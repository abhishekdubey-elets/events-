/**
 * One source of truth for anything that ends up in a <head>, a sitemap or a
 * JSON-LD block. Set NEXT_PUBLIC_SITE_URL per environment; everything that
 * needs an absolute URL derives it from here.
 */
export const site = {
  name: 'Elets Events',
  legalName: 'Elets Technomedia Pvt Ltd',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://events.eletsonline.com').replace(/\/$/, ''),
  locale: 'en_IN',
  lang: 'en-IN',
  founded: '2003',
  description:
    'Elets Technomedia has convened 1,000+ conferences, 20,000+ speakers and 600,000+ delegates across governance, healthcare, education, BFSI, AI, smart cities and energy.',
  tagline: "India's stage for governance, health, education and BFSI",
  // Structured-data logo: search results render it on white, so this is the
  // near-black-ink variant rather than the white-on-transparent original.
  logo: '/assets/img/brand/lockup-on-light.png',
  twitter: '@eletsonline',
  email: 'registration@eletsonline.com',
  phone: '+91 92899 55093',
  social: [
    'https://www.linkedin.com/company/elets-technomedia-pvt-ltd',
    'https://x.com/eletsonline',
    'https://www.youtube.com/@eletstv',
  ],
  offices: [
    {
      locality: 'Noida',
      region: 'Uttar Pradesh',
      postalCode: '201309',
      street: 'Stellar IT Park, Sector 62',
      country: 'IN',
    },
    { locality: 'Dubai', region: null, postalCode: null, street: 'Elets Technomedia FZ-LLC', country: 'AE' },
  ],
} as const;

/** Absolute URL for a site-relative path. */
export const abs = (path = '/') => `${site.url}${path.startsWith('/') ? path : `/${path}`}`;
