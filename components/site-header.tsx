import type { PublicManifest } from '@/lib/content/schema';
import { publicNavigation, site } from '@/lib/site';
import { BrandMark } from './brand-mark';
import { Navigation } from './navigation';
import Link from 'next/link';
export function SiteHeader({ manifest }: { manifest: PublicManifest }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand-lockup" aria-label="Kurisu Labs home">
          <BrandMark />
          <span>Kurisu Labs</span>
        </Link>
        <Navigation links={publicNavigation(manifest)} github={site.github} />
      </div>
    </header>
  );
}
