import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EventBody from '@/components/theme/EventBody';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, graph, breadcrumbLd, eventLd } from '@/lib/seo';
import { events, getEvent } from '@/data/events';

type Params = { params: Promise<{ slug: string }> };

/** Every event in the calendar is prerendered at build time. */
export function generateStaticParams() {
  return events.map((e) => ({ slug: e.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) return {};

  const where = [event.dateLabel, event.city].filter(Boolean).join(', ');
  return pageMeta({
    title: event.name,
    description: `${event.name} — ${where}. ${event.summary}`.slice(0, 300),
    path: `/events/${event.slug}`,
    image: event.image,
    type: 'article',
    keywords: [event.name, event.sectorLabel, event.city ?? 'India', 'Elets conference', 'delegate registration'],
  });
}

export default async function EventPage({ params }: Params) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'Events', path: '/events' },
            { name: event.name, path: `/events/${event.slug}` },
          ]),
          eventLd(event)
        )}
      />
      <EventBody event={event} />
    </>
  );
}
