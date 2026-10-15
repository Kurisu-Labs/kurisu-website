import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  publicRepositories,
  selectPublicRepositories,
  type PublicRepositorySource,
} from '@/lib/public-repositories';
import { PublicRepositoryList } from '@/components/public-repository-list';

const candidate: PublicRepositorySource = {
  slug: 'public-example',
  name: 'Public example',
  description: 'A synthetic record used only to check portfolio eligibility.',
  href: 'https://github.com/Kurisu-Labs/public-example',
  language: 'TypeScript',
  scope: 'Test fixture',
  archived: false,
  fork: false,
  owner: 'Kurisu-Labs',
  private: false,
  visibility: 'public',
  readmeHref: 'https://github.com/Kurisu-Labs/public-example/blob/main/README.md',
  readmeBlobSha: 'test-only',
};

describe('public repository portfolio', () => {
  it('excludes private, internal, foreign-owner and website records', () => {
    expect(
      selectPublicRepositories([
        candidate,
        { ...candidate, private: true },
        { ...candidate, visibility: 'private' },
        { ...candidate, visibility: 'internal' },
        { ...candidate, owner: 'Another-organization' },
        {
          ...candidate,
          slug: 'kurisu-website',
          href: 'https://github.com/Kurisu-Labs/kurisu-website',
        },
      ]),
    ).toHaveLength(1);
  });

  it('rejects unsafe or mismatched destinations instead of rendering them', () => {
    for (const href of [
      'https://github.com/Another-organization/public-example',
      'https://github.com/Kurisu-Labs/public-example/settings',
      'https://example.com/public-example',
      'javascript:alert(1)',
    ]) {
      expect(selectPublicRepositories([{ ...candidate, href }])).toEqual([]);
    }
  });

  it('contains the reviewed public repositories and direct source links only', () => {
    expect(publicRepositories.map((repository) => repository.slug)).toEqual([
      'rentra',
      'ruin-relay',
      'zecsolve',
    ]);
    const html = renderToStaticMarkup(<PublicRepositoryList repositories={publicRepositories} />);
    for (const repository of publicRepositories) {
      expect(html).toContain(`href="${repository.href}"`);
      expect(html).toContain(repository.name);
    }
    expect(html).not.toMatch(/kurisu-website|\/work\/|private-example/);
    expect(html.match(/<li /g)).toHaveLength(3);
  });
});
