# Round 02 — strand studies: rationale, comparison, recommendation

Date: 2026-09-10 · v6 · Author: Claude · Status: exploratory candidates, not selections. Round-01 assets untouched; everything regenerates from `scripts/build-strand-studies.mjs`.

## Version history

v1 three families → v2 pairing (f full / d compact) → v3 bracket + ribbon + radiant palettes → v4 ribbon polish + tape top + champagne → v5 film-strip + single-path T + flute rebuild → **v6 (this)** grid-snapped ribbon + d's new 3-block direction.

## v6 changes and assessments

### f · ribbon — grid discipline (team review round 2)

**Honest finding first:** the reported defects (crooked bar, blue fragments, unequal gaps, uneven crop) are not present in the vector source — the bar is a constant-y horizontal, all strokes and both tube gaps were already uniform, and every cut was flat. What the reviewer saw is **raster aliasing**: thin parallel lines at non-integer screen scales produce apparent slant, wobbling weights, and edge fringing. The prescription is still correct, because grid discipline is what removes the aliasing conditions:

- **Every coordinate snapped to the integer grid** — enforced by an automated check in the build (it fails the build on any off-grid coordinate).
- **Stroke 3.5 → 4, tube gap 10** everywhere, both colors — thicker lines alias far less.
- **Uniform 2-unit transparent knockout** around the over-strand at every crossing (the requested "consistent transparent stroke" rule), all breaks landing on straight segments.
- The T remains one continuous outline path (v5), so junction welds are true 90° at uniform weight.

If any of the four defects is still visible in a fresh render at ≥256 px, that's a real bug and I want the screenshot.

### d · 3-block closure squircle — new direction (team spec, implemented verbatim)

Three solid blocks trace one uniform squircle (x14–86 / y14–86, r22): an **indigo film strip** (top, rounded top corners, straight bottom edge) with **six 6×6 teal square sprockets** (centered in the strip, 10-spacing, 9-unit protective margins), and **two mirrored coral base blocks** (straight top and inner edges, heavily rounded outer bottom corners). The transparent channels — horizontal end-to-end under the strip, vertical on the exact center line, both exactly **8 units** (10 in the micro) — form the floating negative-space T. Channels are 100% transparent; the canvas shows through (verified in the on-ink render). Mono works by construction (sprockets are true evenodd holes). Verified at 16 px.

**Design-lead observations to test with viewers (not objections):**
1. The full-width horizontal channel reads as a *separation line* more than a *T bar* — letterform strokes have ends; an edge-to-edge gap doesn't. The T read leans on the stem. If viewers miss the T, the fix is to stop the horizontal channel short of the silhouette edges (closing the bar's ends with thin block bridges).
2. This direction leaves the strand/weave DNA entirely — d is now solid geometry while f is woven line-work. As a *compact/app-icon* companion that's defensible (solid blocks rasterize best), but the pairing now spans two formal languages **and two palettes**; the system must converge deliberately, not by accident.
3. The silhouette flirts with "helmet/beetle" at a glance; the film strip + T carry the meaning. Another viewer question.

### Dynamic identity · champagne, adapted

The coral base blocks are now the flutes (liquid gradient, bubbles authored mid-rise, constant-speed rise, dissolve below the surface); the transparent stem channel's walls are the flute walls. Verified live: 36/36 bubbles' full travel inside the blocks, zero out-of-bounds.

### v6.1 — symmetry review (d)

Three reported issues (off-center vertical cut, off-center sprockets, vertical stretch) were audited objectively
before changing anything. Findings: the vertical channel is exactly centered on x=50 with the base blocks exact
mirrors (32/32; micro 31/31); the sprocket row is exactly centered (8-unit padding both sides; micro 10/10); the
silhouette rasterizes to a perfectly square bounding box (370×370 at 512²); and a pixel-level mirror comparison
flags only 12 of 262,144 pixels — sub-pixel anti-aliasing rounding along the two corner curves, in symmetric pairs.
The perceived asymmetries came from the contact sheet's 16 px nearest-neighbor pixel proofs, where rasterization
rounding is genuinely asymmetric by up to one pixel — a property of rasterizing any vector at 16 px, addressed in
production by hand-hinted raster icons, not by altering the master. Actions taken anyway: the mirror-comparison and
square-silhouette checks are now **permanent build gates** (the build fails on structural asymmetry), a degenerate
no-op segment in the micro strip path was cleaned, and the contact-sheet d proof now renders at 32 px where
symmetry is fairly visible.

### v6.2 — champagne density and color

Density evaluated and tripled per founder instinct: 18 → **54 bubbles per flute** (6 nucleation columns × 9;
mostly tiny 0.25–0.7 radii with occasional larger ones), which is what makes the flute read as champagne rather
than sparse fizz. Verified live: 216/216 bubbles' full travel inside their blocks, zero out-of-bounds.

On bubble color: **the champagne color belongs in the liquid, not the bubbles.** Physically, bubbles read as bright
refractions against the liquid; gold bubbles on gold liquid vanish. Bubbles are now a warm champagne-white
(`#FFF9EA`). Two liquid treatments are on the board: **A** brand coral (stays inside the strict digital system) and
**B** champagne gold (`#F2CE68 → #D9A63E`) — B is instantly, literally champagne; A reads closer to peach soda.
Recommendation: **B for celebration moments** (session complete, render delivered) with the gold treated as a
dynamic-layer-only accent that never enters the static mark; A if system purity outweighs the celebration read.
Founder decision.

### v7 — unified color system (adopted as the working system)

Team proposal accepted in substance: one three-role palette mapped identically across both marks — role 1
violet-blue = the container (d strip / f ring), role 2 coral = the take (d blocks / f T), role 3 cyan = media
utility (d sprockets / UI accents). Judgment applied to the proposed hexes after measuring WCAG 1.4.11:

| Role | Light-surface token | Dark-surface token | Why |
|---|---|---|---|
| 1 base brand | `#3B3BE6` (6.70 on paper ✓) | `#8A8AF8` (6.01 on ink ✓) | #3B3BE6 fails on ink (2.51) |
| 2 creative play | `#EA531E` (3.44 on paper ✓) | `#FF6B35` (6.29 on ink ✓) | proposed #FF6B35 fails on paper (2.67) |
| 3 media utility | `#00F2FE` — scoped | same | 5.12 inside violet ✓, 12.85 on ink ✓, 1.31 alone on paper ✗ |

Cyan in the ribbon: coloring the knockout gaps was **rejected** — gaps must stay 100% transparent or the weave
breaks on arbitrary surfaces. A cyan thread-end-tip option (caps on the T's two visible ends) is on the board for a
visual decision; if it reads as clutter, cyan lives in f's surroundings (buttons, live indicators). Dark-surface
masters shipped as `*-dark.svg`. Round-01 carried palette, violet/pink, and indigo/coral retained as history.
Remaining palette work: migrate the app UI (currently lime-on-ink) to these tokens in the MVP rebrand phase, and
clear the system in the trademark screen.

## Color state (superseded by v7 above — kept for history)

d now carries the strict digital system (indigo `#3B33C9`, teal `#18D6CF`, coral `#FF6B45`); f still wears the carried craft palette; the app UI is lime-on-ink. Contrast facts are on the board (teal-on-indigo governs the sprockets and passes). **One system must win across f + d + app.** Both directions are one-line changes in the build script.

## Scores (self-assessed; outside viewers pending)

| Mark | Score | Note |
|---|---:|---|
| d 3-block | **8–8.5** | Cleanest rasterization and most app-native d yet; T-bar-as-gap legibility and the two-languages drift are the open questions. |
| f (ribbon/solid/micro) | **8.5** | Geometry now provably disciplined (automated grid check); roundel adjacency still to screen. |
| e | 7 | Comparison baseline. |

## Gates still open

3–5 outside viewers (d: does the 3-block O close? T unprompted? helmet misread?; f: roundel, right-cap read); ONE color system across f + d + app UI; four-surface trial on devices; custom wordmark + lockup; trademark/domain screening (T-in-circle, OT/TO monograms, film-badge marks).

Board: `index.html` · Contact sheet: `overview.png` · Regenerate: `node scripts/build-strand-studies.mjs`.
