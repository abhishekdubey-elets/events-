'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initUI } from '@/lib/ui';
import { initMotion, initScrollFX, initSmooth } from '@/lib/motion';

/**
 * Boots the theme's behaviour layer and rebuilds it on every navigation.
 *
 * The static theme ran two IIFEs on DOMContentLoaded. Under the App Router the
 * document survives navigation while `<main>` is swapped, so each module is
 * torn down and re-bound against the new markup instead. Chrome that outlives
 * the route (preloader, Lenis, cursor) guards itself inside the modules.
 */

const VENDOR = [
  '/assets/vendor/gsap.min.js',
  '/assets/vendor/ScrollTrigger.min.js',
  '/assets/vendor/lenis.min.js',
];

let vendorPromise: Promise<void> | null = null;

/**
 * Loads GSAP + ScrollTrigger + Lenis in order, after hydration. A failure is
 * resolved rather than rejected: the theme is designed to work without them.
 */
function loadVendor(): Promise<void> {
  if (vendorPromise) return vendorPromise;
  vendorPromise = VENDOR.reduce(
    (chain, src) =>
      chain.then(
        () =>
          new Promise<void>((resolve) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const s = document.createElement('script');
            s.src = src;
            s.async = false;
            s.onload = () => resolve();
            s.onerror = () => resolve();
            document.head.appendChild(s);
          })
      ),
    Promise.resolve()
  );
  return vendorPromise;
}

export default function ThemeRuntime() {
  const pathname = usePathname();

  useEffect(() => {
    const cleanups = [initUI(), initMotion()];
    let cancelled = false;

    // Reveals are already running; smooth scroll and the scrubbed layer join
    // as soon as the vendor bundles have evaluated. Order matters — Lenis
    // hands its rAF to the GSAP ticker when both are present.
    if (!window.gsap || !window.lenis) {
      loadVendor().then(() => {
        if (cancelled) return;
        initSmooth();
        cleanups.push(initScrollFX());
      });
    }

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, [pathname]);

  // Lenis keeps its own scroll target; keep it in step with the router.
  useEffect(() => {
    if (!window.location.hash) window.lenis?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
