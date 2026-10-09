import Link from 'next/link';
import type { Project, ResearchNote } from '@/lib/content/schema';
import { displayDate, humanize } from '@/lib/site';
import { Markdown } from './markdown';
import { ArticleToc } from './article-toc';
import { WorkList } from './work-list';

export function ArticleLayout({ note, projects }: { note: ResearchNote; projects: Project[] }) {
  return (
    <article className="container">
      <header className="detail-header">
        <Link className="text-link" href="/research">
          All research
        </Link>
        <p className="meta">{humanize(note.type)}</p>
        <h1>{note.title}</h1>
        <p className="lead">{note.summary}</p>
        <div className="article-byline">
          <span>By {note.authors.join(', ')}</span>
          <time dateTime={note.publishedAt}>{displayDate(note.publishedAt)}</time>
          {note.updatedAt && (
            <span>
              Updated <time dateTime={note.updatedAt}>{displayDate(note.updatedAt)}</time>
            </span>
          )}
        </div>
        {note.areas.length > 0 && <p className="meta">{note.areas.join(' / ')}</p>}
      </header>
      <div className="detail-body">
        <aside className="detail-sidebar" aria-label="Article navigation">
          <ArticleToc body={note.body} />
        </aside>
        <div className="prose">
          <Markdown body={note.body} media={note.media} />
          {note.sources.length > 0 && (
            <section>
              <h2 id="references">References</h2>
              <ol>
                {note.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url}>{source.title}</a>
                    {source.accessedAt && <span> — accessed {displayDate(source.accessedAt)}</span>}
                  </li>
                ))}
              </ol>
            </section>
          )}
          {projects.length > 0 && (
            <section className="related-content">
              <h2>Related work</h2>
              <WorkList projects={projects} />
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
