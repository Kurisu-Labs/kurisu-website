import sharp from 'sharp';
import { mkdir, copyFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const original = 'public/brand/kurisu-logo-original.png';
const before = createHash('sha256')
  .update(await readFile(original))
  .digest('hex');
const source = '1bf9fdb8d8a3815c914ce6c374d2ae1ffcc1331c050c8052c0c857f89aeceb71';
if (before !== source) throw new Error('Supplied logo copies disagree');
// Source bounds plus 12px of breathing room. Crop changes canvas only, never mark geometry.
const cropped = await sharp(original)
  .extract({ left: 354, top: 367, width: 547, height: 495 })
  .png()
  .toBuffer();
await sharp(cropped)
  .resize({ width: 548 })
  .webp({ quality: 92 })
  .toFile('public/brand/kurisu-mark.webp');
for (const size of [32, 180, 192]) {
  const mark = await sharp(cropped)
    .resize({ width: Math.round(size * 0.82) })
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 3, background: '#FEFCF9' } })
    .composite([{ input: mark, gravity: 'centre' }])
    .png()
    .toFile(`public/brand/icon-${size}.png`);
}
await mkdir('public/fonts', { recursive: true });
for (const [family, weight] of [
  ['sans', 'Regular'],
  ['sans', 'Medium'],
  ['sans', 'SemiBold'],
  ['mono', 'Regular'],
]) {
  const title = family === 'sans' ? 'Sans' : 'Mono';
  await copyFile(
    `node_modules/@ibm/plex-${family}/fonts/split/woff2/IBMPlex${title}-${weight}-Latin1.woff2`,
    `public/fonts/IBMPlex${title}-${weight}.woff2`,
  );
}
for (const family of ['sans', 'mono'])
  await copyFile(
    `node_modules/@ibm/plex-${family}/LICENSE.txt`,
    `public/fonts/IBM-Plex-${family}-LICENSE.txt`,
  );
const after = createHash('sha256')
  .update(await readFile(original))
  .digest('hex');
if (before !== after) throw new Error('Original logo changed');
console.log(
  `Original preserved: ${after}. Display crop, 32/180/192 icons, and licensed Latin1 fonts written.`,
);
