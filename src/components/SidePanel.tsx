import { useState } from 'react';
import { fmt } from '../ai/extract';
import { CLOUD_MODEL, cloudBackend, FACTCHECK_API_KEY } from '../ai/config';
import type { NanoAvailability } from '../ai/nano';
import { parseTranscript } from '../transcript';
import { EngineBadge } from './EngineBadge';
import type { Clip, ExtractionResult, LogEntry, Moment, Segment } from '../types';

const NANO_COPY: Record<NanoAvailability, string> = {
  available: 'Ready',
  downloadable: 'Not downloaded yet',
  downloading: 'Downloading…',
  unavailable: 'Unavailable on this device',
  unsupported: 'Prompt API not in this browser',
};

interface Props {
  clip: Clip;
  time: number;
  nano: NanoAvailability;
  nanoProgress?: number;
  extraction?: ExtractionResult;
  scanning: boolean;
  moments: Moment[];
  openId?: string;
  logs: LogEntry[];
  onRescan: (heuristic?: boolean) => void;
  onEnableNano: () => void;
  onOpen: (m: Moment) => void;
  onSeek: (t: number) => void;
  onUpload: (file: File, segments?: Segment[]) => void;
}

export function SidePanel(p: Props) {
  const [tab, setTab] = useState<'moments' | 'transcript' | 'log'>('moments');
  return (
    <aside className="side">
      <section className="card">
        <h2>Hybrid pipeline</h2>
        <ol className="pipeline">
          <li>
            <span className="step">1</span>
            <div>
              <strong>Detect moments · on-device</strong>
              <span className="muted">
                Gemini Nano: {NANO_COPY[p.nano]}
                {p.nano === 'downloading' && p.nanoProgress !== undefined && ` ${Math.round(p.nanoProgress * 100)}%`}
              </span>
              {p.nano === 'downloadable' && (
                <button className="btn btn-small" onClick={p.onEnableNano}>Download Gemini Nano</button>
              )}
            </div>
          </li>
          <li>
            <span className="step">2</span>
            <div>
              <strong>Pop up at the exact timestamp</strong>
              <span className="muted">Timestamps come from the transcript, not the model</span>
            </div>
          </li>
          <li>
            <span className="step">3</span>
            <div>
              <strong>Verify · cloud, on tap</strong>
              <span className="muted">
                {cloudBackend === 'firebase' && `Firebase AI Logic · ${CLOUD_MODEL} + Google Search`}
                {cloudBackend === 'gemini-api' && `Gemini API (dev key) · ${CLOUD_MODEL} + Google Search`}
                {cloudBackend === 'none' && 'Not configured, using demo cache'}
                {FACTCHECK_API_KEY && ' + Fact Check API'}
              </span>
            </div>
          </li>
        </ol>
        <div className="scan-row">
          {p.scanning ? (
            <span className="muted"><span className="spinner spinner-sm" /> Scanning transcript…</span>
          ) : p.extraction ? (
            <>
              <EngineBadge engine={p.extraction.engine} />
              <span className="muted">{p.extraction.moments.length} moments · {p.extraction.ms} ms</span>
            </>
          ) : null}
          <button className="btn btn-small" disabled={p.scanning} onClick={() => p.onRescan()}>Re-scan</button>
        </div>
      </section>

      <section className="card grow">
        <div className="tabs" role="tablist">
          {(['moments', 'transcript', 'log'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
              {t === 'moments' ? `Moments (${p.moments.length})` : t === 'transcript' ? 'Transcript' : `Log (${p.logs.length})`}
            </button>
          ))}
        </div>

        {tab === 'moments' && (
          <ul className="moment-list">
            {p.moments.length === 0 && !p.scanning && <li className="muted">No moments for this mode.</li>}
            {p.moments.map((m) => (
              <li key={m.id}>
                <button className={`moment ${m.id === p.openId ? 'active' : ''} ${p.time >= m.start ? 'passed' : ''}`} onClick={() => { p.onSeek(m.start); p.onOpen(m); }}>
                  <span className={`kind kind-${m.kind}`}>{m.kind === 'claim' ? 'Claim' : 'Product'}</span>
                  <span className="ts">{fmt(m.start)}</span>
                  <span className="moment-label">{m.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {tab === 'transcript' && (
          <ul className="transcript">
            {p.clip.segments.map((s, i) => {
              const live = p.time >= s.start && p.time <= s.end;
              const hit = p.moments.some((m) => m.segmentIndex === i);
              return (
                <li key={i} className={`${live ? 'live' : ''} ${hit ? 'hit' : ''}`} onClick={() => p.onSeek(s.start)}>
                  <span className="ts">{fmt(s.start)}</span> {s.text}
                </li>
              );
            })}
          </ul>
        )}

        {tab === 'log' && (
          <ul className="log">
            {p.logs.map((l, i) => (
              <li key={i} className={`log-${l.level}`}>
                <span className="ts">{new Date(l.at).toLocaleTimeString()}</span> {l.msg}
              </li>
            ))}
          </ul>
        )}
      </section>

      <UploadClip onUpload={p.onUpload} />
    </aside>
  );
}

/** Drop or pick a video: it is transcribed and scanned automatically. */
function UploadClip({ onUpload }: { onUpload: (file: File, segments?: Segment[]) => void }) {
  const [text, setText] = useState('');
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState<string>();

  const take = (file?: File) => {
    if (!file) return;
    if (!/^(video|audio)\//.test(file.type)) return setErr('That file isn\u2019t a video or audio file.');
    setErr(undefined);
    const pasted = text.trim() ? parseTranscript(text) : [];
    onUpload(file, pasted.length ? pasted : undefined);
    setText('');
  };

  return (
    <section className="card">
      <label
        className={`dropzone ${drag ? 'drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files?.[0]); }}
      >
        <input type="file" accept="video/*,audio/*" onChange={(e) => { take(e.target.files?.[0]); e.target.value = ''; }} />
        <strong>+ Upload your own clip</strong>
        <span className="muted">Drop a video here. VidPop transcribes it with Gemini, then finds claims and products automatically.</span>
      </label>
      {err && <p className="error">{err}</p>}
      <details>
        <summary className="muted">Already have captions? Paste them to skip transcription</summary>
        <textarea
          rows={5}
          placeholder={'WebVTT / SRT, or:\n0:02 Okay so here is the news\n0:08 Scientists confirmed that…'}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </details>
    </section>
  );
}
