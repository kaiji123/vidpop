// Transcribe an uploaded clip with Gemini Flash-Lite, fully client-side (no backend).
//
// 1. Decode the video's audio track in the browser and resample to 16 kHz mono WAV.
//    Sending audio only is several times cheaper than sending video, because frames cost tokens.
// 2. Ask Gemini for sentence-level segments with MM:SS start times (structured JSON).
// 3. Gemini's times are whole-second estimates, so snap each start to the nearest real
//    speech onset that we detect from the audio energy. This tightens popup timing a lot.
import { getGenerativeModel, Schema, ThinkingLevel } from 'firebase/ai';
import { GEMINI_API_KEY, getFirebaseAI } from './config';
import { geminiGenerate } from './geminiRest';
import { alignSegments, speechOnsets } from './align';
import type { Segment } from '../types';

export const TRANSCRIBE_MODEL: string = import.meta.env.VITE_TRANSCRIBE_MODEL || 'gemini-3.5-flash-lite';

const MAX_INLINE_BYTES = 19 * 1024 * 1024; // Gemini's limit is 20 MB per request, including base64 overhead
const MAX_SECONDS = 15 * 60;

const PROMPT = `Transcribe the speech in this audio verbatim, in the language spoken.
Split it into segments of one sentence or short clause each (at most about 15 words).
For each segment give "start": the time the segment begins, in MM:SS format, and "text".
Cover the whole recording in order. Do not summarise, translate or add commentary.
If there is no speech, return an empty list.`;

const JSON_SCHEMA = {
  type: 'object',
  properties: {
    segments: {
      type: 'array',
      items: {
        type: 'object',
        properties: { start: { type: 'string' }, text: { type: 'string' } },
        required: ['start', 'text'],
      },
    },
  },
  required: ['segments'],
};

const FIREBASE_SCHEMA = Schema.object({
  properties: {
    segments: Schema.array({
      items: Schema.object({ properties: { start: Schema.string(), text: Schema.string() } }),
    }),
  },
});

export interface TranscribeProgress {
  stage: 'decoding' | 'uploading' | 'aligning' | 'done';
  detail?: string;
}

interface Audio {
  base64: string;
  bytes: number;
  pcm: Float32Array;
  rate: number;
  duration: number;
}

/** Decode any browser-playable video/audio file into mono WAV at a size that fits inline. */
export async function extractAudio(file: Blob): Promise<Audio> {
  const ctx = new AudioContext();
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(await file.arrayBuffer());
  } catch {
    throw new Error('Could not read an audio track from this file. Try an MP4 (H.264/AAC) or an audio file.');
  } finally {
    ctx.close();
  }
  const duration = decoded.duration;
  if (duration > MAX_SECONDS) throw new Error(`Clip is ${Math.round(duration / 60)} min long; trim it to 15 minutes or less.`);

  // 16 kHz is what Gemini uses internally. Drop to 8 kHz for long clips so the request stays under 20 MB.
  const rate = duration > 7 * 60 ? 8000 : 16000;
  const offline = new OfflineAudioContext(1, Math.ceil(duration * rate), rate);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const pcm = (await offline.startRendering()).getChannelData(0);

  const wav = encodeWav(pcm, rate);
  if (wav.byteLength * 1.34 > MAX_INLINE_BYTES) throw new Error('Audio is too large to send inline; trim the clip.');
  return { base64: toBase64(wav), bytes: wav.byteLength, pcm, rate, duration };
}

function encodeWav(pcm: Float32Array, rate: number): ArrayBuffer {
  const buf = new ArrayBuffer(44 + pcm.length * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + pcm.length * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buf;
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function callGemini(audio: Audio): Promise<{ start: string; text: string }[]> {
  const ai = getFirebaseAI();
  const parse = (text: string) => {
    const j = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
    return (Array.isArray(j) ? j : j.segments ?? []) as { start: string; text: string }[];
  };

  if (ai) {
    const run = async (thinking: boolean) => {
      const model = getGenerativeModel(ai, {
        model: TRANSCRIBE_MODEL,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: FIREBASE_SCHEMA,
          temperature: 0,
          // Thinking tokens are billed as output and add nothing to transcription.
          ...(thinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } } : {}),
        },
      });
      const res = await model.generateContent([{ type: 'inlineData', inlineData: { mimeType: 'audio/wav', data: audio.base64 } }, PROMPT]);
      return parse(res.response.text());
    };
    return run(true).catch((e: Error) => (/thinking/i.test(e.message) ? run(false) : Promise.reject(e)));
  }

  if (GEMINI_API_KEY) {
    const run = async (thinking: boolean) => {
      const res = await geminiGenerate({
        contents: [{ role: 'user', parts: [{ inline_data: { mime_type: 'audio/wav', data: audio.base64 } }, { text: PROMPT }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: JSON_SCHEMA,
          temperature: 0,
          ...(thinking ? { thinkingConfig: { thinkingLevel: 'minimal' } } : {}),
        },
      });
      return parse(res.text);
    };
    return run(true).catch((e: Error) => (/thinking/i.test(e.message) ? run(false) : Promise.reject(e)));
  }

  throw new Error('Transcription needs Firebase AI Logic (or a Gemini key in local dev).');
}

export async function transcribe(file: Blob, onProgress?: (p: TranscribeProgress) => void): Promise<Segment[]> {
  onProgress?.({ stage: 'decoding', detail: 'Extracting audio in your browser…' });
  const audio = await extractAudio(file);
  onProgress?.({
    stage: 'uploading',
    detail: `Sending ${(audio.bytes / 1e6).toFixed(1)} MB of audio (${Math.round(audio.duration)} s) to ${TRANSCRIBE_MODEL}…`,
  });
  const raw = await callGemini(audio);
  onProgress?.({ stage: 'aligning', detail: 'Snapping timestamps to speech onsets…' });
  const segments = alignSegments(raw, speechOnsets(audio.pcm, audio.rate), audio.duration);
  onProgress?.({ stage: 'done', detail: `${segments.length} segments` });
  return segments;
}
