/* ==========================================================================
   ELETS EVENTS — MOTION ENGINE
   Ported from the theme's assets/js/animations.js.
   --------------------------------------------------------------------------
   PROGRESSIVE ENHANCEMENT CONTRACT (unchanged from the theme)
   · IntersectionObserver drives every reveal, so content appears even if the
     vendored GSAP / Lenis bundles are blocked or slow.
   · GSAP, when present, layers on parallax, pinning and scrubbed effects.
   · prefers-reduced-motion short-circuits everything decorative.

   Two scopes now exist. Page-level effects are rebuilt on every navigation;
   the preloader, smooth scroll and custom cursor are chrome that outlives the
   route, so they boot once and are guarded by module flags.
   ========================================================================== */

type Cleanup = () => void;

interface GsapLike {
  registerPlugin: (p: unknown) => void;
  to: (t: unknown, v: Record<string, unknown>) => void;
  fromTo: (t: unknown, a: Record<string, unknown>, b: Record<string, unknown>) => void;
  set: (t: unknown, v: Record<string, unknown>) => void;
  ticker: { add: (fn: (t: number) => void) => void; lagSmoothing: (n: number) => void };
}
interface ScrollTriggerLike {
  create: (v: Record<string, unknown>) => void;
  refresh: () => void;
  update: () => void;
  getAll: () => Array<{ kill: () => void }>;
}

declare global {
  interface Window {
    gsap?: GsapLike;
    ScrollTrigger?: ScrollTriggerLike;
    Lenis?: new (o: Record<string, unknown>) => {
      raf: (t: number) => void;
      on: (e: string, cb: () => void) => void;
      stop: () => void;
      start: () => void;
      scrollTo: (t: number | string, o?: unknown) => void;
    };
  }
}

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) =>
  Array.from(r.querySelectorAll<T>(s));

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
const hasGSAP = () => typeof window.gsap !== 'undefined';

/* Chrome that boots once and outlives every route change. */
let preloaderDone = false;
let smoothBooted = false;
let cursorBooted = false;

/* ═══════════════════════════════════════════════ 01 · PRELOADER
   Counts to 100 while the page settles, then lifts. Hard 2.6s failsafe so a
   stalled image can never trap the visitor behind a curtain. The element is
   React-owned, so it is hidden by class rather than removed.               */
function initPreloader() {
  if (preloaderDone) {
    heroIn();
    return;
  }
  preloaderDone = true;

  const el = $('.loader');
  if (!el) {
    document.body.classList.add('is-loaded');
    heroIn();
    return;
  }
  const fill = $<HTMLElement>('.loader__fill', el);
  const num = $('[data-loader-num]', el);
  let p = 0;
  const timer = setInterval(() => {
    p = Math.min(100, p + Math.random() * 16 + 4);
    if (fill) fill.style.width = p + '%';
    if (num) num.textContent = String(Math.floor(p)).padStart(3, '0');
    if (p >= 100) clearInterval(timer);
  }, 90);

  const finish = () => {
    clearInterval(timer);
    if (fill) fill.style.width = '100%';
    if (num) num.textContent = '100';
    setTimeout(() => {
      el.classList.add('is-done');
      el.setAttribute('aria-hidden', 'true');
      document.body.classList.add('is-loaded');
      heroIn();
    }, 220);
  };

  const failsafe = setTimeout(finish, reduced() ? 200 : 2600);
  if (document.readyState === 'complete') {
    clearTimeout(failsafe);
    setTimeout(finish, reduced() ? 0 : 250);
  } else {
    window.addEventListener(
      'load',
      () => {
        clearTimeout(failsafe);
        setTimeout(finish, reduced() ? 0 : 450);
      },
      { once: true }
    );
  }
}

/** Fire the hero's staggered entrance once the curtain is up. */
function heroIn() {
  document.dispatchEvent(new Event('elets:ready'));
  $$('.hero [data-hero-in]').forEach((el, i) => {
    el.style.setProperty('--reveal-delay', i * 80 + 'ms');
    el.classList.add('in');
  });
}

/* ═══════════════════════════════════════════════ 02 · SMOOTH SCROLL
   Exported because the Lenis bundle usually lands after the first boot: the
   runtime calls this again once the vendor scripts have evaluated.         */
export function initSmooth() {
  if (smoothBooted || reduced() || typeof window.Lenis === 'undefined') return;
  smoothBooted = true;
  const lenis = new window.Lenis({
    duration: 1.1,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.6,
    infinite: false,
  });
  window.lenis = lenis;

  if (hasGSAP() && window.ScrollTrigger) {
    lenis.on('scroll', window.ScrollTrigger.update);
    window.gsap!.ticker.add((t: number) => lenis.raf(t * 1000));
    window.gsap!.ticker.lagSmoothing(0);
  } else {
    const loop = (t: number) => {
      lenis.raf(t);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

/* ═══════════════════════════════════════════════ 07 · CURSOR */
function initCursor() {
  if (cursorBooted || !fine() || reduced()) return;
  cursorBooted = true;

  const dot = document.createElement('div');
  dot.className = 'cursor';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');
  dot.setAttribute('aria-hidden', 'true');
  document.body.append(dot, ring);

  let mx = innerWidth / 2;
  let my = innerHeight / 2;
  let rx = mx;
  let ry = my;
  window.addEventListener(
    'mousemove',
    (e) => {
      mx = e.clientX;
      my = e.clientY;
      document.body.classList.add('cursor-ready');
    },
    { passive: true }
  );
  const loop = () => {
    rx += (mx - rx) * 0.17;
    ry += (my - ry) * 0.17;
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  const HOVER = 'a, button, [role="button"], input, select, textarea, .card, .video, .mag, .speaker';
  document.addEventListener('mouseover', (e) => {
    const target = e.target as Element;
    const label = target.closest?.('[data-cursor]');
    const hov = target.closest?.(HOVER);
    if (label) {
      ring.textContent = label.getAttribute('data-cursor');
      document.body.classList.add('cursor-label');
      document.body.classList.remove('cursor-hover');
    } else if (hov) {
      ring.textContent = '';
      document.body.classList.add('cursor-hover');
      document.body.classList.remove('cursor-label');
    } else {
      ring.textContent = '';
      document.body.classList.remove('cursor-hover', 'cursor-label');
    }
  });
  document.addEventListener('mouseleave', () => document.body.classList.remove('cursor-ready'));
}

/* ========================================================================== */
export function initMotion(): Cleanup {
  const ac = new AbortController();
  const { signal } = ac;
  const extra: Cleanup[] = [];
  const observers: IntersectionObserver[] = [];
  const track = (io: IntersectionObserver) => {
    observers.push(io);
    return io;
  };

  const isReduced = reduced();

  initPreloader();
  initSmooth();
  initCursor();

  /* ═══════════════════════════════════════════════ 03 · REVEALS
     The dependable layer — runs regardless of vendor availability.          */
  const revealItems = $$('[data-reveal]');
  if (revealItems.length) {
    if (isReduced || !('IntersectionObserver' in window)) {
      revealItems.forEach((i) => i.classList.add('in'));
    } else {
      const io = track(
        new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (!e.isIntersecting) return;
              const el = e.target as HTMLElement;
              const group = el.closest('[data-reveal-group]');
              let delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
              if (group && !el.hasAttribute('data-reveal-delay')) {
                delay = Math.min($$('[data-reveal]', group).indexOf(el), 8) * 70;
              }
              el.style.setProperty('--reveal-delay', delay + 'ms');
              el.classList.add('in');
              io.unobserve(el);
            });
          },
          { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
        )
      );
      revealItems.forEach((i) => io.observe(i));
    }
  }

  /* ═══════════════════════════════════════════════ 04 · TEXT REVEAL
     Splits [data-split] headings into masked lines of words, and re-splits
     on resize because line breaks move.                                     */
  const splitTargets = $$('[data-split]');
  if (splitTargets.length) {
    if (isReduced) {
      splitTargets.forEach((t) => t.classList.add('split', 'in'));
    } else {
      const splitIo = track(
        new IntersectionObserver(
          (entries) =>
            entries.forEach((e) => {
              if (e.isIntersecting) {
                e.target.classList.add('in');
                splitIo.unobserve(e.target);
              }
            }),
          { rootMargin: '0px 0px -10% 0px', threshold: 0.15 }
        )
      );

      const split = (el: HTMLElement) => {
        el.innerHTML = el.dataset.originalHtml || el.innerHTML;

        // wrap each top-level word, preserving inline markup like <em>
        const wrapWords = (node: Node) => {
          Array.from(node.childNodes).forEach((child) => {
            if (child.nodeType === 3) {
              const frag = document.createDocumentFragment();
              (child.textContent || '').split(/(\s+)/).forEach((tok) => {
                if (!tok) return;
                if (/^\s+$/.test(tok)) {
                  frag.appendChild(document.createTextNode(tok));
                } else {
                  const s = document.createElement('span');
                  s.className = 'split-word';
                  s.textContent = tok;
                  frag.appendChild(s);
                }
              });
              node.replaceChild(frag, child);
            } else if (child.nodeType === 1 && !(child as Element).classList.contains('split-word')) {
              const elc = child as Element;
              if (elc.childNodes.length === 1 && elc.firstChild!.nodeType === 3) {
                elc.classList.add('split-word');
              } else {
                wrapWords(elc);
              }
            }
          });
        };
        wrapWords(el);

        // group words into visual lines and mask each one
        const words = $$('.split-word', el);
        if (!words.length) return;
        let top: number | null = null;
        let line: HTMLElement | null = null;
        const out = document.createDocumentFragment();
        words.forEach((w) => {
          const t = Math.round(w.offsetTop);
          if (top === null || Math.abs(t - top) > 4) {
            line = document.createElement('span');
            line.className = 'split-line';
            out.appendChild(line);
            top = t;
          }
          line!.appendChild(w);
          line!.appendChild(document.createTextNode(' '));
        });
        el.innerHTML = '';
        el.appendChild(out);
        el.classList.add('split');

        $$('.split-word', el).forEach((w, i) => (w.style.transitionDelay = Math.min(i, 26) * 42 + 'ms'));
        if (!el.classList.contains('in')) splitIo.observe(el);
      };

      splitTargets.forEach((t) => (t.dataset.originalHtml = t.innerHTML));
      const run = () => {
        if (signal.aborted) return;
        splitTargets.forEach(split);
      };
      document.fonts?.ready ? document.fonts.ready.then(run) : run();

      let rt: ReturnType<typeof setTimeout>;
      window.addEventListener(
        'resize',
        () => {
          clearTimeout(rt);
          rt = setTimeout(() => {
            splitTargets.forEach((t) => {
              if (t.classList.contains('in')) return; // don't re-hide revealed text
              split(t);
            });
          }, 220);
        },
        { signal }
      );
      extra.push(() => clearTimeout(rt));
    }
  }

  /* ═══════════════════════════════════════════════ 05 · COUNTERS */
  const counters = $$('[data-count]');
  if (counters.length) {
    const paint = (el: HTMLElement, v: number) => {
      const dec = parseInt(el.getAttribute('data-count-dec') || '0', 10);
      const pre = el.getAttribute('data-count-pre') || '';
      const suf = el.getAttribute('data-count-suf') || '';
      const n = dec ? v.toFixed(dec) : Math.round(v);
      const grouped = el.hasAttribute('data-count-plain')
        ? n
        : Number(n).toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      el.textContent = pre + grouped + suf;
    };
    const run = (el: HTMLElement) => {
      const to = parseFloat(el.getAttribute('data-count') || '0');
      const dur = parseInt(el.getAttribute('data-count-dur') || '1800', 10);
      const t0 = performance.now();
      const ease = (t: number) => 1 - Math.pow(1 - t, 4);
      const step = (now: number) => {
        if (signal.aborted) return;
        const p = Math.min(1, (now - t0) / dur);
        paint(el, to * ease(p));
        if (p < 1) requestAnimationFrame(step);
        else paint(el, to);
      };
      requestAnimationFrame(step);
    };

    if (isReduced || !('IntersectionObserver' in window)) {
      counters.forEach((e) => paint(e, parseFloat(e.getAttribute('data-count') || '0')));
    } else {
      const io = track(
        new IntersectionObserver(
          (entries) =>
            entries.forEach((e) => {
              if (!e.isIntersecting) return;
              run(e.target as HTMLElement);
              io.unobserve(e.target);
            }),
          { threshold: 0.4 }
        )
      );
      counters.forEach((e) => io.observe(e));
    }
  }

  /* ═══════════════════════════════════════════════ 06 · SEAT BARS */
  const bars = $$('.seats__fill, [data-bar]');
  if (bars.length) {
    const paint = (b: HTMLElement) => (b.style.width = (b.getAttribute('data-bar') || b.dataset.pct || '60') + '%');
    if (!('IntersectionObserver' in window)) {
      bars.forEach(paint);
    } else {
      const io = track(
        new IntersectionObserver(
          (entries) =>
            entries.forEach((e) => {
              if (e.isIntersecting) {
                paint(e.target as HTMLElement);
                io.unobserve(e.target);
              }
            }),
          { threshold: 0.3 }
        )
      );
      bars.forEach((b) => io.observe(b));
    }
  }

  /* ═══════════════════════════════════════════════ 08 · MAGNETIC */
  if (fine() && !isReduced) {
    $$('.magnetic').forEach((el) => {
      const inner = $<HTMLElement>('.magnetic__inner', el) || (el.firstElementChild as HTMLElement | null);
      const strength = parseFloat(el.getAttribute('data-magnet') || '0.32');
      el.addEventListener(
        'mousemove',
        (e) => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left - r.width / 2) * strength;
          const y = (e.clientY - r.top - r.height / 2) * strength;
          el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          if (inner) inner.style.transform = `translate3d(${x * 0.35}px, ${y * 0.35}px, 0)`;
        },
        { signal }
      );
      el.addEventListener(
        'mouseleave',
        () => {
          el.style.transform = '';
          if (inner) inner.style.transform = '';
        },
        { signal }
      );
    });

    /* ═══════════════════════════════════════════════ 09 · 3D TILT */
    $$('[data-tilt]').forEach((el) => {
      const max = parseFloat(el.getAttribute('data-tilt') || '9');
      const target =
        $<HTMLElement>('.mag__cover', el) || $<HTMLElement>('.tilt__inner', el) || (el.firstElementChild as HTMLElement | null);
      if (!target) return;
      target.style.transformStyle = 'preserve-3d';
      el.addEventListener(
        'mousemove',
        (e) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          target.style.transform = `perspective(1100px) rotateY(${px * max * 2}deg) rotateX(${-py * max * 2}deg) translateZ(14px) scale(1.03)`;
        },
        { signal }
      );
      el.addEventListener('mouseleave', () => (target.style.transform = ''), { signal });
    });
  }

  /* ═══════════════════════════════════════════════ 10 · HERO CANVAS
     A soft, slow gradient-mesh field: two blurred blobs per frame at 22%
     resolution, upscaled by the compositor — cheap enough to hold 60fps.    */
  const cvs = $<HTMLCanvasElement>('.hero__canvas');
  const ctx = cvs && !isReduced ? cvs.getContext('2d', { alpha: true }) : null;
  if (cvs && ctx) {
    const SCALE = 0.22;
    let w = 1;
    let h = 1;
    let running = true;
    let frame = 0;
    const blobs = [
      { x: 0.22, y: 0.34, r: 0.42, s: 0.00021, p: 0 },
      { x: 0.74, y: 0.24, r: 0.38, s: 0.00017, p: 2.1 },
      { x: 0.52, y: 0.76, r: 0.34, s: 0.00025, p: 4.2 },
      { x: 0.88, y: 0.66, r: 0.26, s: 0.00019, p: 1.1 },
    ];
    let colors: string[] = [];

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      colors = [
        cs.getPropertyValue('--aurora-1').trim() || 'rgba(27,77,255,.5)',
        cs.getPropertyValue('--aurora-2').trim() || 'rgba(124,58,237,.42)',
        cs.getPropertyValue('--aurora-3').trim() || 'rgba(255,90,43,.36)',
        cs.getPropertyValue('--aurora-2').trim() || 'rgba(124,58,237,.42)',
      ];
    };
    const size = () => {
      const r = cvs.getBoundingClientRect();
      w = cvs.width = Math.max(1, Math.round(r.width * SCALE));
      h = cvs.height = Math.max(1, Math.round(r.height * SCALE));
    };
    const draw = (now: number) => {
      if (!running || signal.aborted) return;
      const t = now || 0;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      blobs.forEach((b, i) => {
        const x = (b.x + Math.sin(t * b.s + b.p) * 0.1) * w;
        const y = (b.y + Math.cos(t * b.s * 1.3 + b.p) * 0.09) * h;
        const rad = b.r * Math.max(w, h) * (1 + Math.sin(t * b.s * 2 + b.p) * 0.12);
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, colors[i % colors.length]);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      });
      frame = requestAnimationFrame(draw);
    };

    readColors();
    size();
    frame = requestAnimationFrame(draw);
    window.addEventListener('resize', size, { signal });
    document.addEventListener('themechange', () => setTimeout(readColors, 40), { signal });

    // pause off-screen and in background tabs — no point burning frames
    if ('IntersectionObserver' in window) {
      const io = track(
        new IntersectionObserver(([e]) => {
          const was = running;
          running = e.isIntersecting;
          if (running && !was) frame = requestAnimationFrame(draw);
        })
      );
      io.observe(cvs);
    }
    document.addEventListener(
      'visibilitychange',
      () => {
        const was = running;
        running = !document.hidden;
        if (running && !was) frame = requestAnimationFrame(draw);
      },
      { signal }
    );
    extra.push(() => {
      running = false;
      cancelAnimationFrame(frame);
    });
  }

  /* ═══════════════════════════════════════════════ 11 · FLOATING PARTICLES */
  const host = $('[data-particles]');
  if (host && !isReduced && !host.dataset.seeded) {
    const n = parseInt(host.getAttribute('data-particles') || '14', 10);
    const frag = document.createDocumentFragment();
    const nodes: HTMLElement[] = [];
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      const s = 2 + Math.random() * 4;
      p.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;
        width:${s}px;height:${s}px;
        left:${Math.random() * 100}%;top:${Math.random() * 100}%;
        background:currentColor;opacity:${0.1 + Math.random() * 0.3};
        animation:floatY ${8 + Math.random() * 12}s ease-in-out ${-Math.random() * 12}s infinite;`;
      frag.appendChild(p);
      nodes.push(p);
    }
    host.dataset.seeded = '1';
    host.appendChild(frag);
    extra.push(() => {
      nodes.forEach((p) => p.remove());
      delete host.dataset.seeded;
    });
  }

  /* ═══════════════════════════════════════════════ 12 · GSAP LAYER
     Present on a second visit (the vendor bundles are cached and already
     evaluated); on a cold load the runtime calls initScrollFX() as soon as
     they arrive, so the first paint never waits on 128 KB of library.      */
  if (!isReduced && window.gsap && window.ScrollTrigger) {
    extra.push(initScrollFX());
  } else {
    progressFallback = startProgressFallback();
    if (progressFallback) extra.push(progressFallback);
  }

  /* ═══════════════════════════════════════════════ TEARDOWN */
  return () => {
    ac.abort();
    observers.forEach((io) => io.disconnect());
    extra.forEach((fn) => {
      try {
        fn();
      } catch {
        /* node already gone with the route */
      }
    });
  };
}

/** The no-JS-library reading indicator, replaced once GSAP scrubs it. */
let progressFallback: Cleanup | null = null;

function startProgressFallback(): Cleanup | null {
  const fill = $<HTMLElement>('.progress__fill');
  if (!fill) return null;
  const ac = new AbortController();
  const paint = () => {
    const max = document.body.scrollHeight - innerHeight;
    fill.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
  };
  paint();
  window.addEventListener('scroll', paint, { passive: true, signal: ac.signal });
  return () => ac.abort();
}

/**
 * The scrubbed/pinned layer. Split out from initMotion so the vendored GSAP
 * bundle can arrive late without holding up reveals — everything here is
 * additive polish over content that is already on screen.
 */
export function initScrollFX(): Cleanup {
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  if (reduced() || !gsap || !ST) return () => {};

  // hand the reading indicator over from the fallback
  if (progressFallback) {
    progressFallback();
    progressFallback = null;
  }

  const ac = new AbortController();
  const { signal } = ac;

  {
    gsap.registerPlugin(ST);

    // reading / page progress
    const fill = $('.progress__fill');
    if (fill) {
      gsap.to(fill, {
        scaleX: 1,
        ease: 'none',
        transformOrigin: 'left center',
        scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.25 },
      });
      gsap.set(fill, { scaleX: 0, width: '100%' });
    }

    // parallax layers
    $$('[data-parallax]').forEach((el) => {
      const amt = parseFloat(el.getAttribute('data-parallax') || '0.18');
      gsap.fromTo(
        el,
        { yPercent: -amt * 50 },
        {
          yPercent: amt * 50,
          ease: 'none',
          scrollTrigger: {
            trigger: el.closest('[data-parallax-scope]') || el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        }
      );
    });

    // hero depth — content lifts and fades as you leave
    const heroInner = $('.hero__inner');
    if (heroInner) {
      gsap.to(heroInner, {
        y: -70,
        opacity: 0.25,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8 },
      });
    }

    // agenda timeline progress line
    const agenda = $('.agenda');
    const prog = $('.agenda__progress');
    if (agenda && prog) {
      gsap.to(prog, {
        height: '100%',
        ease: 'none',
        scrollTrigger: { trigger: agenda, start: 'top 65%', end: 'bottom 75%', scrub: 0.5 },
      });
    }

    // horizontal drift tied to scroll direction
    $$('[data-scroll-x]').forEach((el) => {
      const amt = parseFloat(el.getAttribute('data-scroll-x') || '90');
      gsap.fromTo(
        el,
        { x: -amt },
        { x: amt, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.2 } }
      );
    });

    // pinned sections
    $$('[data-pin]').forEach((el) => {
      ST.create({
        trigger: el,
        start: 'top top',
        end: '+=' + (el.getAttribute('data-pin') || '60%'),
        pin: true,
        pinSpacing: true,
      });
    });

    // scale-in media on scroll
    $$('[data-scale-in]').forEach((el) => {
      gsap.fromTo(
        el,
        { scale: 0.9, borderRadius: '44px' },
        {
          scale: 1,
          borderRadius: '24px',
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 35%', scrub: 0.6 },
        }
      );
    });

    ST.refresh();
    document.fonts?.ready.then(() => {
      if (!signal.aborted) ST.refresh();
    });
  }

  // every trigger created above belongs to this route
  return () => {
    ac.abort();
    ST.getAll().forEach((t) => t.kill());
  };
}
