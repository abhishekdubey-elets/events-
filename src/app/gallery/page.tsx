import type { Metadata } from 'next';
import GalleryBody from '@/components/theme/GalleryBody';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, graph, breadcrumbLd } from '@/lib/seo';
import { abs } from '@/lib/site';

export const metadata: Metadata = pageMeta({
  title: 'Gallery',
  description: 'Photography from recent Elets summits, awards nights and expo floors.',
  path: '/gallery',
  keywords: ['event photography', 'summit gallery', 'awards night', 'expo floor'],
});

export default function GalleryPage() {
  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'Gallery', path: '/gallery' },
          ]),
          {
            '@type': 'ImageGallery',
            '@id': abs('/gallery#page'),
            url: abs('/gallery'),
            name: 'Elets Events gallery',
            isPartOf: { '@id': abs('/#website') },
          }
        )}
      />
      <GalleryBody />
    </>
  );
}
