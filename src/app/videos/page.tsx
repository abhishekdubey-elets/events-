import type { Metadata } from 'next';
import VideosBody from '@/components/theme/VideosBody';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, graph, breadcrumbLd } from '@/lib/seo';
import { abs } from '@/lib/site';

export const metadata: Metadata = pageMeta({
  title: 'Video Library',
  description:
    'Keynotes, panels and fireside chats from 1,000+ Elets conferences. Over 10 million views.',
  path: '/videos',
  keywords: ['conference keynotes', 'panel discussions India', 'summit videos', 'Elets TV'],
});

export default function VideosPage() {
  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'Videos', path: '/videos' },
          ]),
          {
            '@type': 'CollectionPage',
            '@id': abs('/videos#page'),
            url: abs('/videos'),
            name: 'Elets video library',
            description: 'Keynotes, panels and fireside chats from Elets conferences.',
            isPartOf: { '@id': abs('/#website') },
          }
        )}
      />
      <VideosBody />
    </>
  );
}
