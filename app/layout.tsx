import type { Metadata } from 'next';
import { getPublicManifest } from '@/lib/content/public';
import { site } from '@/lib/site';
import { indexable } from '@/lib/deployment';
import { SiteHeader } from '@/components/site-header';
import { ContactSection } from '@/components/contact-section';
import { SiteFooter } from '@/components/site-footer';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: 'Kurisu Labs | Research & Engineering', template: '%s | Kurisu Labs' },
  description: site.description,
  robots: { index: indexable, follow: indexable },
  icons: {
    icon: [
      { url: '/brand/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/brand/icon-180.png',
  },
};
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const manifest = await getPublicManifest();
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/fonts/IBMPlexSans-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/IBMPlexSans-Medium.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader manifest={manifest} />
        <main id="main-content" tabIndex={-1}>
          {children}
          <ContactSection />
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
