// Verify Mode: cloud Gemini + Grounding with Google Search, plus the Fact Check Tools API.
import { getGenerativeModel, type GroundingMetadata } from 'firebase/ai';
import { FACTCHECK_API_KEY, GEMINI_API_KEY, getFirebaseAI, VERIFY_MODELS } from './config';
import { QuotaError, withFallback } from './retry';
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

type Grounded = { text: string; meta?: GroundingMetadata; engine: Engine };

async function groundedOnce(model: string, prompt: string, signal?: AbortSignal): Promise<Grounded> {
  const ai = getFirebaseAI();
  if (ai) {
    // Grounding is a cloud-only capability, so this model is cloud-only by design.
    const result = await getGenerativeModel(ai, { model, tools: [{ googleSearch: {} }] }).generateContent(prompt, { signal });
    return { text: result.response.text(), meta: result.response.candidates?.[0]?.groundingMetadata, engine: 'firebase-cloud' };
  }
  const res = await geminiGenerate({ contents: [{ role: 'user', parts: [{ text: prompt }] }], tools: [{ google_search: {} }] }, signal, model);
  return { text: res.text, meta: res.groundingMetadata as GroundingMetadata | undefined, engine: 'gemini-api' };
}

async function groundedCall(m: Moment, signal?: AbortSignal) {
  if (!getFirebaseAI() && !GEMINI_API_KEY) return undefined;
  return withFallback(VERIFY_MODELS, (model) => groundedOnce(model, verifyPrompt(m), signal), { signal });
}

const QUOTA_NOTICE =
  'Live Google Search checks are not available on this project yet: Grounding with Google Search needs the Blaze (pay-as-you-go) plan, which includes 5,000 free searches a month. Showing the offline demo result instead.';

export async function verifyMoment(m: Moment, signal?: AbortSignal): Promise<Verification> {
  const t0 = performance.now();
  const factChecksP = searchFactChecks(m.query, signal).catch(() => [] as FactCheck[]);
  let grounded: (Grounded & { model: string }) | undefined;
  let notice: string | undefined;
  try {
    grounded = await groundedCall(m, signal);
  } catch (e) {
    if (!(e instanceof QuotaError)) throw e;
    notice = QUOTA_NOTICE;
  }
  const factChecks = await factChecksP;

  if (!grounded) {
    const cached = demoVerification(m);
    return { ...cached, notice, factChecks: [...factChecks, ...cached.factChecks], ms: Math.round(performance.now() - t0) };
  }

  return {
    ...parseVerdict(grounded.text),
    sources: sourcesFrom(grounded.meta),
    searchQueries: grounded.meta?.webSearchQueries ?? [m.query],
    searchEntryPointHtml: grounded.meta?.searchEntryPoint?.renderedContent,
    factChecks,
    engine: grounded.engine,
    model: grounded.model,
    ms: Math.round(performance.now() - t0),
    checkedAt: new Date().toISOString(),
  };
}

export const googleSearchUrl = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
