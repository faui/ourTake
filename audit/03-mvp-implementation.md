# Audit 03 — MVP Implementation

Audit date: 2026-09-10 · Auditor: Claude (handoff audit) · Repo: main @ `45636a6`. Read-only (dependencies restored via `npm ci` into gitignored `node_modules` only; `typecheck` and unit tests executed as verification).

## 1. Architecture summary

**Coherent, deliberately-scoped single-machine pilot.** Pieces:

- **Frontend** — React 19 + TypeScript in a **vinext** app (Next.js-compatible framework running on Vite). This resolves the "both Next.js and Vite" oddity: `next.config.ts` (`output:'export'`) and `vite.config.ts` (vinext plugin + `/api` proxy to :4100) are *both consumed by vinext*; there is no plain Next.js runtime. Static export to `dist/client`, servable by the worker or Vercel. Two routes: `/` (session/capture app, `components/ourframe-app.tsx`) and `/player` (local-video editor, `components/ourtake-player.tsx`).
- **Worker** — one Node process (`server/index.mjs`, 771 lines): HTTP(S) API, static file serving, and a strictly sequential in-process FFmpeg render queue (`work()`, lines 697-743). Crash recovery: `rendering→queued` and upload-offset reconciliation on boot (745-753).
- **Storage** — SQLite via `node:sqlite` `DatabaseSync` with a single JSON-envelope table `records(kind,id,session_id,data)` (`server/store.mjs`, 18 lines, prepared statements throughout). Media on disk under `data/media` (server-named `<uuid>.source`), renders under `data/renders/<job-id>`.
- **Sync** — NTP-style four-timestamp exchange against `/api/time` (7 samples, lowest half-RTT kept; `lib/ourframe.ts:199-231`, math in `lib/player-model.mjs:28-38`), host schedules start 8s ahead, phones fire `MediaRecorder` via `setTimeout` (`capture-panel.tsx:342-345`). Periodic 30s re-measurement stored as sidecar "clockAnchors" evidence. Docs are unusually honest that this is estimated playback alignment, not exposure sync.
- **Upload** — MediaRecorder 3s chunks → IndexedDB; resumable 2 MiB HTTP chunks with server-authoritative offset (`X-Upload-Offset`, 409 on mismatch), idempotent by `clientId`, `ffprobe` validation on complete.
- **Export pipeline** — plan (`planComposition`/`validateManualEntries`) → per-entry FFmpeg H.264/AAC segment encode with fit-not-crop framing → concat-copy → probe output → signed expiring URL. Manual edit path from the player carries an idempotent `requestId` and server-allocated stable take numbers.

**Odd choices:** heavyweight generated UI kit (77 `components/ui/*` files, mostly unused); `@cloudflare/*`, `wrangler`, `@openai/sites-vite-plugin`, `recharts`, `embla-carousel`, `cmdk`, `input-otp`, `date-fns`, `react-day-picker`, `react-resizable-panels` in deps with no app usage found; provisioned Supabase table intentionally unused by runtime (documented). Overall the architecture is coherent and matches its own written boundaries unusually well.

## 2. Code quality

**Hotspots:** `components/ourtake-player.tsx` — **1,690 lines, one component, ~30 useState atoms**, interval-driven playhead (50ms tick, 0.12s drift reseek, lines 285-380). `server/index.mjs` — 771 lines, one `handler()` function containing the entire API. `capture-panel.tsx` (515) is well-structured; `ourframe-app.tsx` (77 lines but extremely dense ~500-char JSX lines) is hard to review/diff. Code style is deliberately compressed (comma-chained `const`, minified JSX) — consistent but a maintainability tax.

**Error handling:** genuinely good. `fail(status,msg)` pattern with user-facing messages; internal errors log server-side and return a generic 500 (`index.mjs:686-695`); frontend surfaces every failure path with a next action (storage-full stops recording and preserves chunks, save failures offer edit-plan download, failed renders keep take identity for retry).

**Type safety:** `strict: true`, typecheck clean. Escape hatches are few (`(import.meta as any)` in `ourframe.ts:159`, `any` in IndexedDB helpers and WebMCP block). Server is untyped `.mjs` — validation discipline (`text()`/`number()` clamps on every field) substitutes reasonably.

**Security (good):** parameterized SQL only; bearer tokens = 192-bit random, stored SHA-256-hashed, stripped from snapshots (verified + integration-asserted); invites hashed, host-only exposure, rotation supported; HMAC-signed expiring media URLs with `timingSafeEqual` and session binding (`index.mjs:600-626`); static-serving path-traversal guard (`index.mjs:656-664`) and render-dir delete guard (494-499); no user-supplied disk paths anywhere; CORS allowlist; upload size/aggregate-storage budgets; secrets: `.env.local` untracked, signing key generated 0o600 (mode ineffective on Windows, minor), provision script never prints the connection string and pins Supabase CA.

**Security (weak spots):** no session/token expiry or revocation of individual members; per-IP rate limit only on create/join, `rates.clear()` at 10k entries lets a flooder reset everyone (`index.mjs:145`); HMAC payload joins unescaped `:`-delimited fields (`index.mjs:112`) — not exploitable today because ids are server UUIDs, but fragile; probe on `complete` runs under a 45-120s child-process window inside a request. Sync `appendFileSync`/`statSync` per 2 MiB chunk (`index.mjs:531-533`) blocks the single-threaded server that is also answering 1s polls from every phone.

**Dead code:** unused `Wifi` import (`ourframe-app.tsx:3`); the unused dependency set above; `tsconfig` types include `@cloudflare/workers-types` with no workers code.

## 3. Claimed vs actual (spot checks)

| Claim | Verdict |
|---|---|
| "Eleven model/composition tests pass" (PLAYER-IMPLEMENTATION §Validation) | **True** — 11/11 pass |
| "TypeScript check passes" | **True** — clean `tsc --noEmit` |
| "All queries parameterized; no user path as filename/shell command" (ARCHITECTURE) | **True** — verified store.mjs, index.mjs:353, composition.mjs spawn-args |
| "Tokens hashed; not emitted in snapshots" | **True** — index.mjs:154, snapshot strips; integration.mjs:74 asserts |
| "2 MiB chunks, server-authoritative offset, resume" | **True** — ourframe.ts:369-392, index.mjs:517-539 |
| "Seven exchanges, lowest RTT kept, epoch-change detection, 30s re-burst" | **True** — ourframe.ts:199-231, capture-panel.tsx:63-99 |
| "Output capped 120 s / 60 moments" | **True** — player-model.mjs:40-61 |
| "Signed, expiring, poll-stable media URLs with ranges" | **True** — hour-quantized expiry (index.mjs:110-117); note URLs *do* churn at hour boundaries, resetting playback — "stable across ordinary polling" is only hour-scoped |
| "Never repeats footage to manufacture duration" | **True** — composition.mjs:52-70 + dedicated test |
| "Four real FFmpeg editions" (Original/Pulse/Noir/Study) | **True** — styles/grades composition.mjs:6,77; UI names lib/ourframe.ts:132-157 |
| README "Run locally" instructions | **Stale** — cites `C:\venkat\limca\jugnu2\ourframe`; repo lives at `D:\venkat\limca\ourTake` |
| README "Verify" implies runnable out of the box | **Was false in this checkout** — `node_modules` contained 2 packages; `npm ci` was required first |
| "Integration passes… restart persistence, deletion revocation" | **Plausible, not re-run** — test code covers exactly what's claimed (tests/integration.mjs), but it spawns a worker, renders 5 MP4s and polls up to 5 min, so it was skipped in this audit |

Doc honesty is a standout: limitations (no exposure sync, no recognition, browser-storage fragility, single-process take numbering) are stated in docs *and* enforced/labeled in UI copy.

## 4. Test coverage & verification results

**Ran (2026-09-10):**
- `npm.cmd run typecheck` → passes, **zero errors** (after `npm ci`; first run failed `MODULE_NOT_FOUND: typescript` because dependencies were not installed in the checkout).
- `npm.cmd test` → **11/11 pass**: `ℹ tests 11 · pass 11 · fail 0` (5 composition-planner tests, 6 player-model tests incl. clock-exchange math and asymmetric-delay bias).
- `test:integration` **not run** (spawns worker on 4117, generates fixtures, renders 5 MP4s, up-to-5-min poll loop). Its code covers: authz isolation, host control, scheduled start, resumable + idempotent upload, tagging, signed media/ranges + tamper rejection, 4 recipes + manual 2-shot MP4 with probed dimensions, concurrent-duplicate compose idempotency, restart persistence, invite rotation, delete-revokes-media.

**Gaps:** zero component/UI tests (the 1,690-line player's state machine — preview, undo/redo, offsets, draft restore validation — is tested only via its 68-line model file); no tests for rate limiting, CORS, storage-budget enforcement, upload-resume-after-worker-restart, range-parsing edge cases, or store.mjs; no load/soak tests; no physical-device evidence (docs admit this).

## 5. Readiness for a 3-phone squash field test

- **HTTPS is the gating blocker, by the project's own admission.** Capture hard-fails without a secure context (`capture-panel.tsx:168-171`); worker TLS is optional env config (`index.mjs:756-764`); SQUASH-FIRST-FIELD-TEST.md states trusted HTTPS "is still a pending setup step" and no tunnel is authorized. As it stands, three phones cannot open cameras.
- **Clock sync quality:** sound for playback alignment (~half-RTT error on LAN, tens of ms), but the scheduled start relies on a browser `setTimeout` in a foreground tab — screen lock, tab backgrounding, or timer throttling silently skews/kills the start (mitigated only by "keep page visible" doctrine and a 3s stale-start rejection, capture-panel.tsx:336-341). Asymmetric-path bias is unbounded and correctly acknowledged (player.test.mjs:49-52).
- **Upload resilience:** good — idempotent create, offset resume, 3-retry backoff with offset re-fetch, server-side offset reconciliation after crash. Weakness: whole-take Blob assembly from IndexedDB before upload, and IndexedDB itself is best-effort (OS pressure/private mode can destroy the only copy; docs recommend native-camera backup).
- **Storage limits:** enforced (2 GiB/file, 50 GiB aggregate incl. render reservations, per-clip 2h/8K probe caps). A 20-minute 12 Mbps take ≈ 1.8 GB — brushes the 2 GiB cap and the browser-blob path; fine for the planned 30-60s drills, marginal for full games.
- **Battery/thermal:** no in-app evidence beyond a field-sheet instruction; 1 Hz full-snapshot polling per phone (`ourframe-app.tsx:38`) plus 1080p encode plus the 700ms canvas brightness/motion sampler (`capture-panel.tsx:136-164`) will cost battery; untested on the actual iPhone 13/Pixel 11/Pixel 10.
- **Single laptop worker** doing sync-I/O uploads + FFmpeg renders + 1 Hz polls from 4 clients is a real contention point during "upload everything after the take."

Verdict: with a trusted-cert HTTPS origin prepared at home first (as the docs themselves insist), the drill-scale test is plausible; without it, the test cannot start.

## 6. Top 10 risks/debts (ranked)

1. **No HTTPS story executed** — camera capture impossible on phones; the one unresolved prerequisite for the entire product loop. `capture-panel.tsx:168`, `server/index.mjs:756`, docs/SQUASH-FIRST-FIELD-TEST.md §1.
2. **IndexedDB as sole recording custody + full-Blob assembly** — silent loss of irreplaceable footage under OS storage pressure/private mode; 2 GB blob path for long takes. `lib/ourframe.ts:280-344,350`, ARCHITECTURE.md:58.
3. **Scheduled-start fragility in browser** — `setTimeout` to `MediaRecorder.start()` in a tab that must stay foregrounded; throttling/lock ⇒ missed or late take with only a 3s guard. `components/capture-panel.tsx:327-361`.
4. **1,690-line monolithic player component** with interval-driven playhead and ~30 interdependent state atoms — highest defect-density surface, zero UI tests. `components/ourtake-player.tsx` (esp. 285-380 playback engine).
5. **Blocking sync I/O + single-process contention** — `appendFileSync`/`statSync` per chunk and O(all-uploads+jobs) `statSync` budget scans on each upload create, on the same thread serving 1 Hz session polls. `server/index.mjs:324-330, 531-533`.
6. **No token expiry/member revocation; tokens forever-valid in localStorage** — invite rotation doesn't evict joined members (documented, but delete-session is the only remedy). `server/index.mjs:99-105`, `lib/ourframe.ts:235-248`, FIELD-TEST.md:58.
7. **Polling architecture** — full snapshot (all clips incl. up-to-300 clockAnchors each) re-serialized to every member every second; battery/bandwidth and server JSON-parse cost grow with session size. `components/ourframe-app.tsx:38`, `server/index.mjs:118-135`.
8. **Rate limiting token-gesture only** — 30/min on create/join per IP, global `rates.clear()` at 10k keys defeats itself under flood; uploads/compose/media unlimited beyond queue cap. `server/index.mjs:136-146`.
9. **Dependency bloat / stale scaffolding** — ~10 unused runtime deps, Cloudflare/wrangler toolchain, 77 UI-kit files for ~10 used primitives; stale README paths and node-runtime workarounds. `package.json:20-60`, README.md:35-59.
10. **Take-number allocation and job queue are single-process-only** (non-transactional read-max-then-write, in-memory `rendering` flag, `uploadLocks`) — correct today, a landmine if the worker is ever replicated; docs flag it, code has no guard. `server/index.mjs:448-462,697-701`, PLAYER-SPEC.md:92.

## 7. Scored verdict (1-10)

| Axis | Score | Justification |
|---|---:|---|
| Architecture | **7.5** | Coherent pilot with honest, documented boundaries and a credible cloud path; loses points for polling design, sync I/O on the request thread, and scaffolding residue. |
| Code quality | **6** | Strict-mode clean, disciplined validation and error UX, no real security howlers — but two monolith files, minified style, and dead dependencies materially hurt maintainability. |
| Test coverage | **6.5** | Sharp, claim-matching integration suite plus focused model tests (verified 11/11, typecheck clean); zero UI/component tests and thin unit surface for the largest files. |
| Field-test readiness | **4.5** | Upload/recovery paths are genuinely robust and the runbooks are excellent, but the HTTPS prerequisite is unexecuted, capture custody is fragile browser storage, and no target-device evidence exists. |

**Bottom line:** an unusually honest, tightly-validated engineering pilot whose docs and code agree with each other far more than typical MVPs; the biggest gaps are operational (HTTPS, device trials, browser-capture custody) rather than logical, plus concentrated complexity debt in `ourtake-player.tsx` and `server/index.mjs`.
