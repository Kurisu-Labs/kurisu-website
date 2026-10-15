import { getHeadings } from '@/lib/content/markdown';
export function ArticleToc({ body }: { body: string }) {
  const headings = getHeadings(body);
  if (headings.length < 4) return null;
  return (
    <nav className="article-toc" aria-label="On this page">
      <p className="article-toc-title">On this page</p>
      <ol>
        {headings.map((heading) => (
          <li key={heading.id}>
            <a href={`#${heading.id}`}>{heading.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
