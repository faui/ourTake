'use client';
import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Flag, Mic, ScanLine, Square, SwitchCamera, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Choice } from './ourframe-controls';
import {
  activities,
  api,
  Clock,
  Draft,
  formatTime,
  saveChunk,
  saveDraft,
  Session,
  sessionNow,
  startLiveUpload,
  syncClock,
} from '@/lib/ourframe';

export default function CapturePanel({
  session,
  token,
  onSaved,
  onError,
  onCaptureChange,
}: {
  session: Session;
  token: string;
  onSaved: (completed?: Draft) => void;
  onError: (s: string) => void;
  onCaptureChange: (v: boolean) => void;
}) {
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    recorder = useRef<MediaRecorder | null>(null),
    clockRef = useRef<Clock | null>(null),
    draft = useRef<Draft | null>(null),
    pending = useRef<Promise<any>>(Promise.resolve()),
    processedTake = useRef(0),
    startTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    armedRef = useRef(false),
    autoStart = useRef(false),
    storageFailed = useRef(false),
    live = useRef<ReturnType<typeof startLiveUpload> | null>(null),
    marks = useRef<number[]>([]);
  const [ready, setReady] = useState(false),
    [recording, setRecording] = useState(false),
    [saving, setSaving] = useState(false),
    [arming, setArming] = useState(false),
    [clock, setClock] = useState<Clock | null>(null),
    [quality, setQuality] = useState('high'),
    [stats, setStats] = useState({
      brightness: 0,
      motion: 0,
      width: 0,
      height: 0,
      fps: 0,
    }),
    [now, setNow] = useState(Date.now()),
    [markCount, setMarkCount] = useState(0),
    [armedUi, setArmedUi] = useState(false),
    [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const setClockValue = (v: Clock) => {
    clockRef.current = v;
    setClock(v);
  };
  // Periodic evidence is a sidecar, not a claim about sensor or encoded-frame timestamps.
  useEffect(() => {
    if (!recording || !draft.current) return;
    const item = draft.current,
      origin = performance.now();
    let cancelled = false,
      inFlight = false;
    const measure = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const measured = await syncClock();
        if (cancelled) return;
        item.clockAnchors = [
          ...(item.clockAnchors || []),
          {
            sequence: (item.clockAnchors || []).length,
            elapsedMs: performance.now() - origin,
            offset: measured.offset,
            roundTrip: measured.roundTrip,
            measuredAt: measured.measuredAt,
            evidence: 'recorder-callback-clock-estimate' as const,
          },
        ];
        pending.current = pending.current.then(() => saveDraft(item));
      } catch {
        /* Missing probes remain missing; keep filming offline. */
      } finally {
        inFlight = false;
      }
    };
    void measure();
    const timer = setInterval(() => void measure(), 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [recording]);
  useEffect(() => {
    const t = setInterval(() => setNow(sessionNow(clockRef.current)), 200);
    return () => clearInterval(t);
  }, []);
  // Zero-click flow: the camera opens as soon as the capture panel appears
  // (the browser's own permission prompt is the only gate) and the phone
  // arms itself once the preview is live. The buttons below become toggles.
  useEffect(() => {
    if (!autoStart.current) {
      autoStart.current = true;
      void prepare();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const t = setInterval(() => {
      if (armedRef.current)
        api(`/sessions/${session.id}/self`, token, 'PATCH', {
          armed: true,
          clockError: clockRef.current?.error || 0,
          captureInfo: `${stream.current?.getVideoTracks()[0]?.getSettings().width || 0}p / browser`,
        }).catch(() => {});
    }, 6000);
    return () => clearInterval(t);
  }, [session.id, token]);
  useEffect(
    () => () => {
      if (startTimer.current) clearTimeout(startTimer.current);
      if (recorder.current?.state === 'recording') recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      void api(`/sessions/${session.id}/self`, token, 'PATCH', {
        armed: false,
      }).catch(() => {});
    },
    [session.id, token],
  );
  useEffect(() => {
    const prevent = (e: BeforeUnloadEvent) => {
      if (recorder.current?.state === 'recording') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', prevent);
    return () => window.removeEventListener('beforeunload', prevent);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 36;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let last: Uint8ClampedArray | null = null;
    const timer = setInterval(() => {
      if (!video.current || !ctx || video.current.readyState < 2) return;
      ctx.drawImage(video.current, 0, 0, 64, 36);
      const pixels = ctx.getImageData(0, 0, 64, 36).data;
      let brightness = 0,
        motion = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        brightness += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        if (last) motion += Math.abs(pixels[i] - last[i]);
      }
      last = pixels;
      const settings = stream.current?.getVideoTracks()[0]?.getSettings();
      setStats({
        brightness: brightness / (64 * 36),
        motion: motion / (64 * 36),
        width: settings?.width || 0,
        height: settings?.height || 0,
        fps: settings?.frameRate || 0,
      });
    }, 700);
    return () => clearInterval(timer);
  }, [ready]);
  async function prepare(nextFacing?: 'environment' | 'user') {
    setArming(true);
    try {
      if (!window.isSecureContext)
        throw new Error(
          'Camera access needs HTTPS on this phone. Open the trusted HTTPS pilot address.',
        );
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === 'undefined'
      )
        throw new Error(
          'This browser cannot record here. Use your phone camera and add its video in Footage.',
        );
      if (!indexedDB)
        throw new Error(
          'Local recording storage is unavailable in this browser.',
        );
      const measured = await syncClock();
      setClockValue(measured);
      stream.current?.getTracks().forEach((t) => t.stop());
      const captured = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: nextFacing ?? facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      stream.current = captured;
      if (video.current) {
        video.current.srcObject = captured;
        await video.current.play();
      }
      captured.getVideoTracks()[0].onended = () => {
        armedRef.current = false;
        setArmedUi(false);
        setReady(false);
        if (recorder.current?.state === 'recording') recorder.current.stop();
        onError('Camera stopped. Any saved take remains in On this device.');
        void api(`/sessions/${session.id}/self`, token, 'PATCH', {
          armed: false,
        }).catch(() => {});
      };
      setReady(true);
      armedRef.current = false;
      void arm();
      // Storage permission is optional; never claim that the OS guarantees persistence.
      void navigator.storage?.persist?.().catch(() => {});
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setArming(false);
    }
  }
  async function disarm() {
    armedRef.current = false;
    setArmedUi(false);
    try {
      await api(`/sessions/${session.id}/self`, token, 'PATCH', { armed: false });
    } catch (e) {
      onError((e as Error).message);
    }
  }
  function cameraOff() {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setReady(false);
    armedRef.current = false;
    setArmedUi(false);
    void api(`/sessions/${session.id}/self`, token, 'PATCH', { armed: false }).catch(() => {});
  }
  function flip() {
    if (recording || arming) return;
    const next = facing === 'environment' ? 'user' : 'environment';
    setFacing(next);
    void prepare(next);
  }
  async function arm() {
    try {
      const measured = await syncClock();
      setClockValue(measured);
      await api(`/sessions/${session.id}/self`, token, 'PATCH', {
        armed: true,
        clockError: measured.error,
      });
      armedRef.current = true;
      setArmedUi(true);
      setNow(sessionNow(measured));
    } catch (e) {
      onError((e as Error).message);
    }
  }
  async function begin() {
    if (!stream.current || recorder.current?.state === 'recording') return;
    try {
      const mime = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ].find((m) => MediaRecorder.isTypeSupported(m));
      if (!mime)
        throw new Error(
          'No compatible recording codec was found. Import a native-camera video instead.',
        );
      const r = new MediaRecorder(stream.current, {
        mimeType: mime,
        videoBitsPerSecond: quality === 'high' ? 12000000 : 6000000,
        audioBitsPerSecond: 192000,
      });
      recorder.current = r;
      storageFailed.current = false;
      marks.current = [];
      setMarkCount(0);
      let index = 0;
      const item: Draft = {
        id: crypto.randomUUID(),
        sessionId: session.id,
        name: `${session.self.name} · take ${session.take}`,
        mime: r.mimeType,
        startTime: sessionNow(clockRef.current),
        clockError: clockRef.current?.error ?? null,
        marks: [],
        createdAt: Date.now(),
        complete: false,
      };
      draft.current = item;
      await saveDraft(item);
      // Footage streams to the worker during the take; the local spool stays
      // the source of truth and is removed only after the server confirms.
      live.current = startLiveUpload(item, token);
      pending.current = Promise.resolve();
      r.onstart = () => {
        item.startTime = sessionNow(clockRef.current);
        pending.current = pending.current.then(() => saveDraft(item));
        setRecording(true);
        onCaptureChange(true);
      };
      r.ondataavailable = (e) => {
        if (e.data.size) {
          live.current?.append(e.data);
          const current = index++;
          pending.current = pending.current
            .then(() => saveChunk(item.id, current, e.data))
            .catch(() => {
              storageFailed.current = true;
              onError(
                'Local storage is full or unavailable. Recording has stopped; keep this page open to recover the saved parts.',
              );
              if (r.state === 'recording') r.stop();
            });
        }
      };
      r.onstop = () => {
        setRecording(false);
        setSaving(true);
        onCaptureChange(false);
        void pending.current
          .then(async () => {
            item.complete = !storageFailed.current;
            item.marks = [...marks.current];
            await saveDraft(item);
            try {
              const id = await live.current?.finish(item.marks, item.clockAnchors);
              if (id) {
                item.uploadId = id;
                await saveDraft(item);
              }
            } catch {
              // Live relay fell behind or failed; the spooled take uploads
              // through the ordinary resumable path afterwards.
            }
            onSaved(item.complete ? { ...item } : undefined);
          })
          .catch((e) => onError(e.message))
          .finally(() => {
            setSaving(false);
            armedRef.current = false;
            setArmedUi(false);
            void api(`/sessions/${session.id}/self`, token, 'PATCH', {
              armed: false,
            }).catch(() => {});
          });
      };
      r.onerror = () => {
        onError(
          'The browser interrupted recording. Saved parts remain on this device.',
        );
        if (r.state === 'recording') r.stop();
      };
      r.start(3000);
    } catch (e) {
      onError((e as Error).message);
      setRecording(false);
      onCaptureChange(false);
    }
  }
  useEffect(() => {
    if (
      session.status === 'recording' &&
      session.startAt &&
      session.take > processedTake.current &&
      armedRef.current &&
      session.armedIds?.includes(session.self.id)
    ) {
      processedTake.current = session.take;
      if (sessionNow(clockRef.current) - session.startAt > 3000) {
        onError(
          'This take already started. Re-arm for the next take, or import a separate recording.',
        );
        return;
      }
      startTimer.current = setTimeout(
        () => void begin(),
        Math.max(0, session.startAt - sessionNow(clockRef.current)),
      );
    }
    if (session.status === 'stopped') {
      if (startTimer.current) {
        clearTimeout(startTimer.current);
        startTimer.current = null;
      }
      if (recorder.current?.state === 'recording') {
        const t = setTimeout(
          () =>
            recorder.current?.state === 'recording' && recorder.current.stop(),
          Math.max(0, (session.stopAt || 0) - sessionNow(clockRef.current)),
        );
        return () => clearTimeout(t);
      }
    }
  }, [session.status, session.take, session.startAt, session.stopAt]);
  const countdown =
    session.status === 'recording' && session.startAt && session.startAt > now
      ? Math.ceil((session.startAt - now) / 1000)
      : null;
  function mark() {
    if (!draft.current) return;
    marks.current.push(
      (sessionNow(clockRef.current) - draft.current.startTime) / 1000,
    );
    setMarkCount(marks.current.length);
  }
  return (
    <section className="capture-layout">
      <div>
        <div className={`viewfinder ${recording ? 'is-recording' : ''}`}>
          <video ref={video} muted playsInline autoPlay style={{ transform: facing === 'user' ? 'scaleX(-1)' : undefined }} />
          <div className="finder-corners" />
          {!ready && (
            <div className="camera-empty">
              <Camera size={40} />
              <h3>Add your perspective.</h3>
              <p>
                Enable your camera, frame the action,
                <br />
                then let the host start the take.
              </p>
              <Button className="action" disabled={arming} onClick={() => void prepare()}>
                {arming ? 'Opening camera…' : 'Enable camera'} <Camera />
              </Button>
            </div>
          )}
          {ready && (
            <>
              <div className="finder-top">
                <span className="glass-label">
                  <i className={recording ? 'red-dot' : 'green-dot'} />
                  {recording ? 'REC' : armedUi ? 'READY' : 'PREVIEW'}
                </span>
                <span className="glass-label">
                  {stats.width} × {stats.height} · {Math.round(stats.fps)} FPS
                </span>
              </div>
              <div className="finder-bottom">
                <span>
                  {recording && draft.current
                    ? formatTime((now - draft.current.startTime) / 1000)
                    : 'Keep the whole movement in frame'}
                </span>
                <Mic size={17} />
              </div>
            </>
          )}
          {countdown && ready && <div className="countdown">{countdown}</div>}
        </div>
        <div className="camera-actions">
          {ready && !recording && (
            <Button
              variant="outline"
              className="action"
              disabled={arming || saving}
              onClick={flip}
              aria-label="Switch between rear and front camera"
            >
              <SwitchCamera />
              {facing === 'environment' ? 'Use front camera' : 'Use rear camera'}
            </Button>
          )}
          {ready && !recording && (
            <Button
              className="action"
              disabled={arming || saving}
              onClick={() => void (armedUi ? disarm() : arm())}
            >
              <Check />
              {saving
                ? 'Saving take…'
                : armedUi
                  ? 'Ready — tap to hold'
                  : "I'm ready"}
            </Button>
          )}
          {ready && !recording && (
            <Button
              variant="outline"
              className="action"
              disabled={arming || saving}
              onClick={cameraOff}
            >
              <Square /> Camera off
            </Button>
          )}
          {recording && (
            <>
              <Button className="action" onClick={mark}>
                <Flag /> Mark moment {markCount > 0 && `(${markCount})`}
              </Button>
              <Button
                variant="outline"
                className="action"
                onClick={() => recorder.current?.stop()}
              >
                <Square /> Stop my camera
              </Button>
            </>
          )}
        </div>
        {recording && (
          <p className="hint">
            Keep this page visible and the phone unlocked. Mark moments worth
            including. Upload your saved take after recording.
          </p>
        )}
      </div>
      <aside className="panel setup-panel">
        <span className="eyebrow">YOUR ANGLE</span>
        <h3>Frame the whole story.</h3>
        <p>{activities[session.sport].hint}</p>
        <Choice
          label="Camera position"
          value={session.self.position}
          options={activities[session.sport].positions.map((value) => ({
            value,
            label: value.replaceAll('-', ' '),
          }))}
          disabled={recording}
          onChange={(position) =>
            void api(`/sessions/${session.id}/self`, token, 'PATCH', {
              position,
            }).catch((e) => onError(e.message))
          }
        />
        <Choice
          label="Capture quality"
          value={quality}
          onChange={setQuality}
          disabled={ready}
          options={[
            { value: 'high', label: 'High · 1080p target / 12 Mbps' },
            { value: 'balanced', label: 'Balanced · 1080p target / 6 Mbps' },
          ]}
        />
        <div className="check-list">
          <span>
            <ScanLine size={17} />
            {ready
              ? stats.brightness < 35
                ? 'More light will help'
                : stats.brightness > 235
                  ? 'Check bright highlights'
                  : 'Exposure looks usable'
              : 'Enable preview to check light'}
          </span>
          <span>
            <Camera size={17} />
            {ready
              ? stats.motion > 25
                ? 'Movement detected — check stability'
                : 'Keep the phone mounted'
              : 'Place beyond the playing area'}
          </span>
          <span>
            <Wifi size={17} />
            {clock
              ? `Clock estimate ±${Math.ceil(clock.error)} ms`
              : 'Clock measured when camera opens'}
          </span>
        </div>
        <p className="hint">
          Placement is guided and confirmed by you. This version checks light
          and frame change; it does not automatically measure court coverage or
          guarantee frame-level sync.
        </p>
      </aside>
    </section>
  );
}
