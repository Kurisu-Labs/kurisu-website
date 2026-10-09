import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import GithubSlugger from 'github-slugger';
import type { Root, RootContent } from 'mdast';

export function safeUrl(url: string): boolean {
  if (!url || url.trim() !== url || /[\u0000-\u0020\\]/.test(url) || /%0[ad]/i.test(url))
    return false;
  if (url.startsWith('#')) return /^#[\w-]+$/.test(url);
  if (url.startsWith('/')) return !url.startsWith('//') && !/%2f|%5c|\.\./i.test(url);
  try {
    const parsed = new URL(url);
    return (
      ['https:', 'http:', 'mailto:'].includes(parsed.protocol) &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}
export function markdownTree(body: string): Root {
  return unified().use(remarkParse).use(remarkGfm).parse(body);
}
export function textOf(node: Root | RootContent): string {
  if ('value' in node) return node.value;
  if ('children' in node) return node.children.map((child) => textOf(child)).join('');
  if ('alt' in node) return node.alt ?? '';
  return '';
}
export function walkMarkdown(
  node: Root | RootContent,
  visit: (node: Root | RootContent) => void,
): void {
  visit(node);
  if ('children' in node) node.children.forEach((child) => walkMarkdown(child, visit));
}
export function markdownLinks(body: string) {
  const tree = markdownTree(body);
  const definitions = new Map<string, { url: string; title?: string | null }>();
  walkMarkdown(tree, (node) => {
    if (node.type === 'definition') definitions.set(node.identifier.toUpperCase(), node);
  });
  const links: {
    kind: 'image' | 'link';
    url: string;
    alt?: string | null;
    title?: string | null;
  }[] = [];
  walkMarkdown(tree, (node) => {
    if (node.type === 'image' || node.type === 'link')
      links.push({
        kind: node.type,
        url: node.url,
        title: node.title,
        ...('alt' in node ? { alt: node.alt } : {}),
      });
    if (node.type === 'imageReference' || node.type === 'linkReference') {
      const definition = definitions.get(node.identifier.toUpperCase());
      if (!definition) throw new Error('Missing Markdown link/image reference definition');
      links.push({
        kind: node.type === 'imageReference' ? 'image' : 'link',
        ...definition,
        ...('alt' in node ? { alt: node.alt } : {}),
      });
    }
  });
  return links;
}
export function getHeadings(body: string): { id: string; text: string }[] {
  const headings: { id: string; text: string }[] = [];
  const slugger = new GithubSlugger();
  walkMarkdown(markdownTree(body), (node) => {
    if (node.type === 'heading') {
      const text = textOf(node);
      const id = slugger.slug(text);
      if (node.depth === 2 && text.trim()) headings.push({ id, text });
    }
  });
  return headings;
}
// The renderer and TOC consume the same heading-slug algorithm.
export function headingIds() {
  return (tree: Root) => {
    const slugger = new GithubSlugger();
    walkMarkdown(tree, (node) => {
      if (node.type === 'heading')
        node.data = { ...node.data, hProperties: { id: slugger.slug(textOf(node)) } };
    });
  };
}
