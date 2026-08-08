# Elets Events — Next.js

The Elets Events HTML theme, ported to Next.js 16 (App Router, React 19,
TypeScript) with a full SEO layer. Every page is statically prerendered; the
design system is the theme's, unchanged.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 44 static routes
npm start
```

Set `NEXT_PUBLIC_SITE_URL` per environment — canonicals, Open Graph URLs, the
sitemap and every JSON-LD `@id` derive from it. See `.env.example`.

---

## Routes

The theme's thirteen `.html` files became clean URLs, and the two templates
that only ever described one record became dynamic segments:

| Theme file | Route | Notes |
|---|---|---|
| `index.html` | `/` | |
| — | `/events` | New: the calendar index, built from the theme's own card components |
| `event.html` | `/events/[slug]` | 10 events, prerendered from `src/data/events.ts` |
| `speakers.html` | `/speakers` | |
| `speaker.html` | `/speakers/[slug]` | 16 profiles, prerendered from `src/data/speakers.ts` |
| `agenda.html` | `/agenda` | |
| `registration.html` | `/registration` | |
| `sponsors.html` | `/sponsors` | |
| `videos.html` | `/videos` | |
| `gallery.html` | `/gallery` | |
| `magazines.html` | `/magazines` | |
| `news.html` | `/news` | |
| `about.html` | `/about` | |
| `contact.html` | `/contact` | |

Every old `.html` URL 301s to its replacement (`next.config.mjs`), so nothing
that was already indexed drops.

---

## SEO

- **Metadata** — one helper, `pageMeta()` in `src/lib/seo.ts`, builds title,
  description, canonical, Open Graph and Twitter tags together, so they cannot
  drift apart. Every route calls it; the 404 is `noindex, follow`.
- **Structured data** — a `@graph` per page. `Organization` + `WebSite` (with
  `SearchAction`) ship site-wide from the layout; routes add `BreadcrumbList`,
  `Event`, `Person`, `ItemList`, `FAQPage`, `CollectionPage` or `ImageGallery`
  as they apply. It is server-rendered, so crawlers that do not run JavaScript
  still see it.
- **Honest `Event` data.** Dates are emitted only for the two events that
  actually have them. The rest are "TBC" in the theme, and an invented
  `startDate` is worse than none. `offers` appears only where registration is
  open.
- **Honest `FAQPage`.** The five questions come from the accordion on
  `/contact`, verbatim. Structured data that does not match visible copy is a
  rich-result penalty waiting to happen.
- **Share card** — the theme's `og.svg` is not rendered by LinkedIn, X or
  WhatsApp. `src/app/opengraph-image.tsx` renders a 1200×630 PNG at build time
  in the theme's colours instead.
- `sitemap.xml`, `robots.txt` and `manifest.webmanifest` are generated from the
  same data as the routes, so they cannot list a URL that 404s.

---

## How the theme was ported

### Markup

`tools/html-to-jsx.mjs` converts the theme's page bodies to React server
components. The conversion is mechanical on purpose — the class names *are*
the design system's contract with `components.css`, so the markup is
reproduced rather than re-authored. It handles JSX attribute renaming
(including SVG's kebab-case presentation attributes), `style` strings to
objects with CSS custom properties intact, `.html` links to routes, boolean
attributes, `<select>`/`<option>` initial state, and whitespace that HTML
would render but JSX would swallow.

Two extras worth knowing about:

- **Per-record links.** The theme has one speaker page and one event page, so
  every card points at the same file. The generator re-points each card at its
  own route by matching the name the card already displays; anything it cannot
  match keeps the theme's target, so a rename degrades to a working link
  rather than a 404.
- **Patches.** `EventBody` and `SpeakerBody` are parametrised — identity fields
  come from `src/data`. Those edits live in the generator's `PATCHES` table,
  applied after conversion, so re-running it is idempotent. If the theme markup
  moves under a patch, the run *fails* rather than silently reverting a route
  to hard-coded copy.

```bash
npm run theme:pages    # regenerate the 13 page bodies
npm run theme:chrome   # regenerate nav/footer/sprite scaffolds into .chrome-scratch
npm run theme:data     # re-extract the speaker roster from the theme
```

`src/components/chrome/*` is hand-maintained from those scaffolds — the header
needed real routes and `aria-current` derived from the URL rather than stamped
in by the theme's build step.

### Behaviour

`assets/js/script.js` and `animations.js` became `src/lib/ui.ts` and
`src/lib/motion.ts`. Same modules, same markup contract — each still looks for
its own hooks and returns silently when they are absent.

What changed: the document now survives navigation while `<main>` is swapped,
so everything is mount/unmount safe. Every listener registers against an
`AbortController`, every timer, observer and injected node is tracked, and
`initUI()` / `initMotion()` hand back a teardown that leaves the DOM as they
found it. `ThemeRuntime` re-runs them on each route change. Chrome that
outlives the route — preloader, Lenis, custom cursor — guards itself with
module flags.

The progressive-enhancement contract from the theme is preserved and, in one
respect, improved: GSAP and Lenis (128 KB) are no longer in the critical path.
Reveals run on IntersectionObserver the moment the page hydrates, and the
scrubbed/pinned layer joins via `initScrollFX()` when the vendor bundles
arrive. If they never arrive, everything still works.

### Styles

The four stylesheets moved to `src/styles/` and are imported by the root layout
in their required order (`styles → components → animations → responsive`), so
Next bundles, minifies and hashes them. Their `url(../fonts/…)` references were
rewritten to `/assets/fonts/…`: the fonts stay in `public/` at stable paths so
the two visible-on-load faces can be preloaded by name.

---

## Brand assets

Everything in `public/assets/img/brand/` is generated from one source file —
the official logo, kept at `tools/brand/logo-source.png` (150×78, white ink
plus brand red `#ee3248`):

```bash
powershell -ExecutionPolicy Bypass -File tools/brand-assets.ps1
```

| File | Use |
|---|---|
| `lockup-on-light.png` / `-on-dark.png` | Header and footer, and the `Organization` logo in JSON-LD. The complete logo, URL line included |
| `wordmark-on-light.png` / `-on-dark.png` | Wordmark-only crop. Not currently used — kept for anywhere too short for the full lockup |
| `mark-96.png`, `mark-256.png` | The red `e`, cropped square — favicon, apple-touch, PWA manifest |

Three things about the source drive the layout in `src/styles/brand.css`:

- **It is white ink.** Invisible on the light theme. The theme's own
  `--logo-filter` would fix that with `invert()`, but that swings the brand red
  to cyan — so the `-on-light` files recolour only the white ink to `#0a0b0e`
  and leave the red exactly as it is. The suffix names the *surface*, not the
  artwork. The footer is a dark band in both themes and always takes `-on-dark`.
- **It is a stacked lockup**, not a square mark — the theme had `.brand img`
  hard-coded to 34×34. The header therefore drops the duplicate "Elets" text
  and keeps a small `EVENTS PLATFORM` label instead.
- **The URL line is only ~11px of the 68px source**, so the lockup has to be
  tall enough to carry it: at 52px it renders ~8.4px and reads cleanly. The
  sizes step down with `--nav-h` (52 / 46 / 42px against a 76 / 70 / 64px bar)
  so the logo keeps ~12px of breathing room at every breakpoint. Do not shrink
  it below ~42px — that is the floor where the URL stops being readable.

**The source is only 150 px wide.** Fine for header, footer and the tab
favicon; `mark-256.png` is upscaled and visibly soft, so it is the weak link
for phone home-screen icons. Drop higher-resolution or vector art at
`tools/brand/logo-source.png` and re-run the script — the crop bands are
proportional to the source height, so they survive a resolution change of the
same artwork.

---

## Content

Inherited from the theme, and unchanged. Event names, dates, cities, speaker
names and headline statistics come from Elets' published material. Two things
are **not** real and are labelled as such on the pages themselves:

- Testimonial quotations are placeholder copy, attributed by role only.
- Seat-allocation percentages, ticket prices and partnership rates are
  illustrative.

Beyond that, one thing to know before launch: `/events/[slug]` and
`/speakers/[slug]` render one template each. Identity fields are per-record,
but the programme sections (tracks, venue notes, awards) and the speaker
narrative (biography, sessions, publications) are still the flagship edition's
illustrative copy. They are the first thing to replace when real records land —
extend `src/data/events.ts` and `src/data/speakers.ts` and read the extra
fields in the two body components.

`_theme-source/` holds the original theme. It is the generator's input; nothing
in it is served.
