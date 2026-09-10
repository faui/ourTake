# OurFrame — collaborative capture pilot

Brand update, 10 September 2026: the selected customer-facing name is **ourTake**. Read [the authoritative brand kit](docs/BRAND-KIT.md) before brand, copy, or UI work. It records the agreed principles and exploratory visual candidates; the existing runtime still uses OurFrame.

## ourTake player and editor — 10 September 2026

Open `/player` to use local videos, or **Watch & create** inside a shared session. The player implements selected-camera comparison, shared estimated playhead, one listening camera, slow motion, approximate time steps, range looping, visual/manual alignment, a moment tray with trimming/angle replacement/reordering, undo/redo, local draft recovery, sequence preview, and real numbered MP4 takes. Original media is preserved. Local-file export creates a private session and uploads the selected originals after the permission checkbox; it carries the edit choices through automatically. The local media service must be running.

The public wordmark and app metadata now use ourTake. Existing operational colors and pilot mark are retained; no exploratory logo family was adopted. Internal OurFrame identifiers and storage keys remain compatible.

Read the [synchronization and contemporary UX study](docs/PLAYER-RESEARCH.md), [player/editor specification and feature inventory](docs/PLAYER-SPEC.md), and [delivery status](docs/PLAYER-IMPLEMENTATION.md).

Timing is **estimated**, not verified exposure synchronization. Browser capture now samples four-timestamp clock exchanges periodically and retains callback timing evidence with uploads. It does not embed native MP4 metadata, access sensor timestamps, or implement acoustic refinement. Imported file modification times are no longer used as capture timing. Exact frame stepping, native phase alignment, photo stories, annotations, voiceovers, continuous export audio, and tiled MP4 compositions remain future work.

For this machine, use the bundled Node 24 runtime for `server/index.mjs` and `tests/integration.mjs`; the system Node 22.12 lacks the required SQLite support in its current invocation. The frontend builds successfully using the installed system runtime. Keep both the media service (4100) and frontend (3000) available for the editor.

A working local session/capture/upload/render implementation with a custom mobile-first interface. It is an engineering pilot, not yet an autonomous sports-analysis system.

## What works

- Private session creation, QR invitations, participant joining, host-controlled start/stop.
- Explicitly armed cameras with a scheduled countdown and measured network clock estimate.
- Camera preview, activity-specific placement guidance, participant-selected court positions, light/frame-change indicators, and two bitrate targets.
- Local recording chunks in IndexedDB, native-video import, resumable 2 MiB uploads, retained originals.
- Marked moments and participant-tagged intervals; different filters for “my camera” and “featuring me.”
- Four actual FFmpeg editions: Original, Pulse, Noir, Study. 1080p portrait/landscape H.264/AAC MP4 downloads and supported phone share sheets.
- Persistent local records and queued jobs, scoped membership, expiring media links, and host deletion.

## What is not implemented

Bluetooth/NFC cross-platform sync; hardware sub-frame alignment; automatic FOV calibration; automatic player/ball recognition or Re-ID; semantic sports highlights; coordinated adaptive FPS; phone-to-phone compute; sensor import/overlay; generative reconstruction; multi-location live feeds; cross-session collection composition; TikTok/Instagram publishing; full CapCut-style manual editing. The interface labels manual placement/tagging and deterministic timeline edits honestly.

## Run locally

Requires Node 22.13+ (24+ is supported for the worker), npm, FFmpeg and ffprobe on PATH. The current machine also has a bundled Node runtime at `C:/Users/venka/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe`.

```powershell
cd C:\venkat\limca\jugnu2\ourframe
npm.cmd install
npm.cmd run worker
```

In a second terminal:

```powershell
cd C:\venkat\limca\jugnu2\ourframe
npm.cmd run dev
```

Open `http://localhost:3000` on this computer. The development server proxies `/api` to the worker on port 4100. For a single-process local production preview:

```powershell
npm.cmd run build
npm.cmd start
```

Then open `http://localhost:4100`. The worker serves the generated `dist/client` assets and API together.

The build completed successfully with the installed Node 22.12 runtime on this machine. The bundled Windows Node 24.19 runtime emitted a libuv shutdown assertion after prerendering, so use the system Node for local frontend builds here or a supported recent Node 22 release. This is recorded rather than ignoring a nonzero build exit.

Copy `.env.example` to the app's `.env.local` only if configuring worker settings. Do not copy the unrelated parent `.env.local` into the app or expose its keys through frontend build variables. Worker and public frontend settings are documented in the example.

## Phones and HTTPS

Cross-device browser camera access requires a trusted HTTPS origin. A phone's localhost is not the computer. See [the field guide](docs/FIELD-TEST.md) for trusted local TLS, approved tunnel, and hosted-frontend options. Opening a temporary public tunnel requires explicit authorization. Stop the tunnel after testing; it is not a production deployment.

## Vercel and Supabase

A new Vercel project `ourframe` was created and linked in this app directory. `vercel.json` exports only the static frontend. Set `VITE_OURFRAME_API_URL` to a reachable HTTPS Node worker before deploying that frontend, and allow the deployed origin on the worker. The frontend does not contain service-role keys.

A server-only `ourframe` schema and `ourframe.records` table were provisioned in the cloud Supabase project from the parent `.env.local`. Browser roles have no access and RLS is enabled. This is a new namespace within the existing database, not a newly created Supabase project/database server. **The pilot continues to use local SQLite.** The cloud runtime adapter and direct object-storage upload path remain future work.

`npm run db:provision` is the idempotent namespace provisioner. It reads only the selected cloud database configuration into a server process, uses Supabase's CA, and never prints the connection string.

## Verify

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:integration
npm.cmd run build
```

The integration test runs its own worker on port 4117 and generates synthetic video fixtures. It verifies access control, scheduled commands, resumable and idempotent uploads, tagging, signed media/ranges, real exports for all four styles, restart persistence, and deletion. Reports and sample MP4s are in ignored `test-output/run-*` directories. These tests do not establish physical-phone reliability, measured exposure synchronization, sports detection accuracy, or visual design quality.

The app exposes two optional feature-detected WebMCP tools for reading the session and opening the session-creation form. No supported WebMCP environment was available for runtime validation; this optional surface is unverified.

## Documents

- [Meddly / SPORT.VIDEO reviews, operating model, funding and financial scenarios](docs/COMPETITOR-AUDIT.md)
- [Updated MVP: native capture, heart-rate selection, adults only](docs/PRODUCT-DECISIONS-2026-09-09.md)
- [Jugnu current/history review and reuse decisions](docs/JUGNU-REUSE-AUDIT.md)
- [Response to all founder observations and TT ideas](docs/FOUNDER-RESPONSE.md)
- [Brand kit, messages, names, and UX system](docs/BRAND-KIT.md)
- [Architecture, stack, data flow, scope boundaries, and cloud path](docs/ARCHITECTURE.md)
- [Three-phone field test and recovery guide](docs/FIELD-TEST.md)

Do not commit `data`, `.env.local`, `.vercel`, generated certificates, or `test-output`. The site does not send private footage to an AI provider or automatically post anything to social accounts.
