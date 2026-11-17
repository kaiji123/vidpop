// Direct Gemini Developer API calls — local-dev fallback when Firebase isn't configured.
import { CLOUD_MODEL, GEMINI_API_KEY } from './config';

export interface RestResponse {
  text: string;
  groundingMetadata?: {
    searchEntryPoint?: { renderedContent?: string };
    groundingChunks?: { web?: { uri?: string; title?: string } }[];
    webSearchQueries?: string[];
  };
}

export async function geminiGenerate(body: object, signal?: AbortSignal, model: string = CLOUD_MODEL): Promise<RestResponse> {
  if (!GEMINI_API_KEY) throw new Error('VITE_GEMINI_API_KEY not set');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify(body),
      signal,
    },
  );
  if (!res.ok) throw new Error(`Gemini API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const cand = json.candidates?.[0];
  const text = (cand?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('');
  return { text, groundingMetadata: cand?.groundingMetadata };
}
