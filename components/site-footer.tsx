import { publicNavigation, site } from '@/lib/site';
import type { PublicManifest } from '@/lib/content/schema';
import { BrandMark } from './brand-mark';
import { Arrow } from './icons';
import Link from 'next/link';
import { SectionLink } from './section-link';
export function SiteFooter({ manifest }: { manifest: PublicManifest }) {
  return (
    <footer className="site-footer container">
      <div className="footer-brand">
        <Link href="/" className="brand-lockup">
          <BrandMark />
          <span>Kurisu Labs</span>
        </Link>
        <p>
          Independent research,
          <br />
          experimentation, and engineering.
        </p>
      </div>
      <nav aria-label="Footer">
        <Link href="/research">Research</Link>
        {publicNavigation(manifest).some((link) => link.href === '/work') && (
          <Link href="/work">Work</Link>
        )}
        <Link href="/about">About</Link>
        <SectionLink href="/#contact">Contact</SectionLink>
        <Link href="/privacy">Privacy</Link>
        <a href={site.github}>
          GitHub <Arrow external />
        </a>
      </nav>
      <p className="copyright">© {new Date().getUTCFullYear()} Kurisu Labs</p>
    </footer>
  );
}
