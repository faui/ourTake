# ourTake app UX — requirements, constraints, and scoring framework

Date: 2026-09-18 · Author: Claude, from founder observations (2026-09-18) and three weeks of field tests · Status: **foundation for the UX design cycle**; concepts are iterated and scored against this document, and it is updated when a direction is accepted. Scope: the app at `take.gozaika.in` (create / join / run / review sessions). The marketing website is a separate, later deliverable.

## 1. Who uses this and when

- **Participants (the many):** friends/teammates at an activity — squash, basketball, dance, pilates. They are there to *play*, not to record. They arrive via a QR code, on their own phone, mid-warm-up, often with no explanation. Attention budget: seconds. Tolerance for instructions: near zero.
- **The host (the one):** the organizer who set up the session. Slightly more motivated; still on a phone, still at the activity. Wants: everyone in, cameras up, start, stop, and later an edition to share.
- **The reviewer (later, calmer):** anyone from the session watching footage/editions afterwards — at the venue on a phone (buffering over the host's uplink) or at home on a laptop via the device link.
- **The deliberate creator:** occasionally the host or a keen participant using the player to compose manual takes. Depth is welcome here; it must never leak cognitive load into the first three roles.

**Field-test facts that shape the design** (from real sessions): a disabled-until-consent button read as a dead UI; a participant rescanned and became a duplicate person; one iPhone user held the phone landscape and the take died in 3 s (screen lock/app switch); nobody used moment marks or tags unprompted; three phones started within 4 ms of each other; uploads complete during recording; replay at the venue buffers on a 6 Mbps uplink.

## 2. Jobs to be done, in priority order

1. **Join and be ready without thinking.** Scan → name + consent → camera live → armed. Zero training.
2. **Run a take.** Host sees who is ready, starts; everyone sees a countdown; host stops. Repeat.
3. **Know it worked.** Every phone shows: my take is safe (uploaded), the group has N angles.
4. **See something good, fast.** One tap to a finished edition; one more to share/download.
5. **Go deeper (optional).** Mark moments, tag "featuring me," compose manually, choose styles, download originals.

## 3. Objectives (founder's seven, made testable)

| # | Objective | How we score it |
|---|---|---|
| O1 | **Zero training, instantly familiar** | 5-second test: a stranger describes what to do next correctly. Taps from QR scan to armed camera (target: consent + name only). |
| O2 | **Quick operation — the activity is the point** | Median time and taps for jobs 1–3. Anything not needed for the current step is out of sight. |
| O3 | **Minimal cognitive load, with depth on demand** | Count of decisions presented per screen (target ≤1 primary, ≤2 secondary). Depth reachable in one deliberate gesture, never default-visible. |
| O4 | **Playful mood via a motif that costs no real estate** | Motif lives in idle/transition moments (loading, waiting for host, countdown, upload complete, edition ready) — never in the working area during a take. Respects reduced-motion. |
| O5 | **Creator-platform polish** | Consistent tokens/type/spacing; no raw system controls; every state (empty, loading, error, offline, done) designed; mark and wordmark always paired at first encounters. |
| O6 | **Nudges that feel good, and rotate** | A small copy system (kit-approved lines: "Every angle. Together." etc.) surfaced contextually — waiting, done, first edition — not as static banners. Never claims capabilities we don't have. |
| O7 | **Distinct personality, familiar actions** | Personality in color, motion, voice, and the mark; interaction patterns borrowed from what phones already taught people (see §5 metaphors). Reviewer recognizes ourTake in 2 s and still knows how to press record. |

Non-negotiables that sit above the scoring: honesty of copy (no fake AI/sync claims), consent gate remains explicit, accessibility (contrast, touch targets ≥44 px, keyboard on desktop, reduced motion), and nothing on-screen depends on English wordplay.

## 4. Constraints

- **Platform:** web app in the phone browser, portrait-first; desktop is a reviewing surface. No app store install for the pilot.
- **Camera permission** is the browser's own prompt — the one unavoidable dialog; design around it (explain before, confirm after).
- **No accounts.** Identity = device + session token; multi-device via the device link. Designs must not assume login, profiles, or history beyond this device.
- **Network reality:** uploads stream during recording and can lag; replay at the venue buffers on the host's uplink. Progress and "safe" states must be honest and calm, not alarming.
- **Legal/consent:** consent copy is fixed text (host's computer, removal from phone, view/download policy). It can be styled, not shortened into vagueness.
- **Existing information architecture** (what exists today): landing → Create/Join dialogs → session workspace with tabs Capture · Watch & create · Footage · Create · Crew → player (`/player`) for local-file editing. The redesign may restructure this; it must preserve every capability.
- **Brand system (fixed inputs):** T-through-O mark (solid master; micro ≤24 px), unified tokens — violet `#3B3BE6`/`#8A8AF8`, coral `#EA531E`/`#FF6B35`, cyan `#00F2FE` (dark surfaces / inside violet only). Dark-first UI is current; a light mode is allowed if it scores better. Gold champagne motion = celebration states only. Typography still provisional (system stack); the redesign may propose the licensed grotesk.
- **Engineering budget:** vinext/React app, Tailwind + existing component kit; motion via CSS/SVG (no heavy libraries); everything must keep working on a 3-year-old Android and current iPhone Safari.

## 5. Familiar metaphors to borrow (candidates, to be tested)

- **The camera app** for the capture screen: big viewfinder, one obvious state indicator, controls at the thumb.
- **The group video call** for the session lobby: tiles/avatars showing who's in and who's ready; the host has the start control.
- **The shared album** for footage and editions: a grid you scroll, one tap to play, familiar share sheet.
- **The countdown timer / starting gun** for take start.
- **The chat-app QR join** (WhatsApp/Discord invite) for joining.

## 6. Anti-goals

No onboarding carousel; no settings before the first take; no jargon ("arm," "compose," "clip," "scope") in participant-facing copy; no modal stacks; no motion that competes with the viewfinder; no dead-looking disabled buttons — always say why.

## 7. Scoring protocol for concepts

Each concept is presented as: one-line thesis, key screens (lobby, capture, waiting/countdown, footage, edition), and a flow map for jobs 1–4. Score 1–5 on O1–O7 (weights: O1 ×3, O2 ×3, O3 ×2, O4 ×1, O5 ×2, O6 ×1, O7 ×2), veto on any non-negotiable, then list the top risk and the cheapest test. Iterate: keep the best-scoring concept's structure, borrow the strongest element of the runner-up, re-score. Stop when a concept scores ≥4 on O1–O3 and O5 with no vetoes, then validate with the 5-second test on three outsiders.

## 8. Known frictions the redesign must resolve (from field tests)

Consent gate discoverability · landscape holding / screen-lock during takes (guide + detect) · "what is this device still holding?" clarity · the Create tab's four-style choice up-front (defer) · marks/tags never discovered (make marking a single big button during recording, tagging a later, optional act) · buffering replay (calm progress, no spinners of doom) · host's "who is ready" at a glance.

## 9. Founder direction for the capture screen (2026-09-18) — with design-lead assessment

Observations from the founder, recorded as strong inputs (not directives); each carries the assessment the concepts must engage with.

1. **Full-bleed preview during a take.** The camera preview should own nearly the whole screen, with session name, participant count, and camera-ready count overlaid. — *Agree; this is the camera-app metaphor done properly. Constraint: mobile browsers keep their own chrome (address bar), so "full screen" means full viewport, not true fullscreen; an installed PWA (manifest already exists) gets closer. Overlays must sit outside the action zone (top band + bottom thumb band), use translucent scrims, and never cover the center third where the play happens.*
2. **The three actions as overlays: camera flip, "I'm ready" toggle, camera off.** — *Agree. Put them in the bottom thumb band like shutter-row controls; "Ready" is the primary (largest, coral), flip and off are secondary. Guard against accidental taps once a phone is mounted or held loosely: a short press-and-hold or a confirm for "Camera off" during a live take.*
3. **Analyze likely user actions per stage and adapt real estate accordingly.** — *Agree; this is the core of O2/O3. The stages are: joining → camera live but not ready → ready/waiting for host → countdown → recording → uploading/saved → reviewing. Each stage has one likely action; the concept must show the stage map with the single primary action per stage and what recedes.*
4. **"Your angle" placement guidance as a drawer, a scroll-down card, on-preview nudges, or an overlay position picker.** — *Prefer on-preview nudges when they earn it (e.g., a corner badge "back-left" tappable to change; a one-time hint per session when the position is unset), with the full guidance card in a pull-up drawer for deliberate users. Guided activities (squash) may open the drawer once automatically; casual ones never.*
5. **Overlays fade after t seconds and return on touch.** — *Agree — the universal video-player/camera pattern; t ≈ 3–4 s. Two exceptions must never fade: the REC/READY state indicator and the countdown. Fading must not apply during the few seconds before a scheduled start.*
6. **Capture is the default state; the app opens into it; other sections move below the capture screen.** — *Agree for participants. For the host, the same screen plus a floating start/stop control. "Below" as a scrollable stack (Footage, Editions, Crew) or as a bottom sheet are both candidates to score; the tabs bar should not compete with the viewfinder.*
7. **The preview resizes with session state: large while a session is live, small when the camera is off or the session has ended, letting review actions take prominence.** — *Strongly agree; this single mechanic resolves most of the O2/O3 tension. Transition should be the brand's motion moment (calm, ≤400 ms), and the small preview should still show the stage (e.g., "3 angles uploaded").*

**Zoom (founder question: allow it for host/participants?)** — *Recommend no for the first redesign.* Technical: the zoom constraint works on many Android phones but iOS Safari does not expose it, so it would be an inconsistent control; digital zoom via canvas costs quality and battery. Product: framing on a court is a placement problem, and the composition philosophy is fit-not-crop — zooming in loses the action the group came to capture. If it returns later: Android-only pinch-to-zoom, default 1×, never persisted across takes.

**Interaction with the streaming/consent model:** overlays should include a quiet "safe" indicator once the server has confirmed the take (the phone copy is then removed) — this is the moment participants stop worrying, and it deserves the celebration motion sparingly.
