import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import sharp from 'sharp';

const pages = [
  ['/', 'Exploring ideas.'],
  ['/research', 'An agenda, shaped'],
  ['/about', 'An independent place'],
  ['/privacy', 'Privacy'],
];
test('public pages have content, canonical metadata and no runtime exceptions', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const [path, title] of pages) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText(title);
    await expect(page).toHaveTitle(/Kurisu Labs/);
    // URL normalization treats the bare origin and its root slash identically.
    expect(new URL((await page.locator('link[rel="canonical"]').getAttribute('href'))!).href).toBe(
      new URL(path, 'https://kurisulabs.tech').href,
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.getByRole('link', { name: 'Work', exact: true })).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});
test('unapproved, unknown and internal URLs return actual 404s without leaking content', async ({
  request,
}) => {
  for (const route of [
    '/missing',
    '/work',
    '/work/qa-fixture-system',
    '/work/evergreen',
    '/research/qa-fixture-note',
    '/research/private-draft',
    '/docs/CONTENT_STATUS.md',
    '/seed/identity.json',
    '/tests/fixtures/records.ts',
  ]) {
    for (const headers of [{}, { RSC: '1' }] as Record<string, string>[]) {
      const response = await request.get(route, { headers });
      expect(response.status(), route).toBe(404);
      const body = await response.text();
      expect(body).not.toMatch(/QA FIXTURE|QA contributor|QA author|permittedAttribution/);
      expect(body).not.toMatch(/\b(?!hello\b)[a-z0-9.+_-]+@kurisulabs\.tech\b/i);
    }
  }
});
test('sitemap, robots, icons and branded social image are valid', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  const xml = await sitemap.text();
  expect([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]).sort()).toEqual(
    pages.map(([route]) => `https://kurisulabs.tech${route}`).sort(),
  );
  expect(xml).not.toContain('<lastmod>');
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
  for (const path of ['/brand/icon-32.png', '/brand/icon-180.png', '/opengraph-image']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/^image\//);
    expect((await response.body()).byteLength).toBeGreaterThan(100);
    if (path === '/opengraph-image') {
      const { data, info } = await sharp(await response.body())
        .extract({ left: 72, top: 60, width: 60, height: 70 })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      let maroonPixels = 0;
      for (let index = 0; index < data.length; index += info.channels) {
        if (data[index] > 40 && data[index] < 180 && data[index + 1] < 60 && data[index + 2] < 80)
          maroonPixels++;
      }
      expect(maroonPixels).toBeGreaterThan(100);
    }
  }
});
test('menu, current page, Escape and cross-page contact work by keyboard', async ({ page }) => {
  await page.goto('/about');
  const mobile = (page.viewportSize()?.width ?? 1440) < 761;
  if (mobile) {
    const trigger = page.locator('.mobile-navigation summary');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(
      await trigger.evaluate((element) => element.getBoundingClientRect().top),
    ).toBeGreaterThanOrEqual(0);
    await expect(
      page
        .getByRole('navigation', { name: 'Mobile' })
        .getByRole('link', { name: 'About', exact: true }),
    ).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.press('Enter');
    await page
      .getByRole('navigation', { name: 'Mobile' })
      .getByRole('link', { name: 'Contact', exact: true })
      .click();
    await expect(page.locator('.mobile-navigation')).not.toHaveAttribute('open');
  } else {
    await expect(
      page
        .getByRole('navigation', { name: 'Main' })
        .getByRole('link', { name: 'About', exact: true }),
    ).toHaveAttribute('aria-current', 'page');
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Contact', exact: true })
      .focus();
    await page.keyboard.press('Enter');
  }
  await expect(page).toHaveURL(/\/#contact$/);
  await expect(page.locator('#contact')).toBeInViewport();
  await expect(page.locator('.contact-email')).toHaveAttribute(
    'href',
    'mailto:hello@kurisulabs.tech',
  );
});
test('email copy succeeds and rejected clipboard gives a selectable fallback', async ({
  page,
  context,
  browserName,
}) => {
  if (browserName === 'chromium')
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('button', { name: 'Copy email', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Email copied');
  if (browserName === 'chromium')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('hello@kurisulabs.tech');
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('Clipboard denied for test')) },
      configurable: true,
    }),
  );
  await page.getByRole('button', { name: 'Copy email', exact: true }).click();
  await expect(page.getByRole('status')).toContainText(
    'You can select and copy the address instead.',
  );
  await expect(page.locator('.contact-email')).toBeVisible();
});
test('all public layouts reflow at every required width', async ({ page }) => {
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [route] of [...pages, ['/missing']]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${route} @ ${width}`,
      ).toBe(true);
    }
  }
});
test('axe scans public pages and open mobile navigation', async ({ page }) => {
  for (const [route] of [...pages, ['/missing']]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations, route).toEqual([]);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('.mobile-navigation summary').click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test('skip link and reduced motion remain usable at increased text size', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  expect(
    await page
      .getByRole('link', { name: 'Skip to content' })
      .evaluate((element) => getComputedStyle(element).outlineStyle),
  ).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe(
    'auto',
  );
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if ((page.viewportSize()?.width ?? 1440) < 761) {
    const brand = (await page.locator('.header-inner .brand-lockup span').boundingBox())!;
    const menu = (await page.locator('.mobile-navigation summary').boundingBox())!;
    expect(
      brand.x + brand.width <= menu.x ||
        brand.y + brand.height <= menu.y ||
        menu.x + menu.width <= brand.x ||
        menu.y + menu.height <= brand.y,
    ).toBe(true);
  }
  await expect(page.locator('h1')).toBeVisible();
});
test('content, mobile navigation and contact work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3100/');
  await expect(page.locator('h1')).toContainText('Exploring ideas.');
  await page.locator('.mobile-navigation summary').click();
  await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Mobile' })
    .getByRole('link', { name: 'Research', exact: true })
    .click();
  await expect(page.locator('h1')).toContainText('An agenda, shaped');
  await expect(page.locator('.contact-email')).toHaveAttribute(
    'href',
    'mailto:hello@kurisulabs.tech',
  );
  await expect(page.getByRole('button', { name: 'Copy email' })).toHaveCount(0);
  await context.close();
});
