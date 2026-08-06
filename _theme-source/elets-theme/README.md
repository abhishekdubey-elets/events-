# Elets Events — premium HTML theme

A production-ready, dependency-light HTML/CSS/JS theme for Elets Technomedia's
events platform. Thirteen complete pages, one design system, light and dark
themes, and no build step required to deploy.

Open `index.html` in a browser, or drop the whole folder on any static host.

---

## What's in the box

```
elets-events/
├── index.html              Home
├── event.html              Event detail — India Energy Expo 2026
├── speakers.html           Speaker listing (search + filters)
├── speaker.html            Speaker profile
├── agenda.html             Two-day agenda, tracks, bookmarking
├── registration.html       Pricing + 4-step registration + enquiries
├── sponsors.html           Partner tiers, audience data, enquiry
├── videos.html             Video library (Netflix-style rows)
├── gallery.html            Masonry photo gallery
├── magazines.html          Magazine library, 3D covers, subscribe
├── news.html               Newsroom, lead story + grid + sidebar
├── about.html              Company story, milestones, leadership
├── contact.html            Contact desks, form, offices, FAQ
│
├── assets/
│   ├── css/
│   │   ├── styles.css      Tokens, reset, typography, layout, both themes
│   │   ├── components.css  Every reusable block (30 numbered sections)
│   │   ├── animations.css  Keyframes, reveal primitives, motion rules
│   │   └── responsive.css  Breakpoint overrides — loaded last
│   ├── js/
│   │   ├── script.js       Theme, nav, filters, tabs, forms, countdown
│   │   └── animations.js   Preloader, Lenis, GSAP, reveals, cursor, canvas
│   ├── fonts/              Self-hosted woff2 (Inter, Instrument Serif, JetBrains Mono)
│   ├── vendor/             GSAP 3.12 + ScrollTrigger, Lenis 1.1
│   └── img/                Generated placeholder art (see below)
│
├── build/
│   ├── generate-assets.mjs Regenerates all placeholder SVG art
│   └── compose.mjs         Re-stamps shared nav/footer across the 13 pages
│
├── robots.txt
└── sitemap.xml
```

**Load order matters.** CSS is written so that `styles.css → components.css →
animations.css → responsive.css` resolves without a single `!important` in the
component layer. Keep that order.

---

## Design system

### Colour

Everything is a CSS custom property on `:root` / `[data-theme="dark"]`. There
are no hard-coded colours in the component layer, so re-skinning the theme means
editing one block in `styles.css`.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--canvas` | `#f6f5f2` | `#08090c` | Page background |
| `--surface` | `#ffffff` | `#101218` | Cards, inputs, popovers |
| `--ink` | `#0a0b0e` | `#f4f5f7` | Primary text |
| `--ink-3` | `#5f636b` | `#a4aab6` | Secondary text |
| `--ink-4` | `#6b6f78` | `#8b91a0` | Faintest text still ≥ 4.5:1 |
| `--line` | 10% ink | 11% white | Hairlines |
| `--accent` | `#1b4dff` | `#6b8cff` | Interactive accent |
| `--ok` / `--warn` | `#15803d` / `#b45309` | `#4ade80` / `#fbbf24` | Status pills |

The brand gradient (`--grad-brand`, indigo → violet → saffron) is used sparingly:
primary CTA hover, the logo mark, progress fills, and gradient text. Seven sector
accents (`--sector-ai`, `--sector-health`, …) drive category dots and track colours.

**Do not introduce a colour below `--ink-4`.** Those two values are the lightest
text that clears WCAG AA on their own canvas; the audit below depends on it.

### Typography

Three families, self-hosted, latin + latin-ext subsets only (~230 KB total):

- **Inter** — UI and body. Variable weight 400–700.
- **Instrument Serif** — editorial accents only (`.serif`, `.serif-i`). Used for
  the italic phrase inside a headline and for pull quotes. Never for UI.
- **JetBrains Mono** — eyebrows, labels, timestamps, metadata (`.mono`).

The scale is fluid: every step is a `clamp()`, so there are no typographic
breakpoints. `--fs-mono` through `--fs-5xl`. Headings use negative tracking that
tightens as they get larger (`--tracking-tight` → `--tracking-tighter`).

### Spacing, grid, elevation

- Spacing is an 8pt scale (`--sp-1`…`--sp-12`) plus two fluid values:
  `--section-y` for vertical rhythm and `--gutter` for page inset.
- Layout uses `.shell` (1440px), `.shell-wide` (1720px), `.shell-narrow` (980px).
  Asymmetric layouts use `.split` with a per-instance `--split` ratio; every
  `.split` collapses to one column below 860px.
- Five shadow steps, `--shadow-xs` … `--shadow-xl`, plus `--shadow-glow` for the
  brand-tinted lift on primary actions.
- Radii: 8 / 12 / 16 / 20 / 24 / 32 / 44 px. Cards sit at 24, sections at 44.

### Motion

The rules are written at the top of `animations.css` and enforced throughout:

1. Entrances run 500–900 ms on `--ease-out`, travel ≤ 28 px, never opacity-only.
2. Interactions run 160–280 ms — fast enough to read as a direct response.
3. Only `transform`, `opacity` and `filter` are animated. Never width or top.
4. Siblings stagger by 60–90 ms, capped at 8 items so long grids don't crawl.
5. Everything decorative is disabled under `prefers-reduced-motion: reduce`.

---

## How the JavaScript is organised

Both files are IIFEs with no globals beyond `window.lenis` and `window.EletsToast`.
Every module checks for its own markup and returns silently if absent, which is
why one pair of files serves all thirteen pages.

`script.js` — theme switch, sticky/auto-hiding nav, mega menus, mobile drawer,
filter chips, live search, tabs, accordions, agenda disclosure + bookmarking,
modals, countdown, the multi-step form, toasts, marquee cloning, drag rails,
the cursor-following sector preview, sticky CTA bar, scroll-spy.

`animations.js` — preloader, Lenis smooth scroll, IntersectionObserver reveals,
line-by-line text splitting, counters, progress bars, custom cursor, magnetic
buttons, 3D tilt, the hero gradient-mesh canvas, particles, and the GSAP
ScrollTrigger layer.

### Progressive enhancement contract

This is the part worth preserving if you refactor:

- **Reveals are driven by IntersectionObserver, not GSAP.** If the GSAP or Lenis
  files fail to load, every piece of content still appears. GSAP only *adds*
  parallax, pinning and scrubbed effects.
- `<html class="no-js">` is removed by an inline script in `<head>`. If
  JavaScript is off entirely, `.no-js` rules force all hidden content visible.
- The preloader has a hard 2.6 s failsafe. A stalled image can never trap a
  visitor behind the curtain.
- The hero canvas pauses when scrolled out of view and when the tab is hidden.

---

## Placeholder imagery

Every image in `assets/img/**` is a generated SVG — gradient-mesh portraits,
event covers, magazine covers, video thumbnails, gallery tiles and partner
wordmarks. They are deterministic (seeded from the subject's name), weigh about
450 KB in total, and make no external requests.

**To use real photography:** replace the files in place, keeping the same aspect
ratio. The markup already carries `width`/`height`, `loading="lazy"` and
`decoding="async"`, so layout is reserved and nothing shifts.

| Folder | Ratio | Count |
|---|---|---|
| `img/speakers/` | 1:1 | 16 |
| `img/events/` | 8:5 (+ one 2:1 banner) | 13 |
| `img/magazines/` | 3:4 | 6 |
| `img/videos/` | 16:9 | 8 |
| `img/gallery/` | mixed, for the masonry | 12 |
| `img/partners/` | 220×48 flat-ink wordmarks | 12 |

Partner marks are flat ink rather than `currentColor`, because an SVG loaded
through `<img>` cannot inherit page colour. Dark mode inverts them via
`--logo-filter`.

To regenerate: `node build/generate-assets.mjs`

---

## Editing shared chrome

The navigation, footer, icon sprite and script tags are duplicated verbatim into
each page — there is no server-side include, by design. After editing any of
them in `index.html`, run:

```bash
node build/compose.mjs
```

That re-stamps the shared blocks into the other twelve pages from
`build/content/*.html`, which hold each page's `<main>` only.

If you later move onto a templating engine, `partials/head.html` lists the five
blocks worth extracting.

---

## Accessibility

Audited with axe-core against WCAG 2.1 A and AA, in both themes, across all
thirteen pages: **zero violations**.

What that involved, and what to preserve:

- Semantic landmarks throughout; a skip link is the first tab stop on every page.
- Tabs implement the full ARIA tabs pattern including arrow-key navigation.
- Accordions and agenda sessions are buttons with `aria-expanded`.
- Filter chips use `aria-pressed`; the sliding pill is decorative, and the
  pressed chip carries its own solid background so its contrast is real.
- Every form control has a label (visible or `.sr-only`); required fields are
  marked in both text and `required`.
- Speaker badges sit on dark portraits and use their own dark chip with light
  ink, because the light-theme pill colours would be unreadable there.
- The transparent nav has a scrim beneath it so the wordmark never lands on a
  light gradient blob.
- `prefers-reduced-motion`, `prefers-contrast: more` and print styles are all
  handled in `responsive.css`.

Decorative SVG carries `aria-hidden="true"`; meaningful imagery carries real
`alt` text.

---

## Performance notes

- No render-blocking third-party requests. Fonts and libraries are self-hosted.
- Two preloaded woff2 files cover the visible-on-load text.
- All below-the-fold imagery is `loading="lazy" decoding="async"` with explicit
  dimensions, so CLS stays at zero.
- The hero canvas renders at 22% resolution and is upscaled by the compositor.
- Animations are transform/opacity only, so they stay on the compositor thread.
- Total JavaScript: ~30 KB of theme code, plus ~128 KB of vendored GSAP + Lenis.
  Both `<script>` tags are `defer`, and the theme degrades cleanly without them.

If you would rather load GSAP and Lenis from a CDN, swap the three tags at the
bottom of each page for:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js" defer></script>
```

---

## Content, and what is real

Event names, dates, cities, speaker names and designations, magazine titles,
partner names and headline statistics are taken from Elets' own published
material (events.eletsonline.com, indiaaisummit.in, the PSU Summit and World
Education Summit sites) as of July 2026.

Two things are **not** real and are labelled as such on the pages themselves:

- **Testimonial quotations** are placeholder copy for design review. They are
  attributed by role only, never to a named individual.
- **Seat-allocation percentages, ticket prices and partnership rates** are
  illustrative, to demonstrate the components.

Session descriptions and body copy are written to be plausible for these events;
review them before publishing.

---

## Browser support

Chrome/Edge 111+, Safari 16.4+, Firefox 113+ — the floor is set by
`color-mix()`, `:has()`-free selectors, and CSS nesting-free syntax (there is
none, deliberately). `backdrop-filter` degrades to a solid surface. The layout
itself works considerably further back.
