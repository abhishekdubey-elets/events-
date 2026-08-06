import type { MetadataRoute } from 'next';
import { abs } from '@/lib/site';
import { events } from '@/data/events';
import { speakers } from '@/data/speakers';

/**
 * Priorities and change frequencies are advisory at best these days, but the
 * URL set is not: every indexable route appears exactly once, in its
 * canonical form, and nothing that 404s or redirects is listed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const statics: Array<[string, number, MetadataRoute.Sitemap[number]['changeFrequency']]> = [
    ['/', 1, 'weekly'],
    ['/events', 0.9, 'weekly'],
    ['/speakers', 0.8, 'weekly'],
    ['/agenda', 0.8, 'weekly'],
    ['/registration', 0.9, 'monthly'],
    ['/sponsors', 0.7, 'monthly'],
    ['/videos', 0.6, 'weekly'],
    ['/magazines', 0.6, 'monthly'],
    ['/gallery', 0.5, 'monthly'],
    ['/news', 0.7, 'daily'],
    ['/about', 0.5, 'yearly'],
    ['/contact', 0.5, 'yearly'],
  ];

  return [
    ...statics.map(([path, priority, changeFrequency]) => ({
      url: abs(path),
      lastModified: now,
      changeFrequency,
      priority,
    })),
    ...events.map((e) => ({
      url: abs(`/events/${e.slug}`),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: e.status === 'concluded' ? 0.5 : 0.8,
    })),
    ...speakers.map((s) => ({
      url: abs(`/speakers/${s.slug}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
