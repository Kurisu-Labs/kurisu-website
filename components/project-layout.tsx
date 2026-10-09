import Link from 'next/link';
import type { Project, ResearchNote } from '@/lib/content/schema';
import { displayDate, humanize } from '@/lib/site';
import { Markdown } from './markdown';
import { NoteList } from './note-list';
import { Arrow } from './icons';

export function ProjectLayout({ project, notes }: { project: Project; notes: ResearchNote[] }) {
  return (
    <article className="container">
      <header className="detail-header">
        <Link className="text-link" href="/work">
          All work
        </Link>
        <p className="meta">{humanize(project.type)}</p>
        <h1>{project.title}</h1>
        <p className="lead">{project.summary}</p>
        <div className="detail-metadata">
          <span className={`status status-${project.status}`}>{humanize(project.status)}</span>
          <span>{project.period}</span>
          <span>{project.ecosystems.join(', ')}</span>
        </div>
        <p className="detail-attribution">{project.attributionNote}</p>
        {project.status === 'archived' && (
          <p className="archive-notice">
            This project is no longer actively maintained. Findings and artifacts remain available.
          </p>
        )}
      </header>
      <div className="detail-body">
        <aside className="detail-sidebar" aria-label="Project information">
          <dl>
            <dt>Contributors</dt>
            <dd>{project.contributors.join(', ')}</dd>
            <dt>Relationship</dt>
            <dd>{humanize(project.attribution)}</dd>
            {project.areas.length > 0 && (
              <>
                <dt>Research areas</dt>
                <dd>{project.areas.join(', ')}</dd>
              </>
            )}
            <dt>Status reviewed</dt>
            <dd>
              <time dateTime={project.statusReviewedAt}>
                {displayDate(project.statusReviewedAt)}
              </time>
            </dd>
            {project.license && (
              <>
                <dt>Open source</dt>
                <dd>
                  <a href={project.license.evidenceUrl}>{project.license.name} license</a>
                </dd>
              </>
            )}
          </dl>
        </aside>
        <div className="prose">
          <section>
            <h2>Context</h2>
            <p>{project.problem}</p>
          </section>
          <section>
            <h2>Approach</h2>
            <p>{project.approach}</p>
          </section>
          {Object.values(project.links).some(Boolean) && (
            <section>
              <h2>Artifacts</h2>
              <div className="artifact-links">
                {project.links.repository && (
                  <a href={project.links.repository}>
                    View source
                    <Arrow external />
                  </a>
                )}
                {project.links.docs && (
                  <a href={project.links.docs}>
                    Read the docs
                    <Arrow external />
                  </a>
                )}
                {project.links.demo && (
                  <a href={project.links.demo}>
                    {project.demoEnvironment === 'testnet'
                      ? 'Open testnet demo'
                      : project.demoEnvironment === 'local'
                        ? 'View local demo instructions'
                        : 'Open demo'}
                    <Arrow external />
                  </a>
                )}
                {project.links.video && (
                  <a href={project.links.video}>
                    Watch the video
                    <Arrow external />
                  </a>
                )}
              </div>
            </section>
          )}
          <section>
            <h2>Project notes</h2>
            <Markdown body={project.body} media={project.media} />
          </section>
          {project.media.length > 0 && (
            <section>
              <h2>Evidence & media</h2>
              {project.media.map((media) => (
                <figure className="content-figure" key={media.src}>
                  {/* Pre-sized, local author-approved images avoid remote services. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={media.src}
                    alt={media.alt}
                    width={media.width}
                    height={media.height}
                    loading="lazy"
                  />
                  <figcaption>{media.caption}</figcaption>
                </figure>
              ))}
            </section>
          )}
          {project.findings && (
            <section>
              <h2>Findings</h2>
              <p>{project.findings}</p>
            </section>
          )}
          <section>
            <h2>Limitations</h2>
            <p>{project.limitations}</p>
          </section>
          <section>
            <h2>Current state</h2>
            <p>
              {humanize(project.status)}. Status reviewed on{' '}
              <time dateTime={project.statusReviewedAt}>
                {displayDate(project.statusReviewedAt)}
              </time>
              .
            </p>
            {project.nextSteps && <p>{project.nextSteps}</p>}
          </section>
          {project.funding.length > 0 && (
            <section>
              <h2>Funding</h2>
              <ul>
                {project.funding.map((item) => (
                  <li key={item.evidenceUrl}>
                    <a href={item.evidenceUrl}>{item.label}</a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {notes.length > 0 && (
            <section className="related-content">
              <h2>Related research</h2>
              <NoteList notes={notes} />
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
