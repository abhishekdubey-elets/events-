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
      { src: '/assets/img/brand/mark-96.png', sizes: '96x96', type: 'image/png', purpose: 'any' },
      { src: '/assets/img/brand/mark-256.png', sizes: '256x256', type: 'image/png', purpose: 'any' },
    ],
  };
}
