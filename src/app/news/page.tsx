import type { Metadata } from 'next';
import NewsBody from '@/components/theme/NewsBody';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, graph, breadcrumbLd } from '@/lib/seo';
import { abs } from '@/lib/site';

export const metadata: Metadata = pageMeta({
  title: 'News & Insights',
  description:
    'Reporting from inside the room: summit coverage, policy analysis and sector briefings from the Elets newsroom.',
  path: '/news',
  keywords: ['Elets newsroom', 'summit coverage', 'policy analysis India', 'sector briefings'],
});

export default function NewsPage() {
  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'News', path: '/news' },
          ]),
          {
            '@type': 'CollectionPage',
            '@id': abs('/news#page'),
            url: abs('/news'),
            name: 'News & insights',
            description: 'Summit coverage, policy analysis and sector briefings from the Elets newsroom.',
            isPartOf: { '@id': abs('/#website') },
            publisher: { '@id': abs('/#organization') },
          }
        )}
      />
      <NewsBody />
    </>
  );
}
