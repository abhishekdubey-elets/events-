import type { Metadata } from 'next';
import ContactBody from '@/components/theme/ContactBody';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, graph, breadcrumbLd, faqLd } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Contact',
  description:
    'Delegate registration, partnerships, speaking opportunities and press. Noida and Dubai offices.',
  path: '/contact',
  keywords: ['Elets contact', 'conference secretariat', 'press accreditation', 'Noida', 'Dubai'],
});

/**
 * Verbatim from the accordion on the page itself — structured data has to
 * match what a visitor can actually read, or it is a rich-result penalty
 * waiting to happen.
 */
const FAQ = [
  {
    q: 'Do government officers pay to attend?',
    a: 'No. Serving officers of central and state government, PSUs and regulatory bodies attend every Elets event free of charge. Register with your official email address and the fee is waived automatically.',
  },
  {
    q: 'How do I nominate a speaker?',
    a: 'Use the speaking submission form on the registration page, or write to the secretariat. Nominations are reviewed fortnightly by the programme committee; the agenda closes six weeks before each event.',
  },
  {
    q: 'Can I get the magazine in print?',
    a: 'Yes. Serving government officers and academic institutions receive the print edition free on request. Everyone else can read online free or take a paid print subscription.',
  },
  {
    q: 'How do I get press accreditation?',
    a: 'Write to the press desk with your outlet and a recent byline. Accreditation closes seven days before each event; the media kit and high-resolution imagery are shared on approval.',
  },
  {
    q: 'Where do I send an awards nomination?',
    a: 'Through the form above, choosing “Awards nomination”. Entries are assessed by an independent jury; Elets does not vote.',
  },
];

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'Contact', path: '/contact' },
          ]),
          faqLd(FAQ)
        )}
      />
      <ContactBody />
    </>
  );
}
