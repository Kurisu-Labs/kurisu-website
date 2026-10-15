import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { homeCopy, site } from '@/lib/site';

export const alt = `${site.name}: ${homeCopy.hero.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';
export default async function SocialImage() {
  const [font, mono, mark] = await Promise.all([
    readFile(
      path.join(
        process.cwd(),
        'node_modules/@ibm/plex-sans/fonts/complete/woff/IBMPlexSans-Medium.woff',
      ),
    ),
    readFile(
      path.join(
        process.cwd(),
        'node_modules/@ibm/plex-mono/fonts/complete/woff/IBMPlexMono-Regular.woff',
      ),
    ),
    readFile(path.join(process.cwd(), 'public/brand/icon-180.png')),
  ]);
  return new ImageResponse(
    <div
      style={{
        background: '#101211',
        color: '#F1F0E8',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '56px 72px',
        fontFamily: 'Plex',
        position: 'relative',
      }}
    >
      <svg
        width="1200"
        height="630"
        viewBox="0 0 1200 630"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <path d="M864 0h336v630H864z" fill="#261218" />
        <circle cx="1060" cy="325" r="235" fill="#6B0C1A" />
        {[72, 336, 600, 864, 1128].map((x) => (
          <line key={`vertical-${x}`} x1={x} y1="0" x2={x} y2="630" stroke="#3D3035" />
        ))}
        {[56, 144, 486, 574].map((y) => (
          <line key={`horizontal-${y}`} x1="0" y1={y} x2="1200" y2={y} stroke="#3D3035" />
        ))}
        <circle cx="1060" cy="325" r="192" fill="none" stroke="#F1A8B6" strokeOpacity=".3" />
        <ellipse
          cx="1060"
          cy="325"
          rx="215"
          ry="82"
          fill="none"
          transform="rotate(-38 1060 325)"
          stroke="#F1A8B6"
          strokeOpacity=".5"
        />
        <path d="M1050 325h20m-10-10v20" stroke="#F1F0E8" />
        <circle cx="924" cy="433" r="5" fill="#F6BCC7" />
      </svg>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 28,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Preserve the original maroon mark on its existing light tile. */}
          {/* ImageResponse embeds local bytes and cannot render the Next Image component. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            src={`data:image/png;base64,${mark.toString('base64')}`}
            width={56}
            height={56}
            style={{ marginRight: 18 }}
          />
          Kurisu Labs
        </div>
        <span
          style={{
            color: '#F1A8B6',
            fontFamily: 'Plex Mono',
            fontSize: 15,
            letterSpacing: '1px',
          }}
        >
          RESEARCH & ENGINEERING
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 80,
          letterSpacing: '-3px',
          lineHeight: 1.05,
          maxWidth: 1000,
          marginTop: 62,
          position: 'relative',
        }}
      >
        {homeCopy.hero.title}
      </div>
      <div
        style={{
          display: 'flex',
          width: 80,
          height: 4,
          background: '#9C253C',
          marginTop: 30,
        }}
      />
      <div
        style={{
          display: 'flex',
          color: '#F1F0E8',
          fontSize: 20,
          marginTop: 'auto',
          borderTop: '1px solid #9F8088',
          paddingTop: 24,
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        <span>{homeCopy.hero.eyebrow}</span>
        <span style={{ color: '#F1A8B6', fontFamily: 'Plex Mono', fontSize: 17 }}>
          kurisulabs.tech
        </span>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Plex', data: font, weight: 500 },
        { name: 'Plex Mono', data: mono, weight: 400 },
      ],
    },
  );
}
