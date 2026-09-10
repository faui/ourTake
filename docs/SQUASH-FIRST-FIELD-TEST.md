# First squash-court field test

Allow 45–60 minutes. Goal: three cameras reliably produce useful footage and at least one downloadable review clip. Use short drills before attempting a full game. The current pilot does not automatically track the ball, recognize players, align imported footage, or select heart-rate moments.

## 1. Clear the setup gate before leaving home

At the guide's preparation check, ports 3000 and 4100 were not listening. Start the app on the Windows computer:

```powershell
cd C:\venkat\limca\jugnu2\ourframe
npm.cmd run build
& 'C:\Users\venka\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --env-file-if-exists=.env.local server/index.mjs
```

Leave that terminal running. Open http://localhost:4100 on the computer and check Connected. This serves the built frontend and worker together; port 3000 is unnecessary for this test. Keep the computer awake and plugged in.

**Phone camera access requires a trusted HTTPS address. This is still a pending setup step.** A phone's localhost is the phone itself; a plain LAN HTTP address is not an adequate camera origin. The previously proposed public tunnel has not been authorized or started. Use a configured trusted local HTTPS connection or an explicitly approved temporary tunnel. The exact HTTPS origin must be included in the worker's ALLOWED_ORIGINS, followed by a worker restart.

Once HTTPS exists, open that same address on the laptop AND all phones. Create the session from the HTTPS page so the generated invitation does not contain localhost. Complete a 20-second three-phone recording, upload, playback and render at home. Do not spend booked court time debugging deployment.

If HTTPS is unavailable, use the native-camera fallback in step 12. That tests camera placement and content value, but does not test OurFrame coordinated capture.

## 2. Bring and prepare the kit

- Your iPhone 13, Pixel 11 Pro and Pixel 10; confirm the actual model/OS in Settings and note them.
- Three stable mounts, lens cloth, charging cables, and the computer if it will serve the trial onsite.
- Two consenting adult players; ideally one observer operating the laptop and taking notes.
- Facility permission and a rear-glass court with a permitted external viewing area. Keep all equipment outside the playing area and away from the door, exits and spectator movement. If external framing is not possible, choose another court rather than putting unsecured phones in play.
- Charge phones to at least 80%; leave roughly 5 GB free per phone for this small trial and exports. Clean lenses, enable Do Not Disturb if desired, and close unnecessary applications.
- Use Safari on iPhone and Chrome on Pixels, normal browsing mode. Do not clear site data after recording. Keep phones unlocked with the recording page visible.

## 3. Choose three views

Looking toward the front wall from behind the rear glass:

| Camera | Starting position | Job |
|---|---|---|
| A: iPhone | Rear center | Wide master: both players, floor, front wall and useful side-wall context |
| B: Pixel 11 Pro | Rear left | Complementary view when the center camera is blocked |
| C: Pixel 10 | Rear right | Opposite complementary view |

This assignment is a starting point, not a judgment of camera quality. Rotate devices between positions in a later test to separate device quality from viewpoint quality.

Mount landscape, roughly chest/eye height, with lenses reasonably close to the glass without touching it or obstructing access. Start wide without digital zoom. Avoid aiming through markings, door frames or strong reflected lights. Move a player into both back corners and toward the front wall while checking each preview. Adjust for full movement coverage; do not optimize only for an empty court.

Record each mount height and position, and photograph the setup. Do not change position during the first comparison.

## 4. Create and join the session

On the laptop at the shared HTTPS address, create:

- Activity: Squash
- Session: Squash pilot 01 — [date]
- Group: your group's name
- Collection: Squash field tests
- Host name: Observer / your name

Open Invite. Each phone scans the QR, enters its participant name and explicitly agrees to join. If a player wants a personal edit, use that player's membership on one phone and keep using that browser for their tags and compositions. Name the third camera contributor appropriately.

A laptop host plus three phone members means four participants, but only three cameras should be ready. No laptop recording is needed.

## 5. Set capture and arm every phone

Before enabling the camera, choose High — 1080p target / 12 Mbps. This is a requested profile, not a guarantee; note the actual displayed size/FPS. Use the same quality target for all three initially.

Tap Enable camera and grant camera/microphone access. Select back-center, back-left or back-right. Verify landscape orientation and framing. Tap My framing is ready on each phone. The host must see three ready cameras. Camera preview alone is not armed recording.

## 6. Take 1: 30-second readiness test

1. Host presses Start all cameras; wait through the eight-second countdown.
2. Observer verifies REC on all three phones rather than relying only on the host command.
3. Once all are recording, one player makes three clearly visible claps from a position visible to all cameras, before play.
4. Players walk to the front and both rear corners, then make a few controlled shots.
5. Repeat the visible clap reference before stopping. Host presses Stop take; wait until every phone has finished saving.
6. On every phone, open Footage → On this device. Confirm a saved draft and use Save original. Check that the exported file actually plays.
7. Upload each draft, then play all three server clips. Check correct orientation, sound, usable player scale, and whether the ball can be followed during the controlled shots.

Fix failure here before proceeding. If only two phones work, document which failed and continue only as an explicitly labeled two-camera trial.

## 7. Take 2: 90-second controlled drill

Return each phone to Capture and tap My framing is ready again. Confirm three ready cameras before starting every take.

Record about 90 seconds of a repeatable drill with both players visible. Include start/end clap references outside the drill. Ask the observer to note three moments: a clear shot, an occlusion, and movement into a back corner. Write approximate elapsed times so those intervals can be compared across views later.

Stop, wait for saving, export originals, and upload. Do not change quality or placement midway; you need a comparable baseline.

## 8. Take 3: three minutes of normal rallies

If the first two takes passed, re-arm and record three minutes of ordinary rallies. Keep phones fixed. No player should handle a camera during play. Record battery before/after and any dimming, warning, interruption, or unexpectedly hot device. Stop if a device reports a problem; the first test is not a thermal endurance trial.

This gives nine source clips across three short takes. At a 12 Mbps target, budget roughly 90 MB per camera-minute plus audio/container overhead, or about 1.35 GB across the three cameras for five total minutes. Actual sizes vary.

## 9. Create and assess the outputs

Start with Study, landscape 16:9, target 30 seconds, using marked drill/rally moments. The editor may cut among views; it does not guarantee one uninterrupted rally. Judge ball/player visibility and useful context separately from editing continuity.

For a personal edit, the player opens their own session membership, reviews each useful source in Footage, and tags the start/end intervals featuring them. Then choose Featuring me and create a landscape Study edit. My camera instead selects the uploader's footage and is a different test.

Create a short Original or Pulse portrait edit as a separate sharing test. Download and play the MP4 outside OurFrame. Check that framing preserves the action and that cuts do not make the rally misleading. Ask which output the player would actually review or share.

## 10. Do one upload-recovery test

Use a short source whose original has already been exported and verified. Start its upload, briefly disconnect that phone's network, then reconnect and retry from the same On this device draft. Confirm it completes and produces one server clip rather than a duplicate. Do not clear browser storage, uninstall anything, or deliberately interrupt the only copy of an important recording.

## 11. Record results and decide

| Observation | Camera A | Camera B | Camera C |
|---|---|---|---|
| Actual model / OS / browser | | | |
| Reported size / FPS | | | |
| Setup assistance needed | | | |
| Completed takes / 3 | | | |
| Battery before / after | | | |
| Heat / interruption / warnings | | | |
| Upload time and source bytes | | | |
| Ball visible in chosen three moments | | | |
| Unique useful moment this view contributed | | | |

Also record total setup time, successful downloads, render waiting time, and manual tagging effort. Compare the visible clap references at the beginning and end; apparent alignment is observational until checked frame by frame. The clock estimate on screen is not a sensor-sync measurement, and sound arrival differs by camera distance.

Proposed first-trial pass: all nine short sources saved and played; useful landscape and portrait exports; an interrupted upload recovered without duplication; and at least one extra view reveals something the master view missed. Ask each player, separately: “Which view helped?”, “Would you use this next practice?”, and “What would stop you?” Record actual repeat use later rather than treating a positive answer as retention.

Only after this passes, progress to 10–15-minute takes and longer battery/heat trials. Do not infer full-game reliability from five minutes of footage.

## 12. Fallback and wearable preparation

If camera access or orchestration fails, preserve any saved drafts. Switch all phones to their built-in camera applications, use landscape 1080p/30 where available, and manually record the same short drills with visible start/end references. Later import these via Add video. OurFrame currently uses modification times as a coarse hint and does not automatically synchronize these imports; keep source names and alignment notes, and do not call a resulting edit a frame-aligned replay.

If you wear an HR sensor, record a workout separately and retain its timestamped export plus timezone and drill times. This prepares data for the committed HR feature. Automatic “above 140” and “jump over 15%” selection are not available in the current app, so do not spend court time looking for those controls.

Before leaving, verify every original and export is retained on at least one reliable device; ideally copy originals to the computer too. Keep session media until review is complete. Stop any authorized temporary tunnel when the test is over.
