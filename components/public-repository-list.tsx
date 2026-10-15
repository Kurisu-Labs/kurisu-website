import type { PublicRepository } from '@/lib/public-repositories';
import { Arrow } from './icons';
import { RepositoryDiagram } from './repository-diagram';

export function PublicRepositoryList({
  repositories,
}: {
  repositories: readonly PublicRepository[];
}) {
  return (
    <ol className="repository-list">
      {repositories.map((repository, index) => (
        <li
          className="repository-row"
          data-motion-surface="card"
          data-scroll-focus
          key={repository.slug}
        >
          <RepositoryDiagram slug={repository.slug} />
          <div className="repository-content" data-scroll-reveal>
            <span className="repository-index" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="repository-copy">
              <div className="repository-meta">
                <span>{repository.language}</span>
                <span>{repository.scope}</span>
                {repository.archived && <span>Archived</span>}
                {repository.fork && <span>Fork</span>}
              </div>
              <h3>
                <a className="repository-link" href={repository.href}>
                  {repository.name}
                  <Arrow external />
                  <span className="sr-only"> on GitHub</span>
                </a>
              </h3>
              <p>{repository.description}</p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
