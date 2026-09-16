# Squash field test — executable runbook (this machine)

Date prepared: 2026-09-16 · Supersedes the setup sections of `SQUASH-FIRST-FIELD-TEST.md` (whose paths referenced the old machine); its shot list, camera layout, and pass criteria still apply. Repo: `D:\venkat\limca\ourTake`, system Node 24.18, ffmpeg/ffprobe on PATH.

## What is already prepared (2026-09-16)

- **TLS solved.** Local CA (`certs/rootCA.pem` / `rootCA.cer`) + worker certificate (`certs/worker.pem|key`) whose SANs cover both court network options: laptop-hosted Windows Mobile Hotspot (`192.168.137.1`) and iPhone-hosted hotspot (`172.20.10.1–14`). `.env.local` points the worker at the cert and allowlists those origins. Valid to Oct 2027; phones must install + trust `rootCA` once (helper: `node scripts/serve-field-ca.mjs`).
- **Render pipeline fixed and verified.** A Windows-path bug in the ffmpeg concat step broke every composition on this machine (`server/composition.mjs`); fixed, and the full integration suite now passes here: auth isolation, scheduled start, resumable uploads, tagging, signed media, all four styles + manual takes rendering real MP4s, restart persistence, deletion.
- **Security hygiene.** GitHub PAT scrubbed from the git remote (rotate the token on GitHub — still yours to do); the founder mega-env moved out of the repo to `D:\venkat\limca\.env.local` (also fixes `db:provision`); app `.env.local` is now worker-only.
- **Brand applied.** T-through-O mark (favicon, manifest icon, masthead), per BRAND-KIT "Working selection" addendum.

## Phase 0 — porting the runtime from the desktop to the laptop

Transfer split: **GitHub carries the code; a USB stick carries only the secrets** (which are gitignored and must never be pushed). Do all of this at home, on internet.

1. **On the desktop:** commit and push the repo (done 2026-09-16). Copy exactly two items to the USB stick: the `certs\` folder and the `.env.local` file (both from the repo root). Nothing else — `node_modules`, `dist`, `data`, and `test-output` must NOT be transferred; they are machine-specific or regenerated.
2. **On the laptop, install the toolchain** (one time):
   - Node 22.13+ (24 LTS recommended): `winget install OpenJS.NodeJS.LTS`
   - FFmpeg + ffprobe on PATH: `winget install Gyan.FFmpeg` (then open a fresh terminal and confirm `ffmpeg -version` and `ffprobe -version`)
   - Git, and auth for the private repo: `winget install GitHub.cli` then `gh auth login`
3. **Clone and restore:**
   ```
   gh repo clone faui/ourTake
   cd ourTake
   ```
   Copy `certs\` and `.env.local` from the USB stick into the repo root (`.env.local` uses relative cert paths, so it works unchanged on any machine). Then:
   ```
   npm.cmd install
   ```
4. **Verify ON THE LAPTOP — do not skip.** The desktop taught us renders can break machine-specifically (ffmpeg concat path bug). Run:
   ```
   npm.cmd run typecheck
   npm.cmd test
   npm.cmd run test:integration
   npm.cmd run build
   npm.cmd start
   ```
   Integration must end by printing a JSON report (that only happens on success). `npm.cmd start` must print `OurFrame worker: https://localhost:4100`.
5. Wipe or safely store the USB stick afterwards — it holds the CA private key.

**Court networking with venue Wi-Fi (recommended topology):** connect the LAPTOP to the venue Wi-Fi, then turn on Windows Mobile Hotspot sharing that Wi-Fi connection, and join the three phones to the *laptop's* hotspot (not the venue Wi-Fi). This keeps the laptop at the deterministic `192.168.137.1` the certificate covers, gives the phones internet through the laptop, and removes the "hotspot needs a connection to share" failure mode. Do NOT put the phones directly on venue Wi-Fi for the session — the venue-assigned laptop IP is not in the certificate, and client-isolation on venue networks often blocks phone→laptop traffic anyway.

## Phase 1 — home dry run (do this before booking the court)

1. **Build + start the worker (single process, HTTPS):**
   ```
   cd D:\venkat\limca\ourTake
   npm.cmd run build
   npm.cmd start
   ```
   Expect the banner to show an `https://` origin on port 4100.
2. **Start the laptop hotspot:** Settings → Network & internet → Mobile hotspot → On (share your Wi-Fi adapter). The laptop becomes `192.168.137.1`. *(If Windows refuses because there is no internet connection to share, use the iPhone-hotspot fallback in Phase 2 — the certs cover both.)*
3. **Install the CA on all three phones (one-time):** join the phones to the hotspot, run `node scripts/serve-field-ca.mjs`, open `http://192.168.137.1:8899/` on each phone and follow the on-page steps (iPhone: install profile **and** enable full trust in Certificate Trust Settings; Pixels: install as *CA certificate*). Stop the helper afterwards.
4. **Smoke test:** each phone opens `https://192.168.137.1:4100` — expect the padlock, no warning. Create a session on one phone, invite the other two by QR, arm all three cameras, record a 30 s take, watch uploads complete, render one "Original" edition, play it back on a phone.
5. Charge everything to ≥80% and clear ≥5 GB per phone (per `SQUASH-FIRST-FIELD-TEST.md`).

## Phase 2 — court day

1. At the court, laptop on, **Mobile hotspot on**, join all three phones. No venue Wi-Fi or internet needed — everything is local.
2. `npm.cmd start` → phones open `https://192.168.137.1:4100` (bookmark it during the dry run).
3. **Fallback (only if the laptop hotspot won't start):** enable the iPhone 13's Personal Hotspot, join laptop + both Pixels to it, find the laptop's IP with `ipconfig` (it will be `172.20.10.x`), and use `https://172.20.10.x:4100` — the cert and origin allowlist already cover `.1–.14`.
4. Run the shot list from `SQUASH-FIRST-FIELD-TEST.md`: placement per its layout table, 30 s readiness take → 90 s drill → 3 min rallies, clap at each start, keep screens awake and the page foregrounded (scheduled start relies on a live browser timer).
5. Between takes: uploads run over the hotspot; watch the Footage tab counts. Mark moments as you go.
6. Before leaving: render at least one edition per style, and run the upload-interruption recovery test (toggle a phone's Wi-Fi mid-upload; it must resume).
7. Fill the results matrix in the field doc. Also record: battery % per phone at start/end, any thermal warnings, and hotspot dropouts.

## Known limits to respect (unchanged)

Estimated playback alignment, not exposure sync; keep pages foregrounded during scheduled starts; IndexedDB is the only copy until upload completes — as the field doc says, use native-camera backup recording on the master phone for irreplaceable moments; the laptop is a single point of failure (plug it in).

## Recovery quick reference

- Phone shows certificate warning → the CA wasn't fully trusted (iPhone: Certificate Trust Settings toggle; Pixel: must be installed as *CA certificate*, not VPN/app cert).
- "Worker offline" on phones → confirm phone is on the hotspot and the URL uses the exact IP; check the worker terminal is still running.
- Upload stuck → leave the tab open; it resumes with server-acknowledged offsets. Do not clear the browser's site data.
- Render fails → check ffmpeg is on PATH in the worker terminal (`ffmpeg -version`); failed takes keep their number and can be retried.
