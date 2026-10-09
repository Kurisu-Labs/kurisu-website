import { getHeadings } from '@/lib/content/markdown';
export function ArticleToc({ body }: { body: string }) {
  const headings = getHeadings(body);
  if (headings.length < 4) return null;
  return (
    <details className="article-toc" open>
      <summary>On this page</summary>
      <ol>
        {headings.map((heading) => (
          <li key={heading.id}>
            <a href={`#${heading.id}`}>{heading.text}</a>
          </li>
        ))}
      </ol>
    </details>
  );
}
