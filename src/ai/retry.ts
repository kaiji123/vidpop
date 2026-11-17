// Resilience for cloud Gemini calls: free-tier traffic is the first to be shed during demand
// spikes ("This model is currently experiencing high demand", HTTP 500/503), so retry with
// backoff, then fall through a list of models.

export class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaError';
  }
}

const status = (e: unknown): number | undefined => {
  const err = e as { customErrorData?: { status?: number }; message?: string };
  return err.customErrorData?.status ?? Number(err.message?.match(/\b(4\d\d|5\d\d)\b/)?.[1]) ?? undefined;
};

const isTransient = (e: unknown) => {
  const s = status(e);
  return s === 500 || s === 502 || s === 503 || s === 504 || /high demand|overloaded|unavailable/i.test(String((e as Error).message));
};

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

/**
 * Runs `call(model)` for each model in turn, retrying transient errors with backoff.
 * A 429 (quota) skips to the next model, since free-tier quotas are per model; if every model
 * returns 429, a QuotaError is thrown so callers can explain it instead of showing a raw error.
 */
export async function withFallback<T extends object>(
  models: string[],
  call: (model: string) => Promise<T>,
  opts: { retries?: number; signal?: AbortSignal; onRetry?: (model: string, attempt: number, err: Error) => void } = {},
): Promise<T & { model: string }> {
  const list = [...new Set(models.filter(Boolean))];
  const retries = opts.retries ?? 2;
  let lastErr: unknown;
  let quotaHits = 0;
  for (const model of list) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return Object.assign(await call(model), { model }) as T & { model: string };
      } catch (e) {
        if (opts.signal?.aborted) throw e;
        lastErr = e;
        if (status(e) === 429) {
          quotaHits++;
          break; // retrying the same model will not help; try the next one
        }
        if (!isTransient(e)) break; // e.g. unknown model or bad request: try the next model
        opts.onRetry?.(model, attempt + 1, e as Error);
        if (attempt < retries) await sleep(800 * 2 ** attempt + Math.random() * 300, opts.signal);
      }
    }
  }
  if (quotaHits === list.length) throw new QuotaError((lastErr as Error).message);
  throw lastErr;
}
