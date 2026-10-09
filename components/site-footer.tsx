import { site } from '@/lib/site';
import { BrandMark } from './brand-mark';
import { Arrow } from './icons';
import Link from 'next/link';
export function SiteFooter() {
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
        <Link href="/about">About</Link>
        <Link href="/#contact">Contact</Link>
        <Link href="/privacy">Privacy</Link>
        <a href={site.github}>
          GitHub <Arrow external />
        </a>
      </nav>
      <p className="copyright">© {new Date().getUTCFullYear()} Kurisu Labs</p>
    </footer>
  );
}
