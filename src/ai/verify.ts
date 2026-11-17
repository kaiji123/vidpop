// Verify Mode: cloud Gemini + Grounding with Google Search, plus the Fact Check Tools API.
import { getGenerativeModel, type GroundingMetadata } from 'firebase/ai';
import { CLOUD_MODEL, FACTCHECK_API_KEY, GEMINI_API_KEY, getFirebaseAI } from './config';
import { geminiGenerate } from './geminiRest';
import { demoVerification } from './demoCache';
import type { Engine, FactCheck, Moment, Source, Verdict, Verification } from '../types';

const VERDICTS: Record<string, Verdict> = {
  SUPPORTED: 'supported',
  CONTRADICTED: 'contradicted',
  MIXED: 'mixed',
  INSUFFICIENT: 'insufficient',
};

export function verifyPrompt(m: Moment): string {
  return `You are a neutral, careful fact-checking assistant. A viewer tapped a claim while watching a short video.

Claim: "${m.detail}"
Exact words spoken in the video: "${m.quote}"

Search Google for current, reputable, attributable sources (official bodies, peer-reviewed research, established news organisations, recognised fact-checkers). Weigh what they say, then answer in EXACTLY this format:

VERDICT: one of SUPPORTED, CONTRADICTED, MIXED, INSUFFICIENT
SUMMARY: one plain sentence (max 25 words) a viewer can read in two seconds
EXPLANATION: 2–4 short sentences. Say what the evidence shows and, where known, when key sources were published. If the evidence is limited, outdated or conflicting, say so explicitly. Avoid partisan or loaded language; describe evidence, not people.`;
}

export function parseVerdict(text: string): Pick<Verification, 'verdict' | 'summary' | 'explanation'> {
  const grab = (key: string) => {
    const re = new RegExp(`${key}:\\s*([\\s\\S]*?)(?=\\n\\s*(?:VERDICT|SUMMARY|EXPLANATION):|$)`, 'i');
    return text.match(re)?.[1]?.replace(/\*\*/g, '').trim() ?? '';
  };
  const v = grab('VERDICT').toUpperCase().match(/SUPPORTED|CONTRADICTED|MIXED|INSUFFICIENT/)?.[0];
  return {
    verdict: v ? VERDICTS[v] : 'insufficient',
    summary: grab('SUMMARY') || text.split('\n')[0].slice(0, 200),
    explanation: grab('EXPLANATION') || text,
  };
}

const domainOf = (title: string | undefined, uri: string) => {
  if (title && /^[\w-]+(\.[\w-]+)+$/.test(title)) return title;
  try {
    return new URL(uri).hostname.replace(/^www\./, '');
  } catch {
    return title ?? uri;
  }
};

function sourcesFrom(meta?: Pick<GroundingMetadata, 'groundingChunks'>): Source[] {
  const seen = new Set<string>();
  const out: Source[] = [];
  for (const c of meta?.groundingChunks ?? []) {
    const uri = c.web?.uri;
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    const domain = domainOf(c.web?.title, uri);
    out.push({ uri, title: c.web?.title ?? domain, domain });
  }
  return out;
}

export async function searchFactChecks(query: string, signal?: AbortSignal): Promise<FactCheck[]> {
  if (!FACTCHECK_API_KEY) return [];
  const url = new URL('https://factchecktools.googleapis.com/v1alpha1/claims:search');
  url.searchParams.set('query', query);
  url.searchParams.set('languageCode', 'en');
  url.searchParams.set('pageSize', '5');
  url.searchParams.set('key', FACTCHECK_API_KEY);
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const json = await res.json();
  const out: FactCheck[] = [];
  for (const claim of json.claims ?? []) {
    for (const r of claim.claimReview ?? []) {
      out.push({
        claimText: claim.text,
        claimant: claim.claimant,
        publisher: r.publisher?.name ?? r.publisher?.site ?? 'Fact-checker',
        rating: r.textualRating,
        url: r.url,
        reviewDate: r.reviewDate,
        title: r.title,
      });
    }
  }
  return out.slice(0, 5);
}

async function groundedCall(m: Moment, signal?: AbortSignal) {
  const prompt = verifyPrompt(m);
  const ai = getFirebaseAI();
  if (ai) {
    // Grounding is a cloud-only capability, so this model is cloud-only by design.
    const model = getGenerativeModel(ai, { model: CLOUD_MODEL, tools: [{ googleSearch: {} }] });
    const result = await model.generateContent(prompt, { signal });
    const meta = result.response.candidates?.[0]?.groundingMetadata;
    return { text: result.response.text(), meta, engine: 'firebase-cloud' as Engine };
  }
  if (GEMINI_API_KEY) {
    const res = await geminiGenerate({ contents: [{ role: 'user', parts: [{ text: prompt }] }], tools: [{ google_search: {} }] }, signal);
    return { text: res.text, meta: res.groundingMetadata as GroundingMetadata | undefined, engine: 'gemini-api' as Engine };
  }
  return undefined;
}

export async function verifyMoment(m: Moment, signal?: AbortSignal): Promise<Verification> {
  const t0 = performance.now();
  const [grounded, factChecks] = await Promise.all([
    groundedCall(m, signal),
    searchFactChecks(m.query, signal).catch(() => []),
  ]);

  if (!grounded) {
    const cached = demoVerification(m);
    return { ...cached, factChecks: [...factChecks, ...cached.factChecks], ms: Math.round(performance.now() - t0) };
  }

  return {
    ...parseVerdict(grounded.text),
    sources: sourcesFrom(grounded.meta),
    searchQueries: grounded.meta?.webSearchQueries ?? [m.query],
    searchEntryPointHtml: grounded.meta?.searchEntryPoint?.renderedContent,
    factChecks,
    engine: grounded.engine,
    ms: Math.round(performance.now() - t0),
    checkedAt: new Date().toISOString(),
  };
}

export const googleSearchUrl = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
