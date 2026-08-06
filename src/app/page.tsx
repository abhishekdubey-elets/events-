import type { Metadata } from 'next';
import HomeBody from '@/components/theme/HomeBody';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, graph, itemListLd, eventLd } from '@/lib/seo';
import { site } from '@/lib/site';
import { events } from '@/data/events';

export const metadata: Metadata = {
  ...pageMeta({
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    path: '/',
    image: '/opengraph-image',
    keywords: [
      'Elets Technomedia',
      'India conferences',
      'government summits India',
      'healthcare summit India',
      'education summit India',
      'BFSI conference India',
      'India Energy Expo 2026',
    ],
  }),
  // the layout's template would otherwise append the site name twice
  title: { absolute: `${site.name} — ${site.tagline}` },
};

export default function HomePage() {
  const upcoming = events.filter((e) => e.status !== 'concluded');

  return (
    <>
      <JsonLd
        data={graph(
          itemListLd(
            'Upcoming Elets conferences',
            upcoming.map((e) => ({ name: e.name, path: `/events/${e.slug}` }))
          ),
          ...events.filter((e) => e.startDate).map(eventLd)
        )}
      />
      <HomeBody />
    </>
  );
}
