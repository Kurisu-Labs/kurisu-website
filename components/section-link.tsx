'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AnchorHTMLAttributes } from 'react';

/** Same-page sections use native anchors; another page uses the normal Next router. */
export function SectionLink({
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const pathname = usePathname();
  const hash = href.indexOf('#');
  if (hash >= 0 && (!href.slice(0, hash) || href.slice(0, hash) === pathname))
    return <a href={href.slice(hash)} {...props} />;
  return <Link href={href} {...props} />;
}
