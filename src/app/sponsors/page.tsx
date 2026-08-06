import type { Metadata } from 'next';
import SponsorsBody from '@/components/theme/SponsorsBody';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, graph, breadcrumbLd } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Sponsors & Partners',
  description:
    'Partnership tiers, audience profile and packages for Elets conferences across governance, health, education, BFSI and energy.',
  path: '/sponsors',
  keywords: ['conference sponsorship India', 'event partnership', 'exhibitor packages', 'B2B audience'],
});

export default function SponsorsPage() {
  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'Sponsors', path: '/sponsors' },
          ])
        )}
      />
      <SponsorsBody />
    </>
  );
}
