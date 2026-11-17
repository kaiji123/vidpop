// Offline results for the bundled demo clips, used ONLY when no cloud model is configured.
// They are labelled "Demo cache" in the UI. Connect Firebase or a Gemini key for live, grounded checks.
import type { Moment, Verification } from '../types';

type Cached = Omit<Verification, 'ms' | 'factChecks'> & { factChecks: Verification['factChecks'] };

const wiki = (page: string, title: string) => ({
  uri: `https://en.wikipedia.org/wiki/${page}`,
  title,
  domain: 'en.wikipedia.org',
});

const ENTRIES: { match: RegExp; result: Omit<Cached, 'engine' | 'checkedAt' | 'factChecks'> }[] = [
  {
    match: /great wall/i,
    result: {
      verdict: 'contradicted',
      summary: 'The Great Wall is generally not visible to the naked eye from orbit, and it is not the only human-made structure seen from space.',
      explanation:
        'Astronaut accounts and space-agency commentary describe the wall as very hard or impossible to pick out unaided from low Earth orbit, because it is narrow and similar in colour to its surroundings. Cities, highways and airports are far easier to see. The "only structure visible from space" idea predates spaceflight.',
      sources: [wiki('Great_Wall_of_China', 'Great Wall of China — Wikipedia')],
      searchQueries: ['Is the Great Wall of China visible from space naked eye'],
    },
  },
  {
    match: /eiffel/i,
    result: {
      verdict: 'supported',
      summary: 'Thermal expansion can make the Eiffel Tower’s iron structure grow by up to roughly 15 cm on hot days.',
      explanation:
        'The tower is built from puddled iron, which expands with heat. Commonly cited figures put the change at up to about 15 cm. The exact amount depends on temperature, so "about fifteen centimetres" is an upper-end estimate rather than a fixed summer growth.',
      sources: [wiki('Eiffel_Tower', 'Eiffel Tower — Wikipedia')],
      searchQueries: ['Eiffel Tower grows taller in summer thermal expansion'],
    },
  },
  {
    match: /ten percent|10 ?%|10 percent/i,
    result: {
      verdict: 'contradicted',
      summary: 'Brain imaging shows people use virtually all of their brain; the 10% figure is a long-standing myth.',
      explanation:
        'Functional imaging and studies of brain injuries show activity across essentially all brain regions over a day, and no region is unused. Neuroscientists widely describe the 10% claim as a myth, and its origin is unclear.',
      sources: [wiki('Ten_percent_of_the_brain_myth', 'Ten percent of the brain myth — Wikipedia')],
      searchQueries: ['do humans only use 10 percent of their brain'],
    },
  },
  {
    match: /honey/i,
    result: {
      verdict: 'mixed',
      summary: 'Honey has been found in ancient Egyptian tombs, but claims that it was "still edible" rest mostly on anecdote.',
      explanation:
        'Archaeologists have recovered honey or honey residues from Egyptian tombs, and honey’s low moisture and acidity help it resist spoilage. However, reports that thousands-of-years-old samples were tasted and found edible are widely repeated but rarely documented in detail.',
      sources: [wiki('Honey', 'Honey — Wikipedia')],
      searchQueries: ['honey found in Egyptian tombs still edible'],
    },
  },
  {
    match: /tokyo.*(populous|largest|biggest)|most populous/i,
    result: {
      verdict: 'mixed',
      summary: 'Tokyo long topped rankings, but the UN’s 2025 urbanisation report places Jakarta and Dhaka ahead of it.',
      explanation:
        'Rankings depend on how a metropolitan area is defined. Many older lists put Greater Tokyo first, while the UN’s World Urbanization Prospects 2025, published in November 2025 with a new method, ranks Jakarta first, Dhaka second and Tokyo third. The claim is outdated rather than simply false.',
      sources: [wiki('List_of_largest_cities', 'List of largest cities — Wikipedia')],
      searchQueries: ['most populous metropolitan area in the world 2025 UN'],
    },
  },
];

export function demoVerification(m: Moment): Cached {
  const hit = ENTRIES.find((e) => e.match.test(`${m.detail} ${m.quote}`));
  const base = hit?.result ?? {
    verdict: 'insufficient' as const,
    summary: 'No cloud model is connected, so this claim could not be checked live.',
    explanation:
      'Add Firebase AI Logic config (or a Gemini API key for local dev) to check claims with Grounding with Google Search. You can still search this claim on Google.',
    sources: [],
    searchQueries: [m.query],
  };
  return { ...base, factChecks: [], engine: 'demo-cache', checkedAt: new Date().toISOString() };
}
