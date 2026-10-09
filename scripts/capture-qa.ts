import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const destination = path.join(process.cwd(), '.qa/screenshots');
await mkdir(destination, { recursive: true });
const browser = await chromium.launch();
const metadata: Record<string, unknown> = {
  browser: browser.version(),
  mode: 'local production Next server and separate Vite component harness',
  screenshots: [],
};
const screenshots: string[] = [];
for (const width of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 1000 } });
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  for (const [name, route] of [
    ['home', '/'],
    ['research', '/research'],
    ['about', '/about'],
    ['privacy', '/privacy'],
    ['404', '/missing'],
  ]) {
    await page.goto(`http://127.0.0.1:3100${route}`);
    await page.evaluate(() => document.fonts.ready);
    const filename = `${name}-${width}.png`;
    await page.screenshot({ path: path.join(destination, filename), fullPage: true });
    screenshots.push(filename);
    if (name === 'home')
      await page.screenshot({ path: path.join(destination, `home-fold-${width}.png`) });
  }
  for (const view of ['article', 'project', 'archived', 'index']) {
    await page.goto(`http://127.0.0.1:4173/?view=${view}`);
    await page.evaluate(() => document.fonts.ready);
    const filename = `fixture-${view}-${width}.png`;
    await page.screenshot({ path: path.join(destination, filename), fullPage: true });
    screenshots.push(filename);
  }
  if (width === 390) {
    await page.goto('http://127.0.0.1:3100/');
    await page.locator('.mobile-navigation summary').click();
    await page.screenshot({ path: path.join(destination, 'menu-open-390.png') });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Copy email' }).click();
    await page.getByRole('status').filter({ hasText: 'Email copied' }).waitFor();
    await page
      .locator('#contact')
      .screenshot({ path: path.join(destination, 'contact-copy-success-390.png') });
    // A static browser script avoids tsx's function-name helper being serialized into page.evaluate.
    await page.evaluate(`Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('Clipboard denied for QA')) }
    })`);
    await page.getByRole('button', { name: 'Copy email' }).click();
    await page.getByRole('status').filter({ hasText: 'You can select and copy' }).waitFor();
    await page
      .locator('#contact')
      .screenshot({ path: path.join(destination, 'contact-copy-failure-390.png') });
  }
  await page.close();
}
// Cold-cache local load. Browser Resource Timing reports actual encoded/transfer sizes.
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
await page.addInitScript(() => {
  const metrics = { lcp: 0, cls: 0 };
  Object.assign(window, { labMetrics: metrics });
  new PerformanceObserver((list) => {
    metrics.lcp = list.getEntries().at(-1)?.startTime ?? 0;
  }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
      if (!shift.hadRecentInput) metrics.cls += shift.value;
    }
  }).observe({ type: 'layout-shift', buffered: true });
});
await page.goto('http://127.0.0.1:3100/');
await page.evaluate(() => document.fonts.ready);
await page.waitForLoadState('networkidle');
metadata.performance = await page.evaluate(() => {
  const entries = [
    ...performance.getEntriesByType('navigation'),
    ...performance.getEntriesByType('resource'),
  ] as PerformanceResourceTiming[];
  return {
    ...Reflect.get(window, 'labMetrics'),
    entries: entries.map((entry) => ({
      url: entry.name,
      encodedBodySize: entry.encodedBodySize,
      transferSize: entry.transferSize,
      duration: entry.duration,
      type: entry.initiatorType,
    })),
    totalTransferred: entries.reduce((total, entry) => total + entry.transferSize, 0),
    jsEncodedBytes: entries
      .filter((entry) => /\.js(?:\?|$)/.test(entry.name))
      .reduce((total, entry) => total + entry.encodedBodySize, 0),
  };
});
const social = await page.request.get('http://127.0.0.1:3100/opengraph-image');
await writeFile(path.join(destination, 'social-preview.png'), await social.body());
metadata.screenshots = screenshots;
await writeFile('.qa/capture-results.json', JSON.stringify(metadata, null, 2) + '\n');
console.log(
  JSON.stringify(
    {
      browser: browser.version(),
      captured: screenshots.length + 6,
      destination,
      performance: metadata.performance,
    },
    null,
    2,
  ),
);
await browser.close();
