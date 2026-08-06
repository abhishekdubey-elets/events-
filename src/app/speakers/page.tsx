import type { Metadata } from 'next';
import SpeakersBody from '@/components/theme/SpeakersBody';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, graph, breadcrumbLd, itemListLd } from '@/lib/seo';
import { speakers } from '@/data/speakers';

export const metadata: Metadata = pageMeta({
  title: 'Speakers',
  description:
    'Secretaries, IAS officers, CEOs and chief data scientists who have spoken on Elets stages across governance, health, education and BFSI.',
  path: '/speakers',
  keywords: ['conference speakers India', 'IAS officers', 'government speakers', 'CEO panel India'],
});

export default function SpeakersPage() {
  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'Speakers', path: '/speakers' },
          ]),
          itemListLd(
            'Speakers on Elets stages',
            speakers.map((s) => ({ name: s.name, path: `/speakers/${s.slug}` }))
          )
        )}
      />
      <SpeakersBody />
    </>
  );
}
