# Jugnu review and adoption map

Inspected 9 September 2026. Source: `C:\venkat\limca\jugnu`, current HEAD `e819067`, plus the implementation before reset at `eca42b4` (Slice 8 hardening commit `ce8073e`). Source checkout was read without modifying its files, branches, database, or credentials.

## What I found

You were right that there was a substantial implementation and testing. The apparent discrepancy is historical: commit `a65666c` reset Jugnu around Presence, Confidence, Replay. The current tree is a clean shell plus strategy; the earlier implementation remains in Git.

Current code contains a mission homepage, shared domain constants/types, a health route, and smoke tests. Current documents include founder field notes, venture economics, spatial registration, capture confidence, a red-team review, a v2 reconciliation, and cinematic multicam exploration. Some recommendations explicitly remained unratified. I have not silently treated every old proposal as a current OurFrame decision.

The historical implementation includes guest onboarding, signed sessions, multilingual participation, moderation, run sheets, show-content handoff, private photo uploads, CRM, Supabase migrations, and automated/browser test suites. Its own report describes a local rehearsal, with mock payments and fixture-based personal photo suggestions—not a production AI photo/video system.

The historical readiness report records a 20-person/60-operation synthetic burst, access-control and recovery checks, accessibility/browser checks, and physical Pixel 7a browsing/operations flows. These are **historical reported results** that I inspected, not tests I reran. They do not prove video capture or synchronization on the founder's current three phones.

Relevant historical contracts are preserved under [reference/jugnu-eca42b4](reference/jugnu-eca42b4/pilot-readiness-report.md): readiness, private photo memory, architecture, and rehearsal runbook. They are reference material and retain their original demo boundaries.

## Adopted strategy

| Jugnu insight | OurFrame adoption |
|---|---|
| Presence, Confidence, Replay | Minimize participant camera-management time; show evidence of saved footage; deliver something worth reviewing together |
| Content existed but pooling/synthesis failed | Accept native-camera imports; do not require synchronized capture to get any value |
| Recurring fixed venues amortize setup | Prioritize adult dance, trainers, dojos, squash and other recurring courts; save layouts and assignments |
| Source-agnostic event engine | Keep ingest, clock mapping, moment selection, composition and delivery separate from capture clients |
| Confidence is evidence, not a percentage | Distinguish connected/recording/local-save/upload-receipt states and show unknown/stale conditions |
| One master plus intentional alternate views | Protect a wide camera and reference audio; avoid every camera chasing the same target |
| Human time is a cost | Track organizer setup, support, and editorial corrections at replacement cost, even when founder performs them |
| Replay as another social occasion | Measure shared viewing, return to the collection, and voluntary repeat sessions |

Your sports/practice network changes the market-entry recommendation: reach actual adult groups you can observe, rather than importing the old pro-photographer-first recommendation. The older youth/guardian wedge is excluded by your new adult-only instruction. Historical rental, show-control, payments, CRM, and event-entertainment scope does not become OurFrame MVP scope.

## Technology adoption and limits

| Source pattern | Decision | Current OurFrame status |
|---|---|---|
| Modular monolith, asynchronous media work | Retain | Local Node + SQLite + FFmpeg already follows the broad pattern |
| Signed event membership and role checks | Retain and extend to durable accounts | Session bearer credentials exist; account/consent evolution specified |
| Private media, separate derivatives | Retain | Local originals and renders separate; cloud object-storage integration pending |
| Idempotent upload jobs | Retain | Resumable offset-based video upload already implemented |
| SHA-256 server receipt in historical photo upload | Adopt as next source-manifest requirement | Existing video probe/length checks are not an end-to-end checksum guarantee |
| Expiring guest-bound photo URLs | Adapt | Current signed media links are bearer links; true member-bound access is a distinct enhancement |
| Consent withdrawal/data-request history | Adapt for owner media and HR | Committed requirement; not current per-owner deletion behavior |
| Row versions and append-only histories | Adopt for future multi-user edit/control conflicts | Not present as a complete audit/optimistic-lock subsystem yet |
| AprilTag/ArUco + manual fallback | Keep as calibration experiment | Current court markers are manual selections, not measured poses |
| Local-language and accessibility evaluation | Reuse test methodology | Historical results do not validate new UI automatically |
| Fixture-based personal photo matching | Do not transplant as recognition | Manual tags remain explicit; no face embeddings copied or activated |
| Show exports / CRM / gifting / guardians | Exclude | Unrelated to the selected adult capture/review MVP |

### Why I did not bulk-copy historical code

The photo routes use Next.js cookies, Supabase tables/RPCs, local-demo flags, and still-image compression contracts; OurFrame uses a Node video pipeline and resumable file segments. Copying routes would bring incompatible dependencies and demo assumptions rather than working video functionality.

The inspected upload handler computes a checksum after reading a small compressed photo, stores an object, and then creates metadata. Its completion fast-path is useful, but it is not a sufficient proof of atomic idempotency under concurrent retries or a crash between object write and metadata commit. Our future cloud upload must reconcile that gap rather than copy the handler literally. Likewise, its in-memory photo retry buffer is not durable long-video recovery.

The historical code is valuable as a contract/test reference. Reuse its ideas with explicit source provenance and new tests for our larger-file, multi-device workload. No historical mock endpoints, seed identities, or secrets were imported into the running app.

## Corrections to the exploration documents

Some cinematic notes are intentionally enthusiastic hypotheses; these should not survive as engineering claims:

- “Short sessions are thermally safe” and “hours of video are a forbidden physics theorem” are too absolute. Duration, ambient temperature, sensor/codec settings, charging and edge workload require device tests.
- “Every cause of Vyclone's failure has been repealed” is not an evidenced causal analysis. Do not adopt it without original operating/failure evidence.
- “No visible consumer owner” does not mean no direct competitor. Meddly overlaps substantially; SPORT.VIDEO also supports multicam.
- UWB range alone does not give full camera pose, optical calibration, or synchronized exposure. Treat it as one possible observation, not an automatic layout solution.
- 4K landscape to 1080p landscape has at most 2× linear crop headroom before upscaling, assuming the same aspect ratio and no stabilization margin. Portrait reframing changes those bounds; “2–3× free movement” is not general.
- Interpolated frames are not substitutes for measured temporal alignment in performance analysis.
- Percentage “build confidence” figures in brainstorms are subjective judgments, not measured success probabilities.

## Next implementation contracts

1. `SourceManifest`: session/take/device, codec, segment PTS bounds, bytes, SHA-256, clock mapping/version, received/verified timestamps; reconcile before cleanup.
2. `ConsentReceipt`: account/member, scope, purpose/version, timestamp, adult attestation, withdrawal state; separate optional HR permission.
3. `CaptureHealth`: last heartbeat, last segment saved, last server receipt, queue bytes, actual capability readings, freshness. Never infer a recording from an online socket.
4. `MomentQuery`: deterministic sensor predicate and source-grounded windows with owner-scoped access, as specified in the new MVP document.
5. `VenueTemplate`: activity, safe fixed positions, wide-master role, tested device profiles, last verified preview. Revalidate after any camera move/zoom.

These contracts are adopted into the roadmap. Only the previously implemented local-pilot subset is running today; this audit does not claim the pending contracts are implemented.

## Source trail

- Current `AGENTS.md`, `docs/CONTINUE-HERE.md`, `docs/strategy/PROJECT-MEMORY.md`, `docs/strategy/DECISION-LOG.md`, `docs/implementation-plan.md`.
- Current technology/product workstream handoffs, `docs/technology/implementation-plan.md`, `docs/product/spatial-registration.md`.
- Current `docs/v2-direction/07-field-notes.md`, `09-v2-response.md`, `09-cinematic-multicam.md` (relevant sections inspected; claims above distinguish proposed from adopted).
- `eca42b4:docs/tech/pilot-readiness-report.md`, `photo-memory-interface.md`, `architecture.md`, `rehearsal-runbook.md`.
- `eca42b4:apps/product/app/api/demo/photo-upload-ticket/route.ts`, `photo-upload/route.ts`, `tests/e2e/hardening.spec.ts`; historical tree and migration/test inventory.
