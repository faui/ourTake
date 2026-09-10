# OurFrame — three-phone field test

Devices supplied by the founder: iPhone 13 / iOS 26.6.1, Pixel 11 Pro, Pixel 10. These are the intended test devices, not hardware already tested by the agent. Browser support is feature-detected. Begin with current Safari on the iPhone and Chrome on Pixels.

## Before going to the court

1. Run the local worker and frontend from the README. Check the page says Connected.
2. For phones, use a trusted HTTPS URL. `localhost` on a phone means that phone, not this computer. A plain `http://192.168...` URL generally cannot open the camera. Use an explicitly approved temporary tunnel, a trusted local certificate, or a hosted HTTPS frontend with a reachable HTTPS worker.
3. Add the exact frontend origin to the worker's `ALLOWED_ORIGINS`. Avoid wildcard permissions.
4. Keep the computer awake, plugged in, and connected while it serves sessions and renders. A laptop worker is not a continuously available cloud service.
5. Check available phone storage, camera/microphone permission, and an unobstructed stable mount. Use Do Not Disturb voluntarily. Keep the recording page visible and phone unlocked.
6. Agree who may record, view, and download. The product and these pilots are adult-only: no minor accounts or minor-participant sessions. Use consenting adults and facility approval, with framing that avoids uninvolved people. Account age enforcement is not implemented yet; the organizer must enforce this pilot boundary. The consent checkbox does not replace venue permission.
7. Use a 30–60 second rehearsal before a real session. Keep an independent native-camera backup for irreplaceable activity.

## Capture and edit

1. Host: Create a session. Set your name, activity, group, and collection. Group/collection are context labels in this release.
2. Host: Invite. Participants scan the QR with their own phone camera, enter a name, and agree to the private session.
3. Each capturing participant: Enable camera. Select a position. Check their real preview and the activity guidance. Tap **My framing is ready**.
4. Host: Confirm all three intended cameras show Ready, then **Start all cameras**. An eight-second countdown schedules recording. This is coordinated browser capture, not certified frame-locked sensors.
5. During recording: keep phones mounted and the page foregrounded. A participant can mark a moment or stop their own camera. The host can stop the whole take.
6. Each device: Footage → On this device → Upload. Uploads resume from the last acknowledged offset. Do not leave the page until an important upload is confirmed.
7. Review footage, mark moments, and tag the intervals featuring you. “My camera” selects footage you contributed; “Featuring me” selects your tags in any camera.
8. Create: choose Original, Pulse, Noir, or Study; portrait or landscape; and a target duration. Queue one edit or all four. Actual output may be shorter than requested if the source/tagged intervals are short.
9. Download the MP4 or use the supported phone share sheet. Posting to TikTok/Instagram is a manual action; OurFrame does not publish into those accounts.
10. Export your local originals. Browser storage is best-effort and is not guaranteed to survive OS cleanup.

## Initial activity configurations

| Activity | Three-phone layout | First thing to learn |
|---|---|---|
| Dance | Front center and two front diagonals | Does the composition retain full bodies and the routine's continuity? |
| Squash | Back center, back left, back right, outside glass | Can players and ball be seen through reflections and motion? |
| Basketball | Dependable overview and two complementary diagonals | Which events were rescued by another angle? |
| Gym | Side view plus two permitted diagonals | Can the coach see the movement cues they care about? |
| Jiu-jitsu | Overview and opposite permitted mat-edge angles | Does another view resolve occlusion without losing context? |
| Outdoor pickleball | Baseline overview and two diagonal views | How do heat, glare, distant ball size, and uplink affect capture? |

The six-angle basketball design belongs in a subsequent camera-count test. The diagrams do not measure FOV; selected position markers are participant-supplied. Do not place low cameras in run-off areas.

## Record observations, not only impressions

For each device record model, OS/browser, reported capture size/fps, codec, clock estimate, lighting, take duration, battery before/after, interruptions, saved size, upload time, and sync error observed against a visible reference. The app only exposes a subset of these; use a field sheet for the rest.

For alignment, record a visible common event near the beginning and end where practical. Review frame-by-frame to measure offset and drift; sound arrival varies with distance. The displayed clock estimate alone does not validate synchronization.

For the product, record setup minutes, assistance required, failed recordings, useful moments per camera, preferred edition, number of manual tags/corrections, requests for other compositions, and whether the group asks to do it again. Ask which view they would remove and which moment they would have lost without another phone.

## Failure recovery

- Worker offline: keep the recording page open, stop locally, and retain the local take. Restart the worker, then retry upload.
- Host unavailable: each recording phone can stop itself. There is no native coordinator failover yet.
- Upload interrupted: retry from On this device. Reusing the draft does not create another upload record.
- Camera stops: look for a local draft. An interrupted container may be incomplete; save the original parts before clearing anything.
- “Featuring me” has no clips: add your own time intervals in Footage. The pilot does not recognize you automatically.
- Render fails: preserve sources, check worker logs, and queue another edit. FFmpeg and ffprobe must be installed and reachable.
- Wrong imported chronology: file modification times are approximate, not timecode. Use tagged/marked selections; accurate imported multi-cam alignment is future work.
- Invite leaked: host replaces the invitation. This prevents new joins but does not remove already joined members. For full revocation in this pilot, download wanted results and delete the session.

## Exit criteria for a first field-ready release

Three devices finish three short takes each, survive an interrupted-and-resumed upload, produce downloadable portrait and landscape edits, and remain usable without the founder operating every phone. Then run 10–15 minute takes and a longer heat/storage trial before recording full games. Require actual target-device evidence before claiming dependable hour-long browser capture.
