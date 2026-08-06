import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.tagline}`,
    short_name: site.name,
    description: site.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f5f2',
    theme_color: '#f6f5f2',
    lang: site.lang,
    categories: ['business', 'education', 'news'],
    icons: [
      {
        src: '/assets/img/brand/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
