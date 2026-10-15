import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createPublicManifest } from '@/lib/content/core';
import { project, note } from '../fixtures/records';
import { publicNavigation, sitemapEntries } from '@/lib/site';
import { HomeContent } from '@/components/home-content';

describe('public navigation and approved content', () => {
  it('keeps the research-first home and links the verified public portfolio', () => {
    const empty = createPublicManifest([]);
    const html = renderToStaticMarkup(<HomeContent manifest={empty} />);
    expect(html).toContain('Building a decentralized future, together.');
    expect(html).toContain('Web2–Web3');
    expect(html).toContain('Small teams.');
    expect(html).not.toMatch(/Selected work|Notes from the lab|Coming soon/);
    expect(publicNavigation(empty).some((link) => link.href === '/work')).toBe(true);
    expect(sitemapEntries(empty).map((entry) => entry.url)).toEqual([
      'https://kurisulabs.tech/',
      'https://kurisulabs.tech/research',
      'https://kurisulabs.tech/about',
      'https://kurisulabs.tech/privacy',
      'https://kurisulabs.tech/work',
    ]);
    expect(sitemapEntries(empty).some((entry) => entry.lastModified)).toBe(false);
  });
  it('activates approved work, prior-work attribution, notes and sitemap together', () => {
    const manifest = createPublicManifest([project, note]);
    const html = renderToStaticMarkup(<HomeContent manifest={manifest} />);
    expect(html).toContain('Explore our work');
    expect(html).toContain('Previous work by our members');
    expect(html).toContain('Notes from the lab');
    expect(publicNavigation(manifest).some((link) => link.href === '/work')).toBe(true);
    expect(
      sitemapEntries(manifest).some((entry) => entry.url.endsWith(`/work/${project.slug}`)),
    ).toBe(true);
  });
});
