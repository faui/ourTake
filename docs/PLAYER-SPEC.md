# ourTake player and editor specification

## Product contract

One private event, multiple contributed recordings, and numbered personal compositions. A viewer can explore another available perspective of a moment and turn selections into a take without learning a professional editing application. Zero training is an objective to validate, not an established property.

The authoritative brand order remains togetherness, playful invitation, distinctive character, creative transformation, craft, global accessibility, and contemporary enduring expression. Retain current ink/studio/lime tokens and system typography; spell **ourTake** exactly. Do not ship a candidate mark or palette from the exploration board. Number compositions within a session, separately from source recordings and capture runs; preserve numbers across retries and title changes.

## Experience architecture

The viewer is the primary surface. Its first row holds the event title and source context. The video occupies the dominant area, with familiar play, seek, mute and full-screen controls. Below it, a visible “Other angles” action and “Keep this moment” action invite exploration and creation. A horizontal camera strip names contributors and coverage; it never calls source cameras numbered takes.

The personal take tray sits beside the player on wide screens and below it on phones. It starts with a useful sentence and becomes a sequence of editable moment cards. Each card has a name, source, range and duration. Selecting it reveals trim controls and an angle selector; move earlier/later buttons provide a keyboard and touch alternative to dragging. Undo is always available after an edit. A numbered take is assigned by the server at creation; a device-local unfinished tray is called a draft until then.

Keep three states distinct: browsing sources, previewing the assembled take, and rendering an export. Switching cameras while browsing never silently changes a saved take. “Use this angle” applies to the selected moment. “Record my choices” is an explicit future editing mode with a visible recording state, different from filming a new camera recording.

## Shared capability inventory

| Capability | Required behavior | Delivery stage |
|---|---|---|
| Familiar playback | Play/pause, seek, mute, speed, full screen, keyboard equivalents | Implement now |
| Other angles at this moment | Pause all selected views at one event playhead | Implement estimated mapping now; exact indexed samples later |
| Selected-camera tiles | User can choose sources, show two or more, switch back to focus | Implement now; limit active decoders to four |
| Missing coverage | Explicit empty tile; no stale frame masquerading as current footage | Implement now |
| Sound selection | One audible source at a time, locked through angle changes | Implement playback now; export follows each shot unless explicitly extended |
| Source provenance | Contributor/source name, original retained, source-relative range | Implement now |
| Synchronization adjustment | Inspect estimate; mark common event in each clip; adjust offset | Implement manual adjustment now |
| Moment collection | One action keeps a useful interval around the playhead | Implement now |
| Moment editing | Rename, trim, choose another covering camera, reorder, remove, undo/redo | Implement now |
| Take preview | Plays the actual sequence of selected source intervals | Implement now |
| Session take creation | Validated edit decision list, server-assigned number, real MP4 | Implement now |
| Recovery | Device-local draft, explicit save failure, retry-safe render request | Implement now |
| Safe output framing | Landscape or portrait fit; preserve full source field of view | Implement now |
| Image viewing and composition | Still-photo cards, adjustable hold, frame-gallery image export | Later media-pipeline extension |
| Sharing | Explicit user-triggered download/share; finished-take access separate from session access | Existing MP4 sharing; scoped review links later |
| Captions and descriptions | Optional editable speech captions and accessible descriptions | Later transcription pipeline |
| Collaborative review | Notes attached to event time, camera, take ID and revision | Later persistence extension |
| Precision sample selection | PTS index, nearest-sample delta, exact decode and extraction | Native/ingest work required |

“Later” means specified but not represented by a working button or a simulated success. Runtime handoff must explicitly describe what was implemented and what still needs native capture or additional media services.

## Athlete journey

An athlete opens a practice session and chooses **Study**. They find a rally, jump backward, slow playback, and open other angles at the point of contact. They select front and side views, compare, then keep the sequence with enough lead-in and recovery to understand movement. They can select a longer interval, change the viewpoint of one moment, add a descriptive note in its title, and export a natural-color landscape take.

| Athlete need | Behavior |
|---|---|
| Review a rapid movement | 0.25×/0.5×/1× playback; short time steps now, actual adjacent-frame stepping when indexed |
| Repeat practice detail | Loop selected range without restarting the whole session |
| Understand context | Preserve setup and recovery; never automatically label a skill or mistake |
| Compare viewpoints | Synchronized selected-camera tiles; fixed sound; explicit uncertainty |
| Find themselves | Existing manual participant tags; no unimplemented recognition claims |
| Build a study take | Longer shots, original color, whole source frame, descriptive moment titles |
| Explain technique | Future drawings and voiceover with versioned annotations and export parity |
| Compare progress | Future independent two-performance alignment; separate from same-event sync |
| Trust measurements | No angle or speed measurement from uncalibrated perspective; label inferred analysis |
| Review on court | Large touch controls, readable outdoor contrast, no hover-only actions |

Study mode exposes speed, approximate time-step, loop and alignment controls. It does not pretend a 1/30-second seek is an exact frame step on variable-frame-rate footage. The UI names it a time step until a decoded sample index exists.

## Parent journey

A parent opens the birthday session and chooses **Story**. While watching, they keep the arrival, candle moment and a reaction. At the candles they pause and open other angles to discover a relative's reaction, then keep that perspective as another moment. They rename the moments, rearrange them, choose portrait or landscape, preview and create a take. Their original recordings remain untouched.

| Parent need | Behavior |
|---|---|
| Find emotionally meaningful moments | Manual kept moments initially; editable suggestions only after detection exists |
| Include different people | Choose named contributors' views without equating camera owner with subject |
| Tell a story | Simple ordered moment cards; descriptive names; one-level editing |
| Relive reactions | Compare simultaneous views, then choose a perspective or a later tile composition |
| Keep voices | Natural sound by default; future optional licensed music with speech ducking |
| Add photos | Future mixed photo/video story with explicit durations and orientation handling |
| Short or extended memories | Immediate short take; longer films after render limits/performance are expanded |
| Refine without anxiety | Non-destructive trims, undo/redo, retained sources, recoverable draft |
| Share privately | Clear distinction between inviting contributors and sharing a finished film |
| Represent children responsibly | Adult-controlled sessions; permissions and deletion scope visible at sharing |

Story mode foregrounds keeping and arranging. It keeps precision controls in an explicit details area rather than placing a professional timeline in front of every parent. It does not invent “cake detected” or an automatically recognized child.

## Mobile, tablet and desktop

Phone portrait: one focus view, two-column comparison when requested, horizontally scrollable source strip, large labeled actions, vertically stacked take tray. Limit four active camera decoders, using source metadata and cached stills for additional cameras. Do not auto-load dozens of full-resolution videos. Preserve focus and playback position when changing presentation.

Tablet/desktop: viewer plus take tray; expanded selected-camera tiles; keyboard shortcuts documented in the details area. A later precision workspace may add waveform alignment and long timelines. Core creation must remain possible with touch and without dragging. Desktop is advantageous for extended editing, not mandatory for this product's central promise.

Use minimum approximately 44–48 px touch targets, 16 px body copy, 14 px regular labels, visible focus, semantic buttons, named sliders, meaningful status messages, reduced motion, no automatic sound, and no mandatory orientation lock. Empty/loading/error states must retain a useful next action. At 200% text enlargement controls must wrap rather than disappear. Human screen-reader and physical-phone checks remain required before accessibility claims.

## Playback and edit data model

Each source has an immutable ID, duration, URL, contributor label and timing mapping. Each moment references a source ID and in/out points; it also records the selected event-time offset used for alternate-angle replacement. Offset corrections affect exploration and future choices, not the already selected source ranges. A take stores ordered moments, output aspect, recipe, creator ID, stable session number and idempotency key. Backend validation checks membership, source ownership by session, finite ranges, source bounds, shot count, duration and permitted treatments before rendering.

Take numbers are allocated during the server's synchronous record creation section. Existing jobs without numbers are backfilled once. A retry with the same creator and request ID returns the same job. A future multi-process/shared database implementation requires a transaction and unique constraint; the current single-process local worker must not be represented as distributed-safe allocation.

The immediate renderer produces single-camera sequential cuts from the chosen source intervals, preserving existing output styles. Tiled playback is separate from tiled export; a later layout-aware composition model must capture camera set, crop geometry and a continuous audio bus per segment. Preview/output limitations must remain explicit.

## Failure and recovery behavior

- No sources: offer adding local videos or returning to capture; never fabricate sample participants.
- Unknown import capture times: start a user-adjustable alignment, label it unverified, and never use lastModified as capture evidence.
- Missing angle at a playhead: show “Not recorded here”; disable choosing it for a moment that exceeds coverage.
- Buffering/seek delay: pause visible playback as needed; avoid presenting an old image as the requested instant.
- Codec failure: retain the source entry and explain that this browser cannot decode it.
- Save failure: retain in-memory work and offer an edit-plan download; do not say saved.
- Export failure: retain the draft and reuse the same job identity for an explicit retry where supported.
- Expired source access: reopen the session to renew authorized media URLs; no credential bypass.
- Recording active: preserve mounted capture while moving into the player; warn before full navigation.

## Implementation acceptance

Validate time mapping and coverage boundaries, reordered edit ranges, alternate-camera replacement, idempotent numbering, malformed/cross-session requests, and real FFmpeg output. Reuse the existing integration suite for uploads, access and legacy recipes. Test the new manual edit path against synthetic fixtures, which establish deterministic behavior but not physical-camera synchronization or UX quality.

The first implementation is a functioning player/editor integrated with the pilot plus a local-video workspace. It is not a native mobile capture app or proof of frame-accurate phone alignment. The separate research document specifies how to earn those guarantees. Product readiness additionally requires the no-training study, phone codec/performance tests, accessibility review, and a production media/storage deployment.
