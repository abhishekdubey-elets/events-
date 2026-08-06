import type { Metadata } from 'next';
import RegistrationBody from '@/components/theme/RegistrationBody';
import JsonLd from '@/components/seo/JsonLd';
import { pageMeta, graph, breadcrumbLd } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Registration',
  description:
    'Delegate passes, government rates, group bookings, sponsorship and speaking submissions for Elets conferences.',
  path: '/registration',
  keywords: ['delegate pass', 'conference registration India', 'government delegate free pass', 'group booking'],
});

export default function RegistrationPage() {
  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'Registration', path: '/registration' },
          ])
        )}
      />
      <RegistrationBody />
    </>
  );
}
