import { loadContent, validateMedia } from '../lib/content/core';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
const manifest = await loadContent(path.join(process.cwd(), 'content'));
await validateMedia(manifest, path.join(process.cwd(), 'public'));
// Only this validated, projected manifest crosses into the Next module graph.
// Raw content, private approval metadata and repository documents stay outside it.
await mkdir('.generated', { recursive: true });
await writeFile('.generated/public-content.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(
  `Content valid: ${manifest.projects.length} approved projects, ${manifest.research.length} approved notes.`,
);
