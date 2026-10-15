'use client';

import { useEffect } from 'react';

/** Adds optional controls; native radio selection remains the source of truth. */
export function ResearchNetworkMotion({ networkId }: { networkId: string }) {
  useEffect(() => {
    const network = document.getElementById(networkId);
    const shell = network?.closest<HTMLElement>('.research-network-shell');
    const map = network?.querySelector<HTMLElement>('.research-network-map');
    const next = network?.querySelector<HTMLButtonElement>('[data-network-next]');
    const counter = network?.querySelector<HTMLElement>('[data-network-counter]');
    const status = shell?.querySelector<HTMLElement>('[data-network-status]');
    const radios = [
      ...(network?.querySelectorAll<HTMLInputElement>('.research-network-radio') ?? []),
    ];
    if (!network || !shell || !map || !next || !counter || !status || !radios.length) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const observerAvailable = typeof IntersectionObserver !== 'undefined';
    const updateMotion = () => {
      shell.dataset.networkRunning = String(visible && !document.hidden && !reducedMotion.matches);
    };
    const selectedIndex = () =>
      Math.max(
        0,
        radios.findIndex((radio) => radio.checked),
      );
    const updateSelection = () => {
      counter.textContent = `${String(selectedIndex() + 1).padStart(2, '0')} / ${String(radios.length).padStart(2, '0')}`;
    };
    const advance = () => {
      const index = (selectedIndex() + 1) % radios.length;
      const radio = radios[index];
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      const title =
        radio.labels?.[0]?.querySelector('.research-network-node-title')?.textContent?.trim() ??
        radio.value;
      status.textContent = `Direction ${index + 1} of ${radios.length}: ${title}.`;
    };
    const observer = observerAvailable
      ? new IntersectionObserver((entries) => {
          visible = entries.some(
            (entry) =>
              entry.isIntersecting &&
              entry.boundingClientRect.width > 0 &&
              entry.boundingClientRect.height > 0,
          );
          updateMotion();
        })
      : null;

    shell.dataset.networkEnhanced = 'true';
    next.hidden = false;
    updateSelection();
    updateMotion();
    observer?.observe(map);
    next.addEventListener('click', advance);
    network.addEventListener('change', updateSelection);
    reducedMotion.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateMotion);

    return () => {
      observer?.disconnect();
      next.removeEventListener('click', advance);
      network.removeEventListener('change', updateSelection);
      reducedMotion.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', updateMotion);
      next.hidden = true;
      status.textContent = '';
      delete shell.dataset.networkEnhanced;
      delete shell.dataset.networkRunning;
    };
  }, [networkId]);

  return null;
}
