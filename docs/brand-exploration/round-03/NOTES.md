# Round 03 — the closure mark

Date: 2026-09-11 · Author: Claude · Status: single master candidate, pre-validation. Round-01/02 untouched (full lineage archived there). Regenerates from `scripts/build-closure-mark.mjs`.

## Why round 03 exists

End-customer QA of round 02 (2026-09-11) delivered three fixes: (1) one unmistakable primary identity, not a line logo plus an app logo; (2) kill the helmet/robot first-read on the block mark; (3) get "us/together" — the brand's #1 tenet — into the first emotional read, using motion, since both round-02 marks read as object/letter, not group. It also **locked**: unified palette (dark tokens strongest for the icon), no cyan tips, champagne = gold + celebration-only, draw-on motion kept, block mark preferred at icon speed (the only "would tap").

## What round 03 does

**One master: the closure mark.** Three pieces — a shared film strip (violet, cyan sprocket punch-outs) and two contributor blocks (sibling coral tints `#EA531E` / `#C8451A`, both ≥3:1 on paper) — close into one squircle; the T is the space they make together.

- **Helmet killed structurally:** corner radius 22 → 16. Variant comparison proved the dome was the culprit (r22 with identical everything else brings the helmet back); sprockets reduced to 5-unit squares. A "quiet" alternate with transparent sprockets is kept in case cyan still reads as robot-lights to viewers.
- **Plurality in the static read:** the two coral tints make the base read as two related contributors rather than one object — the QA's "single object" critique addressed without breaking symmetry (QA gate now compares the alpha channel: shape symmetric, colors intentionally distinct; 0 flagged pixels, silhouette exactly square).
- **Togetherness as motion:** the assembly animation (strip drops, contributors slide in and click, the T appears only when all three arrive) is the brand gesture, for app launch / hero / loading. Gold champagne remains the earned celebration state. Reduced motion shows the assembled mark.
- **f demoted:** the woven family is a display flourish at most; customers meet one mark. Round-02 board remains its archive.

## Deliverables

`closure-mark.svg` (+ `-dark`, `-mono`, `-micro`, `-quiet`), board `index.html` (master, sizes 48/24/16, assembly + celebration motion, four surfaces with the mark everywhere, locked decisions), `overview.png`. Build gates: 0.5-grid coordinates, alpha-channel mirror symmetry, square silhouette.

## Open before production

Outside-viewer re-test with the round-02 QA prompt (does the helmet stay dead? does plurality read? T unprompted?); wordmark + lockup spec (the mark now needs its typographic partner); trademark screen (add film-badge and generic app-icon-grid classes); app-UI migration to the unified tokens; production icon ladder with hand-hinted 16/24/32 rasters.
