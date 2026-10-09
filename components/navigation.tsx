'use client';
import { usePathname } from 'next/navigation';
import { useRef, useState, useSyncExternalStore } from 'react';
import { Arrow } from './icons';

const subscribe = () => () => {};
export function Navigation({
  links,
  github,
}: {
  links: { href: string; label: string }[];
  github: string;
}) {
  const pathname = usePathname();
  const disclosure = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const items = links.map((link) => (
    <a
      key={link.href}
      href={link.href}
      aria-current={
        link.href === pathname || (link.href !== '/' && pathname.startsWith(`${link.href}/`))
          ? 'page'
          : undefined
      }
    >
      {link.label}
    </a>
  ));
  const external = (
    <a href={github} className="github-link">
      GitHub <Arrow external />
    </a>
  );
  return (
    <>
      <nav className="desktop-navigation" aria-label="Main">
        {items}
        {external}
      </nav>
      <details
        className="mobile-navigation"
        ref={disclosure}
        onToggle={(event) => setOpen(event.currentTarget.open)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && disclosure.current?.open) {
            disclosure.current.open = false;
            disclosure.current.querySelector('summary')?.focus();
          }
        }}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('a') && disclosure.current)
            disclosure.current.open = false;
        }}
      >
        <summary aria-controls="mobile-links" aria-expanded={hydrated ? open : undefined}>
          Menu <span className="menu-glyph" aria-hidden="true" />
        </summary>
        <nav id="mobile-links" aria-label="Mobile">
          {items}
          {external}
        </nav>
      </details>
    </>
  );
}
