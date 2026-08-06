/* ==========================================================================
   ELETS EVENTS — MOTION ENGINE
   animations.js · preloader, Lenis smooth scroll, GSAP scroll effects,
                   text reveals, counters, cursor, magnetics, hero canvas
   --------------------------------------------------------------------------
   PROGRESSIVE ENHANCEMENT CONTRACT
   · IntersectionObserver drives every reveal, so content appears even if the
     GSAP / Lenis CDNs are blocked or slow.
   · GSAP, when present, layers on parallax, pinning and scrubbed effects.
   · prefers-reduced-motion short-circuits everything decorative.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const raf = window.requestAnimationFrame.bind(window);
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = () => typeof window.gsap !== 'undefined';

  /* ═══════════════════════════════════════════════ 01 · PRELOADER
     Counts to 100 while the page settles, then lifts. Hard 2.6s failsafe so a
     stalled image can never trap the visitor behind a curtain.               */
  const Preloader = {
    init() {
      const el = $('.loader');
      if (!el) {
        document.body.classList.add('is-loaded');
        this.done();
        return;
      }
      const fill = $('.loader__fill', el);
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
          document.body.classList.add('is-loaded');
          this.done();
          setTimeout(() => el.remove(), 700);
        }, 220);
      };

      const failsafe = setTimeout(finish, REDUCED ? 200 : 2600);
      window.addEventListener('load', () => {
        clearTimeout(failsafe);
        setTimeout(finish, REDUCED ? 0 : 450);
      });
    },
    done() {
      // fire the hero's entrance once the curtain is up
      document.dispatchEvent(new Event('elets:ready'));
      $$('.hero [data-hero-in]').forEach((el, i) => {
        el.style.setProperty('--reveal-delay', i * 80 + 'ms');
        el.classList.add('in');
      });
    },
  };

  /* ═══════════════════════════════════════════════ 02 · SMOOTH SCROLL */
  const Smooth = {
    init() {
      if (REDUCED || typeof window.Lenis === 'undefined') return;
      const lenis = new window.Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.6,
        infinite: false,
      });
      window.lenis = lenis;

      if (hasGSAP() && window.ScrollTrigger) {
        lenis.on('scroll', window.ScrollTrigger.update);
        window.gsap.ticker.add((t) => lenis.raf(t * 1000));
        window.gsap.ticker.lagSmoothing(0);
      } else {
        const loop = (t) => {
          lenis.raf(t);
          raf(loop);
        };
        raf(loop);
      }
    },
  };

  /* ═══════════════════════════════════════════════ 03 · REVEALS
     The dependable layer. Runs regardless of CDN availability.               */
  const Reveal = {
    init() {
      const items = $$('[data-reveal]');
      if (!items.length) return;
      if (REDUCED || !('IntersectionObserver' in window)) {
        items.forEach((i) => i.classList.add('in'));
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const el = e.target;
            const group = el.closest('[data-reveal-group]');
            let delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
            if (group && !el.hasAttribute('data-reveal-delay')) {
              const sibs = $$('[data-reveal]', group);
              delay = Math.min(sibs.indexOf(el), 8) * 70;
            }
            el.style.setProperty('--reveal-delay', delay + 'ms');
            el.classList.add('in');
            io.unobserve(el);
          });
        },
        { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
      );
      items.forEach((i) => io.observe(i));
    },
  };

  /* ═══════════════════════════════════════════════ 04 · TEXT REVEAL
     Splits [data-split] headings into masked lines of words. Re-splits on
     resize because line breaks move.                                          */
  const SplitText = {
    init() {
      this.targets = $$('[data-split]');
      if (!this.targets.length) return;
      if (REDUCED) {
        this.targets.forEach((t) => t.classList.add('split', 'in'));
        return;
      }
      this.targets.forEach((t) => (t.dataset.originalHtml = t.innerHTML));
      const run = () => this.targets.forEach((t) => this.split(t));
      document.fonts && document.fonts.ready ? document.fonts.ready.then(run) : run();

      let rt;
      window.addEventListener('resize', () => {
        clearTimeout(rt);
        rt = setTimeout(() => {
          this.targets.forEach((t) => {
            if (t.classList.contains('in')) return; // don't re-hide revealed text
            this.split(t);
          });
        }, 220);
      });
    },
    split(el) {
      el.innerHTML = el.dataset.originalHtml;
      // wrap each top-level text word, preserving inline markup like <em>
      const wrapWords = (node) => {
        Array.from(node.childNodes).forEach((child) => {
          if (child.nodeType === 3) {
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach((tok) => {
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
          } else if (child.nodeType === 1 && !child.classList.contains('split-word')) {
            if (child.childNodes.length === 1 && child.firstChild.nodeType === 3) {
              child.classList.add('split-word');
            } else {
              wrapWords(child);
            }
          }
        });
      };
      wrapWords(el);

      // group words into visual lines and mask each one
      const words = $$('.split-word', el);
      if (!words.length) return;
      let top = null;
      let line = null;
      const out = document.createDocumentFragment();
      words.forEach((w) => {
        const t = Math.round(w.offsetTop);
        if (top === null || Math.abs(t - top) > 4) {
          line = document.createElement('span');
          line.className = 'split-line';
          out.appendChild(line);
          top = t;
        }
        line.appendChild(w);
        line.appendChild(document.createTextNode(' '));
      });
      el.innerHTML = '';
      el.appendChild(out);
      el.classList.add('split');

      $$('.split-word', el).forEach((w, i) =>
        (w.style.transitionDelay = Math.min(i, 26) * 42 + 'ms')
      );

      if (!this.io) {
        this.io = new IntersectionObserver(
          (entries) =>
            entries.forEach((e) => {
              if (e.isIntersecting) {
                e.target.classList.add('in');
                this.io.unobserve(e.target);
              }
            }),
          { rootMargin: '0px 0px -10% 0px', threshold: 0.15 }
        );
      }
      if (!el.classList.contains('in')) this.io.observe(el);
    },
  };

  /* ═══════════════════════════════════════════════ 05 · COUNTERS */
  const Counters = {
    init() {
      const els = $$('[data-count]');
      if (!els.length) return;
      if (REDUCED || !('IntersectionObserver' in window)) {
        els.forEach((e) => this.paint(e, parseFloat(e.getAttribute('data-count'))));
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            this.run(e.target);
            io.unobserve(e.target);
          });
        },
        { threshold: 0.4 }
      );
      els.forEach((e) => io.observe(e));
    },
    run(el) {
      const to = parseFloat(el.getAttribute('data-count'));
      const dur = parseInt(el.getAttribute('data-count-dur') || '1800', 10);
      const t0 = performance.now();
      const ease = (t) => 1 - Math.pow(1 - t, 4);
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        this.paint(el, to * ease(p));
        if (p < 1) raf(step);
        else this.paint(el, to);
      };
      raf(step);
    },
    paint(el, v) {
      const dec = parseInt(el.getAttribute('data-count-dec') || '0', 10);
      const pre = el.getAttribute('data-count-pre') || '';
      const suf = el.getAttribute('data-count-suf') || '';
      const n = dec ? v.toFixed(dec) : Math.round(v);
      const grouped = el.hasAttribute('data-count-plain')
        ? n
        : Number(n).toLocaleString('en-IN', {
            minimumFractionDigits: dec,
            maximumFractionDigits: dec,
          });
      el.textContent = pre + grouped + suf;
    },
  };

  /* ═══════════════════════════════════════════════ 06 · SEAT BARS */
  const Bars = {
    init() {
      const bars = $$('.seats__fill, [data-bar]');
      if (!bars.length) return;
      const paint = (b) => (b.style.width = (b.getAttribute('data-bar') || b.dataset.pct || '60') + '%');
      if (!('IntersectionObserver' in window)) {
        bars.forEach(paint);
        return;
      }
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              paint(e.target);
              io.unobserve(e.target);
            }
          }),
        { threshold: 0.3 }
      );
      bars.forEach((b) => io.observe(b));
    },
  };

  /* ═══════════════════════════════════════════════ 07 · CURSOR */
  const Cursor = {
    init() {
      if (!FINE || REDUCED) return;
      const dot = document.createElement('div');
      dot.className = 'cursor';
      const ring = document.createElement('div');
      ring.className = 'cursor-ring';
      ring.setAttribute('aria-hidden', 'true');
      dot.setAttribute('aria-hidden', 'true');
      document.body.append(dot, ring);

      let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
      window.addEventListener(
        'mousemove',
        (e) => {
          mx = e.clientX;
          my = e.clientY;
          document.body.classList.add('cursor-ready');
        },
        { passive: true }
      );
      (function loop() {
        rx += (mx - rx) * 0.17;
        ry += (my - ry) * 0.17;
        dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
        ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
        raf(loop);
      })();

      const HOVER = 'a, button, [role="button"], input, select, textarea, .card, .video, .mag, .speaker';
      document.addEventListener('mouseover', (e) => {
        const label = e.target.closest('[data-cursor]');
        const hov = e.target.closest(HOVER);
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
      document.addEventListener('mouseleave', () =>
        document.body.classList.remove('cursor-ready')
      );
    },
  };

  /* ═══════════════════════════════════════════════ 08 · MAGNETIC */
  const Magnetic = {
    init() {
      if (!FINE || REDUCED) return;
      $$('.magnetic').forEach((el) => {
        const inner = $('.magnetic__inner', el) || el.firstElementChild;
        const strength = parseFloat(el.getAttribute('data-magnet') || '0.32');
        el.addEventListener('mousemove', (e) => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left - r.width / 2) * strength;
          const y = (e.clientY - r.top - r.height / 2) * strength;
          el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          if (inner) inner.style.transform = `translate3d(${x * 0.35}px, ${y * 0.35}px, 0)`;
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = '';
          if (inner) inner.style.transform = '';
        });
      });
    },
  };

  /* ═══════════════════════════════════════════════ 09 · 3D TILT */
  const Tilt = {
    init() {
      if (!FINE || REDUCED) return;
      $$('[data-tilt]').forEach((el) => {
        const max = parseFloat(el.getAttribute('data-tilt') || '9');
        const target = $('.mag__cover', el) || $('.tilt__inner', el) || el.firstElementChild;
        if (!target) return;
        target.style.transformStyle = 'preserve-3d';
        el.addEventListener('mousemove', (e) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          target.style.transform =
            `perspective(1100px) rotateY(${px * max * 2}deg) rotateX(${-py * max * 2}deg) translateZ(14px) scale(1.03)`;
        });
        el.addEventListener('mouseleave', () => (target.style.transform = ''));
      });
    },
  };

  /* ═══════════════════════════════════════════════ 10 · HERO CANVAS
     A soft, slow gradient-mesh field. Two blurred blobs per frame at low
     resolution, upscaled by CSS — cheap enough to hold 60fps on a laptop.    */
  const HeroCanvas = {
    init() {
      const cvs = $('.hero__canvas');
      if (!cvs || REDUCED) return;
      const ctx = cvs.getContext('2d', { alpha: true });
      if (!ctx) return;

      const SCALE = 0.22; // render small, let the browser upscale
      let w, h, t = 0, running = true;
      const blobs = [
        { x: 0.22, y: 0.34, r: 0.42, s: 0.00021, p: 0 },
        { x: 0.74, y: 0.24, r: 0.38, s: 0.00017, p: 2.1 },
        { x: 0.52, y: 0.76, r: 0.34, s: 0.00025, p: 4.2 },
        { x: 0.88, y: 0.66, r: 0.26, s: 0.00019, p: 1.1 },
      ];
      let colors = [];

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

      const draw = (now) => {
        if (!running) return;
        t = now || 0;
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
        raf(draw);
      };

      readColors();
      size();
      raf(draw);
      window.addEventListener('resize', size);
      document.addEventListener('themechange', () => setTimeout(readColors, 40));
      // pause when the hero scrolls away — no point burning frames off-screen
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([e]) => {
          const was = running;
          running = e.isIntersecting;
          if (running && !was) raf(draw);
        }).observe(cvs);
      }
      document.addEventListener('visibilitychange', () => {
        const was = running;
        running = !document.hidden;
        if (running && !was) raf(draw);
      });
    },
  };

  /* ═══════════════════════════════════════════════ 11 · FLOATING PARTICLES
     Twelve slow, low-opacity motes in the hero. Pure DOM, GPU transforms.    */
  const Particles = {
    init() {
      const host = $('[data-particles]');
      if (!host || REDUCED) return;
      const n = parseInt(host.getAttribute('data-particles') || '14', 10);
      const frag = document.createDocumentFragment();
      for (let i = 0; i < n; i++) {
        const p = document.createElement('i');
        const s = 2 + Math.random() * 4;
        p.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;
          width:${s}px;height:${s}px;
          left:${Math.random() * 100}%;top:${Math.random() * 100}%;
          background:currentColor;opacity:${0.1 + Math.random() * 0.3};
          animation:floatY ${8 + Math.random() * 12}s ease-in-out ${-Math.random() * 12}s infinite;`;
        frag.appendChild(p);
      }
      host.appendChild(frag);
    },
  };

  /* ═══════════════════════════════════════════════ 12 · GSAP LAYER */
  const Scroll = {
    init() {
      if (REDUCED || !hasGSAP() || !window.ScrollTrigger) {
        this.fallbackProgress();
        return;
      }
      const gsap = window.gsap;
      gsap.registerPlugin(window.ScrollTrigger);

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
            scrollTrigger: { trigger: el.closest('[data-parallax-scope]') || el, start: 'top bottom', end: 'bottom top', scrub: 1 },
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

      // horizontal drift on marquee rows tied to scroll direction
      $$('[data-scroll-x]').forEach((el) => {
        const amt = parseFloat(el.getAttribute('data-scroll-x') || '90');
        gsap.fromTo(
          el,
          { x: -amt },
          {
            x: amt,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
          }
        );
      });

      // pinned statement section
      $$('[data-pin]').forEach((el) => {
        window.ScrollTrigger.create({
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

      window.ScrollTrigger.refresh();
      document.fonts && document.fonts.ready.then(() => window.ScrollTrigger.refresh());
    },
    fallbackProgress() {
      const fill = $('.progress__fill');
      if (!fill) return;
      const paint = () => {
        const max = document.body.scrollHeight - innerHeight;
        fill.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
      };
      paint();
      window.addEventListener('scroll', paint, { passive: true });
    },
  };

  /* ═══════════════════════════════════════════════ BOOT */
  const boot = () => {
    Preloader.init();
    Smooth.init();
    Reveal.init();
    SplitText.init();
    Counters.init();
    Bars.init();
    Cursor.init();
    Magnetic.init();
    Tilt.init();
    HeroCanvas.init();
    Particles.init();
    Scroll.init();
  };

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', boot)
    : boot();
})();
