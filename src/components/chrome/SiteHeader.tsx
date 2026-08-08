'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SECTOR_LEAD } from '@/data/events';

/**
 * Primary navigation, mega menus and the mobile drawer.
 *
 * Markup matches the theme byte-for-byte where it matters — `.nav`, `.mega`,
 * `[data-mega]`, `.burger` and `.drawer` are the hooks src/lib/ui.ts binds to.
 * What Next.js adds: real routes, and `aria-current` derived from the URL
 * instead of stamped in by the theme's build step.
 */

const ev = (slug: string) => `/events/${slug}`;

const SECTORS = [
  { icon: 'i-spark', label: 'Artificial Intelligence', blurb: 'India AI Summit, National AI Summit on Water', href: ev(SECTOR_LEAD.ai) },
  { icon: 'i-users', label: 'Healthcare', blurb: 'Healthcare Innovation, Patient Centricity', href: ev(SECTOR_LEAD.health) },
  { icon: 'i-book', label: 'Education & Skills', blurb: 'World Education Summit, Campus to Career', href: ev(SECTOR_LEAD.edu) },
  { icon: 'i-flag', label: 'Governance & PSU', blurb: 'National PSU Summit, Digital Innovation', href: ev(SECTOR_LEAD.gov) },
];

const ALSO = [
  { icon: 'i-globe', label: 'Smart & Resilient Cities', blurb: 'Urban Innovation Summit', href: ev(SECTOR_LEAD.city) },
  { icon: 'i-ticket', label: 'Banking & Fintech', blurb: 'NBFC100, BFSI Gamechanger, World Fintech', href: ev(SECTOR_LEAD.bfsi) },
  { icon: 'i-grid', label: 'Energy & Infrastructure', blurb: 'India Energy Expo', href: ev(SECTOR_LEAD.energy) },
  { icon: 'i-clock', label: 'Full agenda', blurb: 'Tracks, sessions and speakers', href: '/agenda' },
];

const WATCH = [
  { icon: 'i-video', label: 'Video library', blurb: 'Keynotes, panels and fireside chats', href: '/videos' },
  { icon: 'i-book', label: 'Magazine library', blurb: 'eGov · digitalLEARNING · eHEALTH · BFSI', href: '/magazines' },
];

const AROUND = [
  { icon: 'i-spark', label: 'News & insights', blurb: 'Reporting from the floor', href: '/news' },
  { icon: 'i-grid', label: 'Gallery', blurb: 'Photography from recent summits', href: '/gallery' },
];

const DRAWER_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/speakers', label: 'Speakers' },
  { href: '/agenda', label: 'Agenda' },
  { href: '/videos', label: 'Videos' },
  { href: '/magazines', label: 'Magazines' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/news', label: 'News' },
  { href: '/sponsors', label: 'Sponsors' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

function MegaItem({ icon, label, blurb, href }: { icon: string; label: string; blurb: string; href: string }) {
  return (
    <Link className="mega__item" href={href}>
      <span className="mega__ico">
        <svg width="16" height="16">
          <use href={`#${icon}`} />
        </svg>
      </span>
      <span>
        <strong>{label}</strong>
        <span>{blurb}</span>
      </span>
    </Link>
  );
}

export default function SiteHeader() {
  const pathname = usePathname() || '/';
  const section = (prefixes: string[]) =>
    prefixes.some((p) => (p === '/' ? pathname === '/' : pathname.startsWith(p)));
  const current = (prefixes: string[]) => (section(prefixes) ? ('page' as const) : undefined);

  return (
    <>
      <header className="nav" id="nav">
        <div className="nav__inner">
          {/* The lockup carries the name, so the link is labelled and both
              images stay decorative — otherwise it announces twice. */}
          <Link className="brand" href="/" aria-label="Elets Events — home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="brand__lockup brand__lockup--on-dark"
              src="/assets/img/brand/lockup-on-dark.png"
              alt=""
              width="134"
              height="68"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="brand__lockup brand__lockup--on-light"
              src="/assets/img/brand/lockup-on-light.png"
              alt=""
              width="134"
              height="68"
            />
            <span className="brand__label">Events Platform</span>
          </Link>

          <nav className="nav__menu" aria-label="Primary">
            <div className="relative">
              <button
                className="nav__link"
                data-mega="mega-events"
                aria-expanded="false"
                aria-haspopup="true"
                aria-current={current(['/events'])}
              >
                Events{' '}
                <svg className="nav__chev" width="13" height="13" aria-hidden="true">
                  <use href="#i-chev" />
                </svg>
              </button>
              <div className="mega" id="mega-events" role="region" aria-label="Events menu">
                <div className="mega__grid">
                  <div className="mega__col">
                    <h4>By sector</h4>
                    {SECTORS.map((s) => (
                      <MegaItem key={s.label} {...s} />
                    ))}
                  </div>
                  <div className="mega__col">
                    <h4>Also running</h4>
                    {ALSO.map((s) => (
                      <MegaItem key={s.label} {...s} />
                    ))}
                  </div>
                  <Link className="mega__feature" href={ev(SECTOR_LEAD.energy)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/img/events/ev-01.svg"
                      alt=""
                      width="1600"
                      height="1000"
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="tag tag-live" style={{ alignSelf: 'start' }}>
                      Registrations open
                    </span>
                    <strong style={{ fontSize: 'var(--fs-md)', marginTop: '.6rem', display: 'block' }}>
                      India Energy Expo 2026
                    </strong>
                    <span style={{ fontSize: 'var(--fs-xs)', opacity: 0.75 }}>18–19 August 2026 · New Delhi</span>
                  </Link>
                </div>
              </div>
            </div>

            <Link className="nav__link" href="/speakers" aria-current={current(['/speakers'])}>
              Speakers
            </Link>
            <Link className="nav__link" href="/agenda" aria-current={current(['/agenda'])}>
              Agenda
            </Link>

            <div className="relative">
              <button
                className="nav__link"
                data-mega="mega-media"
                aria-expanded="false"
                aria-haspopup="true"
                aria-current={current(['/videos', '/magazines', '/news', '/gallery'])}
              >
                Media{' '}
                <svg className="nav__chev" width="13" height="13" aria-hidden="true">
                  <use href="#i-chev" />
                </svg>
              </button>
              <div className="mega" id="mega-media" role="region" aria-label="Media menu">
                <div className="mega__grid">
                  <div className="mega__col">
                    <h4>Watch &amp; read</h4>
                    {WATCH.map((s) => (
                      <MegaItem key={s.label} {...s} />
                    ))}
                  </div>
                  <div className="mega__col">
                    <h4>Around the events</h4>
                    {AROUND.map((s) => (
                      <MegaItem key={s.label} {...s} />
                    ))}
                  </div>
                  <Link className="mega__feature" href="/magazines">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/img/magazines/mag-01.svg"
                      alt=""
                      width="960"
                      height="1280"
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="tag tag-solid" style={{ alignSelf: 'start' }}>
                      Latest issue
                    </span>
                    <strong style={{ fontSize: 'var(--fs-md)', marginTop: '.6rem', display: 'block' }}>
                      eGov · July 2026
                    </strong>
                    <span style={{ fontSize: 'var(--fs-xs)', opacity: 0.75 }}>The AI-Ready State</span>
                  </Link>
                </div>
              </div>
            </div>

            <Link className="nav__link" href="/sponsors" aria-current={current(['/sponsors'])}>
              Sponsors
            </Link>
            <Link className="nav__link" href="/about" aria-current={current(['/about'])}>
              About
            </Link>
          </nav>

          <div className="nav__actions">
            <button className="theme-toggle" data-theme-toggle aria-label="Switch colour theme">
              <svg className="i-sun" aria-hidden="true">
                <use href="#i-sun" />
              </svg>
              <svg className="i-moon" aria-hidden="true">
                <use href="#i-moon" />
              </svg>
            </button>
            <Link className="btn btn-primary btn-sm magnetic" href="/registration" data-magnet="0.24">
              <span className="magnetic__inner">
                Register{' '}
                <svg className="btn__icon" width="14" height="14" aria-hidden="true">
                  <use href="#i-arrow" />
                </svg>
              </span>
            </Link>
            <button className="burger" aria-expanded="false" aria-controls="drawer" aria-label="Open menu">
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      <div className="drawer" id="drawer">
        <nav aria-label="Mobile">
          {DRAWER_LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={pathname === l.href ? 'page' : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <Link className="btn btn-brand btn-lg btn-block mt-6" href="/registration">
          Register your delegation
        </Link>
      </div>
    </>
  );
}
