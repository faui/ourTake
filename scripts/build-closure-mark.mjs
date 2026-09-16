// Round 03 — the closure mark. Single-master direction after end-customer QA
// of round 02 (2026-09-11). QA findings addressed:
//  - "Choose one unmistakable primary identity" → the 3-block closure mark is
//    the master everywhere; the woven f family is demoted to a display
//    flourish and archived on the round-02 board.
//  - "Kill the helmet/robot read" → corner radius 22 → 16 (the dome was the
//    culprit; verified by variant comparison), smaller 5-unit sprockets.
//  - "Make us/together show up in the first read" → the two base blocks carry
//    two sibling coral tints (two contributors, one shared film strip), and
//    the assembly motion shows the three pieces converging into the squircle.
//  - Locked from QA: unified palette (dark tokens for dark surfaces), no cyan
//    tips, champagne = gold + celebration-only, draw-on/assembly motion kept.
//
// Deterministic: regenerates docs/brand-exploration/round-03/ in full.
// QA gates: integer grid; alpha-channel mirror symmetry; square silhouette.
// Usage: node scripts/build-closure-mark.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'docs', 'brand-exploration', 'round-03');
mkdirSync(out, { recursive: true });

const INK = '#22252B';
const PAPER = '#FFF7EF';
const PANEL = '#15181A';

// Unified system tokens (light / dark surface), round-02 v7 + contributor tint.
const V_L = '#3B3BE6', V_D = '#8A8AF8';    // base brand violet-blue
const CO_L = '#EA531E', CO_D = '#FF6B35';  // creative-play coral (contributor 1)
const CO2_L = '#C8451A', CO2_D = '#FF8A5C'; // contributor-2 coral tint
const CY = '#00F2FE';                       // media utility (scoped)
const GOLD_A = '#F2CE68', GOLD_B = '#D9A63E';

// ------------------------------------------------------------------ geometry
// Squircle x14–86 / y14–86, corner r16. Strip y14–38; channels 10 (bar y38–48,
// stem x45–55); base blocks y48–86, widths 31/31. Sprockets 5×5 at y23.5.
const H = [[25, 23.5, 5], [35, 23.5, 5], [45, 23.5, 5], [55, 23.5, 5], [65, 23.5, 5], [75, 23.5, 5]];
const HM = [[28, 22, 8], [50, 22, 8], [72, 22, 8]];
const holes = (cells) => cells.map(([cx, y, s]) => `M${cx - s / 2} ${y}h${s}v${s}h${-s}Z`).join('');
const fills = (fill, cells) =>
  fill ? cells.map(([cx, y, s]) =>
    `<rect x="${cx - s / 2}" y="${y}" width="${s}" height="${s}" fill="${fill}" stroke="none"/>`).join('') : '';

// pieces separated so the board can animate them individually (class pc1/2/3)
const pieces = (v, c1, c2, cy, cells = H) => [
  `<path class="pc1" fill="${v}" fill-rule="evenodd" stroke="none" d="M14 38V30Q14 14 30 14H70Q86 14 86 30V38Z${holes(cells)}"/>` +
    (fills(cy, cells) ? `<g class="pc1">${fills(cy, cells)}</g>` : ''),
  `<path class="pc2" fill="${c1}" stroke="none" d="M14 48H45V86H30Q14 86 14 70Z"/>`,
  `<path class="pc3" fill="${c2}" stroke="none" d="M86 48H55V86H70Q86 86 86 70Z"/>`,
].join('');

const marks = {
  'closure-mark': { label: 'ourTake closure mark — master candidate', colors: [V_L, CO_L, CO2_L, CY], cells: H },
  'closure-mark-micro': { label: 'ourTake closure mark — micro (≤24 px)', colors: [V_L, CO_L, CO2_L, CY], cells: HM },
  'closure-mark-quiet': { label: 'closure mark — alternate: transparent sprockets', colors: [V_L, CO_L, CO2_L, null], cells: H },
};
const svgMark = (def, override = null, mono = false) => {
  const [v, c1, c2, cy] = mono
    ? ['currentColor', 'currentColor', 'currentColor', null]
    : override ?? def.colors;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${def.label}"${
    mono ? ` style="color:${INK}"` : ''}>${pieces(v, c1, c2, cy, def.cells)}</svg>`;
};

const files = {};
for (const [name, def] of Object.entries(marks)) {
  files[`${name}.svg`] = svgMark(def);
  files[`${name}-mono.svg`] = svgMark(def, null, true);
}
files['closure-mark-dark.svg'] = svgMark(marks['closure-mark'], [V_D, CO_D, CO2_D, CY]);
for (const [file, code] of Object.entries(files)) writeFileSync(join(out, file), code);

// --------------------------------------------------------------------- QA gates
{
  const coords = [...svgMark(marks['closure-mark']).matchAll(/d="([^"]+)"/g)]
    .flatMap((m) => m[1].match(/-?\d+(?:\.\d+)?/g));
  const off = coords.filter((c) => Number(c) % 0.5 !== 0);
  if (off.length) throw new Error(`off-grid coordinates: ${off.join(', ')}`);
  console.log('closure QA: all coordinates on the 0.5 grid.');
}
for (const name of ['closure-mark', 'closure-mark-micro']) {
  const img = await sharp(Buffer.from(svgMark(marks[name])), { density: 600 })
    .resize(512, 512).raw().ensureAlpha().toBuffer();
  let flagged = 0, minX = 512, maxX = -1, minY = 512, maxY = -1;
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const a = (y * 512 + x) * 4 + 3, b = (y * 512 + (511 - x)) * 4 + 3; // alpha only: tints differ by design
      if (Math.abs(img[a] - img[b]) > 64) flagged++;
      if (img[a] > 8) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  const w = maxX - minX + 1, h = maxY - minY + 1;
  if (flagged > 50) throw new Error(`${name}: shape asymmetry (${flagged} px)`);
  if (Math.abs(w - h) > 1) throw new Error(`${name}: silhouette not square (${w}x${h})`);
  console.log(`closure QA (${name}): shape mirror-symmetric (${flagged} AA px), silhouette ${w}x${h} (square).`);
}

// ------------------------------------------------------------ celebration demo
let seed = 7;
const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
const flute = (x0, x1) => {
  let circles = '';
  const step = (x1 - x0 - 4) / 5;
  for (let c = 0; c < 6; c++) {
    for (let i = 0; i < 9; i++) {
      const cx = (x0 + 2 + c * step + (rnd() - 0.5) * 2).toFixed(1);
      const cy0 = 52 + rnd() * 28;
      const hgt = Math.max(1, cy0 - (51 + rnd() * 2));
      const r = (i === 4 ? 0.85 + rnd() * 0.3 : 0.25 + rnd() * 0.45).toFixed(2);
      const wx = ((rnd() - 0.5) * 1.8).toFixed(1);
      circles += `<circle class="cb" cx="${cx}" cy="${cy0.toFixed(1)}" r="${r}" fill="url(#bubg)" stroke="none" style="--h:${hgt.toFixed(1)}px;--wx:${wx}px;--d:${(0.16 * hgt + 0.7).toFixed(2)}s;--dl:${(-rnd() * 5.2).toFixed(2)}s"/>`;
    }
  }
  return circles;
};
const celebration = `<svg class="mk" width="220" height="220" viewBox="0 0 100 100" role="img" aria-label="Celebration state: gold champagne in the base blocks">
<defs>
<clipPath id="c3L"><path d="M14 48H45V86H30Q14 86 14 70Z"/></clipPath>
<clipPath id="c3R"><path d="M86 48H55V86H70Q86 86 86 70Z"/></clipPath>
<radialGradient id="bubg" cx="0.35" cy="0.35" r="0.75">
<stop offset="0%" stop-color="#FFF9EA" stop-opacity="0.9"/><stop offset="45%" stop-color="#FFF9EA" stop-opacity="0.3"/>
<stop offset="80%" stop-color="#FFF9EA" stop-opacity="0.85"/><stop offset="100%" stop-color="#FFF9EA" stop-opacity="0"/>
</radialGradient>
<linearGradient id="liq3" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="${GOLD_A}" stop-opacity="0.55"/><stop offset="100%" stop-color="${GOLD_B}" stop-opacity="0.85"/>
</linearGradient>
</defs>
<path fill="${V_L}" fill-rule="evenodd" stroke="none" d="M14 38V30Q14 14 30 14H70Q86 14 86 30V38Z${holes(H)}"/>
${fills(CY, H)}
<g clip-path="url(#c3L)"><path d="M14 48H45V86H30Q14 86 14 70Z" fill="url(#liq3)" stroke="none"/>${flute(15, 44)}</g>
<g clip-path="url(#c3R)"><path d="M86 48H55V86H70Q86 86 86 70Z" fill="url(#liq3)" stroke="none"/>${flute(56, 85)}</g>
</svg>`;

// ---------------------------------------------------------------- board HTML
const inline = (name, size, override = null) =>
  svgMark(marks[name], override).replace('<svg ', `<svg class="mk" width="${size}" height="${size}" `);
const inlineMono = (name, size) =>
  svgMark(marks[name], null, true).replace('<svg ', `<svg class="mk" width="${size}" height="${size}" `);
const assembly = svgMark(marks['closure-mark'])
  .replace('<svg ', '<svg class="mk asm play" id="asm" width="220" height="220" ');

const html = `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ourTake — round 03: the closure mark</title>
<style>
  :root{color-scheme:light}
  body{margin:0;padding:32px 24px 64px;background:${PAPER};color:${INK};font:16px/1.55 system-ui,Segoe UI,Arial,sans-serif;max-width:1100px;margin-inline:auto}
  h1{font-size:1.5rem;margin:0 0 4px} h2{font-size:1.1rem;margin:0 0 2px}
  .sub,.thesis{color:#4a4239;max-width:66ch} .sub{margin:0 0 28px}
  .kicker{font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:#8a7f70}
  section{border-top:1px solid #e2d9cd;padding:24px 0 8px}
  .row{display:flex;gap:20px;flex-wrap:wrap;align-items:flex-end}
  figure{margin:0;text-align:center}
  figcaption{font-size:.75rem;color:#6b6257;margin-top:6px;max-width:230px}
  figure>svg{background:#fff;border:1px solid #e2d9cd;border-radius:12px;padding:10px}
  .dark>svg{background:${PANEL};border-color:${PANEL}}
  .sizes>svg{background:#fff;border:1px solid #e2d9cd;border-radius:6px;padding:4px;margin:0 4px;vertical-align:bottom}
  .notes{font-size:.9rem;color:#4a4239;max-width:72ch}
  table{border-collapse:collapse;font-size:.85rem}
  td,th{border:1px solid #e2d9cd;padding:5px 10px;text-align:left}
  .appicon{width:120px;height:120px;border-radius:28px;display:grid;place-items:center}
  .appicon.inkbg{background:${PANEL}} .appicon.lightbg{background:#fff;border:1px solid #e2d9cd}
  .card{background:#fff;border:1px solid #e2d9cd;border-radius:16px;padding:20px 22px;width:240px;text-align:center}
  .card .wm{font-weight:700} .card h3{font-size:1.05rem;margin:10px 0 2px}
  .card p{font-size:.8rem;color:#6b6257;margin:0 0 12px}
  .card .btn{display:inline-block;background:${V_L};color:#fff;border-radius:8px;padding:8px 18px;font-size:.85rem}
  button{font:inherit;font-size:.8rem;padding:6px 14px;border:1px solid #c8bda9;background:#fff;border-radius:8px;cursor:pointer}
  @media (prefers-reduced-motion:no-preference){
    .asm.play .pc1{animation:drop .55s cubic-bezier(.2,1.4,.4,1) both .1s}
    .asm.play .pc2{animation:inL .55s cubic-bezier(.2,1.4,.4,1) both .3s}
    .asm.play .pc3{animation:inR .55s cubic-bezier(.2,1.4,.4,1) both .45s}
    @keyframes drop{from{transform:translateY(-18px);opacity:0}to{transform:none;opacity:1}}
    @keyframes inL{from{transform:translate(-16px,10px);opacity:0}to{transform:none;opacity:1}}
    @keyframes inR{from{transform:translate(16px,10px);opacity:0}to{transform:none;opacity:1}}
    .cb{animation:rise var(--d) linear var(--dl) infinite}
    @keyframes rise{0%{transform:translate(0,0);opacity:0}10%{opacity:.95}55%{transform:translate(var(--wx),calc(var(--h) * -0.55))}90%{opacity:.7}100%{transform:translate(0,calc(var(--h) * -1));opacity:0}}
  }
</style>
<p class="kicker">ourTake · brand exploration · round 03 · 11 September 2026</p>
<h1>The closure mark — one identity</h1>
<p class="sub">Response to the end-customer QA of round 02: one master mark. Three pieces — a shared film strip and
two contributors — close into one squircle; the T is the space they make together. Corner radius squared (22 → 16)
to kill the helmet read; sibling coral tints carry plurality; the assembly motion carries togetherness.</p>

<section>
  <h2>The master</h2>
  <div class="row">
    <figure>${inline('closure-mark', 180)}<figcaption>light surfaces</figcaption></figure>
    <figure class="dark">${inline('closure-mark', 180, [V_D, CO_D, CO2_D, CY])}<figcaption>dark tokens on ink</figcaption></figure>
    <figure style="color:${INK}">${inlineMono('closure-mark', 180)}<figcaption>one color — sprockets stay holes</figcaption></figure>
    <figure class="sizes">${inline('closure-mark', 48)}${inline('closure-mark-micro', 24)}${inline('closure-mark-micro', 16)}<figcaption>48 / 24 / 16 px (micro ≤24)</figcaption></figure>
  </div>
  <p class="notes">QA-gated on every build: 0.5-unit grid, shape mirror-symmetry (alpha channel — the coral tints
  differ by design), square silhouette. Contributor tints: ${CO_L} + ${CO2_L} (both pass 3:1 on paper: 3.44 / 4.58).</p>
</section>

<section>
  <h2>Assembly — togetherness as motion</h2>
  <p class="thesis">The strip drops in, the two contributors slide in and click into place; the T appears only when
  all three arrive. For app launch, website hero, and loading states. Under reduced motion the assembled mark shows.</p>
  <div class="row">
    <figure><span id="asmWrap">${assembly}</span><figcaption><button onclick="replay()">replay assembly</button></figcaption></figure>
    <figure>${celebration}<figcaption>celebration state — gold, earned moments only</figcaption></figure>
  </div>
</section>

<section>
  <h2>Alternate under consideration</h2>
  <div class="row">
    <figure>${inline('closure-mark-quiet', 140)}<figcaption>quiet variant — transparent sprockets (if cyan still reads “robot lights” to viewers)</figcaption></figure>
  </div>
</section>

<section>
  <h2>Four surfaces — one mark everywhere</h2>
  <div class="row">
    <figure><div class="appicon inkbg">${inline('closure-mark-micro', 84, [V_D, CO_D, CO2_D, CY])}</div><figcaption>app icon — dark</figcaption></figure>
    <figure><div class="appicon lightbg">${inline('closure-mark-micro', 84)}</div><figcaption>app icon — light</figcaption></figure>
    <figure><div class="card">${inline('closure-mark', 64)}<div class="wm">ourTake</div><h3>Our afternoon.<br>Your angle, too.</h3><p>Add photos and videos together.</p><span class="btn">See the invitation</span></div><figcaption>invitation</figcaption></figure>
    <figure><div class="card" style="width:210px">${inline('closure-mark-micro', 24)} <span style="font-size:.8rem">Take 1 — The whole story</span></div><figcaption>composition attribution</figcaption></figure>
  </div>
</section>

<section>
  <h2>Decisions carried from round 02 QA</h2>
  <p class="notes">Locked: unified palette with light/dark tokens (violet ${V_L}/${V_D}, coral ${CO_L}/${CO_D}, cyan
  ${CY} scoped); no cyan tips; champagne = gold, celebration-only; draw-on/assembly motion kept, used at intentional
  moments. Demoted: the woven f family becomes a display flourish only (archived with full lineage on the round-02
  board) — customers meet ONE mark. Open: outside-viewer re-test (does the helmet stay dead? does plurality read?),
  wordmark + lockup, trademark screen (add film-badge and app-icon-grid classes), app-UI token migration.</p>
</section>

<script>
function replay(){const el=document.getElementById('asm');el.classList.remove('play');void el.offsetWidth;el.classList.add('play');}
</script>
`;
writeFileSync(join(out, 'index.html'), html);

// ------------------------------------------------------------- overview PNG
const bg = (code, color = PAPER) =>
  code.includes('style="')
    ? code.replace('style="', `style="background:${color};`)
    : code.replace('<svg ', `<svg style="background:${color}" `);
const big = (name, override = null, paper = PAPER, mono = false) =>
  sharp(Buffer.from(bg(svgMark(marks[name], override, mono), paper)), { density: 300 })
    .resize(280, 280).flatten({ background: paper }).png().toBuffer();
const px = async (name, size, scale) => {
  const buf = await sharp(Buffer.from(bg(svgMark(marks[name])))).resize(size, size).png().toBuffer();
  return sharp(buf).resize(size * scale, size * scale, { kernel: 'nearest' }).png().toBuffer();
};
const row1 = await Promise.all([
  big('closure-mark'), big('closure-mark', [V_D, CO_D, CO2_D, CY], PANEL),
  big('closure-mark', null, PAPER, true), big('closure-mark-quiet'),
]);
const row2 = await Promise.all([
  px('closure-mark', 48, 6), px('closure-mark-micro', 32, 8), px('closure-mark-micro', 24, 11), px('closure-mark-micro', 16, 17),
]);
await sharp({ create: { width: 40 + 4 * 300, height: 660, channels: 4, background: '#e8e2da' } })
  .composite([
    ...row1.map((input, i) => ({ input, left: 30 + i * 300, top: 30 })),
    ...row2.map((input, i) => ({ input, left: 30 + i * 300 + 4, top: 350 })),
  ])
  .png().toFile(join(out, 'overview.png'));

console.log(`round-03 written: ${Object.keys(files).length + 1} SVGs, index.html, overview.png`);
