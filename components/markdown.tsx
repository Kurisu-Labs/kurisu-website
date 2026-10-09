import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Children, isValidElement, type ReactNode } from 'react';
import { headingIds, safeUrl } from '@/lib/content/markdown';
import { CopyButton } from './copy-button';
import type { ContentMedia } from '@/lib/content/schema';
import type { Element, ElementContent } from 'hast';

function nodeText(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) =>
      isValidElement<{ children?: ReactNode }>(child)
        ? nodeText(child.props.children)
        : String(child),
    )
    .join('');
}
function containsImage(node: Element | ElementContent): boolean {
  return node.type === 'element' && (node.tagName === 'img' || node.children.some(containsImage));
}
export function Markdown({ body, media = [] }: { body: string; media?: ContentMedia[] }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, headingIds]}
      skipHtml
      urlTransform={(url) => (safeUrl(url) ? url : '')}
      components={{
        pre({ children }) {
          const child = Children.toArray(children)[0];
          const language = isValidElement<{ className?: string }>(child)
            ? child.props.className?.replace('language-', '')
            : undefined;
          const code = nodeText(children).replace(/\n$/, '');
          return (
            <div className="code-block">
              <div className="code-toolbar">
                <span>{language || 'Code'}</span>
                <CopyButton
                  value={code}
                  label="Copy code"
                  success="Code copied"
                  failure="Couldn’t copy the code. You can select and copy it instead."
                />
              </div>
              <pre tabIndex={0} aria-label="Code example">
                <code>{code}</code>
              </pre>
            </div>
          );
        },
        table({ children }) {
          return (
            <div
              className="table-scroll"
              role="region"
              aria-label="Scrollable data table"
              tabIndex={0}
            >
              <table>{children}</table>
            </div>
          );
        },
        p({ children, node }) {
          return node && containsImage(node) ? (
            <div className="image-paragraph">{children}</div>
          ) : (
            <p>{children}</p>
          );
        },
        img({ src, alt, title }) {
          const dimensions = media.find((item) => item.src === src);
          // Local author-approved media; no external image request or arbitrary HTML.
          return (
            <figure className="content-figure">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={typeof src === 'string' ? src : ''}
                alt={alt ?? ''}
                width={dimensions?.width}
                height={dimensions?.height}
                loading="lazy"
              />
              <figcaption>{title}</figcaption>
            </figure>
          );
        },
      }}
    >
      {body}
    </ReactMarkdown>
  );
}
