import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { validateRecords, createPublicManifest } from '@/lib/content/core';
import { ArticleLayout } from '@/components/article-layout';
import { note } from '../fixtures/records';
const media = [
  {
    src: '/media/diagram.png',
    alt: 'A test diagram',
    caption: 'Reviewed test figure',
    width: 960,
    height: 480,
  },
];
it('rejects reference images that bypass local-only media and alt/caption rules', () => {
  expect(() =>
    validateRecords([
      { ...note, body: '![][diagram]\n\n[diagram]: https://example.com/tracker.png' },
    ]),
  ).toThrow(/image/i);
});
it('resolves legitimate local image references', () => {
  expect(() =>
    validateRecords([
      {
        ...note,
        media,
        body: '![A test diagram][diagram]\n\n[diagram]: /media/diagram.png "Reviewed test figure"',
      },
    ]),
  ).not.toThrow();
});
it('linked figures have valid flow markup and reserve their intrinsic size', () => {
  const manifest = createPublicManifest([
    {
      ...note,
      media,
      body: '[![A test diagram](/media/diagram.png "Reviewed test figure")](https://example.com)',
    },
  ]);
  const html = renderToStaticMarkup(<ArticleLayout note={manifest.research[0]} projects={[]} />);
  expect(html).not.toMatch(/<p><a[^>]*><figure/);
  expect(html).toContain('width="960"');
  expect(html).toContain('height="480"');
});
it('requires declared media dimensions for body images', () => {
  expect(() =>
    validateRecords([
      { ...note, body: '![A test diagram](/media/diagram.png "Reviewed test figure")' },
    ]),
  ).toThrow(/media/i);
});
