import { useRef, type ReactNode, type RefObject } from 'react';
import { fmt } from '../ai/extract';
import type { Clip, Moment } from '../types';

interface Props {
  clip: Clip;
  videoRef: RefObject<HTMLVideoElement | null>;
  time: number;
  duration: number;
  playing: boolean;
  moments: Moment[];
  scanning: boolean;
  popup?: Moment;
  openId?: string;
  sheet?: ReactNode;
  onOpen: (m: Moment) => void;
  onDismiss: (m: Moment) => void;
  onSeek: (t: number) => void;
  onTogglePlay: () => void;
}

export function Phone(p: Props) {
  const bar = useRef<HTMLDivElement>(null);
  const caption = p.clip.segments.find((s) => p.time >= s.start && p.time <= s.end + 0.3);
  const pct = (t: number) => `${Math.min(100, (t / (p.duration || 1)) * 100)}%`;

  const scrub = (e: React.PointerEvent) => {
    const r = bar.current!.getBoundingClientRect();
    p.onSeek(((e.clientX - r.left) / r.width) * p.duration);
  };

  return (
    <div className={`phone ${p.sheet ? 'has-sheet' : ''}`}>
      <div className="screen">
        <video
          ref={p.videoRef}
          src={p.clip.src}
          playsInline
          preload="auto"
          onClick={p.onTogglePlay}
          crossOrigin="anonymous"
        />

        <div className="overlay-top">
          <div className="creator">
            <span className="avatar">{p.clip.creator[1]?.toUpperCase()}</span>
            <div>
              <strong>{p.clip.creator}</strong>
              <span>{p.clip.title}</span>
            </div>
          </div>
          {p.clip.synthetic && <span className="synthetic">Synthetic demo clip</span>}
        </div>

        {!p.playing && !p.sheet && (
          <button className="big-play" onClick={p.onTogglePlay} aria-label="Play">▶</button>
        )}

        {caption && <div className="caption">{caption.text}</div>}

        {p.clip.status === 'transcribing' && (
          <div className="status-overlay">
            <div className="spinner" />
            <strong>Transcribing with Gemini</strong>
            <p className="muted">{p.clip.statusDetail}</p>
            <p className="muted">Moments are found automatically once it’s done.</p>
          </div>
        )}
        {p.clip.status === 'error' && (
          <div className="status-overlay error">
            <strong>Couldn’t transcribe this clip</strong>
            <p className="muted">{p.clip.statusDetail}</p>
            <p className="muted">Re-upload it and paste captions under “Already have captions?” instead.</p>
          </div>
        )}

        {p.popup && !p.sheet && (
          <div className={`popup popup-${p.popup.kind}`} key={p.popup.id} role="dialog" aria-label="VidPop suggestion">
            <button className="popup-x" onClick={() => p.onDismiss(p.popup!)} aria-label="Dismiss">×</button>
            {p.popup.kind === 'claim' ? (
              <>
                <span className="popup-kicker">Is this claim true?</span>
                <strong>{p.popup.label}</strong>
                <span className="popup-sub">Check sources without leaving the video</span>
                <button className="popup-cta" onClick={() => p.onOpen(p.popup!)}>Verify</button>
              </>
            ) : (
              <>
                <span className="popup-kicker">Interested in this?</span>
                <strong>{p.popup.label}</strong>
                <span className="popup-sub">Explore what was mentioned in the video</span>
                <button className="popup-cta" onClick={() => p.onOpen(p.popup!)}>Explore</button>
              </>
            )}
          </div>
        )}

        {p.sheet}
      </div>

      <div className="controls">
        <button className="play-btn" onClick={p.onTogglePlay} aria-label={p.playing ? 'Pause' : 'Play'}>
          {p.playing ? '❚❚' : '▶'}
        </button>
        <span className="time">{fmt(p.time)}</span>
        <div className={`track ${p.scanning || p.clip.status === 'transcribing' ? 'scanning' : ''}`} ref={bar} onPointerDown={scrub}>
          <div className="progress" style={{ width: pct(p.time) }} />
          {p.moments.map((m) => (
            <button
              key={m.id}
              className={`marker marker-${m.kind} ${m.id === p.openId ? 'active' : ''}`}
              style={{ left: pct(m.start) }}
              title={`${fmt(m.start)} · ${m.label}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                p.onSeek(m.start);
                p.onOpen(m);
              }}
            />
          ))}
        </div>
        <span className="time">{fmt(p.duration)}</span>
      </div>
    </div>
  );
}
