// Discover Mode: sponsored products matched to product moments.
// The catalog (./catalog.ts) is fictional: 120 demo products from 20 made-up stores.
// Rules: sponsored cards are always labelled, never shown for claims, and never
// shown on political content. Matching uses only the moment's text, never the viewer.
import type { Moment } from '../types';
import { PRODUCTS, type Product } from './catalog';

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Word-boundary match, allowing a plural ("headphone" ↔ "headphones").
const patterns = new Map(
  PRODUCTS.flatMap((p) => p.keywords).map((k) => [k, new RegExp(`\\b${escape(k)}(?:e?s)?\\b`, 'i')]),
);

function score(p: Product, focus: string, quote: string): number {
  let s = 0;
  for (const k of p.keywords) {
    const re = patterns.get(k)!;
    // Multi-word keywords are more specific, so they count for more.
    const weight = k.split(/\s+/).length;
    if (re.test(focus)) s += 3 * weight;
    else if (re.test(quote)) s += weight;
  }
  return s;
}

/** Best-matching sponsored products for a moment, most relevant first. */
export function offersFor(m: Moment, limit = 3): Product[] {
  if (m.kind !== 'product' || m.category === 'politics') return [];
  const focus = `${m.label} ${m.detail} ${m.query}`;
  const ranked = PRODUCTS.map((p) => ({ p, s: score(p, focus, m.quote) }))
    .filter((x) => x.s >= 3) // at least one keyword in the product itself, not just nearby speech
    .sort((a, b) => b.s - a.s || b.p.reviews - a.p.reviews);
  // Alternatives must be nearly as relevant as the best match, so a passing brand
  // word doesn't drag in an unrelated category.
  const top = ranked[0]?.s ?? 0;
  return ranked.filter((x) => x.s * 2 >= top).slice(0, limit).map((x) => x.p);
}

export const landingUrl = (p: Product, m: Moment) =>
  `/landing.html?p=${p.id}&q=${encodeURIComponent(m.detail)}`;
