# OurFrame handoff

## Latest player work — 10 September 2026

The requested ourTake player/editor research, specification and first implementation are now present. Start with [PLAYER-RESEARCH.md](PLAYER-RESEARCH.md), [PLAYER-SPEC.md](PLAYER-SPEC.md) and [PLAYER-IMPLEMENTATION.md](PLAYER-IMPLEMENTATION.md). `/player` supports local-video composition; session **Watch & create** uses shared footage. Both can render chosen-moment MP4 takes through the local worker. The paragraphs below describe earlier work and should not be read as the status of this new player implementation. The new birthday design request expands the use-case study to parent-controlled creation; it does not establish production child-account or guardian-management support.

Updated 9 September 2026 after competitor and Jugnu review.

## Latest founder decisions

- Add heart-rate-triggered compositions to MVP: above 140 bpm and a rise over 15%, with configurable thresholds and explicit semantics.
- Adult-only product; no minor accounts or minor-participant pilot scope. Core session contribution is explicitly consented; do not repeatedly ask for already-authorized routine composition.
- Study and adopt relevant Jugnu work. Source checkout remains intact; its earlier tested implementation is in Git before the August reset.
- 10 September: founder selected **ourTake** and approved the ordered brand principles. [BRAND-KIT.md](BRAND-KIT.md) is authoritative for identity, composition naming, and the three-family logo exploration. Visual candidates are not production selections; runtime migration and clearance remain outstanding.
- Native capture is recommended; browser remains useful for early tests and long-term low-friction participation/viewing.

## Read next

1. [Product requirements and ordered MVP plan](PRODUCT-DECISIONS-2026-09-09.md).
2. [Competitor audit](COMPETITOR-AUDIT.md): independent review evidence is sparse, historical login issues exist, current revenue is undisclosed. Financial scenarios are assumptions, not company estimates verified from accounts.
3. [Jugnu reuse audit](JUGNU-REUSE-AUDIT.md): current HEAD e819067; historical implementation eca42b4 / hardening ce8073e. Read-only source review, with selected historical contracts copied into reference/.
4. [Current architecture](ARCHITECTURE.md) and [field guide](FIELD-TEST.md).

## Implementation truth

The local browser/Node/FFmpeg pilot predates these new requirements. No source-code changes or new runtime tests were made in this research turn. HR import/query, durable accounts, age enforcement, consent receipts/withdrawal propagation, native capture, checksum receipts, and venue templates are pending implementation. Existing automated test results do not validate them.

The frontend/server were previously run on localhost ports 3000/4100. Vercel project ourframe is created/linked, not deployed as a working cloud service. Supabase has a server-only ourframe namespace in an existing database; the local runtime still uses SQLite.

Temporary public HTTPS tunnel approval from the earlier build remains unanswered. No tunnel was opened. Do not treat this research request as authorization to expose the local service.

## Next concrete engineering slice

Implement adult/session consent contracts and owner-private sensor import, then deterministic HR match preview with manual clock mapping and real FFmpeg composition. Preserve a complete match list separately from a duration-limited recap. Add meaningful data-quality, cross-camera timing, isolation, withdrawal, and deletion tests. Qualify native capture on the exact phones after short behavioral trials; keep recording independent from expensive analysis.

## Research limits

No competitor hands-on recording, private customer interviews, paid filings, or company outreach were performed. No real wearable data or target-device recording was tested. Do not describe public claims, historical Jugnu test reports, or scenario revenue as new measured evidence.
