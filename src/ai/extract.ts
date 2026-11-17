// Moment extraction: find checkable claims and purchasable products in a transcript.
//
// Hybrid strategy (first that works wins):
//   1. Firebase AI Logic, InferenceMode.PREFER_ON_DEVICE  → Gemini Nano if present, else cloud Gemini
//   2. Chrome Prompt API directly                        → Gemini Nano
//   3. Gemini Developer API (dev key)                    → cloud
//   4. Heuristic                                         → no model
//
// The model only returns *segment indices*; timestamps always come from the transcript,
// so popups land at exactly the right moment even if the model is imprecise.
import { getGenerativeModel, InferenceMode, Schema } from 'firebase/ai';
import { GEMINI_API_KEY, getFirebaseAI, LITE_MODEL, LITE_MODELS } from './config';
import { withFallback } from './retry';
import { createNanoSession, nanoAvailability } from './nano';
import { geminiGenerate } from './geminiRest';
import { heuristicExtract } from './heuristic';
import type { Category, Engine, ExtractionResult, Moment, Segment } from '../types';

const CATEGORIES: Category[] = ['science', 'health', 'history', 'politics', 'entertainment', 'travel', 'tech', 'shopping', 'other'];
const WINDOW = 8; // segments per prompt — keeps each call well inside Nano's context window

export const SYSTEM_PROMPT = `You scan short-video transcripts for moments a viewer may want to look up without leaving the video.

Return two kinds of moments:
- "claim": any statement of fact that sources could confirm or refute: statistics, records, superlatives ("the hardest", "the first"), maths, science, history, health, news, announcements, casting news. Include claims that are obviously false or said casually. Hedges like "I think", "actually", "apparently" or "I heard" do NOT make a factual statement an opinion: "I think 2 + 2 is 5" is a claim. Skip only pure taste or feelings ("I love this", "it was amazing"), greetings, jokes that assert nothing, and calls to action.
- "product": a specific product, brand, model, or paid service someone could buy or book.

Return every distinct claim, even several from one line. If a claim runs across lines, use the line where it starts. If a later line only repeats an earlier claim, return it once.

For each moment give:
- segment: the [number] of the transcript line it appears in
- kind: "claim" or "product"
- label: at most 6 words, neutral
- detail: for claims, the claim restated as one self-contained, checkable sentence; for products, the product name
- query: a concise Google Search query to check the claim or find the product
- category: one of ${CATEGORIES.join(', ')}

Be neutral: never judge whether a claim is true. If nothing qualifies, return an empty list.`;

const JSON_SCHEMA = {
  type: 'object',
  properties: {
    moments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          segment: { type: 'integer' },
          kind: { type: 'string', enum: ['claim', 'product'] },
          label: { type: 'string' },
          detail: { type: 'string' },
          query: { type: 'string' },
          category: { type: 'string', enum: CATEGORIES },
        },
        required: ['segment', 'kind', 'label', 'detail', 'query', 'category'],
      },
    },
  },
  required: ['moments'],
};

const FIREBASE_SCHEMA = Schema.object({
  properties: {
    moments: Schema.array({
      items: Schema.object({
        properties: {
          segment: Schema.integer(),
          kind: Schema.enumString({ enum: ['claim', 'product'] }),
          label: Schema.string(),
          detail: Schema.string(),
          query: Schema.string(),
          category: Schema.enumString({ enum: CATEGORIES }),
        },
      }),
    }),
  },
});

interface RawMoment {
  segment: number;
  kind: string;
  label: string;
  detail: string;
  query: string;
  category: string;
}

function formatWindow(segments: Segment[], offset: number): string {
  return segments
    .map((s, i) => `[${offset + i}] (${fmt(s.start)}) ${s.text}`)
    .join('\n');
}

export const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

function parseJson(text: string): RawMoment[] {
  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
  const parsed = JSON.parse(cleaned);
  return Array.isArray(parsed) ? parsed : parsed.moments ?? [];
}

function windows(segments: Segment[]) {
  const out: { offset: number; segs: Segment[] }[] = [];
  for (let i = 0; i < segments.length; i += WINDOW) out.push({ offset: i, segs: segments.slice(i, i + WINDOW) });
  return out;
}

type Runner = (prompt: string) => Promise<{ raw: RawMoment[]; engine: Engine }>;

async function firebaseRunner(): Promise<Runner | undefined> {
  const ai = getFirebaseAI();
  if (!ai) return undefined;
  // Hybrid: Gemini Nano when the browser has it, otherwise cloud Flash-Lite (cheap, fast).
  const modelFor = (cloudModel: string) =>
    getGenerativeModel(ai, {
      mode: InferenceMode.PREFER_ON_DEVICE,
      onDeviceParams: {
        createOptions: {
          expectedInputs: [{ type: 'text', languages: ['en'] }],
          expectedOutputs: [{ type: 'text', languages: ['en'] }],
        },
        promptOptions: { responseConstraint: JSON_SCHEMA },
      },
      inCloudParams: {
        model: cloudModel,
        generationConfig: { responseMimeType: 'application/json', responseSchema: FIREBASE_SCHEMA, temperature: 0.1 },
      },
    });
  return async (prompt) => {
    // System prompt is inlined so it reaches both the on-device and cloud paths.
    const result = await withFallback(LITE_MODELS, async (cloudModel) => ({
      res: await modelFor(cloudModel).generateContent(`${SYSTEM_PROMPT}\n\nTranscript:\n${prompt}`),
    }));
    const engine: Engine = result.res.response.inferenceSource === 'on_device' ? 'firebase-on-device' : 'firebase-cloud';
    return { raw: parseJson(result.res.response.text()), engine };
  };
}

async function nanoRunner(onProgress?: (f: number) => void): Promise<Runner | undefined> {
  const availability = await nanoAvailability();
  if (availability === 'unsupported' || availability === 'unavailable') return undefined;
  return async (prompt) => {
    const session = await createNanoSession(SYSTEM_PROMPT, onProgress);
    try {
      const text = await session.prompt(`Transcript:\n${prompt}`, { responseConstraint: JSON_SCHEMA });
      return { raw: parseJson(text), engine: 'gemini-nano' };
    } finally {
      session.destroy();
    }
  };
}

function restRunner(): Runner | undefined {
  if (!GEMINI_API_KEY) return undefined;
  return async (prompt) => {
    const res = await geminiGenerate({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: `Transcript:\n${prompt}` }] }],
      generationConfig: { responseMimeType: 'application/json', responseJsonSchema: JSON_SCHEMA, temperature: 0.1 },
    }, undefined, LITE_MODEL);
    return { raw: parseJson(res.text), engine: 'gemini-api' };
  };
}

function toMoments(raw: RawMoment[], segments: Segment[]): Omit<Moment, 'id'>[] {
  return raw
    .filter((r) => Number.isInteger(r.segment) && r.segment >= 0 && r.segment < segments.length)
    .filter((r) => r.kind === 'claim' || r.kind === 'product')
    .map((r) => {
      const seg = segments[r.segment];
      return {
        kind: r.kind as Moment['kind'],
        segmentIndex: r.segment,
        start: seg.start,
        end: seg.end,
        quote: seg.text,
        label: String(r.label || r.detail).slice(0, 60),
        detail: String(r.detail || r.label).slice(0, 300),
        query: String(r.query || r.detail).slice(0, 200),
        category: (CATEGORIES.includes(r.category as Category) ? r.category : 'other') as Category,
      };
    });
}

function finalize(list: Omit<Moment, 'id'>[]): Moment[] {
  const seen = new Set<string>();
  return list
    .filter((m) => {
      const key = `${m.segmentIndex}:${m.kind}:${m.label.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.start - b.start || a.kind.localeCompare(b.kind))
    .map((m, i) => ({ ...m, id: `m${i}-${m.segmentIndex}-${m.kind}` }));
}

export interface ExtractOptions {
  onLog?: (level: 'info' | 'ok' | 'warn', msg: string, engine?: Engine) => void;
  onProgress?: (fraction: number) => void;
  forceEngine?: 'auto' | 'heuristic';
}

export async function extractMoments(segments: Segment[], opts: ExtractOptions = {}): Promise<ExtractionResult> {
  const log = opts.onLog ?? (() => {});
  const t0 = performance.now();

  const candidates: [string, () => Promise<Runner | undefined>][] =
    opts.forceEngine === 'heuristic'
      ? []
      : [
          ['Firebase AI Logic (prefer on-device)', firebaseRunner],
          ['Chrome Prompt API (Gemini Nano)', () => nanoRunner(opts.onProgress)],
          ['Gemini Developer API', async () => restRunner()],
        ];

  for (const [name, make] of candidates) {
    const runner = await make().catch(() => undefined);
    if (!runner) continue;
    try {
      log('info', `Scanning ${segments.length} transcript lines with ${name}…`);
      const all: Omit<Moment, 'id'>[] = [];
      let engine: Engine = 'heuristic';
      for (const w of windows(segments)) {
        const res = await runner(formatWindow(w.segs, w.offset));
        engine = res.engine;
        all.push(...toMoments(res.raw, segments));
      }
      const moments = finalize(all);
      const ms = Math.round(performance.now() - t0);
      log('ok', `Found ${moments.length} moments in ${ms} ms`, engine);
      return { moments, engine, ms };
    } catch (err) {
      log('warn', `${name} failed: ${(err as Error).message}`);
    }
  }

  const moments = finalize(heuristicExtract(segments));
  const ms = Math.round(performance.now() - t0);
  log('warn', `No model available — heuristic found ${moments.length} moments`, 'heuristic');
  return { moments, engine: 'heuristic', ms };
}
