# ourTake player implementation status

Implemented 10 September 2026 following PLAYER-RESEARCH.md and PLAYER-SPEC.md. This is a functioning first implementation in the existing browser/Node/FFmpeg pilot, not a validated production or native-camera release.

## Working surfaces

- `/player`: open local videos; Story and Study modes; creation without first navigating through capture. Video originals stay local until the explicit MP4 creation flow adds required sources to a private session. Download an edit-plan JSON without uploading media.
- Shared session → **Watch & create**: uses existing authorized footage and media URLs. Capture remains mounted while session tabs change.
- Main viewer: play/pause, seek, one/tiled views, choose up to four cameras, single listening camera, mute, full screen, slow motion, approximate 33 ms time steps and loops.
- Missing coverage and media failures are visible. Paused seeks hide the previous image while seeking. All angles use an estimated common event playhead, not verified simultaneous exposures.
- Visual alignment: position two native video players on the same visible action and match them. Numeric offsets support finer manual adjustments. Offsets persist with the local draft; changing them does not rewrite already selected source ranges.
- Take tray: keep a bounded interval, rename, trim, swap to a camera that covers the full interval, reorder with accessible buttons, remove, undo/redo, and preview the selected sequence at normal speed.
- Exports: real FFmpeg single-camera cuts from chosen source ranges; portrait fit or landscape; stable numbered takes; idempotent request handling; explicit failed-job retry preserves the take identity. Output is capped at 120 seconds / 60 moments.
- Recovery: local draft persistence with save-failure status; local exports retain resumable upload records and add the new session to the existing session list. Reopening a local draft requires selecting its original video files again. Export jobs remain available from their saved shared session.

## Timing implementation

The `/api/time` endpoint records application-level server receipt and send timestamps using its monotonic time origin. Capture collects seven exchanges per measurement, chooses the lowest round-trip estimate, detects a changed server epoch within a burst, and limits burst duration. While recording, it collects another burst approximately every 30 seconds. Evidence is saved in the recording's IndexedDB metadata and uploaded with the source.

These observations contain callback elapsed time, estimated offset, round trip, sequence and measurement time. They do **not** contain encoded sample PTS or sensor exposure timestamps. They are diagnostic evidence and are not used to manufacture frame-level confidence. There is no claim that the pilot implements the proposed native heartbeat manifest or sensor phase synchronization.

The player uses recorded start estimates where available, manual offsets where chosen, and unverified coincident starts for imported clips. The UI labels timing estimated. Exact nearest-frame decoding and drift-corrected per-sample mapping remain native/ingest work. Browser display drift correction has an approximate 120 ms seek threshold during playback; paused seek targets are finer, but neither constitutes a measured capture or presentation guarantee.

## Validation

- TypeScript check passes.
- Eleven model/composition tests pass: timing exchange math including asymmetric-delay bias, late/early coverage, endpoint exclusion, alternate-angle replacement, edit order, source membership/range bounds, and existing composition invariants.
- Integration passes using the bundled Node 24 runtime: auth and media access, resumable upload, four legacy recipe MP4s, a manually selected two-shot MP4, invalid ranges and foreign sources rejected, idempotent take numbering, persistent jobs, and deletion revocation.
- Frontend production build succeeds and prerenders `/` and `/player`.
- The initial `/player` preview returned HTTP 200 and was handed to the app preview. No browser interaction, screenshot audit, screen-reader session, or physical-phone experiment was performed in this task. Usability and real-device acceptance in the spec remain open.

## Explicit limitations

Still-photo import, exact frame stepping, frame-image export, annotations, voiceover, music, captions, tiled video export, long-form movies, shared draft editing, dedicated take-review links and native frame synchronization are specified future extensions. During exploration the listening camera can stay fixed; MP4 export and take preview use each chosen shot's audio. This avoids claiming preview-only playback controls are rendered effects.

The private-session model is inherited from the pilot. A parent-controlled birthday experience is included in the requested design scope; a production child-permissions/guardian-management system is not implemented. No automatic subject recognition, sports judgement or emotion detection is claimed.

Take-number allocation is valid for the current single-process local store. A multi-worker deployment needs transactional allocation and a unique session/number constraint. Local edits were not deployed to a cloud service. The standalone frontend requires a reachable media worker for upload/export.
