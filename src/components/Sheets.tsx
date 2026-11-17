import { useEffect, useState } from 'react';
import { googleSearchUrl } from '../ai/verify';
import { fmt } from '../ai/extract';
import { offersFor, landingUrl } from '../ads/inventory';
import { formatPrice, type Product } from '../ads/catalog';
import { SearchEntryPoint } from './SearchEntryPoint';
import { EngineBadge } from './EngineBadge';
import type { Moment, Verdict, Verification } from '../types';

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
  /** Pre-generated result, if the background check already finished. */
  cached?: Verification;
  /** Joins the background check for this claim, or starts one. */
  load: () => Promise<Verification>;
}

export function VerifySheet({ moment, cached, load, onClose, onSeek }: VerifyProps) {
  const [result, setResult] = useState<Verification | undefined>(cached);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setResult(cached);
    setError(undefined);
    if (cached) return;
    // The check is shared with the background queue, so closing the sheet doesn't cancel it.
    let live = true;
    load()
      .then((v) => live && setResult(v))
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moment.id]);

  const searchQuery = result?.searchQueries[0] ?? moment.query;

  return (
    <section className="sheet" aria-label="Verify claim">
      <header className="sheet-head">
        <span className="chip chip-verify">Verify</span>
        <span className="chip">{moment.category}</span>
        <button className="icon-btn" onClick={onClose} aria-label="Close">×</button>
      </header>

      <button className="quote" onClick={() => onSeek(moment.start)} title="Replay this moment">
        <span className="ts">{fmt(moment.start)}</span>“{moment.quote}”
      </button>

      {/* Always one tap away, even before the AI answer arrives. */}
      <a className="btn btn-google" href={googleSearchUrl(searchQuery)} target="_blank" rel="noopener noreferrer">
        <span className="g-mark" aria-hidden>G</span> Search this claim on Google ↗
      </a>

      {!result && !error && (
        <div className="loading">
          <div className="spinner" />
          <div>
            <strong>Checking sources…</strong>
            <p className="muted">Gemini is searching Google for evidence.</p>
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

          <details className="why">
            <summary>
              Why? <span className="muted">· {result.sources.length + result.factChecks.length} source{result.sources.length + result.factChecks.length === 1 ? '' : 's'}</span>
            </summary>
            <p className="claim">Claim checked: {moment.detail}</p>
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

            <h4>Sources</h4>
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
          </details>

          {/* Google requires the Search Suggestions chip to be shown alongside grounded answers. */}
          {result.searchEntryPointHtml && <SearchEntryPoint html={result.searchEntryPointHtml} />}

          <footer className="sheet-foot">
            <EngineBadge engine={result.engine} />
            <span>{result.model && `${result.model} · `}AI summary of search results · {result.ms} ms</span>
          </footer>
        </>
      )}
    </section>
  );
}

export function DiscoverSheet({ moment, onClose, onSeek }: SheetProps) {
  const [offer, ...more] = offersFor(moment);
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
        <div className="offers">
          <a className="offer" href={landingUrl(offer, moment)} target="_blank" rel="noopener noreferrer sponsored">
            <span className="sponsored-tag">Sponsored · {offer.store.name}</span>
            <span className="offer-row">
              <span className="offer-tile" style={{ background: offer.store.color }} aria-hidden>{offer.emoji}</span>
              <span className="offer-info">
                <strong>{offer.name}</strong>
                <span className="offer-blurb">{offer.blurb}</span>
                <span className="offer-rating">★ {offer.rating.toFixed(1)} · {offer.reviews.toLocaleString()} reviews</span>
              </span>
            </span>
            <span className="offer-buy">
              <Price p={offer} />
              <span className="offer-cta">Buy now</span>
            </span>
          </a>
          {more.length > 0 && (
            <div className="offer-more">
              {more.map((p) => (
                <a key={p.id} href={landingUrl(p, moment)} target="_blank" rel="noopener noreferrer sponsored">
                  <span className="offer-tile small" style={{ background: p.store.color }} aria-hidden>{p.emoji}</span>
                  <span className="offer-more-name">{p.name}</span>
                  <Price p={p} />
                </a>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="muted">No sponsored offer for this moment.</p>
      )}
      <footer className="sheet-foot">
        <span>Sponsored offers are matched to the product mentioned, not to you, and never appear on claims or political content.</span>
      </footer>
    </section>
  );
}

function Price({ p }: { p: Product }) {
  return (
    <span className="offer-price">
      {formatPrice(p.price)}
      {p.was && <s>{formatPrice(p.was)}</s>}
    </span>
  );
}
