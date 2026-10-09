import type { ResearchNote } from '@/lib/content/schema';
import { displayDate, humanize } from '@/lib/site';
export function NoteList({ notes }: { notes: ResearchNote[] }) {
  return (
    <div className="note-list">
      {notes.map((note) => (
        <article className="note-row" key={note.slug}>
          <p className="meta">
            <time dateTime={note.publishedAt}>{displayDate(note.publishedAt)}</time>
            <span>{humanize(note.type)}</span>
          </p>
          <div>
            <h3>
              <a href={`/research/${note.slug}`}>{note.title}</a>
            </h3>
            <p>{note.summary}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
