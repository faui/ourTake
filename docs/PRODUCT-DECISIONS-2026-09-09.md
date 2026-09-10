# Product decisions: native capture, effort-based clips, consent, and names

Naming supersession, 10 September 2026: **ourTake** is now selected. See [BRAND-KIT.md](BRAND-KIT.md) for authoritative brand decisions and numbered composition names. Earlier candidate-name recommendations below are historical; engineering requirements remain in force.

9 September 2026. The founder has committed heart-rate-triggered composition and adult-only participation to MVP scope. The native approach and naming preference below are recommendations. This document defines requirements; it does not claim these new capabilities are already implemented in the local browser pilot.

## 1. Native capture, web participation

I agree with your direction. A native capture application is the appropriate destination for dependable sensor/camera control, long recordings, local media management, and substantial edge inference. Keep the browser pilot to test the session ritual and output value immediately. Keep web joining, uploads, viewing, and sharing as permanent surfaces rather than throwing away the website after native launch.

| Role | Recommended surface | Reason |
|---|---|---|
| Camera contributor / venue capture node | Native app | Camera lifecycle, sensor timestamps, supported controls, local files, recovery, edge processing |
| Player receiving clips | Browser initially; optional native companion | QR join and viewing should not require installation |
| Athlete connecting a wearable | Native for HealthKit/Health Connect/BLE; file import on web | Access depends on data source and permissions |
| Host / coach | Web or native | Session orchestration and review do not require all capture APIs |
| Venue manager | Web | Saved layouts, booking/session administration, retention, billing |

**Recommended implementation:** retain the TypeScript API contracts, composition plan, and server pipeline. Use a React Native product shell if it accelerates shared account/session UI; implement the capture engine as Swift/AVFoundation and Kotlin/CameraX modules, with Camera2 interop only where tested capabilities require it. A WebView wrapper alone does not solve the capture problem. React web components will need adaptation; do not budget a zero-cost UI transplant.

AVFoundation exposes bounded zoom and smooth zoom ramps; its documentation explicitly distinguishes cropping from upscaling. CameraX supplies zoom, focus/metering, exposure controls, and image-analysis use cases. Native gives us a controlled implementation path, not automatic parity with every OEM camera app. [Apple zoom](https://developer.apple.com/documentation/avfoundation/avcapturedevice/videozoomfactor?language=objc), [CameraX controls](https://developer.android.com/media/camera/camerax/configuration), [CameraX architecture](https://developer.android.com/media/camera/camerax/architecture).

Native apps still face operating-system lifecycle rules. Android restricts starting camera/microphone services from the background; a runtime permission does not remove those restrictions. Test interruption, lock-screen, phone-call, foreground/background transitions, thermal pressure, and disk-full behavior explicitly. Do not promise silent remote camera activation. [Android restrictions](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start).

### Auto-zoom policy

Owner enables “Let the session adjust framing” for that session, sees recording status, and can override/stop immediately. Keep a wide master camera unchanged. Start with bounded zoom on an alternate view, smooth transitions, hysteresis, and a cooldown. Return to a wide view when tracking confidence drops. Log applied lens/FOV changes so calibration and editing remain correct.

For the first field trials, record wide and apply reversible virtual crops in the output. Once subject tracking is reliable, compare that against optical/lens control on supported phones. Zooming all cameras onto the same player can destroy coverage; physical zoom does not recover a moment lost outside the frame. Digital zoom is not free optical detail.

### Transition gates

1. Browser: three people successfully join, capture/import, receive and reuse useful clips. Measure each device separately.
2. Native vertical slice: one iPhone and one Pixel capture engine implement the same session/manifest contract. Qualify the founder's exact devices; do not claim testing from model names alone.
3. Reliability: independently playable segments, verified upload receipts, interrupted-recording recovery, sustainable edge workload, and measured clock drift.
4. Edge intelligence: cheap blur/occlusion/framing checks and proxies first; subject tracking/zoom second; adaptive role/FPS policy only after quality comparisons.

Short sessions are an experimental scope, not a universal thermal guarantee. Edge compute competes with recording for battery, memory bandwidth, and heat. Apply backpressure: recording wins, expensive analysis drops frames or pauses first.

## 2. Heart-rate selection: committed MVP scope

The differentiated user job is: **“Show me the moments corresponding to my effort, across the group's cameras.”** A heart-rate overlay alone is insufficient. Selection, correct time mapping, personal visibility, and a useful resulting clip are the feature.

### Required queries

| Query | Proposed default semantics | User control |
|---|---|---|
| “My heart rate was above 140” | Smoothed HR strictly greater than 140 bpm for at least five seconds | Threshold and minimum duration |
| “My heart rate jumped by more than 15%” | Current five-second median exceeds 1.15 times the median of the preceding 30-second baseline, excluding the current five seconds; condition sustained five seconds | Percentage, baseline window, minimum duration |

Example: baseline 120 bpm → 138 bpm is exactly +15%, so it does **not** meet “more than 15%”; 140 bpm does. A +15% jump is not +15 bpm. Display the rule in plain language, and preserve it with the composition recipe.

These smoothing/window defaults are product choices to evaluate, not medical standards. Offer a raw-threshold comparison during testing. Reject missing baseline, duplicate/conflicting timestamps, invalid units, and unusable sample gaps instead of inventing a heart rate. For the initial high-frequency input, do not bridge gaps over five seconds; lower-frequency exports should display insufficient resolution for short jump detection. Do not forward-fill a whole match from a few readings.

Detect candidate intervals, add configurable context (initially 15 seconds before / 10 after), merge overlapping windows, and intersect them with actual available source footage. The resulting context can legitimately include time below threshold; distinguish the triggering interval from the surrounding clip. Do not duplicate footage or manufacture a requested duration when there are too few matches.

“All shots” means return the complete matching interval list, with download/review options. A short recap is a separate, duration-limited selection from that list. The existing 120-second editor limit must not silently truncate an “all matching moments” request.

### Personal versus event-time selection

HR identifies the participant and time, not their location in the image. MVP therefore supports two explicit modes:

- **Session views during my effort:** select temporally overlapping cameras; the athlete may be off-screen.
- **Featuring me during my effort:** additionally intersect with the participant's manual visibility tags. No tags means an honest empty/unverified result, not an automatic identity claim.

Automatic player tracking can later replace or assist the tags. Include “what happened just before this rise” as a context adjustment; do not call a sensor peak an automatically detected goal, good shot, or fitness diagnosis.

### Data acquisition and clock mapping

MVP starts with CSV import (`timestamp_utc,bpm`) plus an explicit source/owner and alignment step. Accept timezone-qualified timestamps; for elapsed-time files require an explicit session anchor. This gives immediate tests without waiting for a Garmin/Fitbit/Apple integration. FIT and TCX adapters follow the same normalized contract; they remain implementation tasks rather than already-supported formats.

Native phase adds read-only HR access through HealthKit/Health Connect and, for qualified sensors, BLE heart-rate acquisition. HealthKit and Health Connect provide permissioned access, but neither promises that every wearable supplies a real-time stream. Do not assume an ordinary web page can access an Apple Watch workout or HealthKit. [HealthKit privacy](https://developer.apple.com/documentation/healthkit/protecting-user-privacy), [Health Connect vitals](https://developer.android.com/health-and-fitness/health-connect/experiences/vitals).

Normalize time to a session reference, retaining the original timestamps. Model `sessionTime = scale * sensorTime + offset`, version the mapping, and keep measured uncertainty. Map each video's PTS to that reference independently. The browser pilot's file-modification timestamp is not adequate evidence for imported-video alignment. Provide a manual offset/calibration preview before HR selection; never silently treat a local timestamp as UTC. Clock error and the delay between effort and a sensor reading are separate issues.

### Minimal domain additions

```text
SensorStream(id, sessionId, participantId, source, metric, unit,
             importedAt, consentReceiptId, retentionAt)
SensorSample(streamId, sourceTimestamp, value, quality)
ClockMapping(id, streamOrClipId, scale, offset, uncertaintyMs, method, version)
MomentQuery(id, ownerId, sessionId, predicate, context, visibilityMode,
            streamVersion, mappingVersion)
MomentMatch(queryId, triggerStart, triggerEnd, contextStart, contextEnd,
            sourceClipIds, qualityReasons)
Composition(..., queryId, sourceIntervals, recipeVersion)
```

Raw sensor streams and query results are owner-private by default. The host does not automatically receive everyone's HR chart. Sharing an output is separate from exposing raw HR; overlay defaults off. A participant can delete their sensor import. Deletion must invalidate queued dependent queries/edits, remove retained data and hosted derivatives as required by the selected policy, and explain that downloaded copies cannot be recalled.

### Implementation acceptance tests

1. Exact 140 / above 140, exact +15% / greater than +15%, with known timestamped fixtures.
2. Isolated spike versus sustained crossing; noisy threshold chatter; overlapping-window merge.
3. Timezone offsets, out-of-order points, duplicates, sample gaps, insufficient baseline, clock offset/drift.
4. Cross-camera match maps to the expected original frames; uncertainty is displayed.
5. Personal tags exclude off-screen intervals; temporal-only mode is labeled correctly.
6. “All matches” preserves the full list; recap respects duration without inventing footage.
7. No raw HR leakage to other members/hosts; permission revocation and deletion invalidate access and dependent work.
8. One real wearable session, manually annotated against video, passes a founder-defined useful-selection threshold before claiming the feature works.

**Implementation status:** scoped and accepted by founder; not built in the current pilot. No real wearable data has been ingested. No sensor-query tests are claimed as executed.

## 3. Consent and adult-only participation

I agree that explicit joining makes core collaboration consent a normal onboarding interaction, not a reason to abandon the product. We should ask once at the appropriate scope, retain the receipt, and make withdrawal usable. We should not repeatedly interrupt routine composition of content already contributed for that purpose.

Recommended structure:

- Account: adult eligibility attestation (18+ baseline, with launch-region review), terms and privacy notice version, identity and timestamp.
- Session join: visible session purpose and audience; confirmation that contributed media can be used in private session compositions; versioned receipt. Joining is never inferred from proximity.
- Capture device: OS camera/microphone permissions and visible owner-controlled recording. Remote framing is a separate capability toggle when used.
- Optional HR: a specific request when importing/connecting the stream, with owner-private defaults. Face recognition/model training/public promotion are not silently included in ordinary session composition consent.
- Export: clear indication when a composition is leaving the private group; sharing a downloadable copy has different consequences from internal viewing.

No minor accounts or minor-participant pilot sessions. Remove youth-sports and guardian workflows from our target market and MVP, even though the old Jugnu implementation included them. Adult-only account rules alone do not ensure that a bystander or minor never appears in a camera view. Select controlled adult practice settings, provide a stop/remove/report path, and keep venue/recording permissions explicit.

Consent is manageable but does not grant permissions on behalf of nonparticipants, override platform health permissions, or eliminate later withdrawal. Any future biometric identification needs its own jurisdiction-specific review; no biometric feature is enabled by this decision.

**Current gap:** the browser pilot has a session-contribution checkbox and session-scoped credentials; it does not yet have durable user accounts, age eligibility enforcement, versioned consent receipts, or per-contributor withdrawal propagation. These are committed readiness tasks. This document does not relabel the current checkbox as a complete consent system.

## 4. OurTake and takeO

My preference is **OurTake** for the platform at this stage. It connects collective authorship with each person's interpretation and fits sports review, dance, travel, and memories. It is more dynamic than OurFrame. Its weakness is that it sounds like ordinary editorial language and can be heard as “our take” or “hour take.”

**takeO** is playful, compact, and easier to turn into an artifact noun. But readers may pronounce it “take-oh” or “ta-ke-o”; the capital O disappears in speech, URLs, and many search contexts. TAKEO is already used by an established Japanese paper company, and Takeo Kikuchi is an existing fashion brand. These are naming/search considerations, not a finding that this software use infringes a trademark. [TAKEO](https://www.takeo.co.jp/en/company/), [Takeo Kikuchi](https://store.world.co.jp/s/brand/takeo-kikuchi/about/concept/).

| Phrase | My assessment |
|---|---|
| “Join my OurTake session” | Clear invitation; slightly long but immediately understandable |
| “Join us on OurTake” | Natural product/distribution copy |
| “Here's our take” | Strong emotional sharing line; weak standalone search attribution |
| “Join my takeO” | Ambiguous: joining a room, recording, or finished video? |
| “Send me the takeO” | Plausible once the audience knows takeO means a finished clip |
| “Make a takeO” | Good creation command for a branded output |
| “I made a takeO of that rally” | Useful artifact noun; needs pronunciation testing |

If you use both, the coherent architecture is **OurTake = service; a takeO = finished personal composition**. Use “session” for the room and “take” for a recording attempt. However, I would initially launch with one brand and ordinary nouns (“session,” “clip,” “edit”). Teaching two new names before repeat use creates avoidable work. Test takeO as an artifact name with users before putting it everywhere.

International verdict: neither is cleared. OurTake relies on English meaning; takeO has less semantic clarity and multiple plausible pronunciations. Test spoken recall and spelling with English, Hindi, Telugu, Spanish, Portuguese, and Japanese speakers, including hearing the invitation without seeing the logo. Ask people to repeat it and find it later, rather than asking whether they like it. Screen app stores, relevant trademarks, domains, and handles before adoption. No domain availability or legal clearance is claimed; OurFrame remains the repository/deployment name for now.

## 5. Ordered MVP plan

| Priority | Deliverable | Reason |
|---|---|---|
| P0 | Durable accounts, adult eligibility, session consent receipts and contribution withdrawal | Enforce the product boundary the founder just selected |
| P0 | Canonical capture/clock/source-manifest contracts | Shared foundation for browser/native/venue cameras and HR |
| P0 | CSV HR import, alignment preview, both predicates, complete match list, tagged personal selection, rendering | Deliver the newly committed differentiated job |
| P0 | First-session and recovery metrics; saved venue configuration | Address concrete competitor and Jugnu lessons |
| P1 | Qualified iOS + Android native capture modules | Improve edge control and sustained recording reliability |
| P1 | Checksummed source receipts and verified cleanup; private object-storage adapter | Safe capture-to-cloud operation |
| P1 | Read-only wearable connectors and reversible edge-assisted framing | Reduce repeated import/setup effort |
| Later | Automatic player recognition, autonomous zoom, adaptive capture roles, novel viewpoints | Require footage-based accuracy and thermal evidence |

Native work can begin after the first short browser trials; it need not wait for months of generic market validation. The HR feature should also be tested immediately through file import and manual alignment. Avoid letting the native rewrite delay learning about whether people actually want their effort-based clips.
