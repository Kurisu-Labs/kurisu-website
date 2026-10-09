import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadContent, readRecords, validateRecords } from '../lib/content/core';
import { sitemapEntries } from '../lib/site';

const root = process.cwd();
const records = validateRecords(await readRecords(path.join(root, 'content')));
const forbidden = [
  'QA FIXTURE',
  'qa-fixture-',
  'QA reviewer',
  'permittedAttribution',
  'NEXT_PUBLIC_SHOW_DRAFTS',
  'HANDOFF_MANIFEST',
  ...records
    .filter((record) => record.publicationState !== 'public')
    .flatMap((record) => [record.slug, record.title, record.body]),
];
let count = 0;
async function inspect(directory: string) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink in public output: ${file}`);
    if (entry.isDirectory()) await inspect(file);
    else if (/\.(html|rsc|txt|json|js|css|xml|body|map)$/.test(file)) {
      const text = await readFile(file, 'utf8');
      if (/\b(?!hello\b)[a-z0-9.+_-]+@kurisulabs\.tech\b/i.test(text))
        throw new Error(`Non-public contact address in ${file}`);
      for (const marker of forbidden)
        if (marker && text.includes(marker))
          throw new Error(`Non-public marker ${JSON.stringify(marker)} in ${file}`);
      count++;
    }
  }
}
await inspect(path.join(root, 'public'));
await inspect(path.join(root, '.next/static'));
await inspect(path.join(root, '.next/server/app'));
const manifest = await loadContent(path.join(root, 'content'));
const sitemap = await readFile(path.join(root, '.next/server/app/sitemap.xml.body'), 'utf8');
const actual = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]).sort();
const expected = sitemapEntries(manifest)
  .map((entry) => entry.url)
  .sort();
if (JSON.stringify(actual) !== JSON.stringify(expected))
  throw new Error('Built sitemap disagrees with public manifest');
console.log(
  `Public output checked: ${count} text artifacts; sitemap matches ${expected.length} approved routes; no draft/fixture/internal markers.`,
);
