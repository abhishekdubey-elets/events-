/**
 * Elets Events — page composer
 * ----------------------------
 * Every page in this theme is a standalone HTML file with no runtime includes.
 * To keep the shared chrome (icon sprite, navigation, footer, script tags)
 * byte-identical across all 13 pages, this script lifts those blocks out of
 * index.html and stamps them into each page around its own <main> content.
 *
 *   build/content/<name>.html   →   ./<name>.html
 *
 * Run after editing index.html's nav or footer:  node build/compose.mjs
 * The output is committed; the theme ships without a build step.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(ROOT, p), 'utf8');
const between = (s, a, b) => {
  const i = s.indexOf(a);
  const j = s.indexOf(b, i);
  if (i < 0 || j < 0) throw new Error('marker not found: ' + a);
  return s.slice(i, j + b.length);
};

const index = read('index.html');

const SPRITE = between(index, '<!-- ══════════════════════════════════════════════════ ICON SPRITE -->', '</defs></svg>');
const CHROME = between(index, '<!-- ══════════════════════════════════════════════════ NAV -->', '</div>\n\n<main id="main">').replace('\n\n<main id="main">', '');
const FOOTER = between(index, '<!-- ══════════════════════════════════════════════════ FOOTER -->', '</footer>');
const SCRIPTS = between(index, '<script src="assets/vendor/gsap.min.js" defer></script>', '<script src="assets/js/animations.js" defer></script>');

const LOADER = `<div class="loader" role="status" aria-live="polite" aria-label="Loading">
  <div class="loader__inner">
    <span class="loader__mark" aria-hidden="true"></span>
    <span class="loader__bar"><span class="loader__fill"></span></span>
    <span class="loader__meta mono">
      <span>Elets Events</span><span data-loader-num>000</span>
    </span>
  </div>
</div>

<div class="progress" aria-hidden="true"><div class="progress__fill"></div></div>
<a class="skip-link" href="#main">Skip to content</a>`;

/* ------------------------------------------------------------------ pages */
const PAGES = [
  { file: 'event.html',        nav: 'Events',    title: 'India Energy Expo 2026 — Elets Events', desc: 'India Energy Expo 2026, 18–19 August, New Delhi. Agenda, speakers, sponsors, venue and delegate registration.' },
  { file: 'speakers.html',     nav: 'Speakers',  title: 'Speakers — Elets Events', desc: 'Secretaries, IAS officers, CEOs and chief data scientists who have spoken on Elets stages across governance, health, education and BFSI.' },
  { file: 'speaker.html',      nav: 'Speakers',  title: 'Akash Tripathi, IAS — Speaker — Elets Events', desc: 'CEO MyGov and MD & CEO, Digital India Corporation, MeitY. Sessions, talks, publications and speaking history.' },
  { file: 'agenda.html',       nav: 'Agenda',    title: 'Agenda — India Energy Expo 2026 — Elets Events', desc: 'Two-day agenda with tracks, sessions, speakers and rooms. Filter by track, search sessions and bookmark your day.' },
  { file: 'registration.html', nav: null,        title: 'Registration — Elets Events', desc: 'Delegate passes, government rates, group bookings, sponsorship and speaking submissions for Elets conferences.' },
  { file: 'sponsors.html',     nav: 'Sponsors',  title: 'Sponsors & Partners — Elets Events', desc: 'Partnership tiers, audience profile and packages for Elets conferences across governance, health, education, BFSI and energy.' },
  { file: 'videos.html',       nav: 'Media',     title: 'Video Library — Elets Events', desc: 'Keynotes, panels and fireside chats from 1,000+ Elets conferences. Over 10 million views.' },
  { file: 'gallery.html',      nav: 'Media',     title: 'Gallery — Elets Events', desc: 'Photography from recent Elets summits, awards nights and expo floors.' },
  { file: 'magazines.html',    nav: 'Media',     title: 'Magazine Library — Elets Events', desc: 'eGov, digitalLEARNING, eHEALTH and The Banking & Finance Post — read online or download the PDF edition.' },
  { file: 'news.html',         nav: 'Media',     title: 'News & Insights — Elets Events', desc: 'Reporting from inside the room: summit coverage, policy analysis and sector briefings from the Elets newsroom.' },
  { file: 'about.html',        nav: 'About',     title: 'About Elets Technomedia — Elets Events', desc: 'Founded 2003. India’s leading B2B media house for governance, healthcare, education and banking. Offices in Noida and Dubai.' },
  { file: 'contact.html',      nav: null,        title: 'Contact — Elets Events', desc: 'Delegate registration, partnerships, speaking opportunities and press. Noida and Dubai offices.' },
];

const head = (p) => `<!DOCTYPE html>
<html lang="en" class="no-js" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${p.title}</title>
<meta name="description" content="${p.desc}">
<meta name="theme-color" content="#f6f5f2">
<link rel="canonical" href="https://events.eletsonline.com/${p.file}">
<link rel="icon" href="assets/img/brand/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/img/brand/favicon.svg">

<meta property="og:type" content="website">
<meta property="og:site_name" content="Elets Events">
<meta property="og:title" content="${p.title}">
<meta property="og:description" content="${p.desc}">
<meta property="og:image" content="assets/img/og.svg">
<meta name="twitter:card" content="summary_large_image">

<link rel="preload" as="font" type="font/woff2" href="assets/fonts/inter-normal-400-700-latin.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="assets/fonts/instrument-serif-italic-400-latin.woff2" crossorigin>

<link rel="stylesheet" href="assets/css/styles.css">
<link rel="stylesheet" href="assets/css/components.css">
<link rel="stylesheet" href="assets/css/animations.css">
<link rel="stylesheet" href="assets/css/responsive.css">

<script>
/* Theme bootstrap — runs before first paint so there is never a flash. */
(function(){try{var t=localStorage.getItem('elets-theme');
if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
document.documentElement.setAttribute('data-theme',t);
document.querySelector('meta[name="theme-color"]').setAttribute('content',t==='dark'?'#08090c':'#f6f5f2');
}catch(e){}
document.documentElement.classList.remove('no-js');})();
</script>
</head>

<body>

${LOADER}

${SPRITE}
`;

const markActive = (chrome, label) => {
  if (!label) return chrome;
  // <a class="nav__link" href="speakers.html">Speakers</a>
  let out = chrome.replace(
    new RegExp(`(<a class="nav__link" href="[^"]+">)${label}(</a>)`),
    `$1${label}$2`.replace('class="nav__link"', 'class="nav__link" aria-current="page"')
  );
  // dropdown triggers are <button>
  out = out.replace(
    new RegExp(`(<button class="nav__link" data-mega="[^"]+" aria-expanded="false" aria-haspopup="true">\\s*)${label}`),
    (m) => m.replace('class="nav__link"', 'class="nav__link" aria-current="page"')
  );
  return out;
};

let built = 0;
for (const p of PAGES) {
  const body = read(`build/content/${p.file}`);
  const doc =
    head(p) +
    '\n' +
    markActive(CHROME, p.nav) +
    '\n\n<main id="main">\n\n' +
    body.trim() +
    '\n\n</main>\n\n' +
    FOOTER +
    '\n\n' +
    SCRIPTS +
    '\n</body>\n</html>\n';
  writeFileSync(resolve(ROOT, p.file), doc);
  built++;
}
console.log(`✓ composed ${built} pages`);
