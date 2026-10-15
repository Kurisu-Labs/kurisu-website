/**
 * Curated from the unauthenticated public GitHub API and repository READMEs on
 * 2026-10-15. This is a build-time catalog, never a runtime GitHub request.
 * Repository links do not create approved case studies or detail routes.
 */
export type PublicRepository = {
  slug: string;
  name: string;
  description: string;
  href: string;
  language: string;
  scope: string;
  archived: boolean;
  fork: boolean;
};

export type PublicRepositorySource = PublicRepository & {
  owner: string;
  private: boolean;
  visibility: string;
  readmeHref: string;
  readmeBlobSha: string;
};

export const repositoryCatalogVerifiedAt = '2026-10-15';

export function selectPublicRepositories(
  sources: readonly PublicRepositorySource[],
): PublicRepository[] {
  return sources
    .filter(
      (repository) =>
        repository.owner === 'Kurisu-Labs' &&
        repository.private === false &&
        repository.visibility === 'public' &&
        repository.slug.toLowerCase() !== 'kurisu-website' &&
        /^[a-zA-Z0-9._-]+$/.test(repository.slug) &&
        repository.href === `https://github.com/Kurisu-Labs/${repository.slug}`,
    )
    .map(({ slug, name, description, href, language, scope, archived, fork }) => ({
      slug,
      name,
      description,
      href,
      language,
      scope,
      archived,
      fork,
    }));
}

const sources: readonly PublicRepositorySource[] = [
  {
    slug: 'rentra',
    name: 'Rentra',
    description:
      'A peer-to-peer rental escrow experiment using onchain deposits and renter reputation in place of identity-card collateral.',
    href: 'https://github.com/Kurisu-Labs/rentra',
    language: 'Solidity',
    scope: 'Ethereum Sepolia',
    archived: false,
    fork: false,
    owner: 'Kurisu-Labs',
    private: false,
    visibility: 'public',
    readmeHref: 'https://github.com/Kurisu-Labs/rentra/blob/main/README.md',
    readmeBlobSha: '1f29b316d2b7c45afd6f1cf205ba8dbdbdd52f43',
  },
  {
    slug: 'ruin-relay',
    name: 'Ruin Relay',
    description:
      'A shared dungeon puzzle where escaping lets a player propose a tile change, with a smart contract checking the path and keeping the dungeon solvable.',
    href: 'https://github.com/Kurisu-Labs/ruin-relay',
    language: 'TypeScript',
    scope: 'Arbitrum Sepolia',
    archived: false,
    fork: false,
    owner: 'Kurisu-Labs',
    private: false,
    visibility: 'public',
    readmeHref: 'https://github.com/Kurisu-Labs/ruin-relay/blob/main/README.md',
    readmeBlobSha: 'a1ab11c92cc4800b94519f4bb50fc4eaf084c1bb',
  },
  {
    slug: 'zecsolve',
    name: 'zecsolve',
    description:
      'A case-management app for disputed Zcash shielded payments, using selected receipt evidence, merchant review, and records that can be replayed offline.',
    href: 'https://github.com/Kurisu-Labs/zecsolve',
    language: 'Python',
    scope: 'Demonstration',
    archived: false,
    fork: false,
    owner: 'Kurisu-Labs',
    private: false,
    visibility: 'public',
    readmeHref: 'https://github.com/Kurisu-Labs/zecsolve/blob/main/README.md',
    readmeBlobSha: 'f754846cb191470d03bfe6ab2a0a52056789e2db',
  },
];

export const publicRepositories: readonly PublicRepository[] = selectPublicRepositories(sources);
