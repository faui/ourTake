# OurFrame architecture and implementation boundaries

9 September update: [native capture and HR-query MVP requirements](PRODUCT-DECISIONS-2026-09-09.md) and [Jugnu adoption map](JUGNU-REUSE-AUDIT.md) define the next contracts. Native capture is the recommended destination; web participation remains. HR selection and adult-only eligibility are committed scope but not implemented. The running implementation described below remains unchanged.

## Running implementation

Frontend: React + TypeScript in the generated Vinext/Vite app, statically exported. Accessible Base UI/shadcn primitives are composed with a custom OurFrame theme. The frontend can be served by the Node worker or deployed as static assets on Vercel. Public configuration is limited to an optional `VITE_OURFRAME_API_URL`.

Backend: Node HTTP/HTTPS server. Session, member, upload, clip, and job records are stored in SQLite with WAL. All queries are parameterized. Media is written to a dedicated `data/media` directory; renders and edit decision lists are written under `data/renders/<job-id>`. No user-supplied path is used as a disk filename or shell command.

Media worker: one durable sequential FFmpeg queue in the local server process. `ffprobe` validates each completed upload. Jobs transition queued → rendering → done/failed. On restart an interrupted rendering job becomes queued. No GPU or external AI request is required for the current recipes.

Capture: `getUserMedia` and `MediaRecorder`, codec feature detection, requested 1080p/30 and 6/12 Mbps, original audio, explicit camera enable/arm, and local IndexedDB chunks. The requested capture profile is a preference, not a hardware guarantee. Source settings are displayed when available. MP4 and WebM are supported; WebM duration can be recovered from packet timestamps when its container header omits duration.

## Data and API

Core records:

- Session: activity, name, group/collection labels, take number, scheduled start/stop, host-controlled invite.
- Member: session-scoped identity, hashed bearer credential, role, selected position, armed status, heartbeat, clock estimate.
- Upload: device-generated idempotency key, expected length, acknowledged offset, local path, status.
- Clip: owner, validated dimensions/duration, start-time estimate, marked moments, participant-tagged intervals.
- Job: requesting participant, scope/style/aspect/target duration, source snapshot, status/progress, output and edit decision list.

The SQLite envelope table is deliberately small for a single-worker pilot. It is not a claim that unindexed JSON records are the final analytics schema. Introduce normalized groups, collections, takes, event observations, clock fits, and provenance relations when those functions are implemented.

Important endpoints:

| Method | Path | Meaning |
|---|---|---|
| POST | `/api/sessions` | Create private session and host membership |
| POST | `/api/join` | Join using the unguessable invitation |
| GET | `/api/sessions/:id` | Read member-scoped session state |
| PATCH | `/api/sessions/:id/self` | Set own position/readiness and heartbeat |
| POST | `/api/sessions/:id/control` | Host schedules start/stop |
| POST | `/api/sessions/:id/uploads` | Create or resume an idempotent upload |
| PUT | `/api/uploads/:id` | Append a bounded chunk at the acknowledged offset |
| POST | `/api/uploads/:id/complete` | Probe and register completed video |
| PATCH | `/api/clips/:id` | Add a moment or one's own identity interval |
| POST | `/api/sessions/:id/compose` | Queue a real composition |
| GET | `/api/media/:kind/:id` | Signed, expiring media URL with range support |
| DELETE | `/api/sessions/:id` | Host removes session and hosted derivatives |

## Timing

Seven timestamp requests estimate `server_time - local_monotonic_time`; the smallest RTT sample is selected. The host schedules recording eight seconds ahead for currently armed cameras. Browser callback timing is persisted with the recording. The display reports half-RTT uncertainty, not sensor exposure accuracy. Independently paced frames, rolling shutters, input pipeline buffering, and long-run drift are not eliminated by this mechanism.

Imported native-camera footage uses file modification time as a coarse ordering hint; that is not reliable capture time and does not create a synchronized multicamera source set. Tag intervals before composing unrelated imports. The pilot's editor samples source-grounded intervals across available views; it is not a frame-accurate sports replay engine.

Native roadmap: iOS AVFoundation and Android Camera2/CameraX modules, monotonic sensor timestamps, recurring clock drift fits, local transport discovery, audio and visual alignment, device-specific exposure/readout calibration, and explicit confidence/fallback behavior. A shared TypeScript product shell may remain, but a web wrapper does not automatically supply native timing guarantees.

## Upload and storage lifecycle

MediaRecorder blobs are persisted roughly every three seconds. Browser event scheduling may make intervals irregular. Stop seals the draft; users upload after the take. HTTP uploads use 2 MiB chunks with a server-authoritative offset and limited retry/backoff. A interrupted network transfer resumes from the acknowledged offset.

The local original remains after upload. Users can export it, and remove the browser copy only after the uploaded clip appears. A host can remove a whole session, including server originals and derived videos. This cannot erase downloaded copies or recordings still on phones. Disk source retention is manual for the pilot. There is a configurable 2 GiB per-file and 50 GiB aggregate upload/reserved-output budget. The worker checks remaining render storage before each job; these are operational caps, not per-user billing.

IndexedDB is best-effort browser storage, not a guaranteed camera-roll backup. OS storage pressure, private browsing, and a terminated tab can lose material. Preserve a native-camera backup for important events until target-device trials establish reliability. For longer sessions, a native independently playable segmented recorder is preferable to large browser blob assembly.

## Editorial pipeline

1. Validate sources and their durations/codecs.
2. Select source set: all cameras, the requesting contributor's camera, or intervals explicitly tagged with that participant.
3. Prefer marked windows for group/camera edits; otherwise sample chronology.
4. Choose nonrepeated intervals and alternative sources according to recipe shot lengths.
5. Fit to 1080×1920 or 1920×1080. Preserve the full source view; do not silently crop the action.
6. Apply the selected modest color treatment. Encode H.264 yuv420p CRF 18 and AAC 192 kbps, 30 fps, fast-start MP4.
7. Concatenate compatible segments and record the actual output duration and decision list.

An export target can exceed source detail; 640p input does not become genuine 1080p capture. The editor does not repeat footage to manufacture duration. No generated frames, automatic identity claims, or fabricated statistics are introduced. Music, speech-aware cuts, optical-flow retiming, player tracking, ball tracking, cross-view Re-ID, and automatic FOV validation remain unimplemented.

## Existing cloud setup

The project is linked to the newly created `ourframe` Vercel project. Supabase provisioning creates `ourframe.records` in the supplied cloud project's PostgreSQL database. The schema/table revoke public, anonymous, and authenticated-browser access, and the table has RLS enabled. No unrelated tables or auth settings are modified. Provisioning uses a verified TLS connection with Supabase's CA.

**The local app currently uses SQLite, not the provisioned PostgreSQL table.** A Vercel frontend needs a reachable HTTPS worker configured at build time. A static frontend alone cannot render video or provide durable session state. Do not deploy the SQLite worker as a Vercel function or assume its filesystem is persistent.

Next cloud adapter: async Postgres repository for metadata and job leases; direct signed resumable uploads to private Supabase Storage/R2/S3; a persistent or leased container worker; expiring signed downloads. A durable queue must claim jobs atomically, renew leases, retry idempotently, and record cancellation/deletion dependency state. This is the path to multi-worker scale, rather than running the pilot's in-memory lock across several processes.

## Open-source building blocks

Currently used: React (UI), Base UI/shadcn (accessible primitives), lucide (icons), qrcode (local invitation encoding), SQLite (metadata), Node, pg (cloud provisioning), and FFmpeg/ffprobe (video validation/rendering). Respect FFmpeg's build-dependent LGPL/GPL and codec obligations when redistributing a binary.

Candidates for a subsequent analysis pipeline: OpenCV for calibration and visual preprocessing; suitable detection/tracking models with verified commercial licenses; ONNX Runtime/Core ML/TensorFlow Lite for supported edge inference; PyAV/FFmpeg for decoding; sport-specific labeled evaluation sets. A model being downloadable does not establish unrestricted commercial or patent licensing. Benchmark on your actual three phones and camera positions before choosing models.

## Security and operating boundary

Invite/member tokens use cryptographic randomness. Member bearer tokens are stored hashed on the server and locally on that participant's browser. Tokens are not logged, included in analytic events, or emitted in session snapshots. Invite hashes are not exposed to guests. Signed media URLs expire and are stable across ordinary polling so playback is not reset. Browser auth is protected by the same-origin model and an explicit API CORS allowlist. Credentials from the founder's shared `.env.local` are not copied into client source.

The development server is not a production endpoint. A temporary tunnel requires explicit approval; it exposes the app/API publicly even though session contents remain permissioned. Before broad public acquisition: introduce host accounts, creation/inference budgets, abuse controls, per-account rate limiting, revocation, observability, quotas for all generated/intermediate media, sandboxed media workers, and a supported deployment lifecycle. These are proportionate next steps for accepting arbitrary internet uploads, not claims that the private pilot is a hardened public platform.

## Validation status

Automated tests cover personal-vs-camera scope, source bounds, no fabricated duration, session authorization, host control, scheduled commands, chunk offsets, duplicate upload requests, signed URLs and ranges, real rendering of all four recipes, worker restart persistence, invitation replacement, and deletion invalidating hosted media. Fixtures are synthetic test-pattern videos, not sports accuracy evaluation. Type checking and static production compilation are run separately. Physical-phone recording, mobile browser resource limits, exact frame alignment, visual design QA, and output preference must be validated in the pilot. The optional WebMCP tools are feature-detected; no supported WebMCP runtime has been used to verify them.
