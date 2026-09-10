# OurFrame — response to the founder’s observations

Naming supersession, 10 September 2026: **ourTake** is selected. [BRAND-KIT.md](BRAND-KIT.md) supersedes the historical naming recommendations in this response.

Working name: **OurFrame**. **TT** means a tangential thought: keep it in exploration without silently adding it to the current release. Prepared September 9, 2026. Market statements below are supported by linked sources; suggested metrics, names, and engineering policies are proposals.

## 1. Portable capture and founder risk: revised assessment

Your objection is justified. I conflated motivation to overcome setup friction with the reliability of the capture process. Motivated players, coaches, and dancers are a materially better initial audience than casual dinner guests. Your access to a university trainer, a jiu-jitsu instructor, and basketball/squash/dance participants removes a large part of the initial recruitment risk. Portable sports capture is now my preferred first experiment for you.

“Everyone keeps their phone” is also a useful correction. There is no device handover. The residual cost is that a mounted recording phone is temporarily occupied, needs an appropriate location, and may be interrupted by a call, app switch, heat, or depleted storage. These are engineering and field-test variables, not reasons to dismiss the business.

Your success criterion changes the decision. A three-month experiment can be attractive even if it never becomes a venture-scale company. $100,000 annual operating surplus before your personal taxes is about $8,333/month after business expenses. At $100/month contribution per customer account, that needs about 84 accounts; at $200 it needs about 42. Those are arithmetic scenarios, not forecasts. If an account needs hours of support every month, the solo-founder premise becomes the limiting factor.

The real risks are opportunity cost, ongoing service work, unreliable output, and insufficient repeat payment. Low engineering cash cost reduces the cost of discovery; it does not eliminate these risks. Track weekly return, paid repeat sessions, refunds, support minutes per session, and contribution after compute, storage, payment fees, and support. Do not apply venture-market rejection criteria to a business you would happily own for its cash flow.

## 2. Requirements across the three products

Accuracy numbers here are proposed targets for evaluation, not achieved guarantees.

| Dimension | Shared group memories | Portable sports / dance | Installed venue capture |
|---|---|---|---|
| Session meaning | Shared occasion; can span places and dates | One activity and timeline, with repeated takes | Booking or activity window on a calibrated installation |
| Temporal alignment | Approximate chronology; seconds often adequate | For rapid cuts, target measured error below one output frame; rigorous mechanics needs tighter validation | Similar editing target, with hardware timing available if analysis demands it |
| Spatial alignment | Usually unnecessary; needed only for fusion | Layout and complementary views first; calibration for cross-view geometry | Calibrate once, detect movement, revalidate periodically |
| Geographic alignment | Optional location label and time zone | Venue/court identifier usually sufficient; GPS is weak for indoor placement | Fixed court identity; GPS optional |
| FOV objective | Diversity: people, reactions, details, locations | Coverage, useful subject scale, occlusion resilience | Predictable coverage throughout the playing volume |
| Image accuracy | Faithful memories; aesthetic ranking is subjective | Preserve actual movement and outcome; separate analysis from effects | Explicit accuracy measures for each supported sport/statistic |
| Capture resolution | Full-size photos; original video where possible | Start 1080p/30; use 60 fps or 4K when the specific view and task justify it | Choose sensor/lens/bitrate against player and ball pixel size |
| Output resolution | 1080p social film usually enough | 1080p social and landscape review; source quality remains the ceiling | Similar exports, with optional archival quality |
| Compute pattern | Bursts around occasions and requested stories | Repeated source ingestion and personalized editions | Predictable load; on-site gateway may reduce uplink requirements |
| Revenue potential | Large audience, lower/episodic individual willingness to pay | Recurring coach/team/player value | Contracted B2B revenue plus player packages |
| Virality hypothesis | Recipients create the next occasion | Players share work and bring other teams/classes | Players move between venues; venue introductions are a different channel |
| Distribution constraint | Convincing a group to contribute | Getting one motivated organizer and useful camera positions | Selling, installing, maintaining, and supporting courts |

For Thanksgiving across several households, “sync” means belonging to the same event and placing contributions in context. It does not require all cameras to run together. Store captured time, received time, time-zone information, location label, and ordering confidence separately. Live arrivals can be shown immediately and later sorted into a story without pretending uploads arrived in capture order.

## 3. AI, competition, pricing, and speed

I agree with your five advantages: cheaper implementation, faster experiments, new composition interfaces, lower fixed costs, and learning from existing products. A populated market can be a useful source of pricing and UX evidence. Your advantage could be operating a coherent, narrower service with a much smaller team.

The part I would retain from my earlier objection: multi-phone capture plus automatic editing is not wholly unaddressed. [Meddly](https://meddly.app/) explicitly markets it; [SPORT.VIDEO](https://sport.video/multicam) supports multi-phone sports coverage. Their existence does not establish that they execute well, retain your target users, or serve your chosen market. A hands-on comparison of the complete user journey is more informative than a feature checklist.

The opportunity is to make the overall experience feel newly accessible: join, capture without an operator, request a specific useful composition, and receive it quickly. Compete on time to a valued result, quality, and cost per repeat session. Lower R&D cost alone cannot establish how cheaply you can serve an hour of uploaded video.

Suggested benchmark: use the same legal-to-use three-camera source set, ask every competitor and OurFrame for the same personal result, then compare setup steps, missed events, corrections, time to delivery, and total price. Record what the products actually do rather than inferring weaknesses from marketing.

## 4. Collections and recurring contextual stories

This is a strong direction. The proposed domain model is:

`Group → Collection → Session → Take → Clip → Event/annotation → Composition`

Add participants, locations, sensor streams, permissions, and provenance as related records. Examples:

- Family → Thanksgiving → Thanksgiving 2026 → dinner/toast/reactions.
- Dance crew → Competition preparation → September practice → routine takes.
- Player → Serve development → weekly sessions → comparable attempts.

The accumulated context should make an explicit request better: “Show how our Thanksgiving table changed since the first child was born,” or “Compare this week’s footwork with last month’s.” Keep factual dates and user-provided relationships separate from model guesses. Collection membership must not silently expand access to every underlying session. Cross-session stories need permission on each selected clip.

The current pilot records group and collection labels per session. A persistent group graph, cross-session composition, and multi-location live feed are subsequent work, not implemented behaviors hiding behind those labels.

## 5. Pilot order and network effects

Use all six accessible environments as a requirements portfolio, but test the same capture core in a deliberate order:

1. Dance: a bounded routine, three fixed views, known participants, clear preferences about the result.
2. Squash: two players, predictable area, test fast movement and back-glass glare.
3. Basketball: occlusion, missed action, ball scale, and whether alternate views earn their cost.
4. Gym training: coach-selected repetitions and useful movement visibility.
5. Jiu-jitsu: close contact, occlusion, and whether different views materially aid instructor review.
6. Outdoor pickleball: sunlight, heat, connectivity, and distant-ball quality.

This ordering is based on your recruited participants and manageable test structure, not a claim about market size. Obtain facility permission and recording agreement; university/team sessions may require institutional permission beyond an individual trainer’s enthusiasm.

Measure participant invitation acceptance, camera contribution, result opens, saves, external shares, and newly created groups. The useful viral measure is **new activated session hosts per existing host**, not the number of phones installed at one event. Track attributable introductions separately from repeated activity within the original group. Start with adults while identity, recording controls, and operating expectations are being tested.

## 6. Camera count and positioning

I agree that coverage and useful angles should determine camera count. Two is a starting configuration, not a cap. The six-angle basketball proposal is a good hypothesis to test. Names such as front-left and back-right need a shared court orientation so participants interpret them consistently.

Preserve one dependable overview. Additional diagonals can reduce occlusion and support personal compositions. Low views may be expressive but can lose the ball, hide feet, or create mounting hazards; place them outside run-off space with facility approval. A wide full-court view can still provide too few pixels for ball or jersey analysis. Evaluate pixels on the target and occlusion, not FOV alone.

There is diminishing return from cameras with similar views. Measure rescued events, alternate-angle preference, upload bytes, and setup time for 1/2/3/6 cameras on the same session. Allow non-camera participants to join and receive their results: participation should not require sacrificing a useful phone position merely to drive installs.

## 7. TT — physiology on the video timeline

Yes: a time-indexed sensor stream can be aligned to video of tennis, lifting, or dance. It already exists as a general editing workflow: [Telemetry Overlay](https://goprotelemetryextractor.com/telemetry-overlay-trial) supports external activity data and customized gauges. [Garmin FIT](https://developer.garmin.com/fit/overview/) encodes activity/sensor data, and Apple HealthKit provides authorized access to workout-related data. An Apple Watch integration requires a native application and appropriate permissions; browser capture alone does not provide general HealthKit access.

A useful OurFrame differentiator would be synchronized context and retrieval: “Show my final set with heart rate,” or “Compare the same drill at the start and end.” Begin with imported FIT or timestamped CSV and a manual alignment control. Store sensor time, units, source, sampling gaps, and uncertainty. Do not interpolate across large gaps or label sensor readings as clinical findings. Wrist-worn sensing and physiology are not instantaneous labels of the nearest video frame.

Suggested schema: `SensorStream(participant_id,session_id,source,metric,unit,timebase)` plus `Sample(timestamp,value,quality)` and a separately versioned clock mapping. Overlay only in that participant’s permitted compositions. **Updated 9 September 2026: heart-rate selection is now committed MVP scope**, including “above 140 bpm” and “rise greater than 15%.” It is not yet implemented. See the [predicate, alignment, privacy, and acceptance specification](PRODUCT-DECISIONS-2026-09-09.md).

## 8. TT — cooperative capture, compression, and patents

There is substantial room for systems innovation, but broad camera scheduling and redundancy-aware transmission have prior art. Examples include [camera scheduling and energy allocation](https://pubmed.ncbi.nlm.nih.gov/20350857/), [correlation-aware multi-view packet scheduling](https://arxiv.org/abs/1212.4455), and the published application [in-network adaptive quality control of IP cameras](https://patents.google.com/patent/WO2024252169A1/en). A published application is not a determination that a particular enforceable claim covers OurFrame. This is a preliminary map, not a patentability or freedom-to-operate opinion.

Drone swarms offer relevant patterns: distributed role assignment, coverage optimization, handover, uncertainty management, and resilience to node loss. Phones add constraints involving user consent, battery ownership, mixed operating systems, sensor clocks, and recording interruptions.

A promising invention candidate is **composition-aware cooperative acquisition**: choose capture and upload policies according to the future compositions requested by participants, while guaranteeing minimum event coverage and retaining recoverable originals. A specific claim needs more detail than “phones cooperate.”

Proposed controller inputs: coverage map, view quality, identity/track confidence, scene activity, battery/thermal headroom where exposed, uplink budget, local storage, and each participant’s composition preferences. Outputs: primary/alternate role, recording profile at safe boundaries, proxy rate, protected event windows, and requested source segments. Evaluate against constant-quality independent cameras with the same footage and budget.

| Technique | Assessment | Safeguard / experiment |
|---|---|---|
| 15/30/60 fps policy | Feasible on supported native capture paths; browser behavior varies | Do not lose event onset or ball trajectory; switch only at supported boundaries and log changes |
| Adaptive bitrate / codec | Usually the first practical lever; inter-frame codecs already compress static redundancy | Compare quality on the actual fast action, not an idle court |
| One high-quality primary, lower-rate alternates | Promising with explicit alternate-view quality guarantees | An alternate may become the best view unexpectedly; retain enough quality to rescue occlusion |
| Coordinated still/video roles | Plausible for events | A still capture must not interrupt every camera’s view of the action |
| Motion sensor triggering | Useful for detecting camera movement | The phone’s IMU cannot see players moving while the phone is stationary; use visual motion too |
| Local feature/proxy exchange | High potential to reduce duplicate expensive processing | Exchange small metadata first; do not move entire raw streams between every pair |
| Selective full-resolution upload | Strong early optimization | Keep originals until selection is final and viewers have had time to request another edit |
| Edge composition | Useful for fast previews | Avoid multiple irreversible encode generations; upload original selected segments for final rendering |
| Multi-view super-resolution | Potential under suitable alignment and overlap | Distant viewpoints and occlusion are not interchangeable samples of the same pixel |
| Generative missing frames | Appropriate only as an explicitly stylized option | Do not synthesize evidence in performance review, officiating, or factual sports statistics |

The baseline pilot fixes requested capture at 30 fps and offers 6/12 Mbps targets, computes basic light/frame-change indicators locally, and preserves recordings in browser storage before resumable upload. It does not claim dynamic-fps cooperation, cross-phone feature exchange, or automatic event detection.

## 9. Near-field synchronization

Nearby communication helps coordination but does not turn message arrival into sensor exposure time. BLE has scheduling jitter; application callbacks add delay. NFC is appropriate for tap-to-join or exchanging a session identifier, not continuous timing across a court. Web Bluetooth is a peripheral API with limited browser coverage, not a universal cross-phone mesh. [MDN Web Bluetooth](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)

A native implementation can use local discovery and repeated round-trip timing. Apple’s [Multipeer Connectivity](https://developer.apple.com/documentation/multipeerconnectivity) supports nearby Apple-device communication; mixed Android/iOS communication needs a deliberately selected transport/protocol and tests. Use one coordinator, periodic offset/drift fits, a scheduled start, local capture timestamps, and post-capture alignment. Keep the overview independent of coordinator failure.

The browser pilot measures server-clock offset over seven round trips, uses the lowest-RTT estimate, arms each camera explicitly, and schedules an eight-second countdown. Recording start callback time is recorded, but is not a sensor timestamp. The displayed uncertainty is network timing uncertainty only. Audio/visual frame alignment remains a native/media-pipeline milestone. A measured estimate must not be marketed as guaranteed sub-frame sync.

## 10. Naming and identity

Keep **OurFrame** during validation. It is clear and emotionally compatible with collective content. **OurTake** is particularly good if interpretation and personalized versions become central. **VibeTake/VibePlay** have youth appeal but stronger trend dependence and a less precise meaning. **Picus** is compact, but its spelling-to-sound path is ambiguous and the name is already used by businesses; it needs careful screening. **Vdo** is visually short but can be read as “video,” individual letters, or “we do.” A name that needs its pronunciation explained loses some word-of-mouth efficiency.

Creative candidates, not cleared names or available domains:

| Direction | Candidates |
|---|---|
| Shared perspective | OurTake, WeTake, WeSee, AllTake, UsView |
| Playful action | Takeo, Jumo, Vaylo, Zuvo, Rillo |
| Rhythm and motion | Tavo, Veyo, Movo, Kivo, Rova |
| Social sound | Yovo, Piku, Wivo, Nomi, Omi |
| More distinctive coinages | Ouvio, Veylo, Frayo, Tovio, Vumio |

Many short syllables are already brands. This is a sound-and-positioning exploration, not a clearance result. My phonetic shortlist to test is **Takeo, Ouvio, Frayo, Yovo**, alongside **OurFrame** and **OurTake** as clear controls.

Borrow naming principles rather than existing names: TikTok has rhythm and repetition; Instagram combines recognizable ideas; Strava is a compact unfamiliar word that acquired category meaning; Snapchat originally described an action. Aim for one obvious pronunciation, easy spelling after hearing it once, recognizable lowercase silhouette, no awkward transliteration, and a usable invitation: “Join my ___.”

Test pronunciation and unaided recall with actual users in several language groups. Screen meanings, trademarks in relevant classes/jurisdictions, app-store confusion, domains, and social handles before choosing. Favor a name that works for both dance and sports if that remains the intended umbrella.

## 11. Cash costs and deployment

Your existing accounts and machine can keep incremental pilot cash spending very low. The local FFmpeg worker removes the initial need to rent GPU time. Zero-cost operation is conditional on usage limits, plan terms, existing equipment, and your time. [Vercel Hobby](https://vercel.com/docs/plans/hobby) is restricted to non-commercial personal use; do not assume it is the permanent free plan for a revenue-generating service. [Supabase pricing](https://supabase.com/pricing) provides current allowances; video storage can exceed small free quotas rapidly. Rendering and large media transfer belong outside ordinary Vercel functions; its request/response payload limit is relevant to video uploads. [Vercel payload guidance](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions)

Current setup: local API, SQLite metadata, disk media, and FFmpeg; a new linked Vercel project; a provisioned server-only OurFrame schema in the existing Supabase project. The live pilot has not silently switched to Supabase. A cloud release should use direct signed/resumable object uploads and a durable external render worker, with explicit account and usage settings.

## 12. Decision

Proceed with building and field validation. Use the existing participants to test the product you actually want, not only a landing-page proxy. Keep TT ideas as an explicit source of invention and later differentiation. Judge the first build on whether three people can join, capture, receive a useful multi-angle film, ask for a personal version, and want to repeat. Do not equate a polished interface with validated capture reliability or automated sports understanding.
