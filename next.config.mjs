/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // The theme ships hand-tuned SVG art; nothing goes through the image
  // optimiser, so keep the loader out of the way but leave SVG allowed for
  // when real photography replaces assets/img/**.
  images: {
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  async headers() {
    return [
      {
        // Fonts and the vendored libraries are versioned by name and never
        // edited in place, so they can be cached hard.
        source: '/assets/:dir(fonts|vendor)/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Artwork is meant to be swapped in place when real photography
        // arrives — cache it, but never immutably.
        source: '/assets/img/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },

  // Legacy .html URLs from the static theme keep their equity.
  async redirects() {
    const map = {
      '/index.html': '/',
      '/event.html': '/events/india-energy-expo-2026',
      '/speakers.html': '/speakers',
      '/speaker.html': '/speakers/akash-tripathi',
      '/agenda.html': '/agenda',
      '/registration.html': '/registration',
      '/sponsors.html': '/sponsors',
      '/videos.html': '/videos',
      '/gallery.html': '/gallery',
      '/magazines.html': '/magazines',
      '/news.html': '/news',
      '/about.html': '/about',
      '/contact.html': '/contact',
    };
    return Object.entries(map).map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }));
  },
};

export default nextConfig;
