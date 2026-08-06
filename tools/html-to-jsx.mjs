/**
 * Elets Events — theme port
 * -------------------------
 * Converts the static theme's page bodies (build/content/*.html, plus the
 * <main> of index.html) into React server components, one per route.
 *
 * The conversion is mechanical and deterministic on purpose: the theme's
 * markup is the design system's contract (class names drive every component
 * in components.css), so it is reproduced verbatim rather than re-authored.
 * What changes:
 *
 *   · HTML attributes → JSX props (incl. SVG's kebab-case presentation attrs)
 *   · style="a:b"     → style={{ a: 'b' }}, custom properties preserved
 *   · .html links     → clean routes, internal ones through next/link
 *   · assets/…        → /assets/…
 *
 * Run:  node tools/html-to-jsx.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const THEME = resolve(ROOT, '_theme-source/elets-theme');
const OUT = resolve(ROOT, 'src/components/theme');

/* ------------------------------------------------------------------ routes */
const ROUTES = {
  'index.html': '/',
  'event.html': '/events/india-energy-expo-2026',
  'speakers.html': '/speakers',
  'speaker.html': '/speakers/akash-tripathi',
  'agenda.html': '/agenda',
  'registration.html': '/registration',
  'sponsors.html': '/sponsors',
  'videos.html': '/videos',
  'gallery.html': '/gallery',
  'magazines.html': '/magazines',
  'news.html': '/news',
  'about.html': '/about',
  'contact.html': '/contact',
};

/* -------------------------------------------------------------- attributes */
const ATTR = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  minlength: 'minLength',
  autocomplete: 'autoComplete',
  autofocus: 'autoFocus',
  autoplay: 'autoPlay',
  playsinline: 'playsInline',
  novalidate: 'noValidate',
  formaction: 'formAction',
  formnovalidate: 'formNoValidate',
  enctype: 'encType',
  accesskey: 'accessKey',
  contenteditable: 'contentEditable',
  spellcheck: 'spellCheck',
  inputmode: 'inputMode',
  enterkeyhint: 'enterKeyHint',
  crossorigin: 'crossOrigin',
  datetime: 'dateTime',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  usemap: 'useMap',
  srcset: 'srcSet',
  srclang: 'srcLang',
  fetchpriority: 'fetchPriority',
  referrerpolicy: 'referrerPolicy',
  allowfullscreen: 'allowFullScreen',
  frameborder: 'frameBorder',
  marginwidth: 'marginWidth',
  marginheight: 'marginHeight',
  itemprop: 'itemProp',
  itemscope: 'itemScope',
  itemtype: 'itemType',
  /* SVG presentation attributes */
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-opacity': 'strokeOpacity',
  'stroke-miterlimit': 'strokeMiterlimit',
  'fill-opacity': 'fillOpacity',
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
  'clip-path': 'clipPath',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'text-anchor': 'textAnchor',
  'dominant-baseline': 'dominantBaseline',
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'font-weight': 'fontWeight',
  'letter-spacing': 'letterSpacing',
  'color-interpolation-filters': 'colorInterpolationFilters',
  'flood-color': 'floodColor',
  'flood-opacity': 'floodOpacity',
  'stroke-linejoin"': 'strokeLinejoin',
  'xlink:href': 'xlinkHref',
  'xmlns:xlink': 'xmlnsXlink',
};

/* Attributes React wants as controlled/uncontrolled defaults instead. */
const DEFAULTED = { value: 'defaultValue', checked: 'defaultChecked', selected: 'defaultSelected' };

/* `value` keeps its name on these — they are not form state. */
const KEEPS_VALUE = new Set(['option', 'button', 'li', 'meter', 'progress', 'data', 'param']);

/* Props React types as numbers. */
const NUMERIC = new Set([
  'tabIndex', 'colSpan', 'rowSpan', 'span', 'maxLength', 'minLength',
  'rows', 'cols', 'size', 'start', 'step',
]);

/* Attributes that are boolean in HTML — bare presence means true. */
const BOOLEAN = new Set([
  'required', 'disabled', 'checked', 'selected', 'multiple', 'readonly',
  'hidden', 'autofocus', 'autoplay', 'controls', 'loop', 'muted', 'defer',
  'async', 'novalidate', 'open', 'reversed', 'playsinline', 'itemscope',
]);

const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
  'meta', 'param', 'source', 'track', 'wbr', 'use', 'path', 'circle',
  'rect', 'line', 'polygon', 'polyline', 'ellipse', 'stop',
]);

const INLINE = new Set([
  'a', 'abbr', 'b', 'br', 'button', 'cite', 'code', 'em', 'i', 'img', 'input',
  'kbd', 'label', 'mark', 'q', 's', 'small', 'span', 'strong', 'sub', 'sup',
  'svg', 'time', 'u', 'use', 'var',
]);

/* ----------------------------------------------------------------- helpers */
const camel = (s) =>
  s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/** `style="a:b;--c:d"` → a JSX object literal, custom properties intact. */
function styleToObject(raw) {
  const decls = [];
  let custom = false;
  // split on ; that are not inside parentheses — url(a;b) and rgba() are safe
  let depth = 0, buf = '';
  for (const ch of raw) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ';' && depth === 0) {
      decls.push(buf);
      buf = '';
    } else buf += ch;
  }
  decls.push(buf);

  const props = [];
  for (const d of decls) {
    const i = d.indexOf(':');
    if (i < 0) continue;
    const key = d.slice(0, i).trim();
    const val = d.slice(i + 1).trim();
    if (!key || !val) continue;
    if (key.startsWith('--')) {
      custom = true;
      props.push(`'${key}': ${quote(val)}`);
    } else {
      props.push(`${camel(key)}: ${quote(val)}`);
    }
  }
  return { code: `{ ${props.join(', ')} }`, custom };
}

/** JS string literal — for style objects, which live inside braces. */
const quote = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/**
 * JSX attribute value. These are HTML-style strings, not JS: a backslash is
 * literal, so a value containing an apostrophe has to become an expression.
 */
const attrValue = (s) => (/['\\]/.test(s) ? `{${JSON.stringify(s)}}` : `'${s}'`);

/** Rewrite a theme href/src onto the Next.js route + asset layout. */
function rewriteUrl(url) {
  if (!url) return url;
  if (/^(https?:|mailto:|tel:|#|data:)/.test(url)) return url;
  const [path, hash = ''] = url.split('#');
  const suffix = hash ? `#${hash}` : '';
  if (path.startsWith('assets/')) return `/${path}${suffix}`;
  if (ROUTES[path]) return `${ROUTES[path]}${suffix}`;
  if (path === '') return suffix;
  return url;
}

const isInternalRoute = (href) =>
  typeof href === 'string' && href.startsWith('/') && !href.startsWith('//');

/** Parse rawAttrs by hand so attribute case (viewBox) survives. */
function readAttrs(raw) {
  const out = [];
  const re = /([:@a-zA-Z_][-:.\w]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(raw))) {
    const name = m[1];
    const value = m[2] ?? m[3] ?? m[4];
    out.push([name, value]);
  }
  return out;
}

const HTML_ENTITY = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
  '&apos;': "'", '&nbsp;': ' ', '&mdash;': '—', '&ndash;': '–',
  '&hellip;': '…', '&times;': '×', '&middot;': '·', '&rsquo;': '’',
  '&lsquo;': '‘', '&ldquo;': '“', '&rdquo;': '”', '&deg;': '°',
};
const decode = (s) =>
  s.replace(/&(?:[a-zA-Z]+|#\d+);/g, (e) => {
    if (HTML_ENTITY[e]) return HTML_ENTITY[e];
    const n = /^&#(\d+);$/.exec(e);
    return n ? String.fromCodePoint(Number(n[1])) : e;
  });

/* JSX text: keep it as literal text where safe, brace it where not. */
function textToJsx(raw, prevTag, nextTag) {
  const collapsed = decode(raw).replace(/\s+/g, ' ');
  if (!collapsed.trim()) {
    // whitespace-only: only meaningful between inline neighbours
    if (!collapsed) return '';
    const inlineNeighbours =
      (prevTag === null || INLINE.has(prevTag)) && (nextTag === null || INLINE.has(nextTag));
    return inlineNeighbours && prevTag && nextTag ? "{' '}" : '';
  }
  const lead = /^\s/.test(collapsed) ? "{' '}" : '';
  const tail = /\s$/.test(collapsed) ? "{' '}" : '';
  const body = collapsed.trim();
  // `{`, `}` and `<`, `>` cannot appear bare in JSX text
  const safe = /[{}<>]/.test(body)
    ? `{${JSON.stringify(body)}}`
    : body.replace(/'/g, '&apos;');
  return lead + safe + tail;
}

/* ------------------------------------------------------ per-record linking
   The theme has one speaker page and one event page, so every card links to
   the same file. Here each card is pointed at its own route instead, matched
   on the name it already displays. Anything unmatched keeps the theme's
   default target, so a rename degrades to a working link rather than a 404. */

const speakerSlugs = new Map(
  JSON.parse(readFileSync(resolve(ROOT, 'src/data/speakers.generated.json'), 'utf8')).map((s) => [
    s.name.replace(/\s+/g, ' ').trim(),
    s.slug,
  ])
);

const eventSlugs = (() => {
  const src = readFileSync(resolve(ROOT, 'src/data/events.ts'), 'utf8');
  const map = new Map();
  const re = /slug:\s*'([^']+)',\s*\n\s*name:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src))) map.set(m[2].replace(/\\'/g, "'"), m[1]);
  return map;
})();

const norm = (s) => s.replace(/\s+/g, ' ').replace(/&amp;/g, '&').trim();

function relinkCards(root) {
  let speakerHits = 0;
  let eventHits = 0;

  root.querySelectorAll('.speaker').forEach((card) => {
    const name = norm(card.querySelector('.speaker__info h3 a')?.text || card.querySelector('h3 a')?.text || '');
    const slug = speakerSlugs.get(name);
    if (!slug) return;
    card.querySelectorAll('a').forEach((a) => {
      if ((a.getAttribute('href') || '').startsWith('speaker.html')) {
        a.setAttribute('href', `/speakers/${slug}`);
        speakerHits++;
      }
    });
  });

  root.querySelectorAll('.event-card, .card').forEach((card) => {
    const name = norm(card.querySelector('h3 a')?.text || '');
    const slug = eventSlugs.get(name);
    if (!slug) return;
    card.querySelectorAll('a').forEach((a) => {
      if ((a.getAttribute('href') || '').startsWith('event.html')) {
        a.setAttribute('href', `/events/${slug}`);
        eventHits++;
      }
    });
  });

  return { speakerHits, eventHits };
}

/* ------------------------------------------------------------------ render */
const state = { usesLink: false, usesCssProps: false };

function renderNode(node, indent, siblings, index) {
  const pad = '  '.repeat(indent);

  if (node.nodeType === 3) {
    const prev = prevElementTag(siblings, index);
    const next = nextElementTag(siblings, index);
    const jsx = textToJsx(node.rawText, prev, next);
    return jsx ? pad + jsx : '';
  }
  if (node.nodeType === 8) return ''; // comment
  if (node.nodeType !== 1) return '';

  let tag = node.rawTagName;
  if (!tag) return node.childNodes.map((c, i) => renderNode(c, indent, node.childNodes, i)).join('\n');

  const attrs = readAttrs(node.rawAttrs || '');
  const props = [];
  let isLink = false;

  for (const [rawName, rawValue] of attrs) {
    let name = rawName;
    let value = rawValue;

    if ((tag === 'a' || tag === 'area') && name === 'href') value = rewriteUrl(value);
    if (name === 'src' || name === 'poster' || name === 'data-peek') value = rewriteUrl(value);

    if (name === 'style' && value != null) {
      const { code, custom } = styleToObject(value);
      if (custom) state.usesCssProps = true;
      props.push(`style={${code}${custom ? ' as CSSProperties' : ''}}`);
      continue;
    }

    const lower = name.toLowerCase();
    // React drives the initial choice from the <select>, not the <option>
    if (lower === 'selected' && tag.toLowerCase() === 'option') continue;

    if (BOOLEAN.has(lower) && (value === undefined || value === lower)) {
      props.push(DEFAULTED[lower] ?? ATTR[lower] ?? lower);
      continue;
    }
    if (DEFAULTED[lower] && !KEEPS_VALUE.has(tag.toLowerCase())) {
      name = DEFAULTED[lower];
    } else if (ATTR[lower]) {
      name = ATTR[lower];
    } else if (!/^(data-|aria-)/.test(lower) && !/[A-Z]/.test(name)) {
      name = lower;
    }

    const text = decode(String(value ?? ''));
    props.push(
      NUMERIC.has(name) && /^-?\d+$/.test(text.trim())
        ? `${name}={${text.trim()}}`
        : `${name}=${attrValue(text)}`
    );
  }

  if (tag.toLowerCase() === 'select') {
    const chosen = node.querySelector('option[selected]');
    if (chosen) {
      props.push(`defaultValue=${attrValue(decode(chosen.getAttribute('value') ?? chosen.text.trim()))}`);
    }
  }

  if (tag === 'a') {
    const href = attrs.find(([n]) => n === 'href')?.[1];
    if (isInternalRoute(rewriteUrl(href))) {
      isLink = true;
      state.usesLink = true;
      tag = 'Link';
    }
  }

  const openProps = props.length ? ' ' + props.join(' ') : '';
  const kids = node.childNodes.filter(
    (c) => !(c.nodeType === 3 && !c.rawText.trim() && node.childNodes.length === 1)
  );

  if (!kids.length) {
    if (VOID.has(tag.toLowerCase()) || isSelfClosing(node)) return `${pad}<${tag}${openProps} />`;
    return `${pad}<${tag}${openProps}></${tag}>`;
  }

  const inner = node.childNodes
    .map((c, i) => renderNode(c, indent + 1, node.childNodes, i))
    .filter(Boolean)
    .join('\n');

  if (!inner.trim()) return `${pad}<${tag}${openProps}></${tag}>`;
  return `${pad}<${tag}${openProps}>\n${inner}\n${pad}</${tag}>`;
}

const isSelfClosing = (node) => VOID.has((node.rawTagName || '').toLowerCase());

function prevElementTag(siblings, index) {
  for (let i = index - 1; i >= 0; i--) {
    const n = siblings[i];
    if (n.nodeType === 1) return (n.rawTagName || '').toLowerCase();
    if (n.nodeType === 3 && n.rawText.trim()) return 'span';
  }
  return null;
}
function nextElementTag(siblings, index) {
  for (let i = index + 1; i < siblings.length; i++) {
    const n = siblings[i];
    if (n.nodeType === 1) return (n.rawTagName || '').toLowerCase();
    if (n.nodeType === 3 && n.rawText.trim()) return 'span';
  }
  return null;
}

/* -------------------------------------------------------------------- main */
function convert(html, componentName) {
  state.usesLink = false;
  state.usesCssProps = false;

  const root = parse(html, {
    lowerCaseTagName: false,
    comment: false,
    blockTextElements: { script: true, noscript: true, style: true, pre: true },
  });

  const { speakerHits, eventHits } = relinkCards(root);

  const body = root.childNodes
    .map((c, i) => renderNode(c, 3, root.childNodes, i))
    .filter(Boolean)
    .join('\n');

  if (speakerHits || eventHits) {
    console.log(`  ${componentName}: ${speakerHits} speaker links, ${eventHits} event links re-pointed`);
  }

  const imports = [];
  if (state.usesCssProps) imports.push("import type { CSSProperties } from 'react';");
  if (state.usesLink) imports.push("import Link from 'next/link';");

  return `/* eslint-disable */
/**
 * ${componentName} — ported from the Elets HTML theme.
 * Generated by tools/html-to-jsx.mjs. Edit the theme source or this file,
 * but do not re-run the generator over hand-edits without checking git.
 */
${imports.join('\n')}${imports.length ? '\n' : ''}
export default function ${componentName}() {
  return (
    <>
${body}
    </>
  );
}
`;
}

const INDEX = readFileSync(resolve(THEME, 'index.html'), 'utf8');
const slice = (a, b) => {
  const i = INDEX.indexOf(a);
  const j = INDEX.indexOf(b, i);
  return INDEX.slice(i, j + b.length);
};

/* Pull the <main> out of index.html for the home page. */
function homeMain() {
  const a = INDEX.indexOf('<main id="main">');
  const b = INDEX.indexOf('</main>', a);
  return INDEX.slice(a + '<main id="main">'.length, b);
}

/* Shared chrome. Converted once as a starting point; the components in
   src/components/chrome are then maintained by hand (active nav state). */
const CHROME = {
  IconSprite: () => slice('<svg width="0" height="0"', '</defs></svg>'),
  SiteHeader: () => slice('<header class="nav"', '</header>'),
  MobileDrawer: () => slice('<div class="drawer"', '</div>\n\n<main'),
  SiteFooter: () => slice('<footer class="footer noise">', '</footer>'),
  VideoModal: () => slice('<div class="modal modal--video"', '<script src=').replace(/<script src=$/, ''),
};

/* --------------------------------------------------------------- patches
   The theme details exactly one event and one speaker. These two components
   are re-pointed at src/data so a single template serves the whole calendar
   and the whole roster. Applied after conversion so `node tools/html-to-jsx`
   stays idempotent — a patch that no longer matches fails the run loudly
   rather than silently reverting a route to hard-coded copy. */
const PATCHES = {
  EventBody: {
    imports: [
      "import type { EventRecord } from '@/data/events';",
    ],
    signature: ['export default function EventBody() {', 'export default function EventBody({ event }: { event: EventRecord }) {'],
    note: `The event's identity (name, sector, dates, city, artwork, seat
 * allocation) comes from src/data/events.ts. The programme sections below —
 * tracks, venue notes, awards — remain the theme's illustrative copy for the
 * flagship edition.`,
    edits: [
      [
        `              <li>\n                <Link href='/#events'>\n                  Energy\n                </Link>\n              </li>\n              <li aria-current='page'>\n                India Energy Expo 2026\n              </li>`,
        `              <li>\n                <Link href='/events'>\n                  {event.sectorLabel}\n                </Link>\n              </li>\n              <li aria-current='page'>\n                {event.name}\n              </li>`,
      ],
      [
        `                <span className='tag tag-live'>\n                  Registrations open\n                </span>`,
        `                <span className={event.status === 'open' ? 'tag tag-live' : 'tag'}>\n                  {event.statusLabel ?? (event.status === 'concluded' ? 'Concluded' : 'Dates to be confirmed')}\n                </span>`,
      ],
      [
        `                <span className='tag tag-dot' style={{ '--dot': 'var(--sector-energy)' } as CSSProperties}>\n                  Energy\n                </span>\n                {' '}\n                <span className='tag'>\n                  7th edition\n                </span>`,
        `                <span className='tag tag-dot' style={{ '--dot': \`var(--sector-\${event.cats[0]})\` } as CSSProperties}>\n                  {event.sectorLabel}\n                </span>\n                {' '}\n                <span className='tag'>\n                  {event.dateLabel}\n                </span>`,
      ],
      [
        `              <h1 className='mt-5' data-split=''>\n                India Energy Expo 2026\n              </h1>`,
        `              <h1 className='mt-5' data-split=''>\n                {event.name}\n              </h1>`,
      ],
      [
        `                {' '}Two days on the grid India will need in 2035 — storage, transmission, green hydrogen, and the state utilities rebuilding demand forecasting around AI.{' '}`,
        `                {' '}{event.summary}{' '}`,
      ],
      [`alt='India Energy Expo 2026' width='2400'`, `alt={event.name} width='2400'`],
      [
        `                <span className='eyebrow'>\n                  Doors open in\n                </span>\n                <div className='countdown' data-countdown='2026-08-18T09:30:00+05:30' role='timer'>`,
        `                <span className='eyebrow'>\n                  {event.startDate ? 'Doors open in' : 'On the calendar'}\n                </span>\n                {event.startDate ? (\n                <div className='countdown' data-countdown={event.startDate} role='timer' aria-label={\`Time until \${event.name}\`}>`,
      ],
      [
        `                    <span>\n                      Sec\n                    </span>\n                  </div>\n                </div>\n                <dl className='mt-5'`,
        `                    <span>\n                      Sec\n                    </span>\n                  </div>\n                </div>\n                ) : (\n                <p className='mono muted mt-3'>\n                  {event.dateLabel}\n                </p>\n                )}\n                <dl className='mt-5'`,
      ],
      [
        `                      <strong>\n                        18–19 August 2026\n                      </strong>`,
        `                      <strong>\n                        {event.dateLabel}\n                      </strong>`,
      ],
      [
        `                      <strong>\n                        New Delhi\n                      </strong>\n                    </dd>\n                  </div>\n                  <div className='flex between gap-3'>\n                    <dt className='muted'>\n                      Format`,
        `                      <strong>\n                        {event.city ?? 'To be announced'}\n                      </strong>\n                    </dd>\n                  </div>\n                  <div className='flex between gap-3'>\n                    <dt className='muted'>\n                      Format`,
      ],
      [
        `                  <span className='seats__label'>\n                    Delegate seats · 72% allocated\n                  </span>\n                  {' '}\n                  <span className='seats__bar'>\n                    <span className='seats__fill' data-bar='72'></span>`,
        `                  <span className='seats__label'>\n                    Delegate seats · {event.allocated}% allocated\n                  </span>\n                  {' '}\n                  <span className='seats__bar'>\n                    <span className='seats__fill' data-bar={String(event.allocated)}></span>`,
      ],
      [
        `                18–19 August 2026 · New Delhi\n              </span>`,
        `                {[event.dateLabel, event.city].filter(Boolean).join(' · ')}\n              </span>`,
      ],
      [
        `            <strong style={{ fontSize: 'var(--fs-sm)' }}>\n              India Energy Expo 2026\n            </strong>\n            {' '}\n            <span className='mono muted' style={{ display: 'block' }}>\n              18–19 August · New Delhi · 72% allocated\n            </span>`,
        `            <strong style={{ fontSize: 'var(--fs-sm)' }}>\n              {event.name}\n            </strong>\n            {' '}\n            <span className='mono muted' style={{ display: 'block' }}>\n              {[event.dateLabel, event.city, \`\${event.allocated}% allocated\`].filter(Boolean).join(' · ')}\n            </span>`,
      ],
    ],
  },

  SpeakerBody: {
    imports: [
      "import type { Speaker } from '@/data/speakers';",
      "import { site } from '@/lib/site';",
      '',
      'const SECTOR_NAMES: Record<string, string> = {',
      "  ai: 'Artificial Intelligence',",
      "  health: 'Healthcare',",
      "  edu: 'Education',",
      "  gov: 'Governance',",
      "  city: 'Smart Cities',",
      "  energy: 'Energy',",
      "  bfsi: 'Banking & Fintech',",
      "  pharma: 'Pharma',",
      '};',
    ],
    signature: [
      'export default function SpeakerBody() {\n  return (',
      "export default function SpeakerBody({ speaker }: { speaker: Speaker }) {\n  const shortName = speaker.name.replace(/,.*$/, '').replace(/^(Shri|Smt|Dr\\.?|Prof\\.?|Brig\\.?)\\s+/, '');\n  return (",
    ],
    note: `The profile's identity (name, designation, portrait, sector chips)
 * comes from src/data/speakers.ts. The narrative below — biography, sessions,
 * publications — is the theme's illustrative copy for the featured profile
 * and is the first thing to replace when real speaker records land.`,
    edits: [
      [
        `              <li aria-current='page'>\n                Akash Tripathi\n              </li>`,
        `              <li aria-current='page'>\n                {shortName}\n              </li>`,
      ],
      [
        `              <img src='/assets/img/speakers/sp-04.svg' alt='Shri Akash Tripathi, IAS' width='800' height='800' fetchPriority='high' decoding='async' />`,
        `              <img src={speaker.image} alt={speaker.name} width='800' height='800' fetchPriority='high' decoding='async' />`,
      ],
      [
        `                <span className='tag tag-gov'>\n                  Government\n                </span>\n                {' '}\n                <span className='tag tag-dot' style={{ '--dot': 'var(--sector-ai)' } as CSSProperties}>\n                  Artificial Intelligence\n                </span>\n                {' '}\n                <span className='tag tag-dot' style={{ '--dot': 'var(--sector-governance)' } as CSSProperties}>\n                  Governance\n                </span>`,
        `                {speaker.badges.map((b) => (\n                <span key={b} className={b === 'Government' ? 'tag tag-gov' : 'tag tag-ind'}>\n                  {b}\n                </span>\n                ))}\n                {speaker.cats.filter((c) => c !== 'ind').map((c) => (\n                <span key={c} className='tag tag-dot' style={{ '--dot': \`var(--sector-\${c})\` } as CSSProperties}>\n                  {SECTOR_NAMES[c] ?? c}\n                </span>\n                ))}`,
      ],
      [
        `              <h1 className='mt-5' data-split=''>\n                Shri Akash Tripathi, IAS\n              </h1>`,
        `              <h1 className='mt-5' data-split=''>\n                {speaker.name}\n              </h1>`,
      ],
      [
        `                {' '}Chief Executive Officer, MyGov · Managing Director & Chief Executive Officer, Digital India Corporation, Ministry of Electronics and Information Technology, Government of India.{' '}`,
        `                {' '}{speaker.role}{speaker.org ? \`, \${speaker.org}\` : ''}{' '}`,
      ],
      [
        `data-copy='https://events.eletsonline.com/speaker.html'`,
        'data-copy={`${site.url}/speakers/${speaker.slug}`}',
      ],
    ],
  },
};

function applyPatches(code, name) {
  const patch = PATCHES[name];
  if (!patch) return code;

  let out = code;
  if (patch.note) {
    out = out.replace(
      ' * Generated by tools/html-to-jsx.mjs.',
      ` * Generated by tools/html-to-jsx.mjs, then patched by it.\n * ${patch.note}\n *`
    );
  }
  if (patch.imports?.length) {
    out = out.replace("import Link from 'next/link';", `import Link from 'next/link';\n${patch.imports.join('\n')}`);
  }
  const [sigFrom, sigTo] = patch.signature;
  if (!out.includes(sigFrom)) throw new Error(`${name}: signature patch did not match`);
  out = out.replace(sigFrom, sigTo);

  for (const [from, to] of patch.edits) {
    if (!out.includes(from)) {
      throw new Error(`${name}: patch target missing — the theme markup moved:\n${from.slice(0, 120)}…`);
    }
    out = out.replace(from, to);
  }
  return out;
}

const PAGES = [
  ['index.html', 'HomeBody'],
  ['event.html', 'EventBody'],
  ['speakers.html', 'SpeakersBody'],
  ['speaker.html', 'SpeakerBody'],
  ['agenda.html', 'AgendaBody'],
  ['registration.html', 'RegistrationBody'],
  ['sponsors.html', 'SponsorsBody'],
  ['videos.html', 'VideosBody'],
  ['gallery.html', 'GalleryBody'],
  ['magazines.html', 'MagazinesBody'],
  ['news.html', 'NewsBody'],
  ['about.html', 'AboutBody'],
  ['contact.html', 'ContactBody'],
];

const CHROME_ONLY = process.argv.includes('--chrome');

if (!CHROME_ONLY) {
  mkdirSync(OUT, { recursive: true });
  let n = 0;
  for (const [file, name] of PAGES) {
    const html = file === 'index.html' ? homeMain() : readFileSync(resolve(THEME, 'build/content', file), 'utf8');
    writeFileSync(resolve(OUT, `${name}.tsx`), applyPatches(convert(html, name), name));
    n++;
  }
  console.log(`✓ generated ${n} page bodies into src/components/theme`);
} else {
  const dir = resolve(ROOT, '.chrome-scratch');
  mkdirSync(dir, { recursive: true });
  for (const [name, get] of Object.entries(CHROME)) {
    writeFileSync(resolve(dir, `${name}.tsx`), convert(get(), name));
  }
  console.log(`✓ generated chrome scaffolds into .chrome-scratch`);
}
