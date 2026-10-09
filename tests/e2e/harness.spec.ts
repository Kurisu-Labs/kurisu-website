import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const harness = 'http://127.0.0.1:4173/';
test('article TOC, code copy, tables and local scrolling work', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(`${harness}?view=article`);
  await expect(page.locator('h1')).toContainText('QA FIXTURE');
  await expect(page.locator('.image-paragraph figure')).toHaveCount(2);
  for (const image of await page.locator('.image-paragraph img').all()) {
    await expect(image).toHaveAttribute('width', '960');
    await expect(image).toHaveAttribute('height', '480');
  }
  await page.getByRole('link', { name: 'Limitations', exact: true }).click();
  await expect(page).toHaveURL(/#limitations$/);
  await page.getByRole('button', { name: 'Copy code' }).click();
  await expect(page.getByRole('status')).toContainText('Code copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    'deliberatelyLongLine',
  );
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('Denied')) },
      configurable: true,
    }),
  );
  await page.getByRole('button', { name: 'Copy code' }).click();
  await expect(page.getByRole('status')).toContainText('You can select and copy it instead.');
  const code = page.getByLabel('Code example');
  await code.focus();
  await expect(code).toBeFocused();
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(await code.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  }
});
test('project variants preserve real state and conditional artifacts', async ({ page }) => {
  await page.goto(`${harness}?view=project`);
  await expect(page.getByRole('heading', { name: 'Limitations', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open demo' })).toHaveCount(0);
  await page.goto(`${harness}?view=archived`);
  await expect(
    page.getByText('This project is no longer actively maintained.', { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open testnet demo' })).toHaveAttribute(
    'href',
    'https://example.com/demo',
  );
  await expect(page.getByRole('img')).toHaveAttribute('alt', /synthetic test diagram/);
  for (const view of ['project', 'archived', 'index']) {
    await page.goto(`${harness}?view=${view}`);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${view} at ${width}`,
      ).toBe(true);
    }
  }
});
test('shared detail components pass axe and have no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const view of ['article', 'project', 'archived', 'index']) {
    await page.goto(`${harness}?view=${view}`);
    await expect(page.locator('h1')).toBeVisible();
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
      view,
    ).toEqual([]);
  }
  expect(errors).toEqual([]);
});
