import type { Metadata, Viewport } from 'next';
import '@/styles/styles.css';
import '@/styles/components.css';
import '@/styles/animations.css';
import '@/styles/responsive.css';

import { site, abs } from '@/lib/site';
import { graph, organizationLd, websiteLd } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import ThemeScript from '@/components/chrome/ThemeScript';
import Preloader from '@/components/chrome/Preloader';
import IconSprite from '@/components/chrome/IconSprite';
import SiteHeader from '@/components/chrome/SiteHeader';
import SiteFooter from '@/components/chrome/SiteFooter';
import VideoModal from '@/components/chrome/VideoModal';
import ThemeRuntime from '@/components/chrome/ThemeRuntime';

/**
 * Stylesheet order is load-bearing: styles → components → animations →
 * responsive resolves without a single `!important` in the component layer.
 * Keep these four imports in this order.
 */

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.legalName, url: site.url }],
  creator: site.legalName,
  publisher: site.legalName,
  category: 'events',
  // No site-wide canonical: every route declares its own through pageMeta(),
  // and inheriting "/" would hand the 404 a canonical it should not have.
  icons: {
    icon: [{ url: '/assets/img/brand/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/assets/img/brand/favicon.svg' }],
  },
  manifest: '/manifest.webmanifest',
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: 'website',
    siteName: site.name,
    locale: site.locale,
    url: site.url,
  },
  twitter: { card: 'summary_large_image', site: site.twitter },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Deliberately a single tag with no media query: the theme bootstrap and
  // the toggle both rewrite this one element, and a media-split pair would
  // leave the non-matching half stale after a manual switch.
  themeColor: '#f6f5f2',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.lang} className="no-js" data-theme="light" suppressHydrationWarning>
      <head>
        {/* The two faces that carry visible-on-load text. */}
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/assets/fonts/inter-normal-400-700-latin.woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/assets/fonts/instrument-serif-italic-400-latin.woff2"
          crossOrigin="anonymous"
        />
        <ThemeScript />
      </head>
      <body>
        <JsonLd data={graph(organizationLd(), websiteLd())} />
        <Preloader />
        <IconSprite />
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <VideoModal />
        <ThemeRuntime />
      </body>
    </html>
  );
}
