'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/** Animate only the committed page; Next retains navigation, history, scroll and focus. */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const content = document.getElementById('main-content');
    if (preference.matches || document.hidden || !content?.animate) return;

    // Child router effects restore scroll before this parent effect. No outgoing snapshot,
    // layout transform, or artificial delay can interfere with that restoration.
    const animation = content.animate([{ opacity: 0 }, { opacity: 1 }], {
      id: 'page-content-in',
      duration: 260,
      easing: 'ease-out',
    });
    const cancel = () => animation.cancel();
    const onPreferenceChange = () => {
      if (preference.matches) cancel();
    };
    const onVisibilityChange = () => {
      if (document.hidden) cancel();
    };
    preference.addEventListener('change', onPreferenceChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      cancel();
      preference.removeEventListener('change', onPreferenceChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [pathname]);

  return children;
}
