'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Download,
  Expand,
  Film,
  Grid2X2,
  Heart,
  LoaderCircle,
  Pause,
  Play,
  Plus,
  Redo2,
  Repeat2,
  Settings2,
  ShieldCheck,
  Trash2,
  Undo2,
  Upload,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Choice } from './ourframe-controls';
import {
  api,
  formatTime,
  mediaUrl,
  Session,
  saveDraft,
  saveChunk,
  uploadDraft,
  saveMembership,
  type Draft,
} from '@/lib/ourframe';
import {
  coverage,
  locateMoment,
  replaceAngle,
  type Moment,
} from '@/lib/player-model.mjs';

type Source = {
  id: string;
  name: string;
  url: string;
  duration: number;
  offset: number;
  estimated: boolean;
};
type Edit = { moments: Moment[]; title: string; aspect: string };
const seconds = (n: number) =>
  `${n < 0 ? '−' : ''}${Math.floor(Math.abs(n) / 60)}:${(Math.abs(n) % 60).toFixed(2).padStart(5, '0')}`;
const blank: Edit = { moments: [], title: 'Our moments', aspect: 'landscape' };

export default function OurTakePlayer({
  session,
  token,
  onRefresh,
  onAddVideo,
}: {
  session?: Session;
  token?: string;
  onRefresh?: () => void;
  onAddVideo?: () => void;
}) {
  const [localSources, setLocalSources] = useState<Source[]>([]),
    [offsets, setOffsets] = useState<Record<string, number>>({});
  const sourceSignature = JSON.stringify(
    session?.clips.map((c) => [
      c.id,
      c.url,
      c.duration,
      c.startTime,
      c.clockError,
      c.ownerId,
    ]),
  );
  const seed = useMemo(() => {
    if (!session) return localSources;
    const known = session.clips.filter((c) => c.clockError != null);
    const origin = known.length
      ? Math.min(...known.map((c) => c.startTime))
      : 0;
    return session.clips.map((c) => ({
      id: c.id,
      name:
        (session.members.find((m) => m.id === c.ownerId)?.name ||
          'Contributor') +
        ' · ' +
        c.name,
      url: mediaUrl(c.url),
      duration: c.duration,
      offset: c.clockError == null ? 0 : (c.startTime - origin) / 1000,
      estimated: true,
    }));
  }, [sourceSignature, localSources]);
  const sources = useMemo(
    () => seed.map((s) => ({ ...s, offset: offsets[s.id] ?? s.offset })),
    [seed, offsets],
  );
  const [focus, setFocus] = useState(''),
    [enabled, setEnabled] = useState<string[]>([]),
    [view, setView] = useState('focus'),
    [mode, setMode] = useState(
      session?.sport === 'memories' ? 'story' : 'study',
    );
  const [time, setTime] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState('1'),
    [muted, setMuted] = useState(true),
    [sound, setSound] = useState(''),
    [preview, setPreview] = useState(false),
    [loop, setLoop] = useState(false);
  const [edit, setEdit] = useState<Edit>(blank),
    [selected, setSelected] = useState(''),
    [past, setPast] = useState<Edit[]>([]),
    [future, setFuture] = useState<Edit[]>([]),
    [restored, setRestored] = useState(false);
  const [details, setDetails] = useState(false),
    [exportOpen, setExportOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [saveStatus, setSaveStatus] = useState(''),
    [failed, setFailed] = useState<string[]>([]);
  const [permission, setPermission] = useState(false),
    [exportStatus, setExportStatus] = useState(''),
    [localSession, setLocalSession] = useState<Session | null>(null),
    [alignId, setAlignId] = useState(''),
    [seeking, setSeeking] = useState<string[]>([]);
  const exportContext = useRef<{
      session: Session;
      token: string;
      uploads: Record<string, Draft>;
    } | null>(null),
    alignmentReference = useRef<HTMLVideoElement>(null),
    alignmentOther = useRef<HTMLVideoElement>(null);
  const videos = useRef(new Map<string, HTMLVideoElement>()),
    stage = useRef<HTMLDivElement>(null),
    fileInput = useRef<HTMLInputElement>(null),
    objectUrls = useRef<string[]>([]),
    waiting = useRef(new Set<string>()),
    request = useRef<{ signature: string; id: string } | null>(null);
  const draftKey = `ourtake.player.${session?.id || 'local'}.${session?.self.id || 'device'}`;
  const resultSession = session || localSession;
  const total = edit.moments.reduce((sum, m) => sum + m.duration, 0),
    eventEnd = Math.max(0, ...sources.map((s) => s.offset + s.duration));
  const eventStart = Math.min(0, ...sources.map((s) => s.offset));
  const activeMoment = edit.moments.find((m) => m.id === selected);
  const mappedMoment = activeMoment
    ? {
        ...activeMoment,
        offset:
          sources.find((s) => s.id === activeMoment.clipId)?.offset ??
          activeMoment.offset,
      }
    : undefined;
  const location = preview ? locateMoment(edit.moments, time) : null;
  const shownMoment = location ? edit.moments[location.index] : null;
  const eventTime =
    shownMoment && location
      ? location.sourceTime +
        (sources.find((s) => s.id === shownMoment.clipId)?.offset ??
          shownMoment.offset)
      : time;
  const focusId = shownMoment?.clipId || focus;
  const focused = sources.find((s) => s.id === focusId);
  const visibleIds = preview
    ? [focusId]
    : view === 'tiles'
      ? enabled
      : [focusId];
  const mountedIds = [...new Set([...visibleIds, ...(preview ? [] : [sound])])]
    .filter(Boolean)
    .slice(0, 4);
  const playEnd = preview ? total : eventEnd;
  const playable =
    !!focused && coverage(focused, eventTime) && !failed.includes(focusId);

  useEffect(() => {
    setRestored(false);
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) || 'null');
      if (saved?.offsets && typeof saved.offsets === 'object')
        setOffsets(
          Object.fromEntries(
            Object.entries(saved.offsets).filter(
              ([, v]) =>
                typeof v === 'number' &&
                Number.isFinite(v) &&
                Math.abs(v) < 7200,
            ),
          ) as Record<string, number>,
        );
      if (
        saved &&
        Array.isArray(saved.moments) &&
        saved.moments.length <= 60 &&
        saved.moments.every(
          (m: Moment) =>
            typeof m.id === 'string' &&
            typeof m.clipId === 'string' &&
            typeof m.title === 'string' &&
            Number.isFinite(m.start) &&
            m.start >= 0 &&
            Number.isFinite(m.duration) &&
            m.duration >= 0.2 &&
            Number.isFinite(m.offset),
        )
      ) {
        setEdit({
          moments: saved.moments,
          title: typeof saved.title === 'string' ? saved.title : 'Our moments',
          aspect: saved.aspect === 'portrait' ? 'portrait' : 'landscape',
        });
        setSaveStatus('Draft restored on this device');
      }
    } catch {
      setSaveStatus('Draft could not be restored');
    }
    setRestored(true);
  }, [draftKey]);
  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ ...edit, offsets }));
      setSaveStatus('Draft saved on this device');
    } catch {
      setSaveStatus('Draft not saved — download your edit plan');
    }
  }, [edit, offsets, restored, draftKey]);
  useEffect(
    () => () => objectUrls.current.forEach((url) => URL.revokeObjectURL(url)),
    [],
  );
  useEffect(() => {
    if (!localSession || !exportContext.current) return;
    const timer = setInterval(() => {
      const context = exportContext.current;
      if (context)
        void api(`/sessions/${context.session.id}`, context.token)
          .then(setLocalSession)
          .catch(() => {});
    }, 1500);
    return () => clearInterval(timer);
  }, [localSession?.id]);
  useEffect(() => {
    if (details) setPlaying(false);
  }, [details]);
  useEffect(() => {
    if (!sources.length) return;
    if (!sources.some((s) => s.id === focus)) {
      setFocus(sources[0].id);
      setTime(Math.max(0, sources[0].offset));
    }
    if (!enabled.length) setEnabled(sources.slice(0, 4).map((s) => s.id));
    if (!sources.some((s) => s.id === sound)) setSound(sources[0].id);
  }, [sources]);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), 4500);
    return () => clearTimeout(t);
  }, [message]);
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now(),
        delta = Math.min(0.2, (now - last) / 1000) * Number(speed);
      last = now;
      if (
        visibleIds.some(
          (id) =>
            waiting.current.has(id) &&
            coverage(
              sources.find((s) => s.id === id)!,
              eventTime,
            ),
        )
      )
        return;
      setTime((t) => {
        const end =
          loop && !preview && activeMoment
            ? activeMoment.start +
              (mappedMoment?.offset ?? activeMoment.offset) +
              activeMoment.duration
            : playEnd;
        const start =
          loop && !preview && activeMoment
            ? activeMoment.start + (mappedMoment?.offset ?? activeMoment.offset)
            : 0;
        if (t + delta >= end) {
          if (loop) return Math.max(preview ? 0 : eventStart, start);
          setPlaying(false);
          return Math.max(0, end - 0.001);
        }
        return t + delta;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [
    playing,
    speed,
    playEnd,
    loop,
    activeMoment,
    preview,
    visibleIds.join(','),
    sources,
    eventTime,
  ]);
  useEffect(() => {
    videos.current.forEach((video, id) => {
      const source = sources.find((s) => s.id === id);
      if (!source) return;
      const covered = coverage(source, eventTime),
        target =
          shownMoment?.clipId === id && location
            ? location.sourceTime
            : eventTime - source.offset;
      video.muted = muted || id !== (preview ? focusId : sound);
      video.playbackRate = Number(speed);
      if (!covered || !mountedIds.includes(id) || failed.includes(id)) {
        video.pause();
        return;
      }
      if (
        video.readyState >= 1 &&
        Math.abs(video.currentTime - target) > (playing ? 0.12 : 0.008)
      ) {
        try {
          video.currentTime = Math.max(
            0,
            Math.min(target, source.duration - 0.001),
          );
        } catch {}
      }
      if (playing && !waiting.current.has(id) && video.paused)
        void video.play().catch(() => {
          setPlaying(false);
          setError(
            'Playback could not start. Try Play again or choose another camera.',
          );
        });
      else if (!playing && !video.paused) video.pause();
    });
  }, [
    eventTime,
    playing,
    speed,
    muted,
    sound,
    view,
    focusId,
    sourceSignature,
    enabled.join(','),
    failed,
  ]);
  function change(next: Edit) {
    if (preview) setTime(eventTime);
    setPast((p) => [...p.slice(-49), edit]);
    setFuture([]);
    setEdit(next);
    setPreview(false);
    setPlaying(false);
  }
  function undo() {
    const previous = past.at(-1);
    if (!previous) return;
    setFuture((f) => [edit, ...f]);
    setEdit(previous);
    setPast((p) => p.slice(0, -1));
    setPreview(false);
    setPlaying(false);
  }
  function redo() {
    if (!future.length) return;
    setPast((p) => [...p, edit]);
    setEdit(future[0]);
    setFuture((f) => f.slice(1));
    setPreview(false);
    setPlaying(false);
  }
  function seek(value: number) {
    setTime(
      Math.max(
        preview ? 0 : eventStart,
        Math.min(value, Math.max(0, playEnd - 0.001)),
      ),
    );
  }
  function choose(id: string) {
    if (preview) setTime(eventTime);
    setFocus(id);
    setPreview(false);
    if (!enabled.includes(id)) {
      const next = [id, ...enabled].slice(0, 4);
      setEnabled(next);
      if (!next.includes(sound)) setSound(next[0]);
    }
  }
  function keep() {
    if (!focused || !playable) return;
    const local = eventTime - focused.offset,
      start = Math.max(0, local - (mode === 'study' ? 3 : 2)),
      duration = Math.min(
        mode === 'study' ? 10 : 7,
        focused.duration - start,
        120 - total,
      );
    if (duration < 0.2) {
      setError('This take is full. Shorten a moment to make room.');
      return;
    }
    const m: Moment = {
      id: crypto.randomUUID(),
      clipId: focusId,
      start,
      duration,
      offset: focused.offset,
      title:
        mode === 'study'
          ? `Play ${edit.moments.length + 1}`
          : `Moment ${edit.moments.length + 1}`,
    };
    change({ ...edit, moments: [...edit.moments, m] });
    setSelected(m.id);
    setMessage('Moment kept. Make it yours in the take tray.');
  }
  function updateMoment(patch: Partial<Moment>) {
    if (!activeMoment) return;
    change({
      ...edit,
      moments: edit.moments.map((m) =>
        m.id === selected ? { ...m, ...patch } : m,
      ),
    });
  }
  function selectMoment(m: Moment) {
    setSelected(m.id);
    setFocus(m.clipId);
    setTime(
      m.start + (sources.find((s) => s.id === m.clipId)?.offset ?? m.offset),
    );
    setPreview(false);
    setPlaying(false);
  }
  function reorder(index: number, delta: number) {
    const list = [...edit.moments],
      target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    change({ ...edit, moments: list });
  }
  function startPreview() {
    if (!edit.moments.length) return;
    if (edit.moments.some((m) => !sources.some((s) => s.id === m.clipId))) {
      setError('Add the original videos for this draft before previewing.');
      return;
    }
    setPreview(true);
    setSpeed('1');
    setTime(0);
    setPlaying(true);
    setSelected('');
    setLoop(false);
  }
  function downloadPlan() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              format: 'ourtake-edit',
              version: 1,
              ...edit,
              sources: sources.map(({ url, ...s }) => s),
            },
            null,
            2,
          ),
        ],
        { type: 'application/json' },
      ),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ourtake-edit.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importFiles(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    setError('');
    const added: Source[] = [];
    try {
      for (const file of Array.from(files).slice(0, 12)) {
        if (file.size > 2 * 1024 ** 3)
          throw new Error('Choose recordings smaller than 2 GB each.');
        if (!file.type.startsWith('video/'))
          throw new Error(
            'Choose video recordings. Photo stories will be supported in a later version.',
          );
        const id = `local-${file.name}-${file.size}-${file.lastModified}`;
        if (sources.some((s) => s.id === id) || added.some((s) => s.id === id))
          continue;
        const url = URL.createObjectURL(file);
        objectUrls.current.push(url);
        const duration = await new Promise<number>((resolve, reject) => {
          const v = document.createElement('video');
          v.preload = 'metadata';
          const timeout = setTimeout(() => {
            v.removeAttribute('src');
            v.load();
            reject(
              new Error(`Could not open ${file.name}. Try an MP4 recording.`),
            );
          }, 15000);
          v.onloadedmetadata = () => {
            clearTimeout(timeout);
            const d = v.duration;
            v.removeAttribute('src');
            v.load();
            Number.isFinite(d) && d > 0
              ? resolve(d)
              : reject(new Error(`${file.name} has no readable duration.`));
          };
          v.onerror = () => {
            clearTimeout(timeout);
            reject(
              new Error(
                `This browser cannot read ${file.name}. Try H.264 MP4.`,
              ),
            );
          };
          v.src = url;
        });
        added.push({
          id,
          name: file.name,
          url,
          duration,
          offset: 0,
          estimated: true,
        });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLocalSources((s) => [...s, ...added]);
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }
  async function exportTake() {
    setBusy(true);
    setError('');
    try {
      let targetSession = session,
        targetToken = token;
      const ids: Record<string, string> = {};
      if (!targetSession) {
        if (!permission)
          throw new Error('Confirm permission to use these recordings.');
        if (!exportContext.current) {
          setExportStatus('Creating your private session…');
          const created = await api('/sessions', undefined, 'POST', {
            name: edit.title || 'Our moments',
            sport: mode === 'story' ? 'memories' : 'basketball',
            displayName: 'Creator',
            group: 'Our people',
            collection: 'Personal takes',
            consent: true,
          });
          exportContext.current = { ...created, uploads: {} };
          saveMembership({
            id: created.session.id,
            name: created.session.name,
            token: created.token,
          });
          setLocalSession(created.session);
        }
        const context = exportContext.current!;
        targetSession = context.session;
        targetToken = context.token;
        for (const id of [...new Set(edit.moments.map((m) => m.clipId))]) {
          const source = sources.find((s) => s.id === id);
          if (!source)
            throw new Error('Add the original videos for this draft.');
          let draft = context.uploads[id];
          if (!draft) {
            const blob = await fetch(source.url).then((r) => r.blob());
            draft = {
              id: crypto.randomUUID(),
              sessionId: context.session.id,
              name: source.name.slice(0,160),
              mime: blob.type || 'video/mp4',
              startTime: 0,
              clockError: null,
              marks: [],
              createdAt: Date.now(),
              complete: true,
            };
            await saveDraft(draft);
            for (
              let n = 0, offset = 0;
              offset < blob.size;
              n++, offset += 2 * 1024 ** 2
            )
              await saveChunk(
                draft.id,
                n,
                blob.slice(offset, offset + 2 * 1024 ** 2),
              );
            context.uploads[id] = draft;
          }
          ids[id] = await uploadDraft(draft, context.token, (progress) =>
            setExportStatus(`Adding ${source.name} · ${progress}%`),
          );
        }
      }
      setExportStatus('Queuing your take…');
      const payload = {
        title: edit.title || 'Our moments',
        style: mode === 'study' ? 'study' : 'clean',
        scope: 'all',
        aspect: edit.aspect,
        duration: total,
        entries: edit.moments.map(({ clipId, start, duration }) => ({
          clipId: ids[clipId] || clipId,
          start,
          duration,
        })),
      };
      const signature = JSON.stringify(payload);
      if (request.current?.signature !== signature)
        request.current = { signature, id: crypto.randomUUID() };
      const job = await api(
        `/sessions/${targetSession!.id}/compose`,
        targetToken,
        'POST',
        { ...payload, requestId: request.current.id },
      );
      setMessage(`Take ${job.takeNumber} is in the render queue.`);
      setExportOpen(false);
      onRefresh?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setExportStatus('');
    }
  }
  async function fullScreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (stage.current?.requestFullscreen)
        await stage.current.requestFullscreen();
      else setMessage('Use your phone’s landscape view for a larger picture.');
    } catch {
      setError('Full screen is unavailable in this browser.');
    }
  }
  const unavailable = edit.moments.some(
    (m) => !sources.some((s) => s.id === m.clipId),
  );

  return (
    <section
      className={`ot-player ${session ? 'ot-embedded' : ''}`}
      aria-label="ourTake player and editor"
      onKeyDown={(e) => {
        if (
          (e.target as HTMLElement).closest(
            'input,textarea,button,[role=slider],[role=combobox]',
          )
        )
          return;
        if (e.code === 'Space') {
          e.preventDefault();
          setPlaying((p) => !p);
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          seek(time - 5);
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          seek(time + 5);
        }
      }}
      tabIndex={0}
    >
      {!session && (
        <header className="ot-brand">
          <a href="/" className="wordmark">
            ourTake<span>•</span>
          </a>
          <a href="/" className="ot-back">
            <ArrowLeft size={16} /> Shared sessions
          </a>
          <span>
            <ShieldCheck size={15} />{' '}
            {localSession ? 'Private session' : 'On your device'}
          </span>
        </header>
      )}
      <div className="ot-heading">
        <div>
          <span className="ot-kicker">
            {session
              ? 'OUR CAMERAS. YOUR PERSPECTIVE.'
              : 'THE PLAYER / MAKE ANOTHER TAKE'}
          </span>
          <h1>{session ? session.name : 'There’s more in the moment.'}</h1>
          <p>
            {sources.length
              ? `${sources.length} recordings · Explore a view. Keep what matters.`
              : 'Bring your videos together. Find a different angle. Make a take.'}
          </p>
        </div>
        <div className="ot-heading-actions">
          <Tabs value={mode} onValueChange={(v) => setMode(String(v))}>
            <TabsList aria-label="Viewing experience">
              <TabsTrigger value="story">
                <Heart size={16} /> Story
              </TabsTrigger>
              <TabsTrigger value="study">
                <Repeat2 size={16} /> Study
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            onClick={() =>
              onAddVideo ? onAddVideo() : fileInput.current?.click()
            }
            disabled={busy}
          >
            <Plus /> Add videos
          </Button>
        </div>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="video/*"
        multiple
        hidden
        onChange={(e) => void importFiles(e.target.files)}
      />
      {error && (
        <div className="ot-alert" role="alert">
          <span>{error}</span>
          <Button
            variant="ghost"
            aria-label="Dismiss error"
            onClick={() => setError('')}
          >
            <X />
          </Button>
        </div>
      )}
      {message && (
        <div className="ot-toast" role="status">
          <Check size={16} />
          {message}
        </div>
      )}
      <div className="ot-workspace">
        <div className="ot-watch">
          <div className="ot-screen" ref={stage}>
            <div className="ot-screen-top">
              <span>
                {preview
                  ? 'YOUR TAKE · PREVIEW'
                  : view === 'tiles'
                    ? 'SELECTED ANGLES'
                    : focused?.name || 'YOUR MOMENT GOES HERE'}
              </span>
              {sources.length > 0 && (
                <span className="ot-timing">Timing estimated</span>
              )}
            </div>
            {!sources.length ? (
              <div className="ot-welcome">
                <div className="ot-invitation">
                  <Film size={36} />
                  <Plus size={20} />
                  <Film size={36} />
                </div>
                <h2>
                  One moment.
                  <br />
                  <span>Room for another view.</span>
                </h2>
                <p>
                  Open recordings from the same event.
                  <br />
                  Your originals stay yours.
                </p>
                <Button
                  onClick={() =>
                    onAddVideo ? onAddVideo() : fileInput.current?.click()
                  }
                  disabled={busy}
                >
                  <Upload />
                  {busy ? 'Opening videos…' : 'Open your videos'}
                </Button>
                <span>
                  Sports practice, a birthday, or something worth keeping.
                </span>
              </div>
            ) : (
              <div
                className={`ot-views ${view === 'tiles' && !preview ? 'is-tiled' : ''}`}
              >
                {sources
                  .filter((s) => mountedIds.includes(s.id))
                  .map((s) => {
                    const visible = visibleIds.includes(s.id),
                      covered = coverage(s, eventTime),
                      bad = failed.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        className={`ot-view ${visible ? '' : 'audio-only'} ${s.id === focusId ? 'is-focused' : ''}`}
                      >
                        <video
                          ref={(el) => {
                            if (el) videos.current.set(s.id, el);
                            else videos.current.delete(s.id);
                          }}
                          src={s.url}
                          playsInline
                          preload="auto"
                          aria-label={s.name}
                          onLoadedMetadata={() => {
                            const v = videos.current.get(s.id);
                            if (v && coverage(s, eventTime))
                              v.currentTime = Math.max(0, eventTime - s.offset);
                          }}
                          onWaiting={() => waiting.current.add(s.id)}
                          onCanPlay={() => waiting.current.delete(s.id)}
                          onSeeking={() =>
                            setSeeking((ids) =>
                              ids.includes(s.id) ? ids : [...ids, s.id],
                            )
                          }
                          onSeeked={() => {
                            waiting.current.delete(s.id);
                            setSeeking((ids) =>
                              ids.filter((id) => id !== s.id),
                            );
                          }}
                          onError={() => {
                            waiting.current.delete(s.id);
                            setFailed((f) =>
                              f.includes(s.id) ? f : [...f, s.id],
                            );
                            setPlaying(false);
                            setError(
                              `Could not play ${s.name}. Reopen the session to refresh access, or use a supported MP4.`,
                            );
                          }}
                          style={{
                            visibility:
                              covered && !bad && !seeking.includes(s.id)
                                ? 'visible'
                                : 'hidden',
                          }}
                        />
                        {covered && !bad && seeking.includes(s.id) && (
                          <div className="ot-unavailable">
                            <LoaderCircle className="spin" />
                            <span>Finding this moment…</span>
                          </div>
                        )}
                        {(!covered || bad) && (
                          <div className="ot-unavailable">
                            <Film />
                            <strong>
                              {bad ? 'Video unavailable' : 'Not recorded here'}
                            </strong>
                            <span>{s.name}</span>
                          </div>
                        )}
                        {view === 'tiles' && !preview && (
                          <button
                            className="ot-view-label"
                            onClick={() => choose(s.id)}
                            aria-pressed={focusId === s.id}
                          >
                            {s.id === focusId && <Check size={14} />} {s.name}
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
            {sources.length > 0 && (
              <div className="ot-screen-bottom">
                <div className="ot-fullscreen-controls">
                  <Button
                    variant="ghost"
                    aria-label={
                      playing
                        ? 'Pause full-screen playback'
                        : 'Play full-screen playback'
                    }
                    onClick={() => setPlaying((p) => !p)}
                  >
                    {playing ? <Pause /> : <Play />}
                  </Button>
                  <Slider
                    min={preview ? 0 : eventStart}
                    max={Math.max(0.01, playEnd)}
                    step={0.01}
                    value={[Math.min(time, playEnd)]}
                    onValueChange={(v) => seek(Array.isArray(v) ? v[0] : v)}
                    aria-label="Full-screen playback position"
                  />
                  <Button
                    variant="ghost"
                    aria-label={
                      muted
                        ? 'Enable full-screen sound'
                        : 'Mute full-screen sound'
                    }
                    onClick={() => setMuted((m) => !m)}
                  >
                    {muted ? <VolumeX /> : <Volume2 />}
                  </Button>
                </div>
                <span>
                  {preview
                    ? `${location ? location.index + 1 : edit.moments.length} / ${edit.moments.length} moments`
                    : 'Original color · full frame'}
                </span>
                <Button
                  variant="ghost"
                  aria-label="Full screen"
                  onClick={() => void fullScreen()}
                >
                  <Expand size={18} />
                </Button>
              </div>
            )}
          </div>
          <div className="ot-transport">
            <div className="ot-scrub">
              <Slider
                min={preview ? 0 : eventStart}
                max={Math.max(0.01, playEnd)}
                step={0.01}
                value={[Math.min(time, playEnd)]}
                onValueChange={(v) => seek(Array.isArray(v) ? v[0] : v)}
                aria-label={
                  preview ? 'Take playback position' : 'Event playback position'
                }
                disabled={!sources.length}
              />
              <div>
                <span>{seconds(time)}</span>
                <span>{formatTime(playEnd)}</span>
              </div>
            </div>
            <div className="ot-controls">
              <div>
                <Button
                  variant="ghost"
                  aria-label="Back five seconds"
                  disabled={!sources.length}
                  onClick={() => seek(time - 5)}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  className="ot-play"
                  aria-label={playing ? 'Pause' : 'Play'}
                  disabled={!sources.length}
                  onClick={() => {
                    if (time >= playEnd - 0.01) setTime(0);
                    setPlaying((p) => !p);
                  }}
                >
                  {playing ? <Pause /> : <Play />}
                </Button>
                <Button
                  variant="ghost"
                  aria-label="Forward five seconds"
                  disabled={!sources.length}
                  onClick={() => seek(time + 5)}
                >
                  <ChevronRight />
                </Button>
                <Button
                  variant="ghost"
                  aria-label={muted ? 'Enable sound' : 'Mute sound'}
                  disabled={!sources.length}
                  onClick={() => setMuted((m) => !m)}
                >
                  {muted ? <VolumeX /> : <Volume2 />}
                </Button>
              </div>
              <div>
                <Button
                  variant="ghost"
                  aria-pressed={loop}
                  disabled={!sources.length}
                  onClick={() => setLoop((v) => !v)}
                >
                  <Repeat2 size={17} />
                  <span>Loop</span>
                </Button>
                <Button
                  variant="ghost"
                  aria-label="Playback and alignment settings"
                  onClick={() => setDetails(true)}
                >
                  <Settings2 size={18} />
                </Button>
              </div>
            </div>
          </div>
          <div className="ot-main-actions">
            <Button
              variant="outline"
              disabled={!sources.length}
              aria-pressed={view === 'tiles' && !preview}
              onClick={() => {
                setPreview(false);
                setTime(eventTime);
                setPlaying(false);
                setView(view === 'tiles' ? 'focus' : 'tiles');
              }}
            >
              <Grid2X2 />
              {view === 'tiles' && !preview ? 'One angle' : 'Other angles'}
            </Button>
            <Button
              disabled={!playable || total >= 120 || edit.moments.length >= 60}
              onClick={keep}
            >
              <Plus /> Keep this moment
            </Button>
          </div>
          {sources.length > 0 && (
            <>
              <div className="ot-angle-heading">
                <h2>
                  Our angles <span>{enabled.length} selected</span>
                </h2>
                <button onClick={() => setDetails(true)}>Adjust timing</button>
              </div>
              <div className="ot-camera-strip">
                {sources.map((s, i) => (
                  <div
                    className={`ot-camera ${focusId === s.id ? 'selected' : ''}`}
                    key={s.id}
                  >
                    <button
                      onClick={() => choose(s.id)}
                      aria-pressed={focusId === s.id}
                    >
                      <span className="ot-camera-number">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span>
                        <strong>{s.name}</strong>
                        <small>
                          {coverage(s, eventTime)
                            ? 'Available here'
                            : 'Outside this moment'}
                        </small>
                      </span>
                    </button>
                    <Checkbox
                      checked={enabled.includes(s.id)}
                      aria-label={`Include ${s.name} in other angles`}
                      onCheckedChange={(v) => {
                        if (v && enabled.length >= 4) {
                          setMessage('Choose up to four angles at a time.');
                          return;
                        }
                        if (!v && enabled.length === 1) {
                          setMessage('Keep at least one angle selected.');
                          return;
                        }
                        const next = v
                          ? [...enabled, s.id]
                          : enabled.filter((id) => id !== s.id);
                        setEnabled(next);
                        if (!next.includes(sound)) setSound(next[0]);
                        if (!v && focus === s.id) setFocus(next[0]);
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
          {mode === 'study' && sources.length > 0 && (
            <div className="ot-study">
              <span>Look a little closer</span>
              <div>
                {['0.25', '0.5', '1'].map((s) => (
                  <Button
                    variant={speed === s ? 'secondary' : 'ghost'}
                    key={s}
                    aria-pressed={speed === s}
                    onClick={() => setSpeed(s)}
                  >
                    {s}×
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPlaying(false);
                    seek(time - 1 / 30);
                  }}
                  aria-label="Step back approximately 33 milliseconds"
                >
                  −33 ms
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPlaying(false);
                    seek(time + 1 / 30);
                  }}
                  aria-label="Step forward approximately 33 milliseconds"
                >
                  +33 ms
                </Button>
              </div>
            </div>
          )}
        </div>
        <aside className="ot-tray">
          <div className="ot-tray-heading">
            <div>
              <span className="ot-kicker">MAKE IT YOURS</span>
              <h2>Your next take</h2>
            </div>
            <Clapperboard size={25} />
          </div>
          <div className="ot-tray-meta">
            <span>
              {edit.moments.length} moments · {formatTime(total)}
            </span>
            <div>
              <Button
                variant="ghost"
                aria-label="Undo edit"
                disabled={!past.length}
                onClick={undo}
              >
                <Undo2 size={17} />
              </Button>
              <Button
                variant="ghost"
                aria-label="Redo edit"
                disabled={!future.length}
                onClick={redo}
              >
                <Redo2 size={17} />
              </Button>
            </div>
          </div>
          {!edit.moments.length ? (
            <div className="ot-empty-tray">
              <Heart size={28} />
              <h3>
                {mode === 'story'
                  ? 'The bits you love.'
                  : 'The plays worth another look.'}
              </h3>
              <p>
                Tap <strong>Keep this moment</strong> while watching. A little
                before and after comes with it.
              </p>
              <div>
                <span>01</span>
                <i />
                <span>02</span>
                <i />
                <span>03</span>
              </div>
              <small>Choose. Rearrange. Make another take.</small>
            </div>
          ) : (
            <ol className="ot-moments">
              {edit.moments.map((m, i) => (
                <li key={m.id} className={selected === m.id ? 'selected' : ''}>
                  <button
                    className="ot-moment-main"
                    onClick={() => selectMoment(m)}
                  >
                    <span className="ot-moment-index">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span>
                      <strong>{m.title}</strong>
                      <small>
                        {sources.find((s) => s.id === m.clipId)?.name ||
                          'Add original video'}{' '}
                        · {m.duration.toFixed(1)}s
                      </small>
                    </span>
                    <Play size={14} />
                  </button>
                  <div className="ot-moment-tools">
                    <Button
                      variant="ghost"
                      aria-label={`Move ${m.title} earlier`}
                      disabled={i === 0}
                      onClick={() => reorder(i, -1)}
                    >
                      <ArrowUp size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label={`Move ${m.title} later`}
                      disabled={i === edit.moments.length - 1}
                      onClick={() => reorder(i, 1)}
                    >
                      <ArrowDown size={15} />
                    </Button>
                    <span>
                      {seconds(m.start)} — {seconds(m.start + m.duration)}
                    </span>
                    <Button
                      variant="ghost"
                      aria-label={`Remove ${m.title}`}
                      onClick={() =>
                        change({
                          ...edit,
                          moments: edit.moments.filter((n) => n.id !== m.id),
                        })
                      }
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {activeMoment && (
            <div className="ot-moment-edit">
              <div>
                <strong>Make this moment yours</strong>
                <Button
                  variant="ghost"
                  aria-label="Close moment editing"
                  onClick={() => setSelected('')}
                >
                  <X size={16} />
                </Button>
              </div>
              <label>
                Moment name
                <Input
                  value={activeMoment.title}
                  maxLength={60}
                  onChange={(e) => updateMoment({ title: e.target.value })}
                />
              </label>
              <Choice
                label="Use this angle"
                value={activeMoment.clipId}
                options={sources
                  .filter((s) => replaceAngle(mappedMoment!, s))
                  .map((s) => ({ value: s.id, label: s.name }))}
                onChange={(id) => {
                  const replacement = replaceAngle(
                    mappedMoment!,
                    sources.find((s) => s.id === id)!,
                  );
                  if (replacement) {
                    updateMoment(replacement);
                    choose(id);
                    setTime(replacement.start + replacement.offset);
                  }
                }}
              />
              <div className="ot-trim">
                <label>
                  Start (seconds)
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={Number(activeMoment.start.toFixed(2))}
                    onChange={(e) => {
                      const start = Number(e.target.value),
                        end = activeMoment.start + activeMoment.duration;
                      if (
                        Number.isFinite(start) &&
                        start >= 0 &&
                        end - start >= 0.2 &&
                        total - activeMoment.duration + end - start <= 120
                      )
                        updateMoment({ start, duration: end - start });
                    }}
                  />
                </label>
                <label>
                  End (seconds)
                  <Input
                    type="number"
                    min={activeMoment.start + 0.2}
                    max={
                      sources.find((s) => s.id === activeMoment.clipId)
                        ?.duration
                    }
                    step={0.1}
                    value={Number(
                      (activeMoment.start + activeMoment.duration).toFixed(2),
                    )}
                    onChange={(e) => {
                      const end = Number(e.target.value),
                        max =
                          sources.find((s) => s.id === activeMoment.clipId)
                            ?.duration || 0;
                      if (
                        end <= max &&
                        end - activeMoment.start >= 0.2 &&
                        total -
                          activeMoment.duration +
                          end -
                          activeMoment.start <=
                          120
                      )
                        updateMoment({ duration: end - activeMoment.start });
                    }}
                  />
                </label>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setPreview(false);
                  setFocus(activeMoment.clipId);
                  setTime(
                    activeMoment.start +
                      (mappedMoment?.offset ?? activeMoment.offset),
                  );
                  setLoop(true);
                  setPlaying(true);
                }}
              >
                <Repeat2 size={15} /> Loop this moment
              </Button>
            </div>
          )}
          <div className="ot-tray-bottom">
            <Button
              variant="outline"
              disabled={!edit.moments.length || unavailable}
              onClick={startPreview}
            >
              <Play size={17} /> Preview your take
            </Button>
            <Button
              disabled={!edit.moments.length}
              onClick={() => setExportOpen(true)}
            >
              <Clapperboard size={17} /> Make this take
            </Button>
            <span>{saveStatus || 'Original recordings stay untouched'}</span>
          </div>
        </aside>
      </div>
      {resultSession && resultSession.jobs.length > 0 && (
        <section className="ot-finished">
          <h2>
            Our takes <span>Another way to remember it.</span>
          </h2>
          <div>
            {[...resultSession.jobs].sort((a,b)=>(b.takeNumber||0)-(a.takeNumber||0)).map((job, i) => (
              <article key={job.id}>
                <h3>
                  Take {job.takeNumber || resultSession.jobs.length - i} —{' '}
                  {job.title || 'Our moments'}
                </h3>
                {job.url ? (
                  <>
                    <video
                      src={mediaUrl(job.url)}
                      controls
                      playsInline
                      preload="metadata"
                    />
                    <a href={mediaUrl(job.url) + '&download=1'} download>
                      <Download size={16} /> Download MP4
                    </a>
                  </>
                ) : (
                  <p role="status">
                    {job.status === 'failed'
                      ? 'Render needs attention'
                      : job.status === 'queued'
                        ? 'Waiting to render'
                        : `Rendering · ${job.progress}%`}
                  </p>
                )}
                {job.error && <p className="error-text">{job.error}</p>}
                {job.status === 'failed' && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const auth = token || exportContext.current?.token;
                        await api(
                          `/sessions/${resultSession.id}/retry-take`,
                          auth,
                          'POST',
                          { jobId: job.id },
                        );
                        onRefresh?.();
                        setMessage(
                          `Take ${job.takeNumber || ''} is queued for another render.`,
                        );
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    Retry this take
                  </Button>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
      <Dialog open={details} onOpenChange={setDetails}>
        <DialogContent className="ourframe-dialog ot-dialog">
          <DialogHeader>
            <DialogTitle>Playback & timing</DialogTitle>
            <DialogDescription>
              Recordings share a playhead. Their capture alignment still needs
              checking.
            </DialogDescription>
          </DialogHeader>
          <Choice
            label="Playback speed"
            value={speed}
            onChange={setSpeed}
            options={['0.25', '0.5', '1', '1.5', '2'].map((v) => ({
              value: v,
              label: `${v}×`,
            }))}
          />
          {sources.length > 0 && (
            <Choice
              label="Listen to this camera"
              value={sound}
              options={sources.map((s) => ({ value: s.id, label: s.name }))}
              onChange={(id) => {
                setSound(id);
                setMuted(false);
                if (view === 'tiles' && !enabled.includes(id))
                  setEnabled((e) => [id, ...e].slice(0, 4));
              }}
            />
          )}
          <div className="ot-alignment-note">
            <strong>Find a shared visual moment.</strong>
            <p>
              Set each camera’s start on the event timeline. Positive values
              mean the recording starts later. A matching visible action is a
              useful check; sound can arrive later at distant cameras.
            </p>
          </div>
          {sources.length > 1 && (
            <div className="ot-visual-align">
              <Choice
                label="Match a camera to the first recording"
                value={alignId || sources[1].id}
                onChange={setAlignId}
                options={sources
                  .slice(1)
                  .map((s) => ({ value: s.id, label: s.name }))}
              />
              <p>
                Pause both videos at the same visible action, then match them.
              </p>
              <div>
                <label>
                  Reference · {sources[0].name}
                  <video
                    ref={alignmentReference}
                    src={sources[0].url}
                    controls
                    playsInline
                    preload="metadata"
                  />
                </label>
                <label>
                  {
                    sources.find((s) => s.id === (alignId || sources[1].id))
                      ?.name
                  }
                  <video
                    key={alignId || sources[1].id}
                    ref={alignmentOther}
                    src={
                      sources.find((s) => s.id === (alignId || sources[1].id))
                        ?.url
                    }
                    controls
                    playsInline
                    preload="metadata"
                  />
                </label>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const a = alignmentReference.current,
                    b = alignmentOther.current;
                  if (!a || !b || a.readyState < 2 || b.readyState < 2) {
                    setError('Wait for both recordings to load.');
                    return;
                  }
                  a.pause();
                  b.pause();
                  const id = alignId || sources[1].id;
                  setOffsets((o) => ({
                    ...o,
                    [id]: Number(
                      (
                        sources[0].offset +
                        a.currentTime -
                        b.currentTime
                      ).toFixed(3),
                    ),
                  }));
                  setMessage(
                    'These visible moments are matched. Check another moment later in the recording for drift.',
                  );
                }}
              >
                <Check size={16} /> Match these moments
              </Button>
            </div>
          )}
          {sources.map((s) => (
            <label className="ot-offset" key={s.id}>
              <span>
                {s.name}
                <small>Starts at event second</small>
              </span>
              <Input
                aria-label={`${s.name} start on event timeline in seconds`}
                type="number"
                step={0.01}
                value={s.offset}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n) && Math.abs(n) < 7200) {
                    setPlaying(false);
                    setOffsets((o) => ({ ...o, [s.id]: n }));
                  }
                }}
              />
            </label>
          ))}
          <p className="hint">
            This changes exploration and future angle choices. Kept source
            intervals stay intact. Time-step buttons seek about 33 ms; they are
            not exact frame stepping.
          </p>
          <p className="hint">
            Keyboard: focus the player background, then Space to play or pause;
            ← / → to move five seconds. Every action also has a visible control.
          </p>
        </DialogContent>
      </Dialog>
      <Dialog
        open={exportOpen}
        onOpenChange={(v) => {
          if (!busy) setExportOpen(v);
        }}
      >
        <DialogContent className="ourframe-dialog ot-dialog">
          <DialogHeader>
            <DialogTitle>One more take, yours.</DialogTitle>
            <DialogDescription>
              {session
                ? 'Create a numbered take from your chosen moments.'
                : 'Your chosen recordings will be added to a private ourTake session to create your MP4. Your choices come with them.'}
            </DialogDescription>
          </DialogHeader>
          <label>
            Give it a name
            <Input
              value={edit.title}
              disabled={busy}
              maxLength={100}
              onChange={(e) => change({ ...edit, title: e.target.value })}
            />
          </label>
          <Choice
            label="Picture shape"
            disabled={busy}
            value={edit.aspect}
            onChange={(aspect) => change({ ...edit, aspect })}
            options={[
              { value: 'landscape', label: 'Landscape · the whole view' },
              {
                value: 'portrait',
                label: 'Portrait · full view on a soft background',
              },
            ]}
          />
          <p>
            {edit.moments.length} moments · {total.toFixed(1)} seconds ·
            Original color
          </p>
          <p className="hint">
            The MP4 uses your camera choices in sequence, with each shot’s own
            sound. Tile layouts, playback speed, and the listening camera are
            viewing controls.
          </p>
          {!session && (
            <label className="ot-permission">
              <Checkbox
                checked={permission}
                onCheckedChange={(v) => setPermission(v === true)}
                disabled={busy}
              />
              <span>
                I have permission to include these recordings in a private
                session.
              </span>
            </label>
          )}
          <Button
            disabled={
              busy || unavailable || total > 120 || (!session && !permission)
            }
            onClick={() => void exportTake()}
          >
            {busy ? <LoaderCircle className="spin" /> : <Clapperboard />}
            {busy ? 'Creating take…' : 'Create MP4 take'}
          </Button>
          {exportStatus && <p role="status">{exportStatus}</p>}
          <Button variant="outline" onClick={downloadPlan}>
            <Download /> Download edit plan
          </Button>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
