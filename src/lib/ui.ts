/* ==========================================================================
   ELETS EVENTS — CORE UI
   Ported from the theme's assets/js/script.js.
   --------------------------------------------------------------------------
   Same modules, same markup contract: every module looks for its own hooks
   and returns silently when they are absent, so one file serves every route.

   What changed for Next.js: the whole thing is now mount/unmount safe. Every
   listener is registered against an AbortController, every timer, observer
   and injected node is tracked, and `initUI()` hands back a teardown that
   leaves the DOM exactly as it found it. React re-runs it on each navigation.
   ========================================================================== */

type Cleanup = () => void;

declare global {
  interface Window {
    lenis?: { stop: () => void; start: () => void; scrollTo: (t: number | string, o?: unknown) => void; raf: (t: number) => void; on: (e: string, cb: () => void) => void };
    EletsToast?: { show: (msg: string) => void };
  }
}

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) =>
  r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) =>
  Array.from(r.querySelectorAll<T>(s));

const store = {
  get(k: string, f: string | null = null) {
    try {
      const v = localStorage.getItem(k);
      return v === null ? f : v;
    } catch {
      return f;
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* private mode — fail quietly */
    }
  },
};

/* ═══════════════════════════════════════════════ TOAST (module singleton) */
export const Toast = {
  _t: 0 as ReturnType<typeof setTimeout> | 0,
  show(msg: string) {
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
    const span = $('span', t);
    if (span) span.textContent = msg;
    requestAnimationFrame(() => t!.classList.add('is-on'));
    clearTimeout(this._t as ReturnType<typeof setTimeout>);
    this._t = setTimeout(() => t!.classList.remove('is-on'), 3200);
  },
};

/* ========================================================================== */
export function initUI(): Cleanup {
  const ac = new AbortController();
  const { signal } = ac;
  const extra: Cleanup[] = [];

  const on = (
    el: EventTarget | null | undefined,
    ev: string,
    fn: EventListenerOrEventListenerObject,
    opts: AddEventListenerOptions = {}
  ) => el && el.addEventListener(ev, fn, { ...opts, signal });

  const every = (ms: number, fn: () => void) => {
    const id = setInterval(fn, ms);
    extra.push(() => clearInterval(id));
  };

  const observe = (io: IntersectionObserver) => {
    extra.push(() => io.disconnect());
    return io;
  };

  if (typeof window !== 'undefined') window.EletsToast = Toast;

  /* ═══════════════════════════════════════════════ 01 · THEME
     The inline bootstrap in <head> has already applied the stored/system
     choice before first paint; this only wires the toggle.                  */
  const root = document.documentElement;
  const applyTheme = (t: string, persist?: boolean) => {
    root.setAttribute('data-theme', t);
    const meta = $<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#08090c' : '#f6f5f2');
    if (persist) store.set('elets-theme', t);
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: t } }));
  };

  let themeTimer: ReturnType<typeof setTimeout>;
  $$('[data-theme-toggle]').forEach((btn) =>
    on(btn, 'click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      // `.theming` adds a short colour transition for the duration of the
      // swap only, so it costs nothing the rest of the time. (A View
      // Transition was tried and rejected: deferring the DOM update until
      // the old frame is captured reads as lag.)
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        root.classList.add('theming');
        clearTimeout(themeTimer);
        themeTimer = setTimeout(() => root.classList.remove('theming'), 260);
      }
      applyTheme(next, true);
      btn.setAttribute('aria-label', `Switch to ${next === 'dark' ? 'light' : 'dark'} theme`);
    })
  );
  extra.push(() => clearTimeout(themeTimer));

  // follow the OS if the visitor has never chosen manually
  on(matchMedia('(prefers-color-scheme: dark)'), 'change', ((e: MediaQueryListEvent) => {
    if (store.get('elets-theme')) return;
    applyTheme(e.matches ? 'dark' : 'light');
  }) as EventListener);

  /* ═══════════════════════════════════════════════ 02 · NAVIGATION */
  const nav = $('.nav');
  if (nav) {
    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle('is-stuck', y > 24);
      // hide on scroll-down, reveal on scroll-up — never while a menu is open
      const menuOpen = $('.mega.is-open') || $('.drawer.is-open');
      nav.classList.toggle('is-hidden', !menuOpen && y > 480 && y > last + 6);
      last = y;
    };
    onScroll();
    on(window, 'scroll', onScroll, { passive: true });

    /* mega menus */
    const triggers = $$('[data-mega]');
    let closeTimer: ReturnType<typeof setTimeout>;
    const closeAll = (except?: Element) => {
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
    on(document, 'keydown', ((e: KeyboardEvent) => e.key === 'Escape' && closeAll()) as EventListener);
    on(document, 'click', ((e: MouseEvent) => {
      if (!(e.target as Element)?.closest?.('.nav')) closeAll();
    }) as EventListener);
    extra.push(() => {
      clearTimeout(closeTimer);
      closeAll();
    });

    /* mobile drawer */
    const burger = $('.burger');
    const drawer = $('.drawer');
    if (burger && drawer) {
      const set = (open: boolean) => {
        burger.setAttribute('aria-expanded', String(open));
        drawer.classList.toggle('is-open', open);
        document.body.style.overflow = open ? 'hidden' : '';
        if (window.lenis) open ? window.lenis.stop() : window.lenis.start();
      };
      on(burger, 'click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
      $$('a', drawer).forEach((a) => on(a, 'click', () => set(false)));
      on(document, 'keydown', ((e: KeyboardEvent) => e.key === 'Escape' && set(false)) as EventListener);
      // a route change closes the drawer with the page it opened
      extra.push(() => set(false));
    }
  }

  /* ═══════════════════════════════════════════════ 03 · FILTER CHIPS
     Filters any grid of [data-cat] children. Chips carry data-filter.       */
  $$('[data-filters]').forEach((bar) => {
    const grid = $(bar.getAttribute('data-filters') || '');
    if (!grid) return;
    const pill = $('.filters__pill', bar);
    const btns = $$<HTMLButtonElement>('button', bar);
    const empty = grid.parentElement?.querySelector('[data-empty]');

    const movePill = (btn: HTMLElement | null) => {
      if (!pill || !btn) return;
      pill.style.width = btn.offsetWidth + 'px';
      pill.style.transform = `translateX(${btn.offsetLeft}px)`;
    };

    const run = (btn: HTMLButtonElement) => {
      const cat = btn.getAttribute('data-filter');
      btns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      movePill(btn);
      let shown = 0;
      $$('[data-cat]', grid).forEach((card, i) => {
        const match = cat === 'all' || (card.getAttribute('data-cat') || '').split(' ').includes(cat || '');
        if (match) shown++;
        card.style.transitionDelay = match ? `${Math.min(i, 8) * 35}ms` : '0ms';
        card.classList.toggle('hide', !match);
        if (match) {
          card.style.opacity = '0';
          card.style.transform = 'translateY(14px)';
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
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
      if (document.fonts) {
        document.fonts.ready.then(() => {
          if (signal.aborted) return;
          movePill($('[aria-pressed="true"]', bar) || active);
        });
      }
    }
  });

  /* ═══════════════════════════════════════════════ 04 · LIVE SEARCH */
  $$<HTMLInputElement>('[data-search]').forEach((input) => {
    const grid = $(input.getAttribute('data-search') || '');
    if (!grid) return;
    const empty = grid.parentElement?.querySelector('[data-empty]');
    let t: ReturnType<typeof setTimeout>;
    on(input, 'input', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const q = input.value.trim().toLowerCase();
        let shown = 0;
        $$('[data-search-text]', grid).forEach((el) => {
          const hit = !q || (el.getAttribute('data-search-text') || '').toLowerCase().includes(q);
          el.classList.toggle('hide', !hit);
          if (hit) shown++;
        });
        if (empty) empty.classList.toggle('hide', shown > 0);
      }, 120);
    });
    extra.push(() => clearTimeout(t));
  });

  /* ═══════════════════════════════════════════════ 05 · TABS
     Full ARIA tabs pattern, arrow keys included.                            */
  $$('[role="tablist"]').forEach((list) => {
    const tabs = $$<HTMLElement>('[role="tab"]', list);
    const select = (tab: HTMLElement) => {
      tabs.forEach((t) => {
        const isOn = t === tab;
        t.setAttribute('aria-selected', String(isOn));
        t.tabIndex = isOn ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls') || '');
        if (panel) panel.hidden = !isOn;
      });
    };
    tabs.forEach((tab) => {
      on(tab, 'click', () => select(tab));
      on(tab, 'keydown', ((e: KeyboardEvent) => {
        const i = tabs.indexOf(tab);
        let n: HTMLElement | null = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') n = tabs[0];
        if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) {
          e.preventDefault();
          select(n);
          n.focus();
        }
      }) as EventListener);
    });
  });

  /* ═══════════════════════════════════════════════ 06 · ACCORDION + AGENDA */
  $$('.acc').forEach((acc) => {
    const btn = $('.acc__btn', acc);
    const panel = $('.acc__panel', acc);
    if (!btn || !panel) return;
    on(btn, 'click', () => btn.setAttribute('aria-expanded', String(acc.classList.toggle('is-open'))));
  });

  $$('.slot').forEach((slot) => {
    const btn = $('.slot__head', slot);
    if (!btn) return;
    on(btn, 'click', () => btn.setAttribute('aria-expanded', String(slot.classList.toggle('is-open'))));
  });

  $$('[data-expand-all]').forEach((b) =>
    on(b, 'click', () => {
      const scope = $(b.getAttribute('data-expand-all') || '');
      if (!scope) return;
      const anyClosed = $$('.slot', scope).some((s) => !s.classList.contains('is-open'));
      $$('.slot', scope).forEach((s) => {
        s.classList.toggle('is-open', anyClosed);
        $('.slot__head', s)?.setAttribute('aria-expanded', String(anyClosed));
      });
      b.textContent = anyClosed ? 'Collapse all' : 'Expand all';
    })
  );

  $$('[data-bookmark]').forEach((b) => {
    const id = b.getAttribute('data-bookmark') || '';
    const saved = (store.get('elets-saved', '') || '').split(',').filter(Boolean);
    if (saved.includes(id)) b.setAttribute('aria-pressed', 'true');
    on(b, 'click', (e) => {
      e.stopPropagation();
      const list = (store.get('elets-saved', '') || '').split(',').filter(Boolean);
      const i = list.indexOf(id);
      i > -1 ? list.splice(i, 1) : list.push(id);
      store.set('elets-saved', list.join(','));
      b.setAttribute('aria-pressed', String(i === -1));
      Toast.show(i === -1 ? 'Session saved to your agenda' : 'Removed from your agenda');
    });
  });

  /* ═══════════════════════════════════════════════ 07 · MODALS */
  let opener: HTMLElement | null = null;
  const openModal = (m: HTMLElement | null, trigger: HTMLElement) => {
    if (!m) return;
    opener = trigger;
    m.classList.add('is-open');
    m.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    window.lenis?.stop();
    const f = m.querySelector<HTMLElement>('[autofocus], button, a, input');
    if (f) setTimeout(() => f.focus(), 60);
  };
  const closeModal = (m: HTMLElement) => {
    m.classList.remove('is-open');
    m.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    window.lenis?.start();
    const v = m.querySelector<HTMLVideoElement | HTMLIFrameElement>('video, iframe');
    if (v) v.tagName === 'VIDEO' ? (v as HTMLVideoElement).pause() : ((v as HTMLIFrameElement).src = (v as HTMLIFrameElement).src);
    opener?.focus();
  };
  $$('[data-modal-open]').forEach((t) =>
    on(t, 'click', (e) => {
      e.preventDefault();
      openModal($('#' + t.getAttribute('data-modal-open')), t);
    })
  );
  $$('.modal').forEach((m) => {
    $$('[data-modal-close], .modal__scrim', m).forEach((c) => on(c, 'click', () => closeModal(m)));
  });
  on(document, 'keydown', ((e: KeyboardEvent) => {
    if (e.key === 'Escape') $$('.modal.is-open').forEach(closeModal);
  }) as EventListener);
  extra.push(() => {
    $$('.modal.is-open').forEach((m) => m.classList.remove('is-open'));
    document.body.style.overflow = '';
  });

  /* ═══════════════════════════════════════════════ 08 · COUNTDOWN */
  const cds = $$('[data-countdown]');
  if (cds.length) {
    const tick = () => {
      cds.forEach((el) => {
        const target = new Date(el.getAttribute('data-countdown') || '').getTime();
        const d = Math.max(0, target - Date.now());
        const set = (k: string, v: number) => {
          const n = el.querySelector(`[data-cd="${k}"]`);
          const s = String(v).padStart(2, '0');
          if (n && n.textContent !== s) n.textContent = s;
        };
        set('d', Math.floor(d / 864e5));
        set('h', Math.floor((d % 864e5) / 36e5));
        set('m', Math.floor((d % 36e5) / 6e4));
        set('s', Math.floor((d % 6e4) / 1e3));
        if (d === 0) el.setAttribute('data-elapsed', 'true');
      });
    };
    tick();
    every(1000, tick);
  }

  /* ═══════════════════════════════════════════════ 09 · MULTI-STEP FORM */
  const stepForm = $<HTMLFormElement>('[data-stepper]');
  if (stepForm) {
    const panes = $$('.pane', stepForm);
    const steps = $$('.step', stepForm);
    const next = $<HTMLButtonElement>('[data-step-next]', stepForm);
    const prev = $<HTMLButtonElement>('[data-step-prev]', stepForm);
    const submitBtn = $('[data-step-submit]', stepForm);
    let i = 0;

    const summary = () => {
      const box = $('[data-summary]');
      if (!box) return;
      $$('[data-summary-row]', box).forEach((row) => {
        const key = row.getAttribute('data-summary-row');
        const field =
          stepForm.querySelector<HTMLInputElement>(`[name="${key}"]:checked`) ||
          stepForm.querySelector<HTMLInputElement>(`[name="${key}"]`);
        const out = $('[data-summary-val]', row);
        if (!out) return;
        out.textContent = field
          ? (field.type === 'radio' ? field.getAttribute('data-label') || field.value : field.value) || '—'
          : '—';
      });
      const priceField = stepForm.querySelector<HTMLInputElement>('[name="pass"]:checked');
      const total = $('[data-summary-total]');
      if (total && priceField) total.textContent = priceField.getAttribute('data-price') || '—';
    };

    const paint = (scroll = true) => {
      panes.forEach((p, n) => p.classList.toggle('is-active', n === i));
      steps.forEach((s, n) => {
        s.classList.toggle('is-active', n === i);
        s.classList.toggle('is-done', n < i);
      });
      if (prev) prev.style.visibility = i === 0 ? 'hidden' : 'visible';
      if (next) next.classList.toggle('hide', i === panes.length - 1);
      if (submitBtn) submitBtn.classList.toggle('hide', i !== panes.length - 1);
      // the first paint happens on mount — never yank the page around then
      if (scroll) {
        window.scrollTo({
          top: stepForm.getBoundingClientRect().top + window.scrollY - 120,
          behavior: 'smooth',
        });
      }
      summary();
    };

    const valid = () => {
      const pane = panes[i];
      let ok = true;
      $$<HTMLInputElement>('[required]', pane).forEach((f) => {
        if (f.type === 'radio') {
          const grp = $$<HTMLInputElement>(`[name="${f.name}"]`, pane);
          if (!grp.some((r) => r.checked)) ok = false;
          return;
        }
        if (!f.checkValidity()) {
          ok = false;
          f.classList.add('is-invalid');
          f.style.borderColor = 'var(--rose-500)';
          f.addEventListener('input', () => (f.style.borderColor = ''), { once: true, signal });
        }
      });
      if (!ok) {
        pane.querySelector<HTMLElement>('[required]:invalid')?.focus();
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
    on(stepForm, 'change', summary);
    on(stepForm, 'submit', (e) => {
      e.preventDefault();
      if (!valid()) return;
      const done = $('[data-step-done]', stepForm.parentElement || document) || $('[data-step-done]');
      if (done) {
        stepForm.classList.add('hide');
        done.classList.remove('hide');
        $('.tick', done)?.classList.add('is-on');
        window.scrollTo({
          top: done.getBoundingClientRect().top + window.scrollY - 140,
          behavior: 'smooth',
        });
      }
    });
    paint(false);
  }

  /* ═══════════════════════════════════════════════ 10 · FORMS (generic) */
  $$<HTMLFormElement>('form[data-demo]').forEach((f) =>
    on(f, 'submit', (e) => {
      e.preventDefault();
      if (!f.checkValidity()) {
        f.reportValidity();
        return;
      }
      const btn = $('[type="submit"]', f);
      if (!btn) return;
      const label = btn.textContent;
      btn.textContent = 'Sending…';
      btn.setAttribute('aria-disabled', 'true');
      const id = setTimeout(() => {
        btn.textContent = label;
        btn.removeAttribute('aria-disabled');
        f.reset();
        Toast.show(f.getAttribute('data-demo') || 'Thanks — we’ll be in touch.');
      }, 900);
      extra.push(() => clearTimeout(id));
    })
  );

  /* ═══════════════════════════════════════════════ 11 · MARQUEE
     Duplicates the track so the CSS translate(-100%) loop is seamless.      */
  $$('.marquee').forEach((m) => {
    const track = $<HTMLElement>('.marquee__track', m);
    if (!track || track.dataset.cloned) return;
    const clone = track.cloneNode(true) as HTMLElement;
    clone.setAttribute('aria-hidden', 'true');
    clone.dataset.marqueeClone = '1';
    track.dataset.cloned = '1';
    m.appendChild(clone);
    // React owns `.marquee`; hand the node back before it unmounts
    extra.push(() => {
      clone.remove();
      delete track.dataset.cloned;
    });
  });

  /* ═══════════════════════════════════════════════ 12 · DRAG RAILS */
  $$('.speaker-rail, .vid-row').forEach((rail) => {
    let down = false;
    let startX = 0;
    let startL = 0;
    let moved = 0;
    on(rail, 'pointerdown', ((e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      down = true;
      moved = 0;
      startX = e.clientX;
      startL = rail.scrollLeft;
      rail.classList.add('is-dragging');
    }) as EventListener);
    on(window, 'pointerup', () => {
      if (!down) return;
      down = false;
      rail.classList.remove('is-dragging');
    });
    on(rail, 'pointermove', ((e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      moved = Math.abs(dx);
      rail.scrollLeft = startL - dx;
    }) as EventListener);
    on(
      rail,
      'click',
      (e) => {
        if (moved > 6) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      { capture: true }
    );

    const wrap = rail.closest('[data-rail]');
    if (wrap) {
      const step = () => Math.max(260, rail.clientWidth * 0.72);
      on($('[data-rail-prev]', wrap), 'click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
      on($('[data-rail-next]', wrap), 'click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
    }
  });

  /* ═══════════════════════════════════════════════ 13 · INDEX PEEK
     Hovering a sector row floats a preview image beside the cursor.         */
  const peekList = $('[data-peek-list]');
  if (peekList && !matchMedia('(hover: none)').matches) {
    const peek = document.createElement('div');
    peek.className = 'index-peek';
    peek.innerHTML = '<img alt="" width="270" height="190">';
    document.body.appendChild(peek);
    const img = $<HTMLImageElement>('img', peek)!;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let hovering = false;
    let frame = 0;

    $$('[data-peek]', peekList).forEach((row) => {
      on(row, 'mouseenter', () => {
        img.src = row.getAttribute('data-peek') || '';
        peek.classList.add('is-on');
        hovering = true;
      });
      on(row, 'mouseleave', () => {
        peek.classList.remove('is-on');
        hovering = false;
      });
    });
    on(window, 'mousemove', ((e: MouseEvent) => {
      tx = e.clientX + 150;
      ty = e.clientY;
    }) as EventListener, { passive: true });

    const loop = () => {
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      peek.style.transform = `translate(${cx - 135}px, ${cy - 95}px) scale(${hovering ? 1 : 0.9})`;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    extra.push(() => {
      cancelAnimationFrame(frame);
      peek.remove();
    });
  }

  /* ═══════════════════════════════════════════════ 14 · STICKY CTA BAR */
  const bar = $('[data-sticky-bar]');
  if (bar) {
    const sentinel = $(bar.getAttribute('data-sticky-bar') || '') || $('.hero, .page-head');
    if (sentinel) {
      observe(
        new IntersectionObserver(([e]) => bar.classList.toggle('is-on', !e.isIntersecting), {
          rootMargin: '-40% 0px 0px 0px',
        })
      ).observe(sentinel);
    }
  }

  /* ═══════════════════════════════════════════════ 15 · MISC */
  $$('[data-year]').forEach((e) => (e.textContent = String(new Date().getFullYear())));

  $$('[data-copy]').forEach((b) =>
    on(b, 'click', async () => {
      try {
        await navigator.clipboard.writeText(b.getAttribute('data-copy') || '');
        Toast.show('Copied to clipboard');
      } catch {
        Toast.show('Could not copy');
      }
    })
  );

  // in-page anchors, offset for the sticky nav
  $$<HTMLAnchorElement>('a[href^="#"]:not([href="#"])').forEach((a) =>
    on(a, 'click', (e) => {
      const hash = a.getAttribute('href') || '';
      const t = document.getElementById(hash.slice(1));
      if (!t) return;
      e.preventDefault();
      const y = t.getBoundingClientRect().top + window.scrollY - 100;
      window.lenis ? window.lenis.scrollTo(y, { duration: 1.1 }) : window.scrollTo({ top: y, behavior: 'smooth' });
      history.replaceState(null, '', hash);
    })
  );

  // scroll-spy for on-page section nav
  const spyLinks = $$('[data-spy]');
  if (spyLinks.length) {
    const io = observe(
      new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (!en.isIntersecting) return;
            spyLinks.forEach((l) =>
              l.classList.toggle('is-active', l.getAttribute('data-spy') === en.target.id)
            );
          });
        },
        { rootMargin: '-45% 0px -50% 0px' }
      )
    );
    spyLinks
      .map((l) => document.getElementById(l.getAttribute('data-spy') || ''))
      .filter((s): s is HTMLElement => Boolean(s))
      .forEach((s) => io.observe(s));
  }

  /* ═══════════════════════════════════════════════ TEARDOWN */
  return () => {
    ac.abort();
    extra.forEach((fn) => {
      try {
        fn();
      } catch {
        /* a node React already removed — nothing to undo */
      }
    });
  };
}
