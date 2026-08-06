import Link from 'next/link';
import type { CSSProperties } from 'react';
import { events, type EventRecord } from '@/data/events';

/**
 * The calendar index — the one page the static theme did not ship, built out
 * of its own components (`.page-head`, `.filters`, `.event-card`) so it sits
 * inside the design system rather than beside it. Filtering, seat bars and
 * reveals are the same behaviours src/lib/ui.ts binds everywhere else.
 */

const FILTERS: Array<[string, string]> = [
  ['all', 'All sectors'],
  ['ai', 'AI'],
  ['health', 'Healthcare'],
  ['edu', 'Education'],
  ['gov', 'Governance'],
  ['city', 'Smart Cities'],
  ['energy', 'Energy'],
  ['bfsi', 'Banking'],
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Big date chip on the card: a real day where we have one, else a month. */
function badge(e: EventRecord): { top: string; bottom: string; tbc: boolean } {
  if (e.startDate) {
    const d = new Date(e.startDate);
    return { top: String(d.getUTCDate()), bottom: MONTHS[d.getUTCMonth()], tbc: false };
  }
  const month = MONTHS.find((m) => e.dateLabel.startsWith(m) || e.dateLabel.startsWith(monthLong(m)));
  const year = /\b(20\d{2})\b/.exec(e.dateLabel)?.[1] ?? '';
  return { top: month ?? 'TBC', bottom: year, tbc: true };
}

const monthLong = (abbr: string) =>
  ({ Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June', Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December' })[abbr] ?? abbr;

function EventCard({ e }: { e: EventRecord }) {
  const b = badge(e);
  return (
    <article className="card card--glow event-card" data-cat={e.cats.join(' ')} data-reveal="up">
      <div className="card__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={e.image} alt="" width="1600" height="1000" loading="lazy" decoding="async" />
        <span className={`event-card__date${b.tbc ? ' event-card__date--tbc' : ''}`}>
          <b>{b.top}</b>
          <span>{b.bottom}</span>
        </span>
        <span className="event-card__sector">{e.sectorLabel}</span>
      </div>
      <div className="card__body">
        {e.statusLabel ? (
          <span className={e.status === 'open' ? 'tag tag-live' : 'tag'}>{e.statusLabel}</span>
        ) : null}
        <h3>
          <Link className="card__link" href={`/events/${e.slug}`} data-cursor="View">
            {e.name}
          </Link>
        </h3>
        <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
          {e.summary}
        </p>
        <div className="event-card__meta">
          <span>
            <svg width="13" height="13" aria-hidden="true">
              <use href="#i-cal" />
            </svg>{' '}
            {e.dateLabel}
          </span>
          {e.city ? (
            <span>
              <svg width="13" height="13" aria-hidden="true">
                <use href="#i-pin" />
              </svg>{' '}
              {e.city}
            </span>
          ) : null}
        </div>
        <div className="event-card__foot">
          <div className="seats">
            <span className="seats__label">
              {e.status === 'concluded' ? 'Concluded · watch sessions' : `${e.allocated}% allocated`}
            </span>
            <span className="seats__bar">
              <span className="seats__fill" data-bar={String(e.allocated)}></span>
            </span>
          </div>
          <span className="go" aria-hidden="true">
            <svg width="15" height="15">
              <use href="#i-arrow" />
            </svg>
          </span>
        </div>
      </div>
    </article>
  );
}

export default function EventsIndexBody() {
  const upcoming = events.filter((e) => e.status !== 'concluded');
  const past = events.filter((e) => e.status === 'concluded');

  return (
    <>
      <section className="page-head noise">
        <div className="aurora" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="grid-lines" aria-hidden="true"></div>
        <div className="shell relative">
          <nav aria-label="Breadcrumb">
            <ol className="crumbs">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li aria-current="page">Events</li>
            </ol>
          </nav>
          <h1 data-split="">
            The 2026–27 <em className="serif-i grad-text">calendar</em>
          </h1>
          <p className="lead">
            Every Elets summit currently open for registration, across governance, healthcare,
            education, BFSI, AI, smart cities and energy — plus the editions that have just closed.
          </p>
          <div className="hero__stats mt-8" data-reveal-group="">
            <div className="hero__stat" data-reveal="up">
              <span className="n" data-count={String(events.length)}>
                0
              </span>
              <span className="l">Editions on this page</span>
            </div>
            <div className="hero__stat" data-reveal="up">
              <span className="n" data-count="475">
                0
              </span>
              <span className="l">Events in the archive</span>
            </div>
            <div className="hero__stat" data-reveal="up">
              <span className="n" data-count="7">
                0
              </span>
              <span className="l">Sectors covered</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 'var(--sp-8)' } as CSSProperties}>
        <div className="shell shell-wide">
          <div className="sec-head">
            <div>
              <span className="sec-head__kicker mono">Open for registration</span>
              <h2 data-split="">Where India&apos;s sectors meet next</h2>
            </div>
            <div className="sec-head__aside">
              <Link className="btn btn-soft" href="/registration">
                Register as delegate{' '}
                <svg className="btn__icon" width="14" height="14" aria-hidden="true">
                  <use href="#i-arrow" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="filters mb-8" data-filters="#events-grid" role="group" aria-label="Filter events by sector">
            <span className="filters__pill" aria-hidden="true"></span>
            {FILTERS.map(([value, label], i) => (
              <button key={value} data-filter={value} aria-pressed={i === 0 ? 'true' : 'false'}>
                {label}
              </button>
            ))}
          </div>

          <div className="grid g-3" id="events-grid" data-reveal-group="" aria-live="polite" aria-busy="false">
            {upcoming.map((e) => (
              <EventCard key={e.slug} e={e} />
            ))}
          </div>
          <p className="empty hide mt-6" data-empty>
            No events in this sector yet — try another filter.
          </p>
        </div>
      </section>

      {past.length ? (
        <section className="section">
          <div className="shell shell-wide">
            <div className="sec-head">
              <div>
                <span className="sec-head__kicker mono">Recently concluded</span>
                <h2 data-split="">Sessions you can still watch</h2>
              </div>
              <div className="sec-head__aside">
                <Link className="link" href="/videos">
                  Video library{' '}
                  <svg width="14" height="14" aria-hidden="true">
                    <use href="#i-arrow" />
                  </svg>
                </Link>
              </div>
            </div>
            <div className="grid g-3" data-reveal-group="">
              {past.map((e) => (
                <EventCard key={e.slug} e={e} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section-sm">
        <div className="shell">
          <div className="cta noise" data-reveal="scale">
            <div className="aurora" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="relative">
              <span className="eyebrow" style={{ color: 'rgba(255,255,255,.55)' }}>
                Three ways in
              </span>
              <h2 className="mt-5" data-split="">
                Attend. Speak. Or put your brand in the room.
              </h2>
              <p>
                Delegate passes, speaking submissions and partnership decks — all handled by the same
                secretariat.
              </p>
              <div className="flex wrap gap-3 mt-8">
                <Link className="btn btn-brand btn-lg magnetic" href="/registration" data-magnet="0.2">
                  <span className="magnetic__inner">
                    Register as delegate{' '}
                    <svg className="btn__icon" width="15" height="15" aria-hidden="true">
                      <use href="#i-arrow" />
                    </svg>
                  </span>
                </Link>
                <Link className="btn btn-glass btn-lg" href="/registration#speaking">
                  Submit to speak
                </Link>
                <Link className="btn btn-glass btn-lg" href="/sponsors">
                  Partnership deck
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
