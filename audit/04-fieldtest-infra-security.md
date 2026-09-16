# Audit 04 — Field-Test Readiness, Deployment State, Security Hygiene

Audit date: 2026-09-10 · Auditor: Claude (handoff audit) · Repo: main @ `45636a6` (single "Initial commit", working tree clean). Read-only; no originals modified. Secret **values** were never read into this report — names/locations only.

## 1. Field-test plan quality

**Verdict: strong runbook content, one unresolved blocking dependency (HTTPS).**

`docs/SQUASH-FIRST-FIELD-TEST.md` is a genuinely executable 45–60 min runbook: setup gate at home (build + single-process worker on :4100, "Connected" check), kit list with battery/storage budgets (80% charge, ~5 GB/phone, ~1.35 GB total at 12 Mbps for 5 min), a concrete 3-camera layout table (iPhone 13 rear-center master, Pixel 11 Pro rear-left, Pixel 10 rear-right, behind rear glass), three graduated takes (30s readiness → 90s drill → 3 min rallies) with clap sync references, an upload-interruption recovery test, a results matrix, explicit pass criteria, and a native-camera fallback (step 12). `docs/FIELD-TEST.md` complements it with pre-court checklist, per-activity layouts, observation fields, failure recovery, and exit criteria. Together they are honest about limits (estimated clock sync, no ball tracking, no coordinator failover).

**HTTPS story — the weakest link.** Both docs and README agree: phone camera needs a trusted HTTPS origin; plain LAN HTTP won't open `getUserMedia`. Three options are named (trusted local TLS cert via `TLS_CERT`/`TLS_KEY` in `.env.example` and `server/index.mjs:756` which does support `https.createServer`; an "explicitly approved temporary tunnel"; hosted frontend + reachable HTTPS worker). But SQUASH-FIRST §1 states plainly: **"This is still a pending setup step"** — no tunnel authorized, no cert generated (no cert files present; `*.pem` is gitignored and none exist). The runbook is not executable end-to-end today.

**Court-network realism gaps (concrete):**
- No mention of venue Wi-Fi vs. phone hotspot anywhere in either doc. Three phones + laptop must share a network with the laptop worker; squash courts frequently have no usable Wi-Fi. A hotspot topology (which phone hosts, whether the laptop-on-hotspot IP changes the origin/ALLOWED_ORIGINS) is undocumented.
- If a tunnel is used, uploads (~1.35 GB) transit the tunnel over venue uplink — no bandwidth/time estimate given.
- The hosted-Vercel-frontend option still needs an HTTPS **worker** reachable from phones; no recipe exists for exposing the laptop worker over HTTPS on a LAN (self-signed certs won't be trusted by stock iOS Safari without profile installation — not addressed).
- **Stale paths:** SQUASH-FIRST §1 hardcodes `cd C:\venkat\limca\jugnu2\ourframe` and a `codex-primary-runtime` node.exe path; the repo now lives at `D:\venkat\limca\ourTake`. A tester following the doc verbatim fails at step 1.
- No printed QR/URL contingency if the laptop screen is the only invite surface outside the court.

## 2. Deployment state

- **Vercel:** `.vercel/project.json` shows a linked project — `projectName: "ourframe"` under a team org. Link metadata only; no evidence of an actual deployment in the repo.
- **`vercel.json`:** static-only export — `framework: null`, `buildCommand: npm run build`, `outputDirectory: dist/client`, cleanUrls, plus `Referrer-Policy: no-referrer` and `X-Content-Type-Options: nosniff` headers. No serverless functions, no rewrites/proxy to a worker.
- **`.vercelignore`** correctly excludes `data`, `.env*`, `server`, `scripts`, `tests`, `docs`, `node_modules`, etc. — the worker and secrets are not uploaded.
- **Can the deployed frontend work without the local worker? No.** `lib/ourframe.ts:159` reads `VITE_OURFRAME_API_URL` as API base; without a reachable HTTPS Node worker (which only exists as the laptop process on :4100), a Vercel deployment renders UI but no sessions/upload/render. There is no cloud worker.
- **Supabase:** `scripts/provision-supabase.mjs` (`npm run db:provision`) idempotently creates a server-only `ourframe` schema + `ourframe.records` table with RLS enabled and `anon`/`authenticated` revoked, pinned to Supabase's prod CA, never printing the connection string — well-written. README says this was already run against the cloud project. **However, the script reads `../../.env.local` relative to `scripts/` → `D:\venkat\limca\.env.local`, which does not exist** — the env file now sits inside the app dir — so `db:provision` would fail with ENOENT if re-run today. Regardless, **the runtime still uses local SQLite** (`data/ourframe.sqlite` + WAL/SHM, `data/signing-key`, empty `data/media` and `data/renders`); the cloud adapter and direct object-storage upload are explicitly future work. Also committed: `.openai/hosting.json` (static-dir descriptor, no secrets).

## 3. Secrets / security hygiene

**Committed history: clean.** `git ls-files` shows only `.env.example` (no values, public-only vars); no `.env.local`, no `data/`, no `.vercel/`, no pem files ever committed (single-commit history, verified). `git grep` for key patterns across tracked files: no hits. `.gitignore` covers `.env*`, `/data/`, `.vercel`, `*.pem`; `git check-ignore` confirms all are actively ignored.

**Findings (presence only, no values):**
1. **GitHub PAT embedded in remote URL — CONFIRMED.** `git remote -v` shows `https://ghp_…@github.com/faui/ourTake.git` (classic personal access token) in both fetch and push URLs, i.e., stored plaintext in `.git/config`.
2. **Founder mega-env inside the app directory.** `.env.local` (103 lines) is the *unrelated shared environment*, containing ~30 high-value secrets by name: `SUPABASE_SERVICE_ROLE_KEY` (plus `CLOUD_*` and `DOCKER_*` variants), Postgres connection strings with credentials, `RAZORPAY_KEY_SECRET` + webhook secret, `OPENAI_API_KEY`, `GOOGLE_CLIENT_SECRET`, `TURNSTILE_SECRET_KEY`, `UPSTASH_REDIS_REST_TOKEN`, Twilio auth token, `RESEND_API_KEY`, `META_WHATSAPP_ACCESS_TOKEN`, `PICKUP_CREDENTIAL_SECRET`. This directly contradicts README's own rule ("Do not copy the unrelated parent `.env.local` into the app"). Worse, `npm run worker`/`start` uses `--env-file-if-exists=.env.local`, so **the media worker process loads every unrelated production secret into its environment** while serving LAN/tunnel traffic.
3. `data/signing-key` (32-byte media-link signing key) on disk, ignored — fine, but it's the trust root for expiring media links.
4. `.env.example` itself is clean (public URLs/ports only, explicitly annotated).

**Remediations (priority order):**
- (a) Revoke the `ghp_` PAT on GitHub and re-auth via `gh auth login` or a credential manager; scrub the URL with `git remote set-url origin https://github.com/faui/ourTake.git`.
- (b) Move the founder mega-env back out of the repo directory; keep an app-local `.env.local` containing only the worker vars from `.env.example` (this also fixes/clarifies the `db:provision` path).
- (c) Rotate `SUPABASE_SERVICE_ROLE_KEY` and DB passwords if that file has ever been shared/synced.
- (d) Since only a service-role path exists, consider a dedicated least-privilege DB role for `ourframe` instead of the service key.

## 4. Environment / runbook reproducibility

- **Node:** `package.json` engines `>=22.13.0`; README requires 22.13+ (24+ for worker) because Node 22.12's SQLite support was insufficient. Current machine runs v24.18.0, but docs still reference a machine-specific bundled runtime path (`C:/Users/venka/.cache/codex-runtimes/...`) and note the bundled Node 24.19 crashed on frontend build (libuv assertion) — honest, but a new machine gets contradictory guidance that only applies to the old machine.
- **FFmpeg:** required on PATH (or `FFMPEG_PATH`/`FFPROBE_PATH` overrides in `.env.example`, read by `server/index.mjs`). No install/verify step in the runbook beyond "must be installed and reachable" in failure recovery — a fresh machine can reach take-time before discovering renders fail.
- **Windows quirks:** documented well (`npm.cmd`, PowerShell blocks, explicit cert paths), but **every `cd` path in README and SQUASH-FIRST points at `C:\venkat\limca\jugnu2\ourframe`**, not this repo. A new machine following docs literally fails immediately; someone adapting paths would likely succeed: `npm install` → `npm run worker` + `npm run dev` (Vite proxies `/api` → :4100) or `build` + `start` on :4100 is coherent, and the verify suite (`typecheck`, unit, integration on :4117, build) is a real gate.
- **Net:** a competent new machine succeeds after fixing paths and installing FFmpeg; a literal doc-follower does not.

## 5. Scored verdict

| Dimension | Score | Justification |
|---|---:|---|
| **Field-test readiness** | **6/10** | Excellent, honest, graduated runbook — but the single blocking prerequisite (trusted HTTPS for phone cameras) is explicitly unresolved, court networking (Wi-Fi/hotspot) is unaddressed, and hardcoded paths are stale. |
| **Deployment readiness** | **4/10** | Vercel project linked with a sane static-only config and clean ignore rules, but the frontend is useless without a nonexistent hosted HTTPS worker; Supabase namespace provisioned yet the runtime is 100% local SQLite and the provisioner's env path is now broken. |
| **Security hygiene** | **5/10** | Git history is clean and ignore rules are correct — but a classic GitHub PAT sits in the remote URL, and a 30-secret founder production env (service-role key, payment/DB credentials) lives inside the app dir and is loaded wholesale into the network-exposed worker process. Both are fixable in minutes; until then they dominate the score. |

**Key files:** `docs/SQUASH-FIRST-FIELD-TEST.md`, `docs/FIELD-TEST.md`, `README.md`, `vercel.json`, `.vercelignore`, `.vercel/project.json`, `.env.example`, `.env.local` (secrets present — names reported only), `scripts/provision-supabase.mjs`, `.gitignore`, `server/index.mjs` (TLS at line 756, origin gate at 42/176), `lib/ourframe.ts:159` (`VITE_OURFRAME_API_URL`).
