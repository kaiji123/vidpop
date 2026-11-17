// Pure timing helpers for transcription: no SDK or env imports, so they are easy to test.
import type { Segment } from '../types';

export interface Onset {
  t: number; // seconds where speech resumes
  gap: number; // seconds of quiet before it; sentence breaks have longer gaps than pauses inside sentences
}

/** Points where speech resumes after at least ~200 ms of quiet, from 20 ms RMS frames. */
export function speechOnsets(pcm: Float32Array, rate: number): Onset[] {
  const frame = Math.round(rate * 0.02);
  const rms: number[] = [];
  for (let i = 0; i + frame <= pcm.length; i += frame) {
    let sum = 0;
    for (let j = i; j < i + frame; j++) sum += pcm[j] * pcm[j];
    rms.push(Math.sqrt(sum / frame));
  }
  const sorted = [...rms].sort((a, b) => a - b);
  const noise = sorted[Math.floor(sorted.length * 0.1)] ?? 0;
  const peak = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
  const threshold = Math.max(noise * 3, noise + (peak - noise) * 0.12, 0.005);
  const onsets: Onset[] = [];
  let quiet = 1000;
  rms.forEach((r, i) => {
    if (r < threshold) quiet++;
    else {
      if (quiet >= 10) onsets.push({ t: i * 0.02, gap: Math.min(quiet * 0.02, 2) });
      quiet = 0;
    }
  });
  return onsets;
}

const parseTime = (t: string): number => {
  const parts = String(t).trim().split(':').map(Number);
  if (parts.some(isNaN)) return NaN;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
};

const WINDOW = 1.6; // how far (s) from the model's time we look for a real onset
const GAP_WEIGHT = 8; // pause length dominates: measured sentence breaks ≥0.48 s vs ≤0.32 s inside sentences

/**
 * Snap the model's whole-second MM:SS times to real speech onsets, keep them increasing,
 * and derive each segment's end from the next start.
 */
export function alignSegments(raw: { start: string; text: string }[], onsets: Onset[], duration: number): Segment[] {
  const out: Segment[] = [];
  let last = -1;
  for (const r of raw) {
    const text = r.text?.trim();
    let t = parseTime(r.start);
    if (!text || isNaN(t)) continue;
    // "0:05" usually means somewhere in [5, 6), so measure distance from the middle of that second.
    const expected = Number.isInteger(t) ? t + 0.5 : t;
    let best: Onset | undefined;
    let bestScore = Infinity;
    for (const o of onsets) {
      if (o.t <= last + 0.3 || Math.abs(o.t - expected) > WINDOW) continue;
      const score = Math.abs(o.t - expected) - GAP_WEIGHT * Math.min(o.gap, 0.8);
      if (score < bestScore) [best, bestScore] = [o, score];
    }
    if (best) t = best.t;
    t = Math.min(Math.max(t, last + 0.1), duration);
    out.push({ start: +t.toFixed(2), end: 0, text });
    last = t;
  }
  out.forEach((s, i) => (s.end = +(out[i + 1]?.start ?? duration).toFixed(2)));
  return out;
}
