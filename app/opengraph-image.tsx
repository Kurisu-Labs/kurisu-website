import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const alt = 'Kurisu Labs — Exploring ideas. Building working systems.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';
export default async function SocialImage() {
  const [font, mark] = await Promise.all([
    readFile(
      path.join(
        process.cwd(),
        'node_modules/@ibm/plex-sans/fonts/complete/woff/IBMPlexSans-Medium.woff',
      ),
    ),
    readFile(path.join(process.cwd(), 'public/brand/kurisu-mark.webp')),
  ]);
  return new ImageResponse(
    <div
      style={{
        background: '#FEFCF9',
        color: '#211B1D',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '64px 72px',
        fontFamily: 'Plex',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', fontSize: 28 }}>
        {/* ImageResponse consumes embedded local bytes; no external fetch. */}
        <img
          alt=""
          src={`data:image/webp;base64,${mark.toString('base64')}`}
          width={46}
          height={42}
          style={{ marginRight: 18 }}
        />
        Kurisu Labs
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 76,
          letterSpacing: '-3px',
          lineHeight: 1.05,
          maxWidth: 820,
          marginTop: 78,
        }}
      >
        Exploring ideas. Building working systems.
      </div>
      <div
        style={{
          display: 'flex',
          color: '#6B0C1A',
          fontSize: 22,
          marginTop: 'auto',
          borderTop: '1px solid #D8CDD0',
          paddingTop: 24,
          justifyContent: 'space-between',
        }}
      >
        <span>Independent research & engineering collective</span>
        <span>kurisulabs.tech</span>
      </div>
    </div>,
    { ...size, fonts: [{ name: 'Plex', data: font, weight: 500 }] },
  );
}
