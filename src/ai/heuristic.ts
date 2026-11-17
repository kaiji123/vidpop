// Last-resort extractor when no model is available, so the demo never dead-ends.
// It is deliberately simple and is labelled "Heuristic" in the UI.
import type { Category, Moment, Segment } from '../types';

const CLAIM_CUES =
  /\b(proven|proved|studies show|scientists|researchers|archaeologists|percent|%|only|the most|the largest|the first|record|was cast|has been cast|confirmed|announced|according to|visible from|grows|years|million|billion)\b/i;
const NON_CLAIM = /\b(follow|subscribe|like and|see you|link in bio|i think|i feel|obsessed)\b/i;

const PRODUCT_RULES: { re: RegExp; category: Category; label: (m: RegExpMatchArray) => string }[] = [
  { re: /\b([A-Z][a-zA-Z]+ [A-Z]?\w*\d+\w*)(?: series)? camera\b/, category: 'tech', label: (m) => `${m[1]} camera` },
  { re: /\b(?:camera|lens)\b/i, category: 'tech', label: () => 'Camera' },
  { re: /\b(Japan Rail Pass|JR Pass|Eurail Pass|[A-Z]\w+ Rail Pass)\b/, category: 'travel', label: (m) => m[1] },
  { re: /\b(power bank|portable charger)\b/i, category: 'tech', label: () => 'Portable power bank' },
  { re: /\b(headphones|earbuds|sneakers|backpack|suitcase|sunscreen)\b/i, category: 'shopping', label: (m) => m[1] },
];

function guessCategory(text: string): Category {
  if (/brain|health|vaccine|diet|cancer/i.test(text)) return 'health';
  if (/tomb|ancient|archaeolog|history|war|empire/i.test(text)) return 'history';
  if (/election|president|minister|senator|policy|government/i.test(text)) return 'politics';
  if (/actor|film|movie|bond|album|singer|cast/i.test(text)) return 'entertainment';
  if (/city|tokyo|paris|travel|population|metropolitan/i.test(text)) return 'travel';
  return 'science';
}

const firstSentenceWith = (text: string, re: RegExp) =>
  text.split(/(?<=[.!?])\s+/).find((s) => re.test(s)) ?? text;

export function heuristicExtract(segments: Segment[]): Omit<Moment, 'id'>[] {
  const out: Omit<Moment, 'id'>[] = [];
  segments.forEach((seg, i) => {
    const base = { segmentIndex: i, start: seg.start, end: seg.end, quote: seg.text };
    for (const rule of PRODUCT_RULES) {
      const m = seg.text.match(rule.re);
      if (m) {
        const label = rule.label(m);
        out.push({ ...base, kind: 'product', label, detail: label, query: label, category: rule.category });
        break;
      }
    }
    if (CLAIM_CUES.test(seg.text) && !NON_CLAIM.test(seg.text) && seg.text.split(' ').length > 7) {
      const claim = firstSentenceWith(seg.text, CLAIM_CUES).replace(/^(and finally|also|first up|fun fact)[,.]?\s*/i, '');
      const label = claim.split(' ').slice(0, 6).join(' ').replace(/[,.]$/, '') + '…';
      out.push({ ...base, kind: 'claim', label, detail: claim, query: claim, category: guessCategory(claim) });
    }
  });
  return out;
}
