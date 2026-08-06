import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SpeakerBody from '@/components/theme/SpeakerBody';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, graph, breadcrumbLd, personLd } from '@/lib/seo';
import { speakers, getSpeaker } from '@/data/speakers';

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return speakers.map((s) => ({ slug: s.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const speaker = getSpeaker(slug);
  if (!speaker) return {};

  return pageMeta({
    title: `${speaker.name} — Speaker`,
    description: `${speaker.name}, ${speaker.role}${speaker.org ? `, ${speaker.org}` : ''}. Sessions, talks and speaking history on Elets stages.`,
    path: `/speakers/${speaker.slug}`,
    image: speaker.image,
    type: 'profile',
    keywords: [speaker.name, speaker.role, 'Elets speaker', 'conference speaker India'],
  });
}

export default async function SpeakerPage({ params }: Params) {
  const { slug } = await params;
  const speaker = getSpeaker(slug);
  if (!speaker) notFound();

  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'Speakers', path: '/speakers' },
            { name: speaker.name, path: `/speakers/${speaker.slug}` },
          ]),
          personLd(speaker)
        )}
      />
      <SpeakerBody speaker={speaker} />
    </>
  );
}
