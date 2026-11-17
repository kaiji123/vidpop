import { useEffect, useRef } from 'react';

/**
 * Renders Google's required "Search Suggestions" chip from grounding metadata.
 * Isolated in a shadow root, as the Firebase docs recommend, so its CSS can't leak.
 */
export function SearchEntryPoint({ html }: { html: string }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const root = el.shadowRoot ?? el.attachShadow({ mode: 'open' });
    root.innerHTML = html;
    root.querySelectorAll('a').forEach((a) => {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
  }, [html]);
  return <div ref={host} className="search-entry" />;
}
