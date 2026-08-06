import type { Metadata } from 'next';
import AboutBody from '@/components/theme/AboutBody';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, graph, breadcrumbLd } from '@/lib/seo';
import { abs } from '@/lib/site';

export const metadata: Metadata = pageMeta({
  title: 'About Elets Technomedia',
  description:
    'Founded 2003. India’s leading B2B media house for governance, healthcare, education and banking. Offices in Noida and Dubai.',
  path: '/about',
  keywords: ['Elets Technomedia', 'about Elets', 'B2B media India', 'conference company India'],
});

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'About', path: '/about' },
          ]),
          {
            '@type': 'AboutPage',
            '@id': abs('/about#page'),
            url: abs('/about'),
            name: 'About Elets Technomedia',
            mainEntity: { '@id': abs('/#organization') },
          }
        )}
      />
      <AboutBody />
    </>
  );
}
