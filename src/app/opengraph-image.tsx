import { ImageResponse } from 'next/og';
import { site } from '@/lib/site';

/**
 * The share card. The theme ships an SVG for this, which LinkedIn, X and
 * WhatsApp all refuse to render — so it is rendered to PNG at build time
 * instead, in the theme's own colours.
 */
export const runtime = 'nodejs';
export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#08090c',
          padding: 72,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -160,
            left: -120,
            width: 720,
            height: 720,
            borderRadius: 999,
            background: 'radial-gradient(circle, rgba(27,77,255,0.55) 0%, rgba(27,77,255,0) 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -220,
            right: -140,
            width: 760,
            height: 760,
            borderRadius: 999,
            background: 'radial-gradient(circle, rgba(255,90,43,0.42) 0%, rgba(255,90,43,0) 70%)',
            display: 'flex',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #1b4dff 0%, #7c3aed 55%, #ff5a2b 100%)',
              display: 'flex',
            }}
          />
          <div style={{ color: '#f4f5f7', fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>
            Elets Events
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              color: '#ffffff',
              fontSize: 68,
              lineHeight: 1.05,
              letterSpacing: -2.5,
              fontWeight: 700,
              maxWidth: 940,
              display: 'flex',
            }}
          >
            India&apos;s stage for governance, health, education and BFSI
          </div>
          <div style={{ color: 'rgba(244,245,247,0.62)', fontSize: 28, display: 'flex', gap: 24 }}>
            <span>1,000+ conferences</span>
            <span>·</span>
            <span>20,000+ speakers</span>
            <span>·</span>
            <span>600,000+ delegates</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
