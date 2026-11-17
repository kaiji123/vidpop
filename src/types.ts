export interface Segment {
  start: number; // seconds
  end: number;
  text: string;
}

export interface Clip {
  id: string;
  title: string;
  creator: string;
  suggestedMode: Mode;
  src: string;
  duration?: number;
  segments: Segment[];
  synthetic?: boolean;
  /** Uploaded clips: set while Gemini transcribes, or if transcription failed. */
  status?: 'transcribing' | 'error';
  statusDetail?: string;
}

export type Mode = 'verify' | 'discover';
export type MomentKind = 'claim' | 'product';

export type Category =
  | 'science'
  | 'health'
  | 'history'
  | 'politics'
  | 'entertainment'
  | 'travel'
  | 'tech'
  | 'shopping'
  | 'other';

/** Something worth exploring at a precise point in the video. */
export interface Moment {
  id: string;
  kind: MomentKind;
  segmentIndex: number;
  start: number; // from the transcript segment, never from the model
  end: number;
  quote: string; // the transcript text the moment came from
  label: string; // short title: "Great Wall visible from space"
  detail: string; // claim restated as a checkable statement, or product name
  query: string; // Google Search query
  category: Category;
}

/** Which engine produced a result — shown in the UI so the hybrid split is visible. */
export type Engine = 'gemini-nano' | 'firebase-on-device' | 'firebase-cloud' | 'gemini-api' | 'heuristic' | 'demo-cache';

export interface ExtractionResult {
  moments: Moment[];
  engine: Engine;
  ms: number;
}

export type Verdict = 'supported' | 'contradicted' | 'mixed' | 'insufficient';

export interface Source {
  title: string;
  uri: string;
  domain: string;
}

export interface FactCheck {
  claimText: string;
  claimant?: string;
  publisher: string;
  rating: string;
  url: string;
  reviewDate?: string;
  title?: string;
}

export interface Verification {
  verdict: Verdict;
  summary: string;
  explanation: string;
  sources: Source[];
  searchQueries: string[];
  searchEntryPointHtml?: string; // Google-required Search Suggestions chip
  factChecks: FactCheck[];
  engine: Engine;
  ms: number;
  checkedAt: string;
}

export interface LogEntry {
  at: number;
  level: 'info' | 'ok' | 'warn' | 'error';
  engine?: Engine;
  msg: string;
}
