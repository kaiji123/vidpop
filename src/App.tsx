import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { extractMoments } from './ai/extract';
import { createNanoSession, nanoAvailability, type NanoAvailability } from './ai/nano';
import { transcribe, TRANSCRIBE_MODEL } from './ai/transcribe';
import { cloudBackend } from './ai/config';
import { Phone } from './components/Phone';
import { SidePanel } from './components/SidePanel';
import { DiscoverSheet, VerifySheet } from './components/Sheets';
import type { Clip, Engine, ExtractionResult, LogEntry, Moment, Segment, Verification } from './types';

type ModeFilter = 'verify' | 'discover' | 'all';

async function loadClips(): Promise<Clip[]> {
  const index: { id: string }[] = await fetch('/clips/index.json').then((r) => r.json());
  return Promise.all(index.map((c) => fetch(`/clips/${c.id}.json`).then((r) => r.json())));
}

export default function App() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [clipId, setClipId] = useState<string>();
  const [mode, setMode] = useState<ModeFilter>('verify');
  const [extractions, setExtractions] = useState<Record<string, ExtractionResult>>({});
  const [scanning, setScanning] = useState(false);
  const [nano, setNano] = useState<NanoAvailability>('unsupported');
  const [nanoProgress, setNanoProgress] = useState<number>();
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string>();
  const [verifications, setVerifications] = useState<Record<string, Verification>>({});
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const log = useCallback((level: LogEntry['level'], msg: string, engine?: Engine) => {
    setLogs((l) => [{ at: Date.now(), level, msg, engine }, ...l].slice(0, 200));
  }, []);

  useEffect(() => {
    loadClips()
      .then((c) => {
        setClips(c);
        setClipId(c[0]?.id);
        setMode(c[0]?.suggestedMode ?? 'verify');
      })
      .catch((e) => log('error', `Could not load demo clips: ${e.message}`));
    nanoAvailability().then((a) => {
      setNano(a);
      log('info', `Gemini Nano availability: ${a}`);
    });
  }, [log]);

  const clip = clips.find((c) => c.id === clipId);
  const extraction = clip ? extractions[clip.id] : undefined;

  const scan = useCallback(
    async (c: Clip, heuristic = false) => {
      setScanning(true);
      try {
        const res = await extractMoments(c.segments, {
          onLog: log,
          onProgress: (f) => {
            setNano('downloading');
            setNanoProgress(f);
          },
          forceEngine: heuristic ? 'heuristic' : 'auto',
        });
        setExtractions((x) => ({ ...x, [c.id]: res }));
      } finally {
        setScanning(false);
      }
    },
    [log],
  );

  // Scan each clip once, as soon as it has a transcript (uploads get one after transcription).
  const requested = useRef(new Set<string>());
  useEffect(() => {
    if (clip && clip.segments.length > 0 && !requested.current.has(clip.id)) {
      requested.current.add(clip.id);
      scan(clip);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip?.id, clip?.segments.length]);

  const updateClip = (id: string, patch: Partial<Clip>) =>
    setClips((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  /** Upload → transcribe (Gemini Flash-Lite) → scan (Gemini Nano), with no extra clicks. */
  const upload = async (file: File, pastedSegments?: Segment[]) => {
    const c: Clip = {
      id: `upload-${Date.now()}`,
      title: file.name.replace(/\.[^.]+$/, ''),
      creator: '@you',
      suggestedMode: 'verify',
      src: URL.createObjectURL(file),
      segments: pastedSegments ?? [],
      status: pastedSegments ? undefined : 'transcribing',
      statusDetail: pastedSegments ? undefined : 'Preparing audio…',
    };
    setClips((cs) => [...cs, c]);
    switchClip(c);
    setMode('all');
    if (pastedSegments) return log('info', `Loaded ${file.name} with ${pastedSegments.length} pasted transcript lines`);

    log('info', `Transcribing ${file.name} with ${TRANSCRIBE_MODEL}…`);
    const t0 = performance.now();
    try {
      const segments = await transcribe(file, (p) => updateClip(c.id, { statusDetail: p.detail }));
      if (segments.length === 0) throw new Error('No speech was found in this clip.');
      updateClip(c.id, { segments, status: undefined, statusDetail: undefined });
      log('ok', `Transcribed ${segments.length} segments in ${Math.round(performance.now() - t0)} ms`, cloudBackend === 'firebase' ? 'firebase-cloud' : 'gemini-api');
    } catch (e) {
      const msg = (e as Error).message;
      updateClip(c.id, { status: 'error', statusDetail: msg });
      log('error', `Transcription failed: ${msg}`);
    }
  };

  // Frame-accurate clock while playing.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const v = videoRef.current;
      if (v) setTime(v.currentTime);
      raf = requestAnimationFrame(tick);
    };
    if (playing) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => setDuration(v.duration || clip?.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onSeeked = () => setTime(v.currentTime);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onPause);
    v.addEventListener('seeked', onSeeked);
    return () => {
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onPause);
      v.removeEventListener('seeked', onSeeked);
    };
  }, [clip?.id, clip?.duration]);

  const moments = useMemo(() => {
    const all = extraction?.moments ?? [];
    if (mode === 'all') return all;
    return all.filter((m) => (mode === 'verify' ? m.kind === 'claim' : m.kind === 'product'));
  }, [extraction, mode]);

  const popup = useMemo(() => {
    const live = moments.filter((m) => {
      if (dismissed.has(m.id)) return false;
      const showFor = Math.max(6, m.end - m.start + 2.5);
      return time >= m.start + 0.4 && time <= m.start + showFor;
    });
    return live[live.length - 1];
  }, [moments, time, dismissed]);

  const openMoment = extraction?.moments.find((m) => m.id === openId);

  const seek = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(t, v.duration || t));
    setTime(v.currentTime);
  };
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  };
  const open = (m: Moment) => {
    setOpenId(m.id);
    setDismissed((d) => new Set(d).add(m.id));
    log('info', `Opened ${m.kind} at ${m.start.toFixed(1)}s: ${m.label}`);
  };
  const dismiss = (m: Moment) => setDismissed((d) => new Set(d).add(m.id));

  const switchClip = (c: Clip) => {
    videoRef.current?.pause();
    setClipId(c.id);
    setMode(c.suggestedMode);
    setOpenId(undefined);
    setDismissed(new Set());
    setTime(0);
    setPlaying(false);
  };

  const enableNano = async () => {
    try {
      setNano('downloading');
      log('info', 'Downloading Gemini Nano…');
      const s = await createNanoSession('You are helpful.', setNanoProgress);
      s.destroy();
      setNano('available');
      log('ok', 'Gemini Nano is ready', 'gemini-nano');
      if (clip) scan(clip);
    } catch (e) {
      setNano(await nanoAvailability());
      log('error', `Gemini Nano download failed: ${(e as Error).message}`);
    }
  };

  const sheet = openMoment ? (
    openMoment.kind === 'claim' ? (
      <VerifySheet
        moment={openMoment}
        cached={verifications[openMoment.id]}
        onResult={(v) => setVerifications((x) => ({ ...x, [openMoment.id]: v }))}
        onClose={() => setOpenId(undefined)}
        onSeek={seek}
        onLog={log}
      />
    ) : (
      <DiscoverSheet moment={openMoment} onClose={() => setOpenId(undefined)} onSeek={seek} />
    )
  ) : undefined;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">▶</span>
          <div>
            <h1>VidPop</h1>
            <p>Search, discover and verify information at the exact moment it appears in a video.</p>
          </div>
        </div>
        <div className="segmented" role="radiogroup" aria-label="Mode">
          {(['verify', 'discover', 'all'] as const).map((m) => (
            <button key={m} role="radio" aria-checked={mode === m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>
              {m === 'verify' ? 'Verify' : m === 'discover' ? 'Discover' : 'Both'}
            </button>
          ))}
        </div>
      </header>

      <nav className="clip-tabs" aria-label="Clips">
        {clips.map((c) => (
          <button key={c.id} className={c.id === clipId ? 'on' : ''} onClick={() => switchClip(c)}>
            <strong>{c.title}</strong>
            <span>{c.creator} · {c.suggestedMode === 'verify' ? 'Verify demo' : 'Discover demo'}</span>
          </button>
        ))}
      </nav>

      {clip ? (
        <main className="stage">
          <Phone
            clip={clip}
            videoRef={videoRef}
            time={time}
            duration={duration || clip.duration || 0}
            playing={playing}
            moments={moments}
            scanning={scanning}
            popup={popup}
            openId={openId}
            sheet={sheet}
            onOpen={open}
            onDismiss={dismiss}
            onSeek={seek}
            onTogglePlay={togglePlay}
          />
          <SidePanel
            clip={clip}
            time={time}
            nano={nano}
            nanoProgress={nanoProgress}
            extraction={extraction}
            scanning={scanning}
            moments={moments}
            openId={openId}
            logs={logs}
            onRescan={() => scan(clip)}
            onEnableNano={enableNano}
            onOpen={open}
            onSeek={seek}
            onUpload={upload}
          />
        </main>
      ) : (
        <p className="muted center">Loading clips…</p>
      )}
    </div>
  );
}
