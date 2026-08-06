import type { Metadata } from 'next';
import MagazinesBody from '@/components/theme/MagazinesBody';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, graph, breadcrumbLd, itemListLd } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Magazine Library',
  description:
    'eGov, digitalLEARNING, eHEALTH and The Banking & Finance Post — read online or download the PDF edition.',
  path: '/magazines',
  keywords: ['eGov magazine', 'digitalLEARNING', 'eHEALTH magazine', 'Banking and Finance Post'],
});

const TITLES = [
  'eGov',
  'digitalLEARNING',
  'eHEALTH',
  'The Banking & Finance Post',
];

export default function MagazinesPage() {
  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'Magazines', path: '/magazines' },
          ]),
          itemListLd(
            'Elets magazines',
            TITLES.map((name) => ({ name, path: '/magazines' }))
          )
        )}
      />
      <MagazinesBody />
    </>
  );
}
