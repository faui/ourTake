# Audit 01 — Business Proposition, Problem Statement, Viability

Audit date: 2026-09-10 · Auditor: Claude (handoff audit) · Scope: `docs/COMPETITOR-AUDIT.md`, `docs/PRODUCT-DECISIONS-2026-09-09.md`, `docs/FOUNDER-RESPONSE.md`, `docs/JUGNU-REUSE-AUDIT.md`, `docs/CONTINUE-HERE.md`, `README.md`, `docs/reference/jugnu-eca42b4/*.md`. Read-only; no originals modified. This audits what the documents claim — no new market research was performed.

## 1. Stated problem and proposition

**Problem (as stated):** Groups in recurring adult physical activities (dance, squash, basketball, gym, jiu-jitsu, pickleball) generate video across multiple phones, but individuals cannot easily get useful personal review clips; the coordination burden (setup, monitoring, retrieval, payment) falls on someone other than the beneficiary, which suppresses adoption category-wide (`COMPETITOR-AUDIT.md` §5).

**Proposition:** A multi-phone collaborative capture service — session joined by QR/link, explicitly armed cameras, protected wide master, resumable uploads, FFmpeg compositions — whose differentiator is **personal retrieval from a collective practice record**, headlined by heart-rate-triggered moment selection: "show me the moments corresponding to my effort, across the group's cameras" (`PRODUCT-DECISIONS-2026-09-09.md` §2; `COMPETITOR-AUDIT.md` Decision). Adult-only. Native capture app eventually; browser pilot now.

**Business ambition (explicit and unusual):** Not venture-scale. The founder's success criterion is ~$100k/year operating surplus — ~42 accounts at $200/mo or ~84 at $100/mo, labeled "arithmetic scenarios, not forecasts" (`FOUNDER-RESPONSE.md` §1). A pivot from Jugnu, a wedding/event product reset in August (`JUGNU-REUSE-AUDIT.md`).

## 2. Quality of the analysis

**Problem statement: assumed, not validated.** Zero customer interviews, zero landing-page tests, zero willingness-to-pay evidence. The docs admit this repeatedly: "Interviews have not been performed and no outreach has been sent" (`COMPETITOR-AUDIT.md` §7); "No competitor hands-on recording, private customer interviews... were performed" (`CONTINUE-HERE.md` Research limits). The founder's network access (university trainer, jiu-jitsu instructor, squash/basketball/dance participants) is treated as removing *recruitment* risk, and the docs correctly do not claim it removes *demand* risk (`FOUNDER-RESPONSE.md` §1). But the HR-clip feature — the entire differentiation — was committed to MVP scope by founder fiat with no evidence anyone wants it; `PRODUCT-DECISIONS` §5 itself warns "Avoid letting the native rewrite delay learning about whether people actually want their effort-based clips."

**Competitor analysis: methodologically excellent, dangerously narrow.** `COMPETITOR-AUDIT.md` is genuinely rigorous on the two companies it covers: Meddly pricing ($0.06/source-camera-minute, $0.50/output-minute, 7-day upload expiry), SPORT.VIDEO funding (€800k round May 2016, register data, a verified €1,200 Slovak FA license), review forensics with deduplication and exclusion of SEO junk, and transparent labeled revenue scenarios rather than invented ARR. The "Evidence hygiene" section is better than most paid analyst reports. **But the competitive universe is two companies.** Absent entirely: Veo, Pixellot, Hudl, Trace, Balltime, and especially **SwingVision-class single-camera AI apps for racquet sports** — direct substitutes for the squash use case that eliminate the multi-phone coordination problem instead of managing it. Also absent: generic tools people actually use today (one phone on a tripod + free editor), which is the real incumbent. The audit refutes "no direct competitor exists" (`JUGNU-REUSE-AUDIT.md` Corrections) but never asks whether *simpler* solutions cap the price.

**Structural gaps (nothing in any doc):**
- **TAM/SAM/SOM:** no market sizing anywhere, even of the modest kind the $100k goal would need (how many adult recurring practice groups within reachable channels?).
- **Pricing model for ourTake itself:** competitor pricing is dissected; ourTake's own pricing is a $100–200/mo placeholder with no per-session/subscription/venue-license decision.
- **Buyer definition:** `COMPETITOR-AUDIT.md` §3 says "Venue/coach pays"; `FOUNDER-RESPONSE.md` §1 counts "customer accounts" without saying who they are. Never reconciled.
- **Unit economics:** `FOUNDER-RESPONSE.md` §3 concedes "Lower R&D cost alone cannot establish how cheaply you can serve an hour of uploaded video" — and then no doc models storage/compute/egress COGS per session. Vercel Hobby's non-commercial restriction is flagged (§11) but no costed alternative exists.
- **Go-to-market:** entirely the founder's personal contacts. No channel beyond "sell through the activity organizer."
- **Regulatory/privacy:** adult-only removes the minor-*account* problem, and the docs honestly note it doesn't stop minors/bystanders appearing in frame (`PRODUCT-DECISIONS` §3) — but there is no analysis of recording-consent law by jurisdiction (two-party consent states), GDPR special-category treatment of heart-rate/health data, wearable-platform ToS, or venue liability. "Launch-region review" is mentioned once and never assigned.

## 3. Startup viability

**Claims:** "Proceed with building and field validation" (`FOUNDER-RESPONSE.md` §12); room to compete exists but sync multi-phone capture "is already offered" (`COMPETITOR-AUDIT.md` Decision); category failure diagnosis is "distribution and workflow constraints," not technology (§5).

**Supporting evidence:** founder's recruited adult groups; near-zero cash burn (local FFmpeg worker, existing accounts); a real working local pilot (README "What works"); reusable Jugnu contracts and hard-won lessons; the deliberately modest lifestyle-business bar, which the docs correctly refuse to judge by venture criteria.

**Undermining evidence, mostly acknowledged in-doc:** the category's own history — Vyclone dead, Meddly at ~2 iOS ratings/100+ Android downloads after a year, SPORT.VIDEO a regional niche a decade and €800k+ after founding; the coordination-burden hypothesis applies to ourTake too; competitor "failure" is explicitly *not* established as marketing-only, so "we'll out-execute distribution" is unproven.

**Unaddressed risks:** (a) solo-founder support burden is named as the limiting factor (`FOUNDER-RESPONSE.md` §1) but never modeled — no support-minutes budget against the 42-account target; (b) HR-data acquisition UX: MVP is CSV import with manual clock alignment (`PRODUCT-DECISIONS` §2) — developer-grade friction for the flagship feature; Apple Watch needs the not-yet-started native app; (c) defensibility: HR-predicate selection is a feature Meddly or SPORT.VIDEO could copy in a quarter; the patent map (`FOUNDER-RESPONSE.md` §8) finds prior art, not a moat; (d) seasonality/churn of practice groups; (e) opportunity cost of founder time is named but never priced; (f) the P0 list (durable accounts, consent receipts, HR pipeline, clock mapping, venue templates) is a lot of build for a "three-month experiment."

## 4. Key product decisions and rationale

| Decision | Where | Rationale quality |
|---|---|---|
| Native capture, web join/view; phased transition gates | `PRODUCT-DECISIONS` §1 | Sound. Honest about OS lifecycle limits, no zero-cost RN transplant assumed, gates are measurable. |
| HR-triggered composition in MVP | `PRODUCT-DECISIONS` §2 (founder-committed) | Spec is exemplary (predicate semantics, +15% ≠ +15bpm, gap handling, privacy defaults). Business rationale is weakest: differentiator chosen before any demand signal. |
| Adults only; no minor accounts/pilots | `PRODUCT-DECISIONS` §3; `JUGNU-REUSE-AUDIT.md` | Sound risk reduction and internally consistent — but the docs never confront that youth sports is where this category's money historically is (SPORT.VIDEO's federations, Hudl). The market-shrinking cost of the decision is unpriced. |
| Pilot order: **dance first, squash second**, then basketball/gym/jiu-jitsu/pickleball | `FOUNDER-RESPONSE.md` §5 | Reasonable (bounded routine, fixed views), explicitly "not a claim about market size." Note: it is dance-first, not squash-first. |
| ourTake brand (10 Sep), one brand + ordinary nouns at launch | `PRODUCT-DECISIONS` §4 | Sensible; no clearance done, honestly stated. |
| Reuse Jugnu contracts, not code; exclude youth/CRM/show scope | `JUGNU-REUSE-AUDIT.md` | Sound and well-argued (incompatible dependencies, non-atomic upload handler). |

Internal consistency across docs is high — an unusual strength. Documents cross-correct each other (e.g., `JUGNU-REUSE-AUDIT.md` Corrections kills the "Vyclone's failure causes repealed" claim; `CONTINUE-HERE.md` fences off implementation truth from research claims).

## 5. Open questions and contradictions

1. **Who pays?** Venue/coach (`COMPETITOR-AUDIT` §3) vs. undefined "customer accounts" (`FOUNDER-RESPONSE` §1). This determines pricing, GTM, and whether 42 accounts is realistic. Unresolved.
2. **Scope drift toward minors:** `CONTINUE-HERE.md` mentions a "new birthday design request... parent-controlled creation" days after the adult-only commitment. Caveated, but it's the first crack in the boundary.
3. **Brand-noun tension:** `PRODUCT-DECISIONS` §4 recommends launching with ordinary nouns ("session," "clip"); `CONTINUE-HERE.md`/README reference BRAND-KIT "numbered composition names" — takeO-style artifact naming may have crept back in.
4. **Effort-clips vs. dance-first pilot:** the flagship HR feature maps naturally to sports; the first pilot is a dance routine where HR-triggered retrieval is least obviously the job. No doc reconciles this. (Note: the founder's stated next priority is now a squash-court field test, which partially resolves this in practice.)
5. **Repeatable benchmark promised, never scheduled:** the matched Meddly/SPORT.VIDEO/ourTake trial (`COMPETITOR-AUDIT` §7) is the single highest-value next step and has no owner or date.
6. **"Startup" framing vs. $100k surplus goal:** consistently handled, but a handoff reader should know venture-style analysis (moats, TAM) is deliberately absent by choice, not oversight — except the docs never say so explicitly.

## 6. Scored verdict

| Dimension | Score | Justification |
|---|---:|---|
| Problem statement | **4/10** | Coherent and network-informed, but 100% assumed — no interview, survey, or purchase signal exists; the differentiating job ("effort-based clips") was committed unvalidated. |
| Solution approach | **7/10** | Phased, honest, engineering-disciplined with measurable gates and strong consent/privacy design; docked for building the full HR pipeline ahead of any demand evidence and no costed serving model. |
| Competitive analysis | **7/10** | Best-in-class evidence hygiene and pricing/funding forensics on Meddly and SPORT.VIDEO — but a two-company universe that omits single-camera AI substitutes (SwingVision/Veo class) and the tripod-plus-free-editor incumbent. |
| Viability analysis | **4/10** | Candid about unknowns and rightly sized to a lifestyle-business bar, but no TAM, no own-pricing model, undefined buyer, no unit economics, no GTM beyond personal contacts, and no jurisdictional recording/health-data review. |

**Bottom line:** This is an unusually honest documentation set — its greatest business asset is that it almost never overclaims, and its greatest business liability is that nearly everything on the demand side remains a hypothesis. The engineering is ahead of the business: before the native build or further HR-pipeline work, the two cheapest de-risking moves already written down in these docs — the matched competitor trial (`COMPETITOR-AUDIT.md` §7) and paid repeat-session measurement with the founder's own groups — should be executed and dated.
