/**
 * Elets Events — placeholder asset generator
 * ------------------------------------------
 * Emits deterministic, self-contained SVG art for portraits, event covers,
 * magazine covers, video thumbnails and gallery tiles.
 *
 * These are DESIGN PLACEHOLDERS. Replace the files in /assets/img/** with real
 * photography of the same aspect ratio and everything keeps working — the
 * markup already carries width/height, loading="lazy" and decoding="async".
 *
 * Run:  node build/generate-assets.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = (p, s) => {
  const f = resolve(ROOT, p);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, s.trim() + '\n');
};

/* XML-escape anything that lands inside SVG markup — an unescaped "&" in a
   title (e.g. "Skill & Education Summit") produces an invalid document that
   browsers refuse to render. */
const esc = (v) =>
  String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
           .replace(/"/g, '&quot;');

/* ---------------------------------------------------------------- palette */
const PALETTES = [
  ['#1B4DFF', '#7C3AED', '#0B1020'], // indigo
  ['#FF5A2B', '#FFB020', '#1A0E08'], // saffron
  ['#00C4A7', '#1B4DFF', '#04140F'], // teal
  ['#7C3AED', '#FF3D8A', '#140A1E'], // violet
  ['#0EA5E9', '#00C4A7', '#04101A'], // cyan
  ['#F43F5E', '#7C3AED', '#1A0810'], // rose
  ['#F59E0B', '#EF4444', '#1A1004'], // amber
  ['#22C55E', '#0EA5E9', '#04140A'], // green
];

/* deterministic pseudo-random from a string seed */
function rng(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const grain = (id, o = 0.16, f = 0.9) => `
  <filter id="${id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="${f}" numOctaves="3" stitchTiles="stitch" result="n"/>
    <feColorMatrix type="saturate" values="0" in="n" result="ng"/>
    <feComponentTransfer in="ng" result="nt"><feFuncA type="linear" slope="${o}"/></feComponentTransfer>
    <feComposite operator="over" in="nt" in2="SourceGraphic"/>
  </filter>`;

const blob = (r, w, h, colors) => {
  let s = '';
  for (let i = 0; i < 4; i++) {
    const cx = r() * w, cy = r() * h;
    const rad = (0.35 + r() * 0.5) * Math.max(w, h);
    s += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${rad.toFixed(0)}" fill="url(#g${i})" opacity="${(0.5 + r() * 0.4).toFixed(2)}"/>`;
  }
  return s;
};

const meshDefs = (colors, r) =>
  [0, 1, 2, 3]
    .map((i) => {
      const c = colors[i % 2];
      return `<radialGradient id="g${i}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${c}" stop-opacity="${(0.85 - i * 0.12).toFixed(2)}"/>
        <stop offset="100%" stop-color="${c}" stop-opacity="0"/>
      </radialGradient>`;
    })
    .join('');

/* ------------------------------------------------------------- portraits */
function portrait(name, seedKey, paletteIndex) {
  const r = rng(seedKey);
  const c = PALETTES[paletteIndex % PALETTES.length];
  const initials = name
    .replace(/^(Dr\.?|Shri|Brig\.?|Mr\.?|Ms\.?|Mrs\.?)\s+/i, '')
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  const W = 800, H = 800;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Portrait placeholder for ${esc(name)}">
  <defs>
    ${meshDefs(c, r)}
    <linearGradient id="veil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="45%" stop-color="${c[2]}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${c[2]}" stop-opacity=".82"/>
    </linearGradient>
    <linearGradient id="fig" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity=".24"/>
      <stop offset="100%" stop-color="#fff" stop-opacity=".05"/>
    </linearGradient>
    ${grain('gr', 0.14, 1.1)}
  </defs>
  <rect width="${W}" height="${H}" fill="${c[2]}"/>
  <g filter="url(#gr)">${blob(r, W, H, c)}</g>
  <g opacity=".9">
    <circle cx="400" cy="330" r="118" fill="url(#fig)"/>
    <path d="M180 800c0-140 98-236 220-236s220 96 220 236z" fill="url(#fig)"/>
  </g>
  <rect width="${W}" height="${H}" fill="url(#veil)"/>
  <text x="56" y="742" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="72" font-weight="600" letter-spacing="-2" fill="#fff" fill-opacity=".92">${esc(initials)}</text>
</svg>`;
}

/* ---------------------------------------------------------- event covers */
function cover(title, sector, seedKey, paletteIndex, W = 1600, H = 1000) {
  const r = rng(seedKey);
  const c = PALETTES[paletteIndex % PALETTES.length];
  let lines = '';
  for (let i = 0; i <= 16; i++) {
    lines += `<line x1="${(i * W) / 16}" y1="0" x2="${(i * W) / 16}" y2="${H}" stroke="#fff" stroke-opacity=".05"/>`;
  }
  for (let i = 0; i <= 10; i++) {
    lines += `<line x1="0" y1="${(i * H) / 10}" x2="${W}" y2="${(i * H) / 10}" stroke="#fff" stroke-opacity=".05"/>`;
  }
  let arcs = '';
  for (let i = 0; i < 5; i++) {
    const rad = 160 + i * 130 + r() * 40;
    arcs += `<circle cx="${(W * 0.78).toFixed(0)}" cy="${(H * 0.28).toFixed(0)}" r="${rad.toFixed(0)}" fill="none" stroke="#fff" stroke-opacity="${(0.14 - i * 0.02).toFixed(3)}" stroke-width="1.5"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(title)}">
  <defs>${meshDefs(c, r)}${grain('gr', 0.1, 0.85)}
    <linearGradient id="veil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="30%" stop-color="${c[2]}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${c[2]}" stop-opacity=".9"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${c[2]}"/>
  <g filter="url(#gr)">${blob(r, W, H, c)}</g>
  <g>${lines}</g>
  <g>${arcs}</g>
  <rect width="${W}" height="${H}" fill="url(#veil)"/>
  <text x="64" y="${H - 116}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="30" letter-spacing="6" fill="#fff" fill-opacity=".7">${esc(sector.toUpperCase())}</text>
  <text x="64" y="${H - 52}" font-family="Georgia,'Times New Roman',serif" font-size="62" fill="#fff" fill-opacity=".96">${esc(title.slice(0, 34))}</text>
</svg>`;
}

/* ------------------------------------------------------- magazine covers */
function magazine(masthead, issue, strap, seedKey, paletteIndex) {
  const r = rng(seedKey);
  const c = PALETTES[paletteIndex % PALETTES.length];
  const W = 960, H = 1280;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(masthead)} ${esc(issue)} cover">
  <defs>${meshDefs(c, r)}${grain('gr', 0.12, 0.95)}
    <linearGradient id="veil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c[2]}" stop-opacity=".55"/>
      <stop offset="55%" stop-color="${c[2]}" stop-opacity=".1"/>
      <stop offset="100%" stop-color="${c[2]}" stop-opacity=".92"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${c[2]}"/>
  <g filter="url(#gr)">${blob(r, W, H, c)}</g>
  <rect width="${W}" height="${H}" fill="url(#veil)"/>
  <text x="60" y="150" font-family="Georgia,'Times New Roman',serif" font-size="96" font-weight="700" fill="#fff" letter-spacing="-3">${esc(masthead)}</text>
  <line x1="60" y1="190" x2="${W - 60}" y2="190" stroke="#fff" stroke-opacity=".35"/>
  <text x="60" y="238" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="26" letter-spacing="4" fill="#fff" fill-opacity=".75">${esc(issue.toUpperCase())}</text>
  <text x="60" y="${H - 190}" font-family="Georgia,'Times New Roman',serif" font-size="58" fill="#fff" fill-opacity=".95">${esc(strap.split('|')[0])}</text>
  <text x="60" y="${H - 122}" font-family="Georgia,'Times New Roman',serif" font-size="58" fill="#fff" fill-opacity=".95">${esc(strap.split('|')[1] || '')}</text>
  <text x="60" y="${H - 56}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="22" letter-spacing="3" fill="#fff" fill-opacity=".6">ELETS TECHNOMEDIA</text>
</svg>`;
}

/* -------------------------------------------------------------- datasets */
const SPEAKERS = [
  ['Brig B D Mishra', 0], ['Amit Sharma', 1], ['Gaurav Gupta', 2], ['Akash Tripathi', 3],
  ['Thampy Koshy', 4], ['Meeta R Lochan', 5], ['Rajit Punhani', 6], ['Rajendra Kumar', 7],
  ['Ashok K K Meena', 2], ['D Thara', 4], ['Deepak Bagla', 1], ['Himanshu Pant', 3],
  ['Shailesh Kumar', 0], ['Gaurav Duggal', 5], ['Deepak Gupta', 6], ['Ravi Gupta', 7],
];
SPEAKERS.forEach(([n, p], i) =>
  out(`assets/img/speakers/sp-${String(i + 1).padStart(2, '0')}.svg`, portrait(n, n + i, p))
);

const EVENTS = [
  ['India Energy Expo 2026', 'Energy', 7],
  ['BFSI Gamechanger Summit', 'Banking', 0],
  ['World Education Summit', 'Education', 3],
  ['Patient Centricity Summit', 'Healthcare', 5],
  ['National PSU Summit', 'Governance', 4],
  ['Urban Innovation Summit', 'Smart Cities', 2],
  ['Skill & Education Summit', 'Education', 1],
  ['Healthcare Innovation', 'Healthcare', 7],
  ['India Pharma Expo 2027', 'Healthcare', 5],
  ['India AI Summit 2026', 'Artificial Intelligence', 0],
  ['Digital Innovation Summit', 'Governance', 4],
  ['World Fintech Summit', 'Banking', 6],
];
EVENTS.forEach(([t, s, p], i) =>
  out(`assets/img/events/ev-${String(i + 1).padStart(2, '0')}.svg`, cover(t, s, t + i, p))
);

/* wide hero / event-detail banner */
out('assets/img/events/hero-wide.svg', cover('India Energy Expo 2026', 'Energy · New Delhi', 'hero-wide', 7, 2400, 1200));

const MAGS = [
  ['eGov', 'July 2026', 'The AI-Ready|State', 0],
  ['digitalLEARNING', 'July 2026', 'Campus to|Career', 3],
  ['eHEALTH', 'June 2026', 'Patient First|by Design', 2],
  ['BFSI Post', 'June 2026', 'The NBFC|Tech Stack', 6],
  ['eGov', 'May 2026', 'Water, Data|and AI', 4],
  ['digitalLEARNING', 'April 2026', 'Skilling|Bharat', 1],
];
MAGS.forEach(([m, iss, s, p], i) =>
  out(`assets/img/magazines/mag-${String(i + 1).padStart(2, '0')}.svg`, magazine(m, iss, s, m + iss, p))
);

const VIDEOS = [
  ['AI in Governance', 'Keynote', 0], ['Inside the NBFC Stack', 'Panel', 6],
  ['Building Smart Wards', 'Session', 2], ['Water Intelligence', 'Keynote', 4],
  ['Campus to Career', 'Fireside', 3], ['Public Sector Cyber', 'Panel', 5],
  ['Energy Transition', 'Keynote', 7], ['The ONDC Effect', 'Fireside', 1],
];
VIDEOS.forEach(([t, s, p], i) =>
  out(`assets/img/videos/vid-${String(i + 1).padStart(2, '0')}.svg`, cover(t, s, t + 'v' + i, p, 1600, 900))
);

/* Mixed aspect ratios so the masonry column layout actually staggers. */
const GAL_RATIOS = [[1200, 900], [1200, 1500], [1200, 800], [1200, 1350], [1200, 900], [1200, 1200]];
for (let i = 1; i <= 12; i++) {
  const p = (i * 3) % PALETTES.length;
  const [gw, gh] = GAL_RATIOS[i % GAL_RATIOS.length];
  out(`assets/img/gallery/g-${String(i).padStart(2, '0')}.svg`,
    cover(['Plenary', 'Awards Night', 'Expo Floor', 'Roundtable', 'Fireside', 'Networking'][i % 6], 'Elets 2026', 'gal' + i, p, gw, gh));
}

/* ------------------------------------------------------------ brand marks */
out('assets/img/brand/logo.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" role="img" aria-label="Elets">
  <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#1B4DFF"/><stop offset="55%" stop-color="#7C3AED"/><stop offset="100%" stop-color="#FF5A2B"/>
  </linearGradient></defs>
  <rect width="40" height="40" rx="11" fill="url(#lg)"/>
  <path d="M13 12h15v4.2H17.6v3.7h9.1v4.1h-9.1v3.8H28V32H13z" fill="#fff"/>
</svg>`);

out('assets/img/brand/favicon.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
  <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#1B4DFF"/><stop offset="55%" stop-color="#7C3AED"/><stop offset="100%" stop-color="#FF5A2B"/>
  </linearGradient></defs>
  <rect width="40" height="40" rx="9" fill="url(#lg)"/>
  <path d="M13 12h15v4.2H17.6v3.7h9.1v4.1h-9.1v3.8H28V32H13z" fill="#fff"/>
</svg>`);

/* partner wordmarks — neutral, monochrome, inherit currentColor */
const PARTNERS = [
  'NxtGen', 'Confluent', 'Infinity Labs', 'ESDS', 'Karix', 'Chat360',
  'Digital India', 'MyGov', 'ONDC', 'NITI Aayog', 'MeitY', 'FSSAI',
];
PARTNERS.forEach((name, i) => {
  /* Uniform 220×48 canvas so every mark reserves identical layout space and the
     marquee never reflows as logos stream in. Ink is explicit (not currentColor)
     because an SVG loaded via <img> cannot inherit page colour — dark mode is
     handled by the `--logo-filter` invert in CSS. */
  const size = name.length > 11 ? 17 : 19;
  out(`assets/img/partners/p-${String(i + 1).padStart(2, '0')}.svg`, `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 48" width="220" height="48" role="img" aria-label="${esc(name)}">
  <rect x="1" y="9" width="30" height="30" rx="9" fill="none" stroke="#0a0b0e" stroke-opacity=".38" stroke-width="1.6"/>
  <circle cx="16" cy="24" r="7" fill="#0a0b0e" fill-opacity=".5"/>
  <text x="42" y="30.5" font-family="Inter,Helvetica,Arial,sans-serif" font-size="${size}" font-weight="600" letter-spacing="-.4" fill="#0a0b0e" fill-opacity=".82">${esc(name)}</text>
</svg>`);
});

/* social preview */
out('assets/img/og.svg', cover('Elets Events — India’s stage', 'Governance · Health · Education · BFSI', 'og', 0, 1200, 630));

console.log('✓ assets generated');
