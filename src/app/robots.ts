import type { MetadataRoute } from 'next';
import { abs, site } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Next's internals and the API surface have nothing to index.
        disallow: ['/api/', '/_next/'],
      },
    ],
    sitemap: abs('/sitemap.xml'),
    host: site.url,
  };
}
