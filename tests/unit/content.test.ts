import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { project, note } from '../fixtures/records';
import { validateRecords, createPublicManifest, loadContent } from '@/lib/content/core';
import { safeUrl, getHeadings } from '@/lib/content/markdown';

describe('approval boundary', () => {
  it('handles empty collections', () =>
    expect(createPublicManifest([])).toEqual({ projects: [], research: [] }));
  it('defaults missing state to draft and excludes explicit drafts', () => {
    const draft = Object.fromEntries(
      Object.entries(project).filter(([key]) => !['publicationState', 'approval'].includes(key)),
    );
    expect(createPublicManifest([draft]).projects).toHaveLength(0);
    expect(createPublicManifest([{ ...project, publicationState: 'draft' }]).projects).toHaveLength(
      0,
    );
  });
  it('requires approval for public records', () =>
    expect(() => validateRecords([{ ...project, approval: undefined }])).toThrow(/approval/i));
  it('requires approved attribution for projects', () =>
    expect(() => validateRecords([{ ...project, attributionNote: '' }])).toThrow());
  it('requires limitations and authors', () => {
    expect(() => validateRecords([{ ...project, limitations: '' }])).toThrow();
    expect(() => validateRecords([{ ...note, authors: [] }])).toThrow();
  });
  it('projects only public fields, excluding reviewer metadata', () => {
    const manifest = createPublicManifest([project, note]);
    expect(manifest.projects[0].slug).toBe(project.slug);
    expect(manifest.research[0].slug).toBe(note.slug);
    expect(JSON.stringify(manifest)).not.toMatch(
      /QA reviewer|permittedAttribution|publicationState/,
    );
  });
  it('rejects duplicate slugs', () =>
    expect(() => validateRecords([project, project])).toThrow(/duplicate/i));
  it.each(['../bad', 'UPPER', 'a/b', 'two words'])('rejects unsafe slug %s', (slug) =>
    expect(() => validateRecords([{ ...project, slug }])).toThrow(),
  );
  it.each(['2026-02-30', 'yesterday', '2026-13-01'])('rejects invalid date %s', (date) =>
    expect(() => validateRecords([{ ...project, statusReviewedAt: date }])).toThrow(),
  );
  it('rejects invalid enums and unknown metadata', () => {
    expect(() => validateRecords([{ ...project, status: 'funded' }])).toThrow();
    expect(() => validateRecords([{ ...project, secretField: 'no' }])).toThrow();
  });
  it('rejects missing relations and public references to drafts', () => {
    expect(() => validateRecords([{ ...project, relatedNotes: ['unknown'] }])).toThrow(/relation/i);
    expect(() =>
      validateRecords([
        { ...project, relatedNotes: [note.slug] },
        { ...note, publicationState: 'draft' },
      ]),
    ).toThrow(/relation/i);
    expect(validateRecords([{ ...project, relatedNotes: [note.slug] }, note])).toHaveLength(2);
  });
  it('requires evidence for license and funding, and a demo environment', () => {
    expect(() => validateRecords([{ ...project, license: { label: 'MIT' } }])).toThrow();
    expect(() => validateRecords([{ ...project, funding: [{ label: 'Grant' }] }])).toThrow();
    expect(() => validateRecords([{ ...project, links: { demo: 'https://example.com' } }])).toThrow(
      /demo/i,
    );
  });
  it('rejects inline links to unpublished content', () =>
    expect(() => validateRecords([{ ...note, body: '[Hidden](/work/private-draft)' }])).toThrow(
      /link/i,
    ));
  it('loads exact extensions from allowlisted directories only', async () => {
    const root = await mkdtemp(join(tmpdir(), 'kurisu-content-'));
    try {
      await mkdir(join(root, 'projects'));
      await mkdir(join(root, 'research'));
      const { body, ...metadata } = project;
      await writeFile(
        join(root, 'projects', `${project.slug}.md`),
        `---\n${stringify(metadata)}---\n${body}`,
      );
      await writeFile(join(root, 'projects', 'ignored.mdx.example'), 'not content');
      await writeFile(join(root, 'private.md'), 'not content');
      expect((await loadContent(root)).projects).toHaveLength(1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe('Markdown safety and navigation', () => {
  it.each([
    'javascript:alert(1)',
    'data:text/html,x',
    '//evil.example',
    '/\\evil.example',
    ' javaScript:alert(1)',
    'https://user:pass@example.com',
  ])('rejects unsafe URL %s', (url) => expect(safeUrl(url)).toBe(false));
  it.each(['https://example.com/path', '/about', '#question', 'mailto:hello@kurisulabs.tech'])(
    'accepts safe URL %s',
    (url) => expect(safeUrl(url)).toBe(true),
  );
  it('rejects unsafe Markdown links and raw HTML', () => {
    expect(() => validateRecords([{ ...note, body: '[Click](javascript:alert)' }])).toThrow();
    expect(() =>
      validateRecords([{ ...note, body: '<iframe src="https://example.com"></iframe>' }]),
    ).toThrow();
  });
  it('generates stable distinct anchors from meaningful H2 headings', () => {
    expect(getHeadings('## Same **heading**\n\n## Same heading\n\n### Child')).toEqual([
      { id: 'same-heading', text: 'Same heading' },
      { id: 'same-heading-1', text: 'Same heading' },
    ]);
  });
});
