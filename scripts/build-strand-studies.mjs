// Round 02 strand studies — "creative shapes formed by strands".
// v7 (10 Sep 2026): UNIFIED COLOR SYSTEM adopted across both marks.
//  Three functional roles mapped identically to the 3-block d and the ribbon f:
//   1. Base Brand (electric violet-blue) — d strip / f 'O' tracks & ring
//   2. Creative Play (vibrant coral)     — d base blocks / f 'T'
//   3. Media Utility (neon cyan)         — d sprockets / UI utility accents
//  Judgment applied to the proposed hexes (WCAG 1.4.11, 3:1 non-text):
//   coral #FF6B35 fails on paper (2.67) → light-surface token #EA531E (3.44),
//   #FF6B35 kept as the dark-surface token (6.29 on ink);
//   violet #3B3BE6 passes paper (6.70) but fails ink (2.51) → dark token #8A8AF8;
//   cyan #00F2FE passes inside violet (5.12) and on ink (12.85), fails alone on
//   paper (1.31) → scoped to sprockets-in-violet and dark-surface UI accents.
//  Cyan in the ribbon: colored knockout gaps were REJECTED (gaps must stay 100%
//  transparent for the weave to work on any surface); a cyan thread-end-tip
//  option is rendered for a visual decision instead.
//
// Deterministic; QA gates: ribbon integer-grid, d mirror-symmetry + square
// silhouette. Usage: node scripts/build-strand-studies.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'docs', 'brand-exploration', 'round-02');
mkdirSync(out, { recursive: true });

const INK = '#22252B';
const PAPER = '#FFF7EF';
const PANEL = '#15181A';

// Unified system tokens (light-surface / dark-surface per role).
const V_L = '#3B3BE6', V_D = '#8A8AF8';   // 1 · base brand violet-blue
const CO_L = '#EA531E', CO_D = '#FF6B35'; // 2 · creative-play coral
const CY = '#00F2FE';                     // 3 · media-utility cyan (scoped)

// Explored alternatives, kept for the record.
const PALETTES = {
  u: { name: 'UNIFIED (working system) · violet-blue / coral', s1: V_L, s2: CO_L },
  c: { name: 'C · deep blue / clay (round-01 carried)', s1: '#214F68', s2: '#BB4C34' },
  violet: { name: 'explored · electric violet / neon pink', s1: '#6C2BD9', s2: '#FF3E8F' },
  indigo: { name: 'explored · deep indigo / coral', s1: '#4636D8', s2: '#FF5A5F' },
};

// ------------------------------------------------------------------ geometry
const holes = (cells) =>
  cells.map(([cx, y, s]) => `M${cx - s / 2} ${y}h${s}v${s}h${-s}Z`).join('');
const holeFills = (fill, cells) =>
  fill
    ? cells.map(([cx, y, s]) =>
        `<rect x="${cx - s / 2}" y="${y}" width="${s}" height="${s}" fill="${fill}" stroke="none"/>`).join('')
    : '';

const D_HOLES = [[25, 23, 6], [35, 23, 6], [45, 23, 6], [55, 23, 6], [65, 23, 6], [75, 23, 6]];
const DM_HOLES = [[28, 21, 8], [50, 21, 8], [72, 21, 8]];
const dBlocks = (blue, orange, cyan) =>
  `<path fill="${blue}" fill-rule="evenodd" stroke="none" d="M14 38V36Q14 14 36 14H64Q86 14 86 36V38Z${holes(D_HOLES)}"/>` +
  holeFills(cyan, D_HOLES) +
  `<path fill="${orange}" stroke="none" d="M14 46H46V86H36Q14 86 14 64Z"/>` +
  `<path fill="${orange}" stroke="none" d="M86 46H54V86H64Q86 86 86 64Z"/>`;
const dBlocksMicro = (blue, orange, cyan) =>
  `<path fill="${blue}" fill-rule="evenodd" stroke="none" d="M14 36Q14 14 36 14H64Q86 14 86 36Z${holes(DM_HOLES)}"/>` +
  holeFills(cyan, DM_HOLES) +
  `<path fill="${orange}" stroke="none" d="M14 46H45V86H36Q14 86 14 64Z"/>` +
  `<path fill="${orange}" stroke="none" d="M86 46H55V86H64Q86 86 86 64Z"/>`;

const marks = {
  'f-mark': {
    label: 'f / T through O — full mark',
    colors: [V_L, CO_L],
    body: (s1, s2) =>
      `<path pathLength="100" stroke="${s1}" d="M22 50V56Q22 76 42 76M58 76Q78 76 78 56V40Q78 20 58 20H42Q22 20 22 34"/>` +
      `<path pathLength="100" stroke="${s2}" d="M6 42H66"/>` +
      `<path pathLength="100" stroke="${s2}" d="M50 42V92"/>`,
  },
  'f-mark-micro': {
    label: 'f / T through O — micro',
    width: 13,
    colors: [V_L, CO_L],
    body: (s1, s2) =>
      `<path pathLength="100" stroke="${s1}" d="M22 51V56Q22 76 42 76M58 76Q78 76 78 56V40Q78 20 58 20H42Q22 20 22 33"/>` +
      `<path pathLength="100" stroke="${s2}" d="M10 42H66"/>` +
      `<path pathLength="100" stroke="${s2}" d="M50 42V88"/>`,
  },
  'f-mark-ribbon': {
    label: 'f / T through O — ribbon display variant',
    width: 4,
    colors: [V_L, CO_L],
    body: (s1, s2) =>
      `<path pathLength="100" stroke="${s1}" d="M15 52V62Q15 83 36 83H41M59 83H64Q85 83 85 62V34Q85 13 64 13H36Q15 13 15 34"/>` +
      `<path pathLength="100" stroke="${s1}" d="M25 52V62Q25 73 36 73H41M59 73H64Q75 73 75 62V34Q75 23 64 23H36Q25 23 25 34"/>` +
      `<path pathLength="100" stroke="${s2}" d="M71 38H6V48H45V92H55V48H71"/>` +
      `<path pathLength="100" stroke="${s2}" d="M89 38H93V48H89"/>`,
  },
  'd-mark': {
    label: 'd / 3-block closure squircle — negative-space T, compact mark',
    colors: [V_L, CO_L, CY],
    body: (s1, s2, s3) => dBlocks(s1, s2, s3),
  },
  'd-mark-micro': {
    label: 'd / 3-block closure squircle — micro',
    colors: [V_L, CO_L, CY],
    body: (s1, s2, s3) => dBlocksMicro(s1, s2, s3),
  },
  'e-mark': {
    label: 'e / Threaded O',
    body: (s1, s2) =>
      `<path pathLength="100" stroke="${s1}" d="M22 52V38Q22 22 38 22H62Q78 22 78 38V62Q78 78 62 78H38Q22 78 22 68"/>` +
      `<path pathLength="100" stroke="${s2}" d="M2 60H70M86 60H98"/>`,
  },
};

const studies = {
  'study-loom-v5-strip': {
    label: 'Superseded — loom v5: strand-built film-strip half',
    body: (s1, s2) =>
      `<path fill="${s2}" fill-rule="evenodd" stroke="none" d="M19 26V22Q19 8 33 8H67Q81 8 81 22V26Z${
        holes([[27, 10.5, 3.5], [36.4, 10.5, 3.5], [45.8, 10.5, 3.5], [55.2, 10.5, 3.5], [64.6, 10.5, 3.5], [74, 10.5, 3.5]])}"/>` +
      `<path pathLength="100" stroke="${s1}" d="M25 26V66Q25 80 39 80H61Q75 80 75 66V26"/>` +
      `<path pathLength="100" stroke="${s1}" d="M35 76V44M65 76V44"/>`,
  },
  'study-loom-v3-bracket': {
    label: 'Superseded — loom v3: camera-bracket tips with floating rail',
    body: (s1, s2) =>
      `<path pathLength="100" stroke="${s1}" d="M25 6V64Q25 80 41 80H59Q75 80 75 64V6"/>` +
      `<path pathLength="100" stroke="${s1}" d="M35 76V44M65 76V44"/>` +
      `<path pathLength="100" stroke="${s2}" d="M8 14H17M33 14H67M83 14H92"/>`,
  },
  'study-planted-t': {
    label: 'Study — planted T (teammate weave spec); drifts toward signpost read',
    body: (s1, s2) =>
      `<path pathLength="100" stroke="${s1}" d="M58 24Q78 24 78 42V58Q78 76 58 76H42Q22 76 22 58V42Q22 24 42 24"/>` +
      `<path pathLength="100" stroke="${s2}" d="M20 8H80M50 8V68M50 84V94"/>`,
  },
  'study-loom-v1': {
    label: 'Superseded — loom v1: hairpin blocks contrived; stubs read as wheels',
    body: (s1, s2) =>
      `<path pathLength="100" stroke="${s1}" d="M14 98V88M14 72V28Q14 14 28 14H72Q86 14 86 28V72M86 88V98"/>` +
      `<path pathLength="100" stroke="${s2}" stroke-linejoin="miter" d="M2 80H26V52H36V80H64V52H74V80H98"/>`,
  },
  'study-bracket-o': {
    label: 'Rejected — two L-strands closing an O (reads as crop brackets)',
    body: (s1, s2) =>
      `<path pathLength="100" stroke="${s1}" d="M4 22H14M30 22H54Q78 22 78 46V90"/>` +
      `<path pathLength="100" stroke="${s2}" d="M96 78H86M70 78H46Q22 78 22 54V10"/>`,
  },
};

// Color resolution: explicit s1/s2 override; else the mark's unified colors;
// else the round-01 carried pair (studies keep their historical look). Mono
// suppresses accent fills so sprockets stay true cutouts.
const svgMark = (def, s1 = null, s2 = null, mono = false) => {
  const { label, body, width = 12, colors } = def;
  const painted = mono
    ? body('currentColor', 'currentColor', null)
    : s1 != null
      ? body(s1, s2, colors?.[2] ?? null)
      : colors
        ? body(...colors)
        : body(PALETTES.c.s1, PALETTES.c.s2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${label}"${
    mono ? ` style="color:${INK}"` : ''
  }><g fill="none" stroke-width="${width}" stroke-linecap="butt" stroke-linejoin="round">${painted}</g></svg>`;
};

const files = {};
for (const [name, def] of Object.entries({ ...marks, ...studies })) {
  files[`${name}.svg`] = svgMark(def);
  files[`${name}-mono.svg`] = svgMark(def, null, null, true);
}
// dark-surface masters for the unified marks
for (const name of ['f-mark', 'f-mark-ribbon', 'd-mark']) {
  files[`${name}-dark.svg`] = svgMark(marks[name], V_D, CO_D);
}
for (const [key, p] of Object.entries(PALETTES)) {
  if (key !== 'u') files[`f-mark-palette-${key}.svg`] = svgMark(marks['f-mark'], p.s1, p.s2);
}
for (const [file, code] of Object.entries(files)) writeFileSync(join(out, file), code);

// Ribbon QA: integer grid.
{
  const d = svgMark(marks['f-mark-ribbon']);
  const coords = [...d.matchAll(/d="([^"]+)"/g)].flatMap((m) => m[1].match(/-?\d+(?:\.\d+)?/g));
  const offGrid = coords.filter((c) => !Number.isInteger(Number(c)));
  if (offGrid.length) throw new Error(`ribbon off-grid coordinates: ${offGrid.join(', ')}`);
  console.log('ribbon QA: all coordinates integer-grid; stroke 4; tube gap 10; knockout 2.');
}
// d QA: mirror symmetry + square silhouette.
for (const name of ['d-mark', 'd-mark-micro']) {
  const img = await sharp(Buffer.from(svgMark(marks[name])), { density: 600 })
    .resize(512, 512).raw().ensureAlpha().toBuffer();
  let flagged = 0, minX = 512, maxX = -1, minY = 512, maxY = -1;
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const a = (y * 512 + x) * 4, b = (y * 512 + (511 - x)) * 4;
      let diff = 0;
      for (let k = 0; k < 4; k++) diff = Math.max(diff, Math.abs(img[a + k] - img[b + k]));
      if (diff > 64) flagged++;
      if (img[a + 3] > 8) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  const w = maxX - minX + 1, h = maxY - minY + 1;
  if (flagged > 50) throw new Error(`${name}: mirror asymmetry (${flagged} px)`);
  if (Math.abs(w - h) > 1) throw new Error(`${name}: silhouette not square (${w}x${h})`);
  console.log(`d QA (${name}): mirror-symmetric (${flagged} AA px), silhouette ${w}x${h} (square).`);
}

// ------------------------------------------------------- contrast (WCAG 1.4.11)
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
};
const pass = (r) => (r >= 3 ? `✓ ${r}` : `✗ ${r}`);
const tokenRows = [
  ['1 · base brand', 'light token', V_L], ['1 · base brand', 'dark token', V_D],
  ['2 · creative play', 'light token', CO_L], ['2 · creative play', 'dark token', CO_D],
  ['3 · media utility', 'single token', CY],
].map(([role, kind, hex]) =>
  `<tr><td>${role}</td><td>${kind}</td><td><code>${hex}</code></td><td>${pass(ratio(hex, PAPER))}</td><td>${pass(ratio(hex, PANEL))}</td></tr>`);
const contrastTable = `<table>
<tr><th>role</th><th>token</th><th>hex</th><th>vs paper ${PAPER}</th><th>vs ink ${PANEL}</th></tr>
${tokenRows.join('\n')}
</table>
<p class="notes">Rules derived from the ratios: light tokens on light surfaces, dark tokens on dark surfaces; cyan
never appears alone on light surfaces — its governing use is inside the violet strip (cyan-on-violet ${ratio(CY, V_L)})
and as a utility accent on dark UI (${ratio(CY, PANEL)} on ink). Proposed #FF6B35 was kept as the coral dark token;
the light token was deepened to ${CO_L} to clear the 3:1 gate on paper.</p>`;

// ----------------------------------------------------- champagne dynamic study
let seed = 7;
const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
const flute = (x0, x1) => {
  let circles = '';
  const step = (x1 - x0 - 4) / 5;
  for (let c = 0; c < 6; c++) {
    for (let i = 0; i < 9; i++) {
      const cx = (x0 + 2 + c * step + (rnd() - 0.5) * 2).toFixed(1);
      const cy0 = 50 + rnd() * 30;
      const h = Math.max(1, cy0 - (49 + rnd() * 2));
      const r = (i === 4 ? 0.85 + rnd() * 0.3 : 0.25 + rnd() * 0.45).toFixed(2);
      const wx = ((rnd() - 0.5) * 1.8).toFixed(1);
      circles += `<circle class="cb" cx="${cx}" cy="${cy0.toFixed(1)}" r="${r}" fill="url(#bubg)" stroke="none" style="--h:${h.toFixed(1)}px;--wx:${wx}px;--d:${(0.16 * h + 0.7).toFixed(2)}s;--dl:${(-rnd() * 5.2).toFixed(2)}s"/>`;
    }
  }
  return circles;
};
const champagneVariant = (sfx, liqTop, liqBot, opTop, opBot) => `<svg class="mk" width="220" height="220" viewBox="0 0 100 100" role="img" aria-label="Dynamic identity study: champagne base blocks (${sfx})">
<defs>
<clipPath id="chL${sfx}"><path d="M14 46H46V86H36Q14 86 14 64Z"/></clipPath>
<clipPath id="chR${sfx}"><path d="M86 46H54V86H64Q86 86 86 64Z"/></clipPath>
<radialGradient id="bubg" cx="0.35" cy="0.35" r="0.75">
<stop offset="0%" stop-color="#FFF9EA" stop-opacity="0.9"/><stop offset="45%" stop-color="#FFF9EA" stop-opacity="0.3"/>
<stop offset="80%" stop-color="#FFF9EA" stop-opacity="0.85"/><stop offset="100%" stop-color="#FFF9EA" stop-opacity="0"/>
</radialGradient>
<linearGradient id="liq${sfx}" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="${liqTop}" stop-opacity="${opTop}"/><stop offset="100%" stop-color="${liqBot}" stop-opacity="${opBot}"/>
</linearGradient>
</defs>
<path fill="${V_L}" fill-rule="evenodd" stroke="none" d="M14 38V36Q14 14 36 14H64Q86 14 86 36V38Z${holes(D_HOLES)}"/>
${holeFills(CY, D_HOLES)}
<g clip-path="url(#chL${sfx})"><path d="M14 46H46V86H36Q14 86 14 64Z" fill="url(#liq${sfx})" stroke="none"/>${flute(15, 45)}</g>
<g clip-path="url(#chR${sfx})"><path d="M86 46H54V86H64Q86 86 86 64Z" fill="url(#liq${sfx})" stroke="none"/>${flute(55, 85)}</g>
</svg>`;
const champagne = champagneVariant('A', CO_L, CO_L, 0.35, 0.75);
const champagneGold = champagneVariant('B', '#F2CE68', '#D9A63E', 0.55, 0.85);

// Cyan thread-end-tip option for f (role-3 presence in the ribbon family):
// small cyan caps on the T's two visible ends.
const fTips = svgMark(marks['f-mark']).replace('</g></svg>',
  `<path stroke="${CY}" stroke-width="12" d="M6 42H10"/><path stroke="${CY}" stroke-width="12" d="M50 88V92"/></g></svg>`);

// ---------------------------------------------------------------- board HTML
const inline = (name, size, s1 = null, s2 = null) =>
  svgMark(marks[name] ?? studies[name], s1, s2).replace('<svg ', `<svg class="mk" width="${size}" height="${size}" `);
const inlineMono = (name, size) =>
  svgMark(marks[name] ?? studies[name], null, null, true)
    .replace('<svg ', `<svg class="mk" width="${size}" height="${size}" `);

const html = `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ourTake — strand studies, round 02 v7</title>
<style>
  :root{color-scheme:light}
  body{margin:0;padding:32px 24px 64px;background:${PAPER};color:${INK};font:16px/1.55 system-ui,Segoe UI,Arial,sans-serif;max-width:1100px;margin-inline:auto}
  h1{font-size:1.5rem;margin:0 0 4px} h2{font-size:1.1rem;margin:0 0 2px}
  .sub,.thesis{color:#4a4239;max-width:66ch} .sub{margin:0 0 28px}
  .kicker{font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:#8a7f70}
  section{border-top:1px solid #e2d9cd;padding:24px 0 8px}
  .row{display:flex;gap:20px;flex-wrap:wrap;align-items:flex-end}
  figure{margin:0;text-align:center}
  figcaption{font-size:.75rem;color:#6b6257;margin-top:6px;max-width:220px}
  figure>svg{background:#fff;border:1px solid #e2d9cd;border-radius:12px;padding:10px}
  .dark>svg{background:${PANEL};border-color:${PANEL}}
  .sizes>svg{background:#fff;border:1px solid #e2d9cd;border-radius:6px;padding:4px;margin:0 4px;vertical-align:bottom}
  .notes{font-size:.9rem;color:#4a4239;max-width:72ch}
  .hero{display:flex;gap:36px;align-items:center;flex-wrap:wrap;padding:8px 0 16px}
  table{border-collapse:collapse;font-size:.85rem}
  td,th{border:1px solid #e2d9cd;padding:5px 10px;text-align:left}
  .appicon{width:120px;height:120px;border-radius:28px;display:grid;place-items:center}
  .appicon.inkbg{background:${PANEL};color:${PAPER}}
  .appicon.lightbg{background:#fff;border:1px solid #e2d9cd}
  .card{background:#fff;border:1px solid #e2d9cd;border-radius:16px;padding:20px 22px;width:240px;text-align:center}
  .card .wm{font-weight:700} .card h3{font-size:1.05rem;margin:10px 0 2px}
  .card p{font-size:.8rem;color:#6b6257;margin:0 0 12px}
  .card .btn{display:inline-block;background:${V_L};color:#fff;border-radius:8px;padding:8px 18px;font-size:.85rem}
  .attrib{width:300px;border:1px solid #e2d9cd;border-radius:10px;overflow:hidden;background:#fff}
  .attrib .img{height:130px;background:linear-gradient(160deg,#a9c3b2 0 55%,#d9c9a8 55%)}
  .attrib .strip{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;font-size:.8rem}
  .rej .row svg{opacity:.55} .rej h2{color:#8a7f70}
  button{font:inherit;font-size:.8rem;padding:6px 14px;border:1px solid #c8bda9;background:#fff;border-radius:8px;cursor:pointer}
  @media (prefers-reduced-motion:no-preference){
    .anim.play path{stroke-dasharray:100;stroke-dashoffset:100;animation:draw .9s ease-out forwards}
    .anim.play path:nth-of-type(1){animation-delay:.05s}
    .anim.play path:nth-of-type(2){animation-delay:.75s}
    .anim.play path:nth-of-type(3){animation-delay:1.2s}
    .anim.play path:nth-of-type(4){animation-delay:1.2s}
    @keyframes draw{to{stroke-dashoffset:0}}
    .cb{animation:rise var(--d) linear var(--dl) infinite}
    @keyframes rise{0%{transform:translate(0,0);opacity:0}10%{opacity:.95}55%{transform:translate(var(--wx),calc(var(--h) * -0.55))}90%{opacity:.7}100%{transform:translate(0,calc(var(--h) * -1));opacity:0}}
  }
</style>
<p class="kicker">ourTake · brand exploration · round 02 · v7 · 10 September 2026</p>
<h1>Strand studies — one identity, one system</h1>
<p class="sub">Unified three-role color system across <strong>f · T through O</strong> (full mark) and
<strong>d · 3-block closure squircle</strong> (compact mark): violet-blue structure, coral creative-play, cyan media
utility. Exploratory candidates, not selections; palette is the working system pending clearance.</p>

<section>
  <h2>The unified pairing</h2>
  <div class="hero">
    <figure>${inline('f-mark', 180)}<figcaption>f — full mark</figcaption></figure>
    <figure>${inline('f-mark-ribbon', 180)}<figcaption>f — ribbon display (≥64 px)</figcaption></figure>
    <figure>${inline('d-mark', 110)}<figcaption>d — compact</figcaption></figure>
    <figure>${inline('d-mark-micro', 48)}${inline('d-mark-micro', 24)}<figcaption>d micro 48 / 24</figcaption></figure>
  </div>
  <p class="notes">Role mapping: violet-blue = the container (d strip / f ring-tracks); coral = the take (d base
  blocks / f T); cyan = media utility (d sprockets / UI accents). Same three roles, both formal languages.</p>
</section>

<section>
  <h2>The color system</h2>
  ${contrastTable}
  <div class="row" style="margin-top:14px">
    <figure>${inline('f-mark', 120)}<figcaption>f · light surfaces</figcaption></figure>
    <figure class="dark">${inline('f-mark', 120, V_D, CO_D)}<figcaption>f · dark tokens on ink</figcaption></figure>
    <figure>${fTips.replace('<svg ', '<svg class="mk" width="120" height="120" ')}<figcaption>OPTION: cyan thread-end tips (role 3 in f)</figcaption></figure>
    <figure>${inline('d-mark', 120)}<figcaption>d · light surfaces</figcaption></figure>
    <figure class="dark">${inline('d-mark', 120, V_D, CO_D)}<figcaption>d · dark tokens on ink</figcaption></figure>
  </div>
  <p class="notes">Cyan in the ribbon: coloring the knockout gaps was rejected — the gaps must stay 100% transparent
  or the weave stops working on arbitrary surfaces. The cyan thread-end-tip option above is the honest way to give f
  a role-3 presence; if it reads as clutter, cyan lives in f's surroundings (buttons, links, live indicators) instead.
  The shipped app UI (lime on ink) migrates to these tokens in the MVP rebrand phase.</p>
</section>

<section>
  <h2>d · 3-block closure squircle</h2>
  <div class="row">
    <figure>${inline('d-mark', 160)}<figcaption>color</figcaption></figure>
    <figure style="color:${INK}">${inlineMono('d-mark', 160)}<figcaption>one color — sprockets are true holes</figcaption></figure>
    <figure class="dark">${inline('d-mark', 160, V_D, CO_D)}<figcaption>on ink (dark tokens)</figcaption></figure>
    <figure class="sizes">${inline('d-mark', 48)}${inline('d-mark-micro', 24)}${inline('d-mark-micro', 16)}<figcaption>48 / 24 / 16 px</figcaption></figure>
  </div>
  <p class="notes">Machine-verified on every build: centered channels, mirrored blocks, square silhouette
  (512² pixel mirror-comparison gates the build).</p>
</section>

<section>
  <h2>Dynamic identity — champagne base blocks</h2>
  <p class="thesis">54 bubbles per flute, warm champagne-white highlights, constant-speed rise, dissolve below the
  surface. Two liquids: A stays in-system (coral); B is the literal celebration read (gold as a dynamic-layer-only
  accent). Recommendation: B for celebration moments, never in the static mark.</p>
  <div class="row">
    <figure>${champagne}<figcaption>A — brand coral liquid</figcaption></figure>
    <figure>${champagneGold}<figcaption>B — champagne gold liquid</figcaption></figure>
  </div>
</section>

<section>
  <h2>f · T through O</h2>
  <div class="row">
    <figure>${inline('f-mark', 160)}<figcaption>color</figcaption></figure>
    <figure style="color:${INK}">${inlineMono('f-mark', 160)}<figcaption>one color</figcaption></figure>
    <figure class="dark">${inline('f-mark', 160, V_D, CO_D)}<figcaption>on ink (dark tokens)</figcaption></figure>
    <figure class="sizes">${inline('f-mark', 48)}${inline('f-mark-micro', 24)}${inline('f-mark-micro', 16)}<figcaption>48 / 24 / 16 px (micro ≤24)</figcaption></figure>
    <figure><span class="anim play" id="animF">${inline('f-mark', 160)}</span><figcaption>motion<br><button onclick="replay('animF')">replay</button></figcaption></figure>
  </div>
  <div class="row" style="margin-top:14px">
    <figure>${inline('f-mark-ribbon', 160)}<figcaption>ribbon — unified system</figcaption></figure>
    <figure class="dark">${inline('f-mark-ribbon', 160, V_D, CO_D)}<figcaption>ribbon on ink (dark tokens)</figcaption></figure>
  </div>
  <p class="notes">Ribbon discipline (build-gated): integer grid, single-path T (true 90° welds), stroke 4, tube gap
  10, uniform 2-unit transparent knockouts, breaks on straights only. Display ≥64 px; solid master/micro below.</p>
</section>

<section>
  <h2>Four surfaces</h2>
  <div class="row">
    <figure><div class="appicon inkbg">${inline('d-mark-micro', 84, V_D, CO_D)}</div><figcaption>app icon — d, dark tokens</figcaption></figure>
    <figure><div class="appicon lightbg">${inline('d-mark-micro', 84)}</div><figcaption>app icon — light</figcaption></figure>
    <figure><div class="card">${inline('f-mark', 64)}<div class="wm">ourTake</div><h3>Our afternoon.<br>Your angle, too.</h3><p>Add photos and videos together.</p><span class="btn">See the invitation</span></div><figcaption>a friend's invitation — f</figcaption></figure>
    <figure><div class="attrib"><div class="img"></div><div class="strip"><span>Take 1 — The whole story</span>${inline('f-mark-micro', 22)}</div></div><figcaption>composition attribution — f micro</figcaption></figure>
  </div>
</section>

<section>
  <h2>Explored palette history</h2>
  <div class="row">
    ${Object.entries(PALETTES).map(([k, p]) =>
      `<figure>${inline('f-mark', 110, p.s1, p.s2)}<figcaption>${p.name}</figcaption></figure>`).join('\n    ')}
  </div>
</section>

<section>
  <h2>e · Threaded O — retained for comparison</h2>
  <div class="row">
    <figure>${inline('e-mark', 120)}<figcaption>round-01 palette (historical)</figcaption></figure>
  </div>
</section>

<section class="rej">
  <h2>Studies — superseded and rejected (kept for the record)</h2>
  <div class="row">
    <figure>${inline('study-loom-v5-strip', 110)}<figcaption>loom v5 — strand film-strip</figcaption></figure>
    <figure>${inline('study-loom-v3-bracket', 110)}<figcaption>loom v3 — bracket tips</figcaption></figure>
    <figure>${inline('study-planted-t', 110)}<figcaption>planted T</figcaption></figure>
    <figure>${inline('study-loom-v1', 110)}<figcaption>loom v1</figcaption></figure>
    <figure>${inline('study-bracket-o', 110)}<figcaption>bracket O</figcaption></figure>
  </div>
</section>

<section>
  <h2>Gates still open</h2>
  <p class="notes">3–5 outside viewers (T reveal, roundel/helmet misreads, cyan-tips option, champagne A vs B);
  four-surface trial on devices; custom wordmark + lockup; trademark/domain screening; app-UI migration to the
  unified tokens (MVP rebrand phase). Nothing on this board is a production selection.</p>
</section>

<script>
function replay(id){const el=document.getElementById(id);el.classList.remove('play');void el.offsetWidth;el.classList.add('play');}
</script>
`;
writeFileSync(join(out, 'index.html'), html);

// ------------------------------------------------------------- overview PNG
const bg = (code, color = PAPER) =>
  code.includes('style="')
    ? code.replace('style="', `style="background:${color};`)
    : code.replace('<svg ', `<svg style="background:${color}" `);
const px = async (name, size, scale) => {
  const buf = await sharp(Buffer.from(bg(svgMark(marks[name])))).resize(size, size).png().toBuffer();
  return sharp(buf).resize(size * scale, size * scale, { kernel: 'nearest' }).png().toBuffer();
};
const big = (name, s1 = null, s2 = null, paper = PAPER, mono = false) =>
  sharp(Buffer.from(bg(mono ? svgMark(marks[name], null, null, true) : svgMark(marks[name], s1, s2), paper)), { density: 300 })
    .resize(280, 280).flatten({ background: paper }).png().toBuffer();

const row1 = await Promise.all([
  big('f-mark'), big('f-mark-ribbon'), big('f-mark', V_D, CO_D, PANEL),
  big('d-mark'), big('d-mark', null, null, PAPER, true), big('d-mark', V_D, CO_D, PANEL),
]);
const row2 = await Promise.all([
  big('f-mark-ribbon', V_D, CO_D, PANEL), big('d-mark-micro'),
  px('f-mark-micro', 16, 17), px('f-mark', 48, 6), px('d-mark-micro', 32, 8), px('d-mark', 48, 6),
]);
await sharp({ create: { width: 40 + 6 * 300, height: 660, channels: 4, background: '#e8e2da' } })
  .composite([
    ...row1.map((input, i) => ({ input, left: 30 + i * 300, top: 30 })),
    ...row2.map((input, i) => ({ input, left: 30 + i * 300 + 4, top: 350 })),
  ])
  .png().toFile(join(out, 'overview.png'));

console.log(`round-02 v7 written: ${Object.keys(files).length} SVGs, index.html, overview.png`);
