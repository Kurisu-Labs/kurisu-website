import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProjectLayout } from '@/components/project-layout';
import { ArticleLayout } from '@/components/article-layout';
import { createPublicManifest } from '@/lib/content/core';
import { project, note } from '../fixtures/records';

describe('complete isolated templates', () => {
  it('renders attribution, limitations, current state and no unavailable artifacts', () => {
    const manifest = createPublicManifest([project]);
    const html = renderToStaticMarkup(<ProjectLayout project={manifest.projects[0]} notes={[]} />);
    for (const expected of [
      'Context',
      'Approach',
      'Findings',
      'Limitations',
      'Current state',
      'QA contributor',
      project.attributionNote,
    ])
      expect(html).toContain(expected);
    expect(html).not.toMatch(/Open demo|Open source|Artifacts|href="#"/);
  });
  it('distinguishes archived records, testnet demos and verified licenses', () => {
    const manifest = createPublicManifest([
      {
        ...project,
        status: 'archived',
        links: { demo: 'https://example.com/demo', repository: 'https://example.com/repo' },
        demoEnvironment: 'testnet',
        license: {
          name: 'MIT',
          evidenceUrl: 'https://example.com/license',
          verifiedAt: '2026-10-01',
          openSource: true,
        },
      },
    ]);
    const html = renderToStaticMarkup(<ProjectLayout project={manifest.projects[0]} notes={[]} />);
    expect(html).toContain('This project is no longer actively maintained.');
    expect(html).toContain('Open testnet demo');
    expect(html).toContain('Open source');
  });
  it('renders article headings, TOC, reference links and overflow regions', () => {
    const manifest = createPublicManifest([note]);
    const html = renderToStaticMarkup(<ArticleLayout note={manifest.research[0]} projects={[]} />);
    for (const expected of [
      'On this page',
      'next-questions-1',
      'Code example',
      'Scrollable data table',
      'References',
      'QA author',
    ])
      expect(html).toContain(expected);
    expect(html).not.toMatch(/permittedAttribution|QA reviewer/);
  });
  it('omits a TOC for short notes and optional related sections', () => {
    const manifest = createPublicManifest([
      { ...note, body: '## Brief question\n\nA short note.' },
    ]);
    const html = renderToStaticMarkup(<ArticleLayout note={manifest.research[0]} projects={[]} />);
    expect(html).not.toMatch(/On this page|Related work/);
  });
});
