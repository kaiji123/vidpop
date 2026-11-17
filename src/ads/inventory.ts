// Discover Mode: a tiny, fictional sponsored inventory matched to product moments.
// Advertisers are made up for the demo; landing pages are local mock pages.
// Rules: sponsored cards are always labelled, never shown for claims, and never
// shown on political content.
import type { Moment } from '../types';

export interface Offer {
  id: string;
  advertiser: string;
  headline: string;
  body: string;
  cta: string;
  match: RegExp;
}

export const OFFERS: Offer[] = [
  {
    id: 'shutterhaus',
    advertiser: 'ShutterHaus',
    headline: 'Interested in this camera?',
    body: 'Compare compact cameras like the one in this video, with free next-day delivery.',
    cta: 'View product',
    match: /camera|x100|lens|fujifilm|sony|canon|nikon/i,
  },
  {
    id: 'raillink',
    advertiser: 'RailLink Travel',
    headline: 'Planning trains in Japan?',
    body: 'Rail passes and reserved seats, delivered digitally before you fly.',
    cta: 'See passes',
    match: /rail pass|jr pass|bullet train|shinkansen/i,
  },
  {
    id: 'voltpack',
    advertiser: 'VoltPack',
    headline: 'Need a power bank for the trip?',
    body: 'Slim 10,000 mAh chargers that are airline-safe.',
    cta: 'Shop chargers',
    match: /power bank|charger|battery/i,
  },
];

export function offerFor(m: Moment): Offer | undefined {
  if (m.kind !== 'product' || m.category === 'politics') return undefined;
  return OFFERS.find((o) => o.match.test(`${m.label} ${m.detail} ${m.quote}`));
}

export const landingUrl = (o: Offer, m: Moment) =>
  `/landing.html?ad=${o.id}&q=${encodeURIComponent(m.detail)}`;
