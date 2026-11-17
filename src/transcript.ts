import type { Segment } from './types';

const toSec = (t: string) => {
  const parts = t.trim().replace(',', '.').split(':').map(Number);
  return parts.reduce((acc, p) => acc * 60 + p, 0);
};

/**
 * Accepts WebVTT / SRT, or simple lines like "0:08 The Great Wall is…".
 * For simple lines, each segment ends where the next begins.
 */
export function parseTranscript(input: string, duration?: number): Segment[] {
  const text = input.replace(/\r/g, '').trim();
  const cue = /(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{1,3})[^\n]*\n([\s\S]*?)(?=\n\n|$)/g;
  const cues = [...text.matchAll(cue)];
  if (cues.length) {
    return cues
      .map((m) => ({ start: toSec(m[1]), end: toSec(m[2]), text: m[3].replace(/<[^>]+>/g, '').replace(/\n/g, ' ').trim() }))
      .filter((s) => s.text);
  }
  const lines = [...text.matchAll(/^\[?(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?)\]?\s*[-–:]?\s*(.+)$/gm)].map((m) => ({
    start: toSec(m[1]),
    text: m[2].trim(),
  }));
  return lines.map((l, i) => ({
    ...l,
    end: lines[i + 1]?.start ?? Math.max(l.start + 4, duration ?? l.start + 4),
  }));
}
