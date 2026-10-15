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
const heroTraces: Record<string, unknown> = {};
for (const width of [1440, 390]) {
  const page = await browser.newPage({
    viewport: { width, height: width === 390 ? 844 : 1000 },
    isMobile: width === 390,
    hasTouch: width === 390,
    colorScheme: 'dark',
  });
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  for (const [name, route] of [
    ['home', '/'],
    ['research', '/research'],
    ['work', '/work'],
    ['about', '/about'],
    ['privacy', '/privacy'],
    ['404', '/missing'],
  ]) {
    await page.goto(`http://127.0.0.1:3100${route}`);
    await page.evaluate(() => document.fonts.ready);
    const filename = `${name}-${width}.png`;
    await page.screenshot({ path: path.join(destination, filename), fullPage: true });
    screenshots.push(filename);
    if (name === 'home') {
      await page.screenshot({ path: path.join(destination, `home-fold-${width}.png`) });
      if (width === 1440) {
        const field = page.locator('.lab-field[data-motion-enabled="true"]');
        await field.waitFor();
        const bounds = (await field.boundingBox())!;
        await page.mouse.move(bounds.x + bounds.width * 0.72, bounds.y + bounds.height * 0.35);
        await page.locator('.lab-field[data-pointer-active="true"]').waitFor();
        await page.screenshot({
          path: path.join(destination, 'home-hover-1440.png'),
          animations: 'disabled',
        });
        screenshots.push('home-hover-1440.png');
        await page.mouse.move(0, 0);
      }
      for (const [section, selector] of [
        ['research-network', '.research-network-shell'],
        ['public-work', '#public-work'],
        ['workflow', '#method'],
      ]) {
        const sectionFilename = `${section}-${width}.png`;
        await page.locator(selector).screenshot({ path: path.join(destination, sectionFilename) });
        screenshots.push(sectionFilename);
        if (section === 'research-network') {
          await page
            .locator('.research-network-node')
            .filter({ hasText: 'Privacy, identity & verifiable systems' })
            .click();
          const selectedFilename = `research-selected-${width}.png`;
          await page
            .locator(selector)
            .screenshot({ path: path.join(destination, selectedFilename) });
          screenshots.push(selectedFilename);
        }
      }
      if (width === 390) {
        const trace = page.locator('.hero-index');
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        );
        const restingTrace = await trace.evaluate(
          (node) => getComputedStyle(node, '::after').transform,
        );
        await trace.evaluate((node) =>
          node.scrollIntoView({ block: 'center', behavior: 'instant' }),
        );
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        );
        heroTraces[width] = {
          supported: await page.evaluate(() => CSS.supports('animation-timeline', 'view()')),
          resting: restingTrace,
          scrolled: await trace.evaluate((node) => getComputedStyle(node, '::after').transform),
        };
        const card = page.locator('.repository-row').first();
        await card.evaluate((node) =>
          node.scrollIntoView({ block: 'center', behavior: 'instant' }),
        );
        await page.locator('.repository-row[data-scroll-focused="true"]').first().waitFor();
        await page.screenshot({
          path: path.join(destination, 'portfolio-reading-390.png'),
          animations: 'disabled',
        });
        const step = page.locator('.process-list li').nth(1);
        await step.evaluate((node) =>
          node.scrollIntoView({ block: 'center', behavior: 'instant' }),
        );
        await page.locator('.process-list li[data-scroll-focused="true"]').first().waitFor();
        await page.screenshot({
          path: path.join(destination, 'workflow-reading-390.png'),
          animations: 'disabled',
        });
        screenshots.push('portfolio-reading-390.png', 'workflow-reading-390.png');
      }
    }
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
// The paper palette uses the same content and responsive structure.
for (const width of [1440, 390]) {
  const light = await browser.newPage({
    viewport: { width, height: width === 390 ? 844 : 1000 },
    isMobile: width === 390,
    hasTouch: width === 390,
    colorScheme: 'light',
  });
  await light.goto('http://127.0.0.1:3100/');
  await light.locator('html[data-theme="light"]').waitFor();
  await light.evaluate(() => document.fonts.ready);
  const lightHero = `home-light-${width}.png`;
  await light.screenshot({ path: path.join(destination, lightHero), animations: 'disabled' });
  screenshots.push(lightHero);
  for (const [name, selector] of [
    ['research-light', '.research-network-shell'],
    ['portfolio-light', '#public-work'],
    ['workflow-light', '#method'],
  ]) {
    const filename = `${name}-${width}.png`;
    await light
      .locator(selector)
      .screenshot({ path: path.join(destination, filename), animations: 'disabled' });
    screenshots.push(filename);
  }
  if (width === 390) {
    await light.locator('.mobile-navigation summary').click();
    await light.screenshot({
      path: path.join(destination, 'theme-menu-light-390.png'),
      animations: 'disabled',
    });
    screenshots.push('theme-menu-light-390.png');
  }
  await light.close();
}
// Cold-cache local load. Browser Resource Timing reports actual encoded/transfer sizes.
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  colorScheme: 'dark',
});
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
metadata.heroTraces = heroTraces;
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
