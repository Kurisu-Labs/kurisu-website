import { readdir, readFile, lstat } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import {
  recordSchema,
  publicProjectSchema,
  publicResearchSchema,
  type PublicManifest,
} from './schema';
import { markdownTree, markdownLinks, safeUrl, walkMarkdown } from './markdown';
import sharp from 'sharp';

export function validateRecords(input: unknown[]) {
  const records = input.map((record) => recordSchema.parse(record));
  const ids = new Set<string>();
  for (const record of records) {
    const key = `${record.kind}/${record.slug}`;
    if (ids.has(key)) throw new Error(`Duplicate slug: ${key}`);
    ids.add(key);
    if (record.publicationState === 'public' && !record.approval)
      throw new Error(`Missing approval: ${key}`);
    if (record.kind === 'project') {
      if (record.links.demo && !record.demoEnvironment)
        throw new Error(`Missing demo environment: ${key}`);
      if (record.license && !record.links.repository)
        throw new Error(`License requires repository: ${key}`);
    } else if (record.updatedAt && record.updatedAt < record.publishedAt)
      throw new Error(`Update precedes publication: ${key}`);
  }
  const publicPaths = new Set([
    '/',
    '/research',
    '/about',
    '/privacy',
    ...(records.some((r) => r.kind === 'project' && r.publicationState === 'public')
      ? ['/work']
      : []),
  ]);
  for (const record of records.filter((r) => r.publicationState === 'public'))
    publicPaths.add(`/${record.kind === 'project' ? 'work' : 'research'}/${record.slug}`);
  for (const record of records) {
    const relatedKind = record.kind === 'project' ? 'research' : 'project';
    const relations = record.kind === 'project' ? record.relatedNotes : record.relatedProjects;
    for (const slug of relations) {
      const target = records.find((r) => r.kind === relatedKind && r.slug === slug);
      if (!target || (record.publicationState === 'public' && target.publicationState !== 'public'))
        throw new Error(`Invalid relation from ${record.slug} to ${slug}`);
    }
    walkMarkdown(markdownTree(record.body), (node) => {
      if (node.type === 'html')
        throw new Error(`Raw HTML is not allowed in Markdown: ${record.slug}`);
      if (node.type === 'heading' && node.depth === 1)
        throw new Error(`Body headings must begin at H2: ${record.slug}`);
    });
    for (const link of markdownLinks(record.body)) {
      if (!safeUrl(link.url)) throw new Error(`Unsafe Markdown link in ${record.slug}`);
      if (link.kind === 'image') {
        if (
          !/^\/media\/[\w/-]+\.(png|jpe?g|webp|avif)$/.test(link.url) ||
          !link.alt?.trim() ||
          !link.title?.trim()
        )
          throw new Error(
            `Images require local /media assets, alt text and a title caption: ${record.slug}`,
          );
        if (!record.media.some((media) => media.src === link.url))
          throw new Error(`Image requires declared media dimensions: ${record.slug}`);
      } else if (record.publicationState === 'public' && link.url.startsWith('/')) {
        const target = new URL(link.url, 'https://kurisulabs.tech').pathname;
        if (!publicPaths.has(target))
          throw new Error(`Unpublished internal link in ${record.slug}: ${target}`);
      }
    }
  }
  return records;
}
export function createPublicManifest(input: unknown[]): PublicManifest {
  const records = validateRecords(input).filter((record) => record.publicationState === 'public');
  return {
    projects: records
      .filter((record) => record.kind === 'project')
      .map((record) => publicProjectSchema.parse(record))
      .sort(
        (a, b) =>
          Number(a.status === 'archived') - Number(b.status === 'archived') ||
          b.statusReviewedAt.localeCompare(a.statusReviewedAt) ||
          a.title.localeCompare(b.title),
      ),
    research: records
      .filter((record) => record.kind === 'research')
      .map((record) => publicResearchSchema.parse(record))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title)),
  };
}
export async function readRecords(root: string): Promise<unknown[]> {
  const records: unknown[] = [];
  for (const [directory, kind] of [
    ['projects', 'project'],
    ['research', 'research'],
  ] as const) {
    // Exact directory and extension allowlist; no recursion, symlinks, examples or MDX execution.
    const folder = path.join(root, directory);
    if (!(await lstat(folder)).isDirectory())
      throw new Error(`Content directories must be real directories: ${folder}`);
    const entries = await readdir(folder, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const source = await readFile(path.join(root, directory, entry.name), 'utf8');
      const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(source);
      if (!match) throw new Error(`Missing YAML frontmatter: ${directory}/${entry.name}`);
      const metadata: unknown = parse(match[1], { uniqueKeys: true });
      if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata))
        throw new Error(`Invalid metadata: ${entry.name}`);
      const record = recordSchema.parse({ ...metadata, body: match[2].trim() });
      if (record.kind !== kind || entry.name !== `${record.slug}.md`)
        throw new Error(`Filename/kind/slug mismatch: ${entry.name}`);
      records.push(record);
    }
  }
  return records;
}
export async function loadContent(root: string): Promise<PublicManifest> {
  return createPublicManifest(await readRecords(root));
}
export async function validateMedia(manifest: PublicManifest, publicRoot: string) {
  for (const record of [...manifest.projects, ...manifest.research]) {
    for (const media of record.media) {
      const file = path.join(publicRoot, media.src);
      if (!(await lstat(file)).isFile()) throw new Error(`Media must be a real file: ${media.src}`);
      const dimensions = await sharp(file).metadata();
      if (dimensions.width !== media.width || dimensions.height !== media.height)
        throw new Error(`Incorrect media dimensions: ${media.src}`);
    }
  }
}
