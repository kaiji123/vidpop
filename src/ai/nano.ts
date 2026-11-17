// Thin wrapper around Chrome's built-in Prompt API (Gemini Nano, on-device).
// https://developer.chrome.com/docs/ai/prompt-api

export type NanoAvailability = 'unavailable' | 'downloadable' | 'downloading' | 'available' | 'unsupported';

interface LMSession {
  prompt(input: string, opts?: { responseConstraint?: object; signal?: AbortSignal }): Promise<string>;
  destroy(): void;
}
interface LMStatic {
  availability(opts?: object): Promise<Exclude<NanoAvailability, 'unsupported'>>;
  create(opts?: object): Promise<LMSession>;
}

const LANG_OPTS = {
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
};

function api(): LMStatic | undefined {
  return (globalThis as unknown as { LanguageModel?: LMStatic }).LanguageModel;
}

export async function nanoAvailability(): Promise<NanoAvailability> {
  const lm = api();
  if (!lm) return 'unsupported';
  try {
    return await lm.availability(LANG_OPTS);
  } catch {
    return 'unavailable';
  }
}

/**
 * Creates a session. If the model still needs downloading this triggers it
 * (Chrome requires a user gesture for that, so call from a click handler).
 */
export async function createNanoSession(systemPrompt: string, onProgress?: (fraction: number) => void): Promise<LMSession> {
  const lm = api();
  if (!lm) throw new Error('Prompt API not available in this browser');
  return lm.create({
    ...LANG_OPTS,
    initialPrompts: [{ role: 'system', content: systemPrompt }],
    monitor(m: EventTarget) {
      m.addEventListener('downloadprogress', (e) => onProgress?.((e as ProgressEvent).loaded));
    },
  });
}
