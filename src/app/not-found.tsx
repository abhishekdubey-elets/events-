import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className="page-head noise" style={{ minHeight: '62vh' }}>
      <div className="aurora" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div className="grid-lines" aria-hidden="true"></div>
      <div className="shell relative">
        <span className="eyebrow">404</span>
        <h1 className="mt-5">
          That page has left the <em className="serif-i grad-text">building</em>.
        </h1>
        <p className="lead">
          The link may be from an older edition of the site. The calendar, the speaker index and the
          newsroom are all still here.
        </p>
        <div className="flex wrap gap-3 mt-8">
          <Link className="btn btn-primary btn-lg" href="/">
            Back to the home page{' '}
            <svg className="btn__icon" width="15" height="15" aria-hidden="true">
              <use href="#i-arrow" />
            </svg>
          </Link>
          <Link className="btn btn-ghost btn-lg" href="/events">
            Browse the calendar
          </Link>
          <Link className="btn btn-ghost btn-lg" href="/contact">
            Contact the secretariat
          </Link>
        </div>
      </div>
    </section>
  );
}
