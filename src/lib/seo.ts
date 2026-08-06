import type { Metadata } from 'next';
import { site, abs } from './site';
import type { EventRecord } from '@/data/events';
import type { Speaker } from '@/data/speakers';

/* ------------------------------------------------------------------ <head> */

interface PageMetaInput {
  title: string;
  description: string;
  /** Site-relative path — becomes the canonical and the og:url. */
  path: string;
  /** Site-relative image path. Defaults to the route's generated OG card. */
  image?: string;
  type?: 'website' | 'article' | 'profile';
  keywords?: string[];
  publishedTime?: string;
  noIndex?: boolean;
}

/**
 * Every route builds its <head> through here, so canonical, Open Graph and
 * Twitter tags can never drift apart. `title` is the bare page title; the
 * template in the root layout appends the site name.
 */
export function pageMeta({
  title,
  description,
  path,
  image,
  type = 'website',
  keywords,
  publishedTime,
  noIndex,
}: PageMetaInput): Metadata {
  const url = abs(path);
  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
    openGraph: {
      type: type === 'profile' ? 'profile' : type,
      url,
      siteName: site.name,
      title,
      description,
      locale: site.locale,
      ...(publishedTime ? { publishedTime } : {}),
      ...(image ? { images: [{ url: abs(image), width: 1200, height: 630, alt: title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: site.twitter,
      ...(image ? { images: [abs(image)] } : {}),
    },
  };
}

/* --------------------------------------------------------------- JSON-LD */

type Json = Record<string, unknown>;

export const organizationLd = (): Json => ({
  '@type': 'Organization',
  '@id': abs('/#organization'),
  name: site.legalName,
  alternateName: site.name,
  url: site.url,
  foundingDate: site.founded,
  logo: { '@type': 'ImageObject', url: abs(site.logo) },
  description:
    'India’s leading B2B media and conference company across governance, healthcare, education and banking.',
  email: site.email,
  telephone: site.phone,
  sameAs: [...site.social],
  address: site.offices.map((o) => ({
    '@type': 'PostalAddress',
    ...(o.street ? { streetAddress: o.street } : {}),
    addressLocality: o.locality,
    ...(o.region ? { addressRegion: o.region } : {}),
    ...(o.postalCode ? { postalCode: o.postalCode } : {}),
    addressCountry: o.country,
  })),
});

export const websiteLd = (): Json => ({
  '@type': 'WebSite',
  '@id': abs('/#website'),
  url: site.url,
  name: site.name,
  description: site.description,
  inLanguage: site.lang,
  publisher: { '@id': abs('/#organization') },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${abs('/speakers')}?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
});

export const breadcrumbLd = (trail: Array<{ name: string; path: string }>): Json => ({
  '@type': 'BreadcrumbList',
  itemListElement: trail.map((t, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: t.name,
    item: abs(t.path),
  })),
});

/**
 * Event structured data. Dates are only emitted where the calendar actually
 * has them — Google would rather have no date than an invented one, and the
 * theme carries several "TBC" entries.
 */
export const eventLd = (e: EventRecord): Json => ({
  '@type': 'Event',
  '@id': abs(`/events/${e.slug}#event`),
  name: e.name,
  description: e.summary,
  url: abs(`/events/${e.slug}`),
  image: [abs(e.image)],
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  eventStatus:
    e.status === 'concluded'
      ? 'https://schema.org/EventScheduled'
      : 'https://schema.org/EventScheduled',
  ...(e.startDate ? { startDate: e.startDate } : {}),
  ...(e.endDate ? { endDate: e.endDate } : {}),
  ...(e.city
    ? {
        location: {
          '@type': 'Place',
          name: e.venue || e.city,
          address: { '@type': 'PostalAddress', addressLocality: e.city, addressCountry: 'IN' },
        },
      }
    : {}),
  organizer: { '@id': abs('/#organization') },
  ...(e.status === 'open'
    ? {
        offers: {
          '@type': 'Offer',
          url: abs('/registration'),
          availability: 'https://schema.org/InStock',
          priceCurrency: 'INR',
          category: 'Delegate pass',
        },
      }
    : {}),
});

export const personLd = (s: Speaker): Json => ({
  '@type': 'Person',
  '@id': abs(`/speakers/${s.slug}#person`),
  name: s.name,
  jobTitle: s.role,
  ...(s.org ? { worksFor: { '@type': 'Organization', name: s.org } } : {}),
  image: abs(s.image),
  url: abs(`/speakers/${s.slug}`),
});

export const itemListLd = (name: string, items: Array<{ name: string; path: string }>): Json => ({
  '@type': 'ItemList',
  name,
  numberOfItems: items.length,
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.name,
    url: abs(it.path),
  })),
});

export const faqLd = (qa: Array<{ q: string; a: string }>): Json => ({
  '@type': 'FAQPage',
  mainEntity: qa.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
});

/** Wraps one or more nodes into a single @graph document. */
export const graph = (...nodes: Json[]) => ({
  '@context': 'https://schema.org',
  '@graph': nodes,
});
