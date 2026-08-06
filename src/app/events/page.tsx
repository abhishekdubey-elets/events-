import type { Metadata } from 'next';
import EventsIndexBody from '@/components/pages/EventsIndexBody';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, graph, breadcrumbLd, itemListLd, eventLd } from '@/lib/seo';
import { events } from '@/data/events';

export const metadata: Metadata = pageMeta({
  title: 'Events — the 2026–27 calendar',
  description:
    'Every Elets summit open for registration across governance, healthcare, education, BFSI, AI, smart cities and energy — dates, cities and delegate seats.',
  path: '/events',
  keywords: [
    'India conference calendar 2026',
    'government summit India',
    'healthcare conference India',
    'BFSI summit',
    'education summit',
    'energy expo India',
  ],
});

export default function EventsPage() {
  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'Events', path: '/events' },
          ]),
          itemListLd(
            'Elets conference calendar 2026–27',
            events.map((e) => ({ name: e.name, path: `/events/${e.slug}` }))
          ),
          ...events.map(eventLd)
        )}
      />
      <EventsIndexBody />
    </>
  );
}
