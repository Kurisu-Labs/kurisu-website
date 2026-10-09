import { Arrow } from '@/components/icons';
import Link from 'next/link';
export default function NotFound() {
  return (
    <section className="container not-found">
      <p className="eyebrow">404 / Page not found</p>
      <h1>This page isn’t here.</h1>
      <p>
        The address may have changed, or the page may not be available. There are still questions
        worth exploring.
      </p>
      <div className="hero-actions">
        <Link className="button button-primary" href="/">
          Return home
          <Arrow />
        </Link>
        <Link className="text-link" href="/research">
          Explore our research
        </Link>
      </div>
    </section>
  );
}
