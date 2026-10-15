import type { Metadata } from 'next';
import { getPublicManifest } from '@/lib/content/public';
import { site } from '@/lib/site';
import { indexable } from '@/lib/deployment';
import { SiteHeader } from '@/components/site-header';
import { ContactSection } from '@/components/contact-section';
import { SiteFooter } from '@/components/site-footer';
import { LabMotion } from '@/components/lab-motion';
import { PageTransition } from '@/components/page-transition';
import { themeBootstrapScript } from '@/lib/theme';
import './globals.css';
import '@/styles/lab-motion.css';
import '@/styles/illustration-hover.css';
import '@/styles/theme-switcher.css';

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
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
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
        <LabMotion />
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader manifest={manifest} />
        <PageTransition>
          <main id="main-content" tabIndex={-1}>
            {children}
            <ContactSection />
          </main>
        </PageTransition>
        <SiteFooter manifest={manifest} />
      </body>
    </html>
  );
}
