import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const publicRoutes = ['/', '/research', '/work', '/about', '/privacy', '/missing'];
const idleSelector = '.field-idle-orbits, .field-idle-signal, .field-idle-core';

function runtimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (/hydration|did not match|server rendered html/i.test(message.text()))
      errors.push(message.text());
  });
  return errors;
}

async function themeControl(page: Page, touch = false) {
  const menu = page.locator('.mobile-navigation');
  const trigger = menu.locator('summary');
  if ((await trigger.isVisible()) && (await menu.getAttribute('open')) === null) {
    if (touch) await trigger.tap();
    else await trigger.click();
  }
  const control = page.getByRole('combobox', { name: 'Color theme', exact: true });
  await expect(control).toBeVisible();
  await expect(control).toBeEnabled();
  return control;
}

async function expectThemeControls(page: Page, value: string) {
  const controls = page.getByRole('combobox', {
    name: 'Color theme',
    exact: true,
    includeHidden: true,
  });
  await expect(controls).toHaveCount(2);
  for (const control of await controls.all()) await expect(control).toHaveValue(value);
}

async function idleState(page: Page) {
  return page.locator(idleSelector).evaluateAll((nodes) =>
    nodes.map((node) => {
      const animation = node
        .getAnimations()
        .find((item) => item.effect?.getTiming().iterations === Infinity);
      const style = getComputedStyle(node);
      return {
        time: typeof animation?.currentTime === 'number' ? animation.currentTime : null,
        state: animation?.playState ?? 'none',
        transform: style.transform,
        opacity: style.opacity,
      };
    }),
  );
}

async function expectIdleFrozen(page: Page, duration = 150) {
  await expect
    .poll(async () => (await idleState(page)).every((animation) => animation.state === 'paused'))
    .toBe(true);
  const samples = await page.locator(idleSelector).evaluateAll(async (nodes, duration) => {
    const snapshot = () =>
      nodes.map((node) => {
        const animation = node
          .getAnimations()
          .find((item) => item.effect?.getTiming().iterations === Infinity);
        return typeof animation?.currentTime === 'number' ? animation.currentTime : null;
      });
    const before = snapshot();
    // Measure elapsed animation time, rather than trusting the pause attribute alone.
    await new Promise((resolve) => setTimeout(resolve, duration));
    return { before, after: snapshot() };
  }, duration);
  expect(samples.before).toHaveLength(4);
  for (let index = 0; index < samples.before.length; index++) {
    expect(samples.before[index]).not.toBeNull();
    expect(samples.after[index]).not.toBeNull();
    expect(Math.abs(samples.after[index]! - samples.before[index]!)).toBeLessThan(1);
  }
}

async function readyIdle(page: Page) {
  await page.mouse.move(1, 1);
  await page.evaluate(() => document.fonts.ready);
  const field = page.locator('.lab-field');
  await expect(field).toBeVisible();
  await expect(field).toHaveAttribute('data-idle-running', 'true');
  await expect
    .poll(() =>
      field
        .locator('.field-diagram')
        .evaluate(
          (node) =>
            node
              .getAnimations()
              .filter(
                (animation) =>
                  animation.playState === 'running' &&
                  animation.effect?.getTiming().iterations !== Infinity,
              ).length,
        ),
    )
    .toBe(0);
  return field;
}

async function boxes(locator: Locator) {
  return locator.evaluateAll((nodes) =>
    nodes.map((node) => {
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x, y, width, height };
    }),
  );
}

test('system theme follows the OS while explicit choices override it', async ({
  page,
  isMobile,
}) => {
  const errors = runtimeErrors(page);
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('/');
  const control = await themeControl(page, isMobile);
  await expectThemeControls(page, 'system');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await control.selectOption('light');
  await expectThemeControls(page, 'light');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await control.selectOption('dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await control.selectOption('system');
  await expectThemeControls(page, 'system');
  expect(await page.evaluate(() => localStorage.getItem('kurisu-theme'))).toBeNull();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(errors).toEqual([]);
});

test('theme choice survives client navigation and reload without hydration errors', async ({
  page,
  isMobile,
}) => {
  const errors = runtimeErrors(page);
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/');
  await (await themeControl(page, isMobile)).selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.evaluate(() => localStorage.getItem('kurisu-theme'))).toBe('light');
  const timeOrigin = await page.evaluate(() => performance.timeOrigin);
  await page.getByRole('link', { name: 'Explore all work', exact: true }).click();
  await expect(page).toHaveURL(/\/work$/);
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await themeControl(page, isMobile);
  await expectThemeControls(page, 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await themeControl(page, isMobile);
  await expectThemeControls(page, 'light');
  expect(errors).toEqual([]);
});

test('theme control supports keyboard selection and an open mobile menu at enlarged text', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('/');
  let control = await themeControl(page, isMobile);
  if (isMobile) await control.tap();
  else await control.focus();
  await control.press('End');
  await control.press('Enter');
  await expectThemeControls(page, 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  await page.evaluate(() => document.fonts.ready);
  control = await themeControl(page, isMobile);
  for (const value of ['light', 'dark', 'system']) {
    await control.selectOption(value);
    await expectThemeControls(page, value);
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme',
      value === 'system' ? 'light' : value,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
      `Open menu reflows with ${value} theme and 200% text`,
    ).toBe(true);
    const targets = await boxes(
      page.locator('.mobile-navigation a:visible, .mobile-navigation select:visible'),
    );
    for (let index = 0; index < targets.length; index++) {
      const target = targets[index];
      expect(target.width).toBeGreaterThan(0);
      expect(target.height).toBeGreaterThanOrEqual(24);
      for (const other of targets.slice(index + 1)) {
        const overlaps =
          target.x < other.x + other.width &&
          target.x + target.width > other.x &&
          target.y < other.y + other.height &&
          target.y + target.height > other.y;
        expect(overlaps, `Menu targets do not overlap in ${value} theme`).toBe(false);
      }
    }
  }
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`${colorScheme} theme passes accessibility checks on every public page and open mobile menu`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    for (const route of publicRoutes) {
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
      await page.evaluate(() => document.fonts.ready);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations,
        route,
      ).toEqual([]);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await themeControl(page);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test('blocked storage keeps a usable in-memory theme and safely defaults after reload', async ({
  page,
  isMobile,
}) => {
  const errors = runtimeErrors(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Storage blocked for this test', 'SecurityError');
      },
    });
  });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await (await themeControl(page, isMobile)).selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('link', { name: 'Explore all work', exact: true }).click();
  await expect(page).toHaveURL(/\/work$/);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await themeControl(page, isMobile);
  await expectThemeControls(page, 'system');
  expect(errors).toEqual([]);
});

test('without JavaScript the theme follows the OS and optional controls stay hidden', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
    colorScheme: 'light',
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    await page.goto('/');
    const scheme = () =>
      page.locator('html').evaluate((node) => getComputedStyle(node).colorScheme);
    await expect.poll(scheme).toBe('light');
    const lightBackground = await page
      .locator('body')
      .evaluate((node) => getComputedStyle(node).backgroundColor);
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(scheme).toBe('dark');
    expect(
      await page.locator('body').evaluate((node) => getComputedStyle(node).backgroundColor),
    ).not.toBe(lightBackground);
    await page.locator('.mobile-navigation summary').click();
    await expect(page.getByRole('combobox', { name: 'Color theme' })).toHaveCount(0);
    await expect(page.locator('[data-idle-toggle], [data-motion-toggle]')).toHaveCount(0);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.contact-email')).toHaveAttribute(
      'href',
      'mailto:hello@kurisulabs.tech',
    );
  } finally {
    await context.close();
  }
});

test('idle research animation advances without moving labels or changing layout', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'The decorative field is hidden on the simplified mobile layout.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await readyIdle(page);
  const before = await idleState(page);
  expect(before).toHaveLength(4);
  expect(
    before.every((animation) => animation.state === 'running' && animation.time !== null),
  ).toBe(true);
  const layoutBefore = await boxes(page.locator('.hero, .field-label text'));
  await expect
    .poll(async () => {
      const after = await idleState(page);
      return after.every(
        (animation, index) => animation.time !== null && animation.time > before[index].time! + 80,
      );
    })
    .toBe(true);
  const after = await idleState(page);
  expect(
    after.some(
      (animation, index) =>
        animation.transform !== before[index].transform ||
        animation.opacity !== before[index].opacity,
    ),
  ).toBe(true);
  const layoutAfter = await boxes(page.locator('.hero, .field-label text'));
  expect(layoutBefore).toHaveLength(5);
  for (let index = 0; index < layoutBefore.length; index++) {
    for (const key of ['x', 'y', 'width', 'height'] as const)
      expect(Math.abs(layoutAfter[index][key] - layoutBefore[index][key])).toBeLessThan(0.5);
  }
});

test('idle animation pauses for pointer movement and offscreen, then resumes automatically', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'The decorative field is hidden on mobile.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const field = await readyIdle(page);
  const rect = await field.boundingBox();
  expect(rect).not.toBeNull();
  await page.mouse.move(rect!.x + rect!.width / 2, rect!.y + rect!.height / 2);
  await expect(field).toHaveAttribute('data-idle-running', 'false');
  await expectIdleFrozen(page);
  // A stationary pointer releases the temporary pause without requiring mouseleave.
  await expect(field).toHaveAttribute('data-idle-running', 'true');
  await readyIdle(page);
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await expect(field).toHaveAttribute('data-idle-running', 'false');
  await expectIdleFrozen(page);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
  });
  await readyIdle(page);
});

test('document visibility and reduced motion stop idle animation', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The decorative field is hidden on mobile.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const field = await readyIdle(page);
  // Exercise the browser visibility event boundary without freezing the test runner itself.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(field).toHaveAttribute('data-idle-running', 'false');
  await expectIdleFrozen(page);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden');
    Reflect.deleteProperty(document, 'visibilityState');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await readyIdle(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(field).not.toHaveAttribute('data-idle-running', 'true');
  await expect(page.locator('[data-idle-toggle], [data-motion-toggle]')).toHaveCount(0);
  const animationNames = await page
    .locator(idleSelector)
    .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).animationName));
  expect(animationNames).toHaveLength(4);
  expect(animationNames.every((name) => name === 'none')).toBe(true);
  await expect(page.locator('h1')).toBeVisible();
});
