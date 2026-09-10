# ourTake player and synchronization study

## Recommendation

Build a mobile-first viewer that gradually becomes a composition tool. Preserve an event's shared timeline while allowing each person to collect and arrange a different story. Offer desktop and tablet as larger working surfaces for precise analysis, long stories, and more simultaneous views. There is no evidence here that useful creation must be desktop-only.

The server heartbeat proposal is technically feasible as metadata, but reception timestamps alone cannot establish simultaneous exposures. Pursue a native capture architecture with measured clock mapping and per-frame timestamps; add recorded-event alignment and independent physical validation. Treat browser capture as a lower-confidence compatibility path. Keep playback synchronization, clock synchronization, and sensor exposure synchronization as three different engineering objectives.

Scope: primary-source documentation review, current as accessed 10 September 2026, plus inspection of the existing pilot. This is an expert workflow evaluation, not hands-on comparative usability testing. Recommendations and target numbers below are proposed design decisions, not measured ourTake performance. Existing product documentation is historical where superseded by the authoritative BRAND-KIT.md or this requested player scope.

## 1. What the heartbeat can and cannot do

Suppose the server sends marker 42 at event time 90 seconds. Phone A receives it after 12 ms and phone B after 87 ms. If each writes marker 42 against the frame being recorded on arrival, equating those markers introduces 75 ms of error: about 4.5 frame periods at 60 fps. The ID proves the messages refer to one transmission, not that the attached frames show one instant. This numerical example is illustrative.

Sending a future target time solves delivery coordination: “marker 42 refers to event time 95 seconds.” Each camera must then map that target into its own clock and actual captured samples. The payload should carry a session ID, monotonically increasing sequence, target event time, clock epoch and protocol version. Authentication protects the marker's provenance; a cryptographic signature does not improve its timing.

There are suitable non-picture locations in movie containers. Android MediaMuxer supports application-defined timed metadata tracks in MP4 from API 26, with metadata timestamps in the same timebase as media. Apple supports timed metadata writing; its documentation now also describes MetadataReceiver, while older adaptor APIs are marked deprecated in current documentation. Validate deployment-target availability before selecting the iOS API. These facilities carry timing evidence but do not create it. [Android MediaMuxer](https://developer.android.com/reference/android/media/MediaMuxer), [Apple MetadataReceiver](https://developer.apple.com/documentation/avfoundation/avassetwriterinput/metadatareceiver), [Apple timed metadata example](https://developer.apple.com/documentation/avfoundation/adding-a-display-mask-rectangle-metadata-track-to-a-movie-file).

Prefer a canonical versioned sidecar manifest plus an embedded metadata copy. Trimming, transcoding, social platforms, and third-party editors may remove or retime metadata; container support does not guarantee round-trip preservation. Hash original assets and bind manifests to those hashes. Preserve original sample timing and explicitly map proxies and edited assets back to originals. Never infer capture time from file modification time.

## 2. Synchronization options

| Option | Useful contribution | Principal limitation | ourTake decision |
|---|---|---|---|
| Server broadcast received every 30 seconds | Presence, sequence, diagnostic anchors | Variable network transit and callback latency | Keep as evidence, never declare frames equal from IDs |
| Repeated four-timestamp exchanges | Estimates clock offset and network transit | Asymmetric paths and software scheduling remain | Implement measurement now; retain raw observations |
| Local leader on Wi-Fi | Shorter paths, local operation, less internet dependence | Mixed-device connectivity and leader failures | Preferred native capture experiment |
| Native camera timestamps | Associates encoded samples with camera timing | Device-dependent clock domains, rolling shutter | Essential for high-accuracy track mapping |
| Software sensor phase alignment | Can align capture instants on supported devices | Camera controls and assumptions may not exist everywhere | Prototype on a tested Android allowlist |
| Audio cross-correlation | Aligns imported footage and verifies drift | Sound propagation, echoes, noise processing, unrelated sound | Secondary evidence with confidence and distance treatment |
| Shared visual code / optical event | Direct observation of scene timing | Must be visible; display refresh and rolling shutter affect precision | Setup and laboratory validation |
| External timecode | Shared time labels in supported capture chains | Labels alone are not sensor genlock | Optional specialist path |
| Hardware trigger / genlock | Strongest control of physical exposures | Generally outside arbitrary-phone capture capability | Benchmark; specialist cameras for strict guarantees |
| Browser MediaRecorder only | Broad participation with little setup | No standard arbitrary timed-metadata insertion or sensor phase control | Compatibility capture, explicitly estimated timing |

NTP's four timestamps estimate offset as ((t2−t1)+(t3−t4))/2 and round-trip delay as (t4−t1)−(t3−t2). Taking multiple low-delay observations is useful, but neither HTTP measurements nor half a round trip establish camera exposure error. The proposed application handshake borrows the equations; it is not a complete NTP implementation. Server receipt/send timestamps must share a stable clock domain. [RFC 5905, sections 8–10](https://datatracker.ietf.org/doc/html/rfc5905).

Android distinguishes camera timestamps comparable to elapsedRealtimeNanos from UNKNOWN timestamps that cannot safely be compared across subsystems. A native implementation must query this characteristic, establish the camera-to-host clock relationship, and retain exposure duration/readout information where available. Nanosecond units are not evidence of nanosecond accuracy. [CameraCharacteristics](https://developer.android.com/reference/android/hardware/camera2/CameraCharacteristics).

A particularly relevant research lead is Ansari, Wadhwa, Garg and Chen's *Wireless Software Synchronization of Multiple Distributed Cameras* (2019). It reports less than 250 microseconds on its tested hardware using network clock estimation followed by camera-stream phase alignment, and releases an Android implementation. This is evidence that aggressive software synchronization is worth investigating, not a promise for current heterogeneous iPhones and Android phones. Reproduce the LED-array experiment and audit device controls before adopting its approach. [Paper and implementation reference](https://arxiv.org/html/1812.09366v2).

## 3. Recommended timing architecture

Use event-relative time rather than assuming UTC itself needs high accuracy. On the native path, elect a local leader, collect a burst of timestamp exchanges before arming, schedule capture in advance, and record the actual sample timestamps. Continue probes periodically and after reconnect, thermal state changes, interruptions, or camera reconfiguration. Thirty seconds is a reasonable starting interval to test, not an accuracy guarantee; shorten adaptively when residuals rise.

Store pairs connecting media presentation timestamps to leader time. Fit a robust affine mapping `eventSeconds = offset + rate × sourcePTSSeconds`; split into segments at discontinuities rather than smoothing across a restart. Track residuals, age, evidence type, sample count, and uncertainty. Use separate mappings for video and audio when their clocks differ. For scale, a hypothetical 50 ppm clock error accumulates 1.5 ms in 30 seconds and 90 ms in 30 minutes. These are calculated examples, not measured phone oscillator specifications.

Reconcile network evidence with audio landmarks across multiple windows. Reject ambiguous peaks; use a connected overlap graph rather than forcing every camera to correlate with one distant microphone. Sound needs roughly 29 ms to travel an additional 10 m at an assumed 343 m/s, so audio-aligned arrivals may misalign visual events by almost a frame at 30 fps. Do not “correct” precise visual timing using an uncompensated distant clap. Multiple landmarks, known geometry where available, or a shared optical observation can distinguish propagation from clock offset.

For an arbitrary requested instant, retrieve the nearest real sample within a declared tolerance. Preserve its actual timestamp and delta from the requested instant. At 30 fps, frames are about 33.3 ms apart; even perfectly mapped independent streams need not expose at the same phase. Rolling shutter also means different rows represent different times. A “same moment” gallery must distinguish known alignment, estimated alignment, unavailable footage, and frames outside tolerance. Never freeze a stale frame and imply continued coverage.

Browser playback should share one logical playhead and map it into each source. Seek paused views to that playhead, wait for usable frames, and expose loading or missing coverage. During playback, measure drift and correct it without mixing multiple audio tracks by default. HTML video and requestVideoFrameCallback support presentation observation; they do not give hard synchronized-display guarantees across video elements. Full scientific frame selection requires an indexed sample/decode pipeline. [MediaStream Recording specification](https://www.w3.org/TR/mediastream-recording/), [requestVideoFrameCallback](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback).

### Manifest proposal

```json
{
  "version": 1,
  "sessionId": "opaque-session-id",
  "assetSha256": "hash-of-original",
  "clockEpoch": "leader-boot-id",
  "videoTimescale": 90000,
  "anchors": [{
    "sequence": 42,
    "targetEventUs": 95000000,
    "sourcePts": 8460000,
    "observedHostNs": "1234567890123",
    "eventEstimateUs": 95000180,
    "uncertaintyUs": 1200,
    "evidence": "native-sample-clock-map"
  }],
  "segments": [{"sourceStart": 0, "sourceEnd": 120, "offset": 1, "rate": 1.00001}],
  "discontinuities": [],
  "validation": {"physicalExposureVerified": false}
}
```

Integer units and string-encoded large integers avoid accidental JavaScript precision loss. Keep raw exchange samples for reprocessing. A browser callback anchor must instead say `recorder-callback-clock-estimate`; its elapsed callback time must not be mislabeled as encoded video PTS. Native schemas remain a proposal until capture hardware and SDK implementations exist.

## 4. Contemporary UX evidence

| Reference | Documented workflow | Lesson for ourTake | Boundary |
|---|---|---|---|
| YouTube precise seeking | Expand a scrubber into thumbnails, with a way to cancel seeking | Keep basic playback familiar; reveal precision intentionally | Gesture-only discovery is insufficient; add visible controls |
| Final Cut Pro for iPad Live Multicam | Up to four angles; edit proxies while originals transfer | Multicamera is viable on touch devices; originals need not block exploration | Apple ecosystem setup differs from a mixed-phone group |
| Premiere multicam editing | View angles, cut with number keys during playback, refine cuts afterward | “Record my choices” is a valuable advanced shortcut | Do not expose source-sequence setup as the consumer entry point |
| Onform | Slow motion, frame review, side-by-side, drawings, voiceover | Athletes need repeatable observation and explanation | Vendor capability descriptions do not validate biomechanics claims |
| iMovie on iPhone | Magic Movie and storyboards, with later rearrangement and customization | Start parents from selected moments and an editable draft | Templates should not bury real voices or force sentiment |
| Adobe Express | Direct start/end trim controls and scene editing | Visible range choices reduce timeline learning | Retain context before and after a moment |
| Vimeo review links | Time-coded feedback and permission controls | Attach a comment to a particular moment, angle, and take version | Group capture access and finished-take sharing need separate scopes |
| Descript | Transcript-based edits | Useful future interface for speeches, vows and birthday messages | Spoken words are a poor universal model for silent sports action |

Sources: [YouTube seeking](https://support.google.com/youtube/answer/12825599), [Apple Live Multicam](https://support.apple.com/en-ie/guide/final-cut-pro-ipad/dev619b965f2/ipados), [Premiere multicam](https://helpx.adobe.com/premiere/desktop/edit-projects/set-up-multi-camera-sequences-for-editing/create-and-edit-a-multi-camera-target-sequence.html), [Onform analysis](https://support.onform.com/article/116-analysis-tools), [iMovie iPhone guide](https://support.apple.com/en-lamr/guide/imovie-iphone/welcome/ios), [Express trimming](https://helpx.adobe.com/express/web/video-creation-and-editing/edit-videos/trim-videos.html), [Vimeo review links](https://help.vimeo.com/hc/en-us/articles/12426192100113-How-to-use-and-manage-video-review-links), [Descript document editing](https://help.descript.com/hc/en-us/articles/10164808475149-Inline-notes).

The resulting opportunity is a shared event with many possible interpretations. The individual interaction patterns already exist; defensibility would come from reliable cross-camera moments, effortless group participation, and personally meaningful outputs. This review does not establish competitive uniqueness, retention lift, or a superior UX without participant testing.

## 5. Validation plan and decision gates

Run a physical capture study before advertising precision. Include current and older iOS/Android devices, mixed vendors, 24/30/60 fps and supported high-speed modes, indoor and outdoor light, Wi-Fi contention, mobile internet, 30–60 minute sessions, low battery, heat, dropped frames, interrupted recordings and backgrounding. Use at least three phones per session and repeat across device combinations. Verify against an independently timed LED array or equivalent optical instrument; a server timestamp overlay generated by the same clock is not independent ground truth.

Compare reception-only heartbeats, four-timestamp mapping, native sample mapping, audio refinement, and supported phase alignment. Report pairwise median, p95 and maximum exposure-time mismatch, drift over time, coverage failures, rolling-shutter effects, missing anchors, and session failure rate. Publish results per device/mode rather than averaging away failing combinations.

Proposed product gates: family switching p95 below 33 ms; sports comparison p95 below 8 ms; advanced sensor-phase experiments below 1 ms on an explicit supported-device set. These are aspirational acceptance targets subject to testing, and none is achieved by this implementation. Report frame availability separately from timing residuals. Aligning timestamps cannot recover uncaptured instants or repair motion blur.

For UX, recruit five athletes and five parents for formative sessions, followed by a broader round after revision. Without a tutorial, ask them to find another view, select two cameras, keep a moment, change its angle, reorder it, undo, preview and export. Proposed targets: first other-angle action within 10 seconds, first kept moment within 30 seconds, a three-moment take within 3 minutes, no destructive mistakes. Record task success, hesitation, accessibility failures and satisfaction, not just time in app. Compare phone and desktop for the same tasks. Measure completed and revisited takes per event and repeat-event contribution; longer editing time alone is not success.

## Source register

All URLs above were accessed 10 September 2026. Platform documentation is living documentation unless a date is stated. RFC 5905 is June 2010; the camera synchronization paper was revised June 2019; Premiere's multicamera target-sequence guide was updated August 2025; Adobe Express trimming was updated April 2026. The local primary reference is [BRAND-KIT.md](BRAND-KIT.md), version 0.2, updated 10 September 2026. This study retains its agreed principles and does not approve an exploratory visual family.
