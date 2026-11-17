import { useEffect, useState } from 'react';
import { verifyMoment, googleSearchUrl } from '../ai/verify';
import { fmt } from '../ai/extract';
import { offerFor, landingUrl } from '../ads/inventory';
import { SearchEntryPoint } from './SearchEntryPoint';
import { EngineBadge } from './EngineBadge';
import type { Engine, Moment, Verdict, Verification } from '../types';

const VERDICT_COPY: Record<Verdict, { label: string; icon: string }> = {
  supported: { label: 'Supported by sources', icon: '✓' },
  contradicted: { label: 'Contradicted by sources', icon: '✕' },
  mixed: { label: 'Mixed or outdated', icon: '≈' },
  insufficient: { label: 'Not enough evidence', icon: '?' },
};

const favicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;

const formatDate = (iso?: string) => {
  if (!iso) return undefined;
  const d = new Date(iso);
  return isNaN(+d) ? iso : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

interface SheetProps {
  moment: Moment;
  onClose: () => void;
  onSeek: (t: number) => void;
}

interface VerifyProps extends SheetProps {
  cached?: Verification;
  onResult: (v: Verification) => void;
  onLog: (level: 'info' | 'ok' | 'warn' | 'error', msg: string, engine?: Engine) => void;
}

export function VerifySheet({ moment, cached, onResult, onClose, onSeek, onLog }: VerifyProps) {
  const [result, setResult] = useState<Verification | undefined>(cached);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setResult(cached);
    setError(undefined);
    if (cached) return;
    const ctrl = new AbortController();
    onLog('info', `Verifying “${moment.label}” with Gemini + Google Search…`);
    verifyMoment(moment, ctrl.signal)
      .then((v) => {
        setResult(v);
        onResult(v);
        onLog('ok', `Verdict: ${v.verdict} · ${v.sources.length} sources · ${v.ms} ms`, v.engine);
      })
      .catch((e: Error) => {
        if (ctrl.signal.aborted) return;
        setError(e.message);
        onLog('error', `Verification failed: ${e.message}`);
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moment.id]);

  return (
    <section className="sheet" aria-label="Verify claim">
      <header className="sheet-head">
        <span className="chip chip-verify">Verify</span>
        <span className="chip">{moment.category}</span>
        <button className="icon-btn" onClick={onClose} aria-label="Close">×</button>
      </header>

      <button className="quote" onClick={() => onSeek(moment.start)} title="Jump to this moment">
        <span className="ts">{fmt(moment.start)}</span>“{moment.quote}”
      </button>
      <p className="claim">{moment.detail}</p>

      {!result && !error && (
        <div className="loading">
          <div className="spinner" />
          <div>
            <strong>Checking sources…</strong>
            <p className="muted">Gemini is searching Google for evidence. The video keeps playing.</p>
          </div>
        </div>
      )}

      {error && <p className="error">Couldn’t check this claim: {error}</p>}

      {result && (
        <>
          {result.notice && <p className="notice">{result.notice}</p>}
          <div className={`verdict verdict-${result.verdict}`}>
            <span className="verdict-icon">{VERDICT_COPY[result.verdict].icon}</span>
            <div>
              <div className="verdict-label">{VERDICT_COPY[result.verdict].label}</div>
              <div className="verdict-summary">{result.summary}</div>
            </div>
          </div>
          <p className="explanation">{result.explanation}</p>

          {result.factChecks.length > 0 && (
            <>
              <h4>Published fact-checks</h4>
              <ul className="sources">
                {result.factChecks.map((f, i) => (
                  <li key={i}>
                    <a href={f.url} target="_blank" rel="noopener noreferrer">
                      <span className="src-title">{f.publisher}: “{f.rating}”</span>
                      <span className="src-meta">{[formatDate(f.reviewDate), f.claimant && `Claim by ${f.claimant}`].filter(Boolean).join(' · ')}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h4>Sources {result.sources.length > 0 && <span className="muted">({result.sources.length})</span>}</h4>
          {result.sources.length === 0 ? (
            <p className="muted">No web sources were returned. Treat this result with caution.</p>
          ) : (
            <ul className="sources">
              {result.sources.map((s) => (
                <li key={s.uri}>
                  <a href={s.uri} target="_blank" rel="noopener noreferrer">
                    <img src={favicon(s.domain)} alt="" width={16} height={16} />
                    <span className="src-title">{s.title}</span>
                    <span className="src-meta">{s.domain}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}

          {result.searchEntryPointHtml && <SearchEntryPoint html={result.searchEntryPointHtml} />}

          <div className="sheet-actions">
            <a className="btn btn-primary" href={googleSearchUrl(result.searchQueries[0] ?? moment.query)} target="_blank" rel="noopener noreferrer">
              Open in Google Search ↗
            </a>
          </div>
          <footer className="sheet-foot">
            <EngineBadge engine={result.engine} />
            <span>{result.model && `${result.model} · `}AI summary of search results · checked {new Date(result.checkedAt).toLocaleTimeString()} · {result.ms} ms</span>
          </footer>
        </>
      )}
    </section>
  );
}

export function DiscoverSheet({ moment, onClose, onSeek }: SheetProps) {
  const offer = offerFor(moment);
  return (
    <section className="sheet" aria-label="Discover product">
      <header className="sheet-head">
        <span className="chip chip-discover">Discover</span>
        <span className="chip">{moment.category}</span>
        <button className="icon-btn" onClick={onClose} aria-label="Close">×</button>
      </header>

      <button className="quote" onClick={() => onSeek(moment.start)} title="Jump to this moment">
        <span className="ts">{fmt(moment.start)}</span>“{moment.quote}”
      </button>

      <h3 className="product-name">{moment.detail}</h3>

      <div className="sheet-actions">
        <a className="btn btn-primary" href={googleSearchUrl(moment.query)} target="_blank" rel="noopener noreferrer">
          Search on Google ↗
        </a>
        <a className="btn" href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(moment.query)}`} target="_blank" rel="noopener noreferrer">
          Compare prices ↗
        </a>
      </div>

      {offer ? (
        <a className="offer" href={landingUrl(offer, moment)} target="_blank" rel="noopener noreferrer sponsored">
          <span className="sponsored-tag">Sponsored · {offer.advertiser}</span>
          <strong>{offer.headline}</strong>
          <span>{offer.body}</span>
          <span className="offer-cta">{offer.cta} →</span>
        </a>
      ) : (
        <p className="muted">No sponsored offer for this moment.</p>
      )}
      <footer className="sheet-foot">
        <span>Sponsored offers are matched to the product mentioned, not to you, and never appear on claims or political content.</span>
      </footer>
    </section>
  );
}
