/* ==========================================================================
   ELETS EVENTS — CORE UI
   script.js · theme, navigation, filters, tabs, accordions, forms, countdown
   --------------------------------------------------------------------------
   No framework. No dependencies. Every module is defensive: if its markup
   isn't on the page it returns silently, so one file serves all 13 pages.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------ helpers */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const on = (el, ev, fn, o) => el && el.addEventListener(ev, fn, o);
  const raf = window.requestAnimationFrame.bind(window);

  document.documentElement.classList.remove('no-js');

  const store = {
    get(k, f) {
      try {
        const v = localStorage.getItem(k);
        return v === null ? f : v;
      } catch (e) {
        return f;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, v);
      } catch (e) {
        /* private mode — fail quietly */
      }
    },
  };

  /* ═══════════════════════════════════════════════ 01 · THEME
     Light is the default. The inline script in <head> has already applied the
     stored/system choice to avoid a flash; this only wires the toggle.        */
  const Theme = {
    init() {
      this.root = document.documentElement;
      $$('[data-theme-toggle]').forEach((b) => on(b, 'click', () => this.flip(b)));
      // follow the OS if the user has never chosen manually
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      on(mq, 'change', (e) => {
        if (store.get('elets-theme', null)) return;
        this.apply(e.matches ? 'dark' : 'light');
      });
    },
    flip(btn) {
      const next =
        this.root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';

      // Apply immediately — the switch must feel instantaneous. `.theming`
      // adds a short colour transition to every element for the duration of
      // the swap, then gets removed so it costs nothing the rest of the time.
      // (A View Transition was tried here and rejected: it defers the DOM
      // update until the old frame is captured, which reads as lag.)
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.root.classList.add('theming');
        clearTimeout(this._t);
        this._t = setTimeout(() => this.root.classList.remove('theming'), 260);
      }
      this.apply(next, true);

      if (btn) {
        btn.setAttribute(
          'aria-label',
          `Switch to ${next === 'dark' ? 'light' : 'dark'} theme`
        );
      }
    },
    apply(t, persist) {
      this.root.setAttribute('data-theme', t);
      const meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', t === 'dark' ? '#08090c' : '#f6f5f2');
      if (persist) store.set('elets-theme', t);
      document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: t } }));
    },
  };

  /* ═══════════════════════════════════════════════ 02 · NAVIGATION */
  const Nav = {
    init() {
      this.el = $('.nav');
      if (!this.el) return;
      this.last = 0;
      this.onScroll();
      on(window, 'scroll', () => this.onScroll(), { passive: true });
      this.megaMenus();
      this.drawer();
    },
    onScroll() {
      const y = window.scrollY;
      this.el.classList.toggle('is-stuck', y > 24);
      // hide on scroll-down, reveal on scroll-up — but never while a menu is open
      const menuOpen = $('.mega.is-open') || $('.drawer.is-open');
      this.el.classList.toggle('is-hidden', !menuOpen && y > 480 && y > this.last + 6);
      this.last = y;
    },
    megaMenus() {
      const triggers = $$('[data-mega]');
      let closeTimer;
      const closeAll = (except) => {
        triggers.forEach((t) => {
          const p = $('#' + t.getAttribute('data-mega'));
          if (p && p !== except) {
            p.classList.remove('is-open');
            t.setAttribute('aria-expanded', 'false');
          }
        });
      };
      triggers.forEach((t) => {
        const panel = $('#' + t.getAttribute('data-mega'));
        if (!panel) return;
        const open = () => {
          clearTimeout(closeTimer);
          closeAll(panel);
          panel.classList.add('is-open');
          t.setAttribute('aria-expanded', 'true');
        };
        const close = () => {
          closeTimer = setTimeout(() => {
            panel.classList.remove('is-open');
            t.setAttribute('aria-expanded', 'false');
          }, 140);
        };
        on(t, 'mouseenter', open);
        on(t, 'focus', open);
        on(t, 'click', (e) => {
          e.preventDefault();
          panel.classList.contains('is-open') ? closeAll() : open();
        });
        on(t.parentElement, 'mouseleave', close);
        on(panel, 'mouseenter', () => clearTimeout(closeTimer));
        on(panel, 'mouseleave', close);
      });
      on(document, 'keydown', (e) => e.key === 'Escape' && closeAll());
      on(document, 'click', (e) => {
        if (!e.target.closest('.nav')) closeAll();
      });
    },
    drawer() {
      const burger = $('.burger');
      const drawer = $('.drawer');
      if (!burger || !drawer) return;
      const set = (open) => {
        burger.setAttribute('aria-expanded', String(open));
        drawer.classList.toggle('is-open', open);
        document.body.style.overflow = open ? 'hidden' : '';
        if (window.lenis) open ? window.lenis.stop() : window.lenis.start();
      };
      on(burger, 'click', () =>
        set(burger.getAttribute('aria-expanded') !== 'true')
      );
      $$('a', drawer).forEach((a) => on(a, 'click', () => set(false)));
      on(document, 'keydown', (e) => e.key === 'Escape' && set(false));
    },
  };

  /* ═══════════════════════════════════════════════ 03 · FILTER CHIPS
     Filters any grid of [data-cat] children. Chips carry data-filter.        */
  const Filters = {
    init() {
      $$('[data-filters]').forEach((bar) => {
        const targetSel = bar.getAttribute('data-filters');
        const grid = $(targetSel);
        if (!grid) return;
        const pill = $('.filters__pill', bar);
        const btns = $$('button', bar);
        const empty = grid.parentElement.querySelector('[data-empty]');

        const movePill = (btn) => {
          if (!pill) return;
          pill.style.width = btn.offsetWidth + 'px';
          pill.style.transform = `translateX(${btn.offsetLeft}px)`;
        };

        const run = (btn) => {
          const cat = btn.getAttribute('data-filter');
          btns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
          movePill(btn);
          let shown = 0;
          $$('[data-cat]', grid).forEach((card, i) => {
            const match = cat === 'all' || card.getAttribute('data-cat').split(' ').includes(cat);
            if (match) shown++;
            card.style.transitionDelay = match ? `${Math.min(i, 8) * 35}ms` : '0ms';
            card.classList.toggle('hide', !match);
            if (match) {
              card.style.opacity = '0';
              card.style.transform = 'translateY(14px)';
              raf(() =>
                raf(() => {
                  card.style.opacity = '';
                  card.style.transform = '';
                })
              );
            }
          });
          if (empty) empty.classList.toggle('hide', shown > 0);
          grid.setAttribute('aria-busy', 'false');
        };

        btns.forEach((b) => on(b, 'click', () => run(b)));
        const active = btns.find((b) => b.getAttribute('aria-pressed') === 'true') || btns[0];
        if (active) {
          movePill(active);
          on(window, 'resize', () => movePill($('[aria-pressed="true"]', bar) || active));
          // fonts can shift widths after first paint
          if (document.fonts) document.fonts.ready.then(() => movePill($('[aria-pressed="true"]', bar) || active));
        }
      });
    },
  };

  /* ═══════════════════════════════════════════════ 04 · LIVE SEARCH */
  const Search = {
    init() {
      $$('[data-search]').forEach((input) => {
        const grid = $(input.getAttribute('data-search'));
        if (!grid) return;
        const empty = grid.parentElement.querySelector('[data-empty]');
        let t;
        on(input, 'input', () => {
          clearTimeout(t);
          t = setTimeout(() => {
            const q = input.value.trim().toLowerCase();
            let shown = 0;
            $$('[data-search-text]', grid).forEach((el) => {
              const hit = !q || el.getAttribute('data-search-text').toLowerCase().includes(q);
              el.classList.toggle('hide', !hit);
              if (hit) shown++;
            });
            if (empty) empty.classList.toggle('hide', shown > 0);
          }, 120);
        });
      });
    },
  };

  /* ═══════════════════════════════════════════════ 05 · TABS */
  const Tabs = {
    init() {
      $$('[role="tablist"]').forEach((list) => {
        const tabs = $$('[role="tab"]', list);
        const select = (tab) => {
          tabs.forEach((t) => {
            const on_ = t === tab;
            t.setAttribute('aria-selected', String(on_));
            t.tabIndex = on_ ? 0 : -1;
            const panel = document.getElementById(t.getAttribute('aria-controls'));
            if (panel) panel.hidden = !on_;
          });
        };
        tabs.forEach((tab) => {
          on(tab, 'click', () => select(tab));
          on(tab, 'keydown', (e) => {
            const i = tabs.indexOf(tab);
            let n = null;
            if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
            if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
            if (e.key === 'Home') n = tabs[0];
            if (e.key === 'End') n = tabs[tabs.length - 1];
            if (n) {
              e.preventDefault();
              select(n);
              n.focus();
            }
          });
        });
      });
    },
  };

  /* ═══════════════════════════════════════════════ 06 · ACCORDION + AGENDA */
  const Disclose = {
    init() {
      // FAQ-style accordions
      $$('.acc').forEach((acc) => {
        const btn = $('.acc__btn', acc);
        const panel = $('.acc__panel', acc);
        if (!btn || !panel) return;
        on(btn, 'click', () => {
          const open = acc.classList.toggle('is-open');
          btn.setAttribute('aria-expanded', String(open));
        });
      });
      // agenda sessions
      $$('.slot').forEach((slot) => {
        const btn = $('.slot__head', slot);
        if (!btn) return;
        on(btn, 'click', () => {
          const open = slot.classList.toggle('is-open');
          btn.setAttribute('aria-expanded', String(open));
        });
      });
      // expand / collapse all
      $$('[data-expand-all]').forEach((b) =>
        on(b, 'click', () => {
          const scope = $(b.getAttribute('data-expand-all'));
          if (!scope) return;
          const anyClosed = $$('.slot', scope).some((s) => !s.classList.contains('is-open'));
          $$('.slot', scope).forEach((s) => {
            s.classList.toggle('is-open', anyClosed);
            const h = $('.slot__head', s);
            if (h) h.setAttribute('aria-expanded', String(anyClosed));
          });
          b.textContent = anyClosed ? 'Collapse all' : 'Expand all';
        })
      );
      // bookmark a session
      $$('[data-bookmark]').forEach((b) => {
        const id = b.getAttribute('data-bookmark');
        const saved = store.get('elets-saved', '').split(',').filter(Boolean);
        if (saved.includes(id)) b.setAttribute('aria-pressed', 'true');
        on(b, 'click', (e) => {
          e.stopPropagation();
          const list = store.get('elets-saved', '').split(',').filter(Boolean);
          const i = list.indexOf(id);
          i > -1 ? list.splice(i, 1) : list.push(id);
          store.set('elets-saved', list.join(','));
          b.setAttribute('aria-pressed', String(i === -1));
          Toast.show(i === -1 ? 'Session saved to your agenda' : 'Removed from your agenda');
        });
      });
    },
  };

  /* ═══════════════════════════════════════════════ 07 · MODALS */
  const Modal = {
    init() {
      $$('[data-modal-open]').forEach((t) =>
        on(t, 'click', (e) => {
          e.preventDefault();
          this.open($('#' + t.getAttribute('data-modal-open')), t);
        })
      );
      $$('.modal').forEach((m) => {
        $$('[data-modal-close], .modal__scrim', m).forEach((c) =>
          on(c, 'click', () => this.close(m))
        );
      });
      on(document, 'keydown', (e) => {
        if (e.key === 'Escape') $$('.modal.is-open').forEach((m) => this.close(m));
      });
    },
    open(m, trigger) {
      if (!m) return;
      this.opener = trigger;
      m.classList.add('is-open');
      m.removeAttribute('aria-hidden');
      document.body.style.overflow = 'hidden';
      if (window.lenis) window.lenis.stop();
      const f = m.querySelector('[autofocus], button, a, input');
      if (f) setTimeout(() => f.focus(), 60);
    },
    close(m) {
      m.classList.remove('is-open');
      m.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (window.lenis) window.lenis.start();
      const v = m.querySelector('video, iframe');
      if (v) v.tagName === 'VIDEO' ? v.pause() : (v.src = v.src);
      if (this.opener) this.opener.focus();
    },
  };

  /* ═══════════════════════════════════════════════ 08 · COUNTDOWN */
  const Countdown = {
    init() {
      const els = $$('[data-countdown]');
      if (!els.length) return;
      const tick = () => {
        els.forEach((el) => {
          const target = new Date(el.getAttribute('data-countdown')).getTime();
          let d = Math.max(0, target - Date.now());
          const days = Math.floor(d / 864e5);
          const hrs = Math.floor((d % 864e5) / 36e5);
          const min = Math.floor((d % 36e5) / 6e4);
          const sec = Math.floor((d % 6e4) / 1e3);
          const set = (k, v) => {
            const n = el.querySelector(`[data-cd="${k}"]`);
            if (n) {
              const s = String(v).padStart(2, '0');
              if (n.textContent !== s) n.textContent = s;
            }
          };
          set('d', days);
          set('h', hrs);
          set('m', min);
          set('s', sec);
          if (d === 0) el.setAttribute('data-elapsed', 'true');
        });
      };
      tick();
      setInterval(tick, 1000);
    },
  };

  /* ═══════════════════════════════════════════════ 09 · MULTI-STEP FORM */
  const Stepper = {
    init() {
      const form = $('[data-stepper]');
      if (!form) return;
      const panes = $$('.pane', form);
      const steps = $$('.step', form);
      const next = $('[data-step-next]', form);
      const prev = $('[data-step-prev]', form);
      const submit = $('[data-step-submit]', form);
      let i = 0;

      const paint = () => {
        panes.forEach((p, n) => p.classList.toggle('is-active', n === i));
        steps.forEach((s, n) => {
          s.classList.toggle('is-active', n === i);
          s.classList.toggle('is-done', n < i);
        });
        if (prev) prev.style.visibility = i === 0 ? 'hidden' : 'visible';
        if (next) next.classList.toggle('hide', i === panes.length - 1);
        if (submit) submit.classList.toggle('hide', i !== panes.length - 1);
        const y = form.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({ top: y, behavior: 'smooth' });
        Stepper.summary(form);
      };

      const valid = () => {
        const pane = panes[i];
        let ok = true;
        $$('[required]', pane).forEach((f) => {
          if (f.type === 'radio') {
            const grp = $$(`[name="${f.name}"]`, pane);
            if (!grp.some((r) => r.checked)) ok = false;
            return;
          }
          if (!f.checkValidity()) {
            ok = false;
            f.classList.add('is-invalid');
            f.style.borderColor = 'var(--rose-500)';
            f.addEventListener('input', () => (f.style.borderColor = ''), { once: true });
          }
        });
        if (!ok) {
          const bad = pane.querySelector('[required]:invalid');
          if (bad) bad.focus();
          Toast.show('Please complete the highlighted fields');
        }
        return ok;
      };

      on(next, 'click', () => {
        if (!valid()) return;
        i = Math.min(i + 1, panes.length - 1);
        paint();
      });
      on(prev, 'click', () => {
        i = Math.max(i - 1, 0);
        paint();
      });
      on(form, 'change', () => Stepper.summary(form));
      on(form, 'submit', (e) => {
        e.preventDefault();
        if (!valid()) return;
        const done = $('[data-step-done]', form.parentElement) || $('[data-step-done]');
        if (done) {
          form.classList.add('hide');
          done.classList.remove('hide');
          const tick = $('.tick', done);
          if (tick) tick.classList.add('is-on');
          window.scrollTo({
            top: done.getBoundingClientRect().top + window.scrollY - 140,
            behavior: 'smooth',
          });
        }
      });
      paint();
    },
    summary(form) {
      const box = $('[data-summary]');
      if (!box) return;
      const rows = $$('[data-summary-row]', box);
      rows.forEach((row) => {
        const key = row.getAttribute('data-summary-row');
        const field = form.querySelector(`[name="${key}"]:checked`) || form.querySelector(`[name="${key}"]`);
        const out = $('[data-summary-val]', row);
        if (!out) return;
        let v = '';
        if (field) {
          v = field.type === 'radio' ? field.getAttribute('data-label') || field.value : field.value;
        }
        out.textContent = v || '—';
      });
      const priceField = form.querySelector('[name="pass"]:checked');
      const total = $('[data-summary-total]');
      if (total && priceField) total.textContent = priceField.getAttribute('data-price') || '—';
    },
  };

  /* ═══════════════════════════════════════════════ 10 · FORMS (generic) */
  const Forms = {
    init() {
      $$('form[data-demo]').forEach((f) =>
        on(f, 'submit', (e) => {
          e.preventDefault();
          if (!f.checkValidity()) {
            f.reportValidity();
            return;
          }
          const btn = $('[type="submit"]', f);
          if (btn) {
            const label = btn.textContent;
            btn.textContent = 'Sending…';
            btn.setAttribute('aria-disabled', 'true');
            setTimeout(() => {
              btn.textContent = label;
              btn.removeAttribute('aria-disabled');
              f.reset();
              Toast.show(f.getAttribute('data-demo') || 'Thanks — we’ll be in touch.');
            }, 900);
          }
        })
      );
    },
  };

  /* ═══════════════════════════════════════════════ 11 · TOAST */
  const Toast = {
    show(msg) {
      let t = $('.toast');
      if (!t) {
        t = document.createElement('div');
        t.className = 'toast';
        t.setAttribute('role', 'status');
        t.setAttribute('aria-live', 'polite');
        document.body.appendChild(t);
      }
      t.innerHTML =
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><span></span>';
      $('span', t).textContent = msg;
      raf(() => t.classList.add('is-on'));
      clearTimeout(this._t);
      this._t = setTimeout(() => t.classList.remove('is-on'), 3200);
    },
  };
  window.EletsToast = Toast;

  /* ═══════════════════════════════════════════════ 12 · MARQUEE
     Duplicates the track so the CSS translate(-100%) loop is seamless.       */
  const Marquee = {
    init() {
      $$('.marquee').forEach((m) => {
        const track = $('.marquee__track', m);
        if (!track || track.dataset.cloned) return;
        const clone = track.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.dataset.cloned = '1';
        m.appendChild(clone);
      });
    },
  };

  /* ═══════════════════════════════════════════════ 13 · DRAG RAILS */
  const Rails = {
    init() {
      $$('.speaker-rail, .vid-row').forEach((rail) => {
        let down = false, startX = 0, startL = 0, moved = 0;
        on(rail, 'pointerdown', (e) => {
          if (e.pointerType === 'touch') return;
          down = true;
          moved = 0;
          startX = e.clientX;
          startL = rail.scrollLeft;
          rail.classList.add('is-dragging');
        });
        on(window, 'pointerup', () => {
          if (!down) return;
          down = false;
          rail.classList.remove('is-dragging');
        });
        on(rail, 'pointermove', (e) => {
          if (!down) return;
          const dx = e.clientX - startX;
          moved = Math.abs(dx);
          rail.scrollLeft = startL - dx;
        });
        on(rail, 'click', (e) => {
          if (moved > 6) {
            e.preventDefault();
            e.stopPropagation();
          }
        }, true);

        // arrow controls, if present
        const wrap = rail.closest('[data-rail]');
        if (wrap) {
          const step = () => Math.max(260, rail.clientWidth * 0.72);
          on($('[data-rail-prev]', wrap), 'click', () =>
            rail.scrollBy({ left: -step(), behavior: 'smooth' })
          );
          on($('[data-rail-next]', wrap), 'click', () =>
            rail.scrollBy({ left: step(), behavior: 'smooth' })
          );
        }
      });
    },
  };

  /* ═══════════════════════════════════════════════ 14 · INDEX PEEK
     Hovering a sector row floats a preview image beside the cursor.          */
  const Peek = {
    init() {
      const list = $('[data-peek-list]');
      if (!list || window.matchMedia('(hover: none)').matches) return;
      const peek = document.createElement('div');
      peek.className = 'index-peek';
      peek.innerHTML = '<img alt="" width="270" height="190">';
      document.body.appendChild(peek);
      const img = $('img', peek);
      let tx = 0, ty = 0, cx = 0, cy = 0, on_ = false;

      $$('[data-peek]', list).forEach((row) => {
        on(row, 'mouseenter', () => {
          img.src = row.getAttribute('data-peek');
          peek.classList.add('is-on');
          on_ = true;
        });
        on(row, 'mouseleave', () => {
          peek.classList.remove('is-on');
          on_ = false;
        });
      });
      on(window, 'mousemove', (e) => {
        tx = e.clientX + 150;
        ty = e.clientY;
      });
      (function loop() {
        cx += (tx - cx) * 0.14;
        cy += (ty - cy) * 0.14;
        peek.style.transform = `translate(${cx - 135}px, ${cy - 95}px) scale(${on_ ? 1 : 0.9})`;
        raf(loop);
      })();
    },
  };

  /* ═══════════════════════════════════════════════ 15 · STICKY CTA BAR */
  const StickyBar = {
    init() {
      const bar = $('[data-sticky-bar]');
      if (!bar) return;
      const sentinel = $(bar.getAttribute('data-sticky-bar')) || $('.hero, .page-head');
      if (!sentinel) return;
      const io = new IntersectionObserver(
        ([e]) => bar.classList.toggle('is-on', !e.isIntersecting),
        { rootMargin: '-40% 0px 0px 0px' }
      );
      io.observe(sentinel);
    },
  };

  /* ═══════════════════════════════════════════════ 16 · MISC */
  const Misc = {
    init() {
      // year stamps
      $$('[data-year]').forEach((e) => (e.textContent = new Date().getFullYear()));

      // copy-to-clipboard
      $$('[data-copy]').forEach((b) =>
        on(b, 'click', async () => {
          try {
            await navigator.clipboard.writeText(b.getAttribute('data-copy'));
            Toast.show('Copied to clipboard');
          } catch (e) {
            Toast.show('Could not copy');
          }
        })
      );

      // in-page anchor offset (native smooth scroll handles the rest)
      $$('a[href^="#"]:not([href="#"])').forEach((a) =>
        on(a, 'click', (e) => {
          const t = document.getElementById(a.getAttribute('href').slice(1));
          if (!t) return;
          e.preventDefault();
          const y = t.getBoundingClientRect().top + window.scrollY - 100;
          window.lenis
            ? window.lenis.scrollTo(y, { duration: 1.1 })
            : window.scrollTo({ top: y, behavior: 'smooth' });
          history.replaceState(null, '', a.getAttribute('href'));
        })
      );

      // scroll-spy for on-page section nav
      const spyLinks = $$('[data-spy]');
      if (spyLinks.length) {
        const sections = spyLinks
          .map((l) => document.getElementById(l.getAttribute('data-spy')))
          .filter(Boolean);
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((en) => {
              if (!en.isIntersecting) return;
              spyLinks.forEach((l) =>
                l.classList.toggle('is-active', l.getAttribute('data-spy') === en.target.id)
              );
            });
          },
          { rootMargin: '-45% 0px -50% 0px' }
        );
        sections.forEach((s) => io.observe(s));
      }
    },
  };

  /* ═══════════════════════════════════════════════ BOOT */
  const boot = () => {
    Theme.init();
    Nav.init();
    Filters.init();
    Search.init();
    Tabs.init();
    Disclose.init();
    Modal.init();
    Countdown.init();
    Stepper.init();
    Forms.init();
    Marquee.init();
    Rails.init();
    Peek.init();
    StickyBar.init();
    Misc.init();
  };

  document.readyState === 'loading'
    ? on(document, 'DOMContentLoaded', boot)
    : boot();
})();
