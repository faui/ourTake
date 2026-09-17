# Trainer trials — public HTTPS via Cloudflare Tunnel

Date: 2026-09-19 · For sessions where participants use their own phones with **zero setup** (no certificate installs). The laptop still runs the worker; a named Cloudflare tunnel gives it a publicly trusted address on the pilot domain `gozaika.in` (infrastructure domain — the product name on screen remains ourTake).

## One-time setup (at home, ~20 minutes, all on the laptop)

1. **Put the domain on Cloudflare (free plan):** create a Cloudflare account → Add site → `gozaika.in` → Free. Cloudflare shows two nameservers; in **Porkbun** → domain → Nameservers, replace Porkbun's with Cloudflare's. Wait for Cloudflare to email "site active" (minutes to a few hours).
2. **Install cloudflared:**
   ```
   winget install Cloudflare.cloudflared
   ```
3. **Create the named tunnel** (fresh terminal):
   ```
   cloudflared tunnel login
   cloudflared tunnel create ourtake
   cloudflared tunnel route dns ourtake take.gozaika.in
   ```
   The login step opens a browser to authorize; `create` prints a tunnel UUID and writes a credentials JSON under `%USERPROFILE%\.cloudflared\`.
4. **Config file** at `%USERPROFILE%\.cloudflared\config.yml`:
   ```yaml
   tunnel: ourtake
   credentials-file: C:\Users\<you>\.cloudflared\<TUNNEL-UUID>.json
   ingress:
     - hostname: take.gozaika.in
       service: http://127.0.0.1:4100
     - service: http_status:404
   ```
5. **Smoke test:** terminal 1: `npm.cmd run start:tunnel` (worker on loopback, no local TLS — the tunnel provides HTTPS). Terminal 2: `cloudflared tunnel run ourtake`. Any phone, any network: open `https://take.gozaika.in` — padlock, no install, camera works.

## Trial day (basketball court / pilates studio)

1. Laptop online (venue Wi-Fi or your phone's hotspot — the tunnel only needs outbound internet and works even when venue Wi-Fi isolates clients).
2. Two terminals: `npm.cmd run start:tunnel` and `cloudflared tunnel run ourtake`.
3. On your phone open `https://take.gozaika.in`, create the session, and let everyone scan the QR — their phones, their networks, no setup.
4. Watch the worker terminal: it narrates joins, take starts/stops, uploads, and renders.
5. Footage streams to the laptop **during** recording and is removed from each phone once confirmed; participants can download their own originals from Footage, and the host can open downloads for everyone (Crew tab toggle) or delete the session and all media.

## Operating notes

- **Bandwidth ceiling:** phone→Cloudflare→laptop means uploads ride the venue's internet. Live upload tolerates slow links — the phone spools locally and catches up after the take. On very weak uplinks expect the catch-up to run into breaks between takes.
- **Chunks are 2 MiB**, comfortably under Cloudflare's 100 MB request limit.
- **Privacy line for participants** (matches the in-app consent): video goes to the host's computer through an encrypted relay (Cloudflare), not to a cloud service; the host can delete everything; phones keep nothing after upload confirms.
- The certificate/hotspot kit from `FIELD-TEST-2026-09-16.md` is now the **offline fallback** (venues with no internet at all). With the tunnel as the main path, the local field CA can be retired or regenerated at leisure.
- Stop `cloudflared` after the trial; the URL goes dark until you run it again.
