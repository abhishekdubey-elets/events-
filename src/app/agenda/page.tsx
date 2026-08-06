import type { Metadata } from 'next';
import AgendaBody from '@/components/theme/AgendaBody';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, graph, breadcrumbLd } from '@/lib/seo';

const TITLE = 'Agenda — India Energy Expo 2026';
const DESCRIPTION =
  'Two-day agenda with tracks, sessions, speakers and rooms. Filter by track, search sessions and bookmark your day.';

export const metadata: Metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: '/agenda',
  keywords: ['conference agenda', 'India Energy Expo agenda', 'summit tracks', 'session schedule'],
});

export default function AgendaPage() {
  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'Agenda', path: '/agenda' },
          ])
        )}
      />
      <AgendaBody />
    </>
  );
}
