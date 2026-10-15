import { test, expect, type Locator, type Page } from '@playwright/test';

const transitionSelector = '.section-transition';
const transitionKinds = [
  'research-work',
  'work-method',
  'method-collaboration',
  'collaboration-contact',
];
const stableTargets =
  '#research-network .section-more, #public-work h2, #public-work .repository-link, #public-work > .section-more, #method h2, #method .process-list h3, #collaboration h2, #collaboration .text-link, #contact-title, .contact-email';

async function positionAt(transition: Locator, viewportFraction: number) {
  await transition.evaluate((node, fraction) => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({
      top: window.scrollY + node.getBoundingClientRect().top - window.innerHeight * fraction,
      behavior: 'instant',
    });
    // Assertions below poll native progress; no page callbacks are needed in no-JS mode.
  }, viewportFraction);
}

async function decoration(transition: Locator) {
  return transition.evaluate((node) => {
    const style = (selector: string) => getComputedStyle(node.querySelector(selector)!);
    const matrix = (selector: string) => {
      const transform = style(selector).transform;
      return new DOMMatrixReadOnly(transform === 'none' ? undefined : transform);
    };
    return {
      line: matrix('.section-transition-line').m11,
      stem: matrix('.section-transition-stem-fill').m22,
      markerY: matrix('.section-transition-marker').m42,
      markerAngle: matrix('.section-transition-marker').m11,
      markerOpacity: Number(style('.section-transition-marker').opacity),
      wash: Number(style('.section-transition-wash').opacity),
    };
  });
}

async function settleEntrances(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    // View-timeline animations do not finish with elapsed time. Only await existing entrances.
    await Promise.all(
      [...document.querySelectorAll('[data-scroll-reveal]')]
        .flatMap((node) => node.getAnimations())
        .filter(
          (animation) =>
            animation.timeline === document.timeline &&
            animation.effect?.getTiming().iterations !== Infinity,
        )
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
}

async function documentBoxes(page: Page) {
  return page.locator(stableTargets).evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return {
        x: box.x + window.scrollX,
        y: box.y + window.scrollY,
        width: box.width,
        height: box.height,
      };
    }),
  );
}

async function staticAcrossScroll(transition: Locator) {
  await positionAt(transition, 0.85);
  await expect
    .poll(() => transition.evaluate((node) => node.getAnimations({ subtree: true }).length))
    .toBe(0);
  const before = await decoration(transition);
  expect(before.line).toBeCloseTo(1, 3);
  await positionAt(transition, 0.25);
  expect(await decoration(transition)).toEqual(before);
  await positionAt(transition, 0.85);
  expect(await decoration(transition)).toEqual(before);
}

test('section connections follow scroll in both directions without moving text or links', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.mouse.move(1, 1);
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(
      () =>
        CSS.supports('animation-timeline', 'view()') &&
        CSS.supports('animation-range', 'cover 0% cover 65%'),
    ),
  ).toBe(true);
  const transitions = page.locator(transitionSelector);
  await expect(transitions).toHaveCount(transitionKinds.length);
  expect(
    await transitions.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-section-transition')),
    ),
  ).toEqual(transitionKinds);
  for (const transition of await transitions.all()) {
    await expect(transition).toHaveAttribute('aria-hidden', 'true');
    await expect(
      transition.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'),
    ).toHaveCount(0);
  }
  // Settle the pre-existing first-visit entrances before measuring document-space positions.
  for (const target of await page.locator(stableTargets).all()) {
    await target.scrollIntoViewIfNeeded();
    await settleEntrances(page);
  }
  const before = await documentBoxes(page);
  expect(before.length).toBeGreaterThan(8);
  for (const transition of await transitions.all()) {
    await positionAt(transition, 0.85);
    await expect(transition).toHaveAttribute('data-ambient-running', 'true');
    await expect.poll(async () => (await decoration(transition)).line).toBeLessThan(0.8);
    const start = await decoration(transition);
    expect(
      await transition.evaluate(
        (node) =>
          node
            .getAnimations({ subtree: true })
            .filter((animation) => animation.timeline !== document.timeline).length,
      ),
    ).toBeGreaterThan(0);
    await positionAt(transition, 0.25);
    await expect
      .poll(async () => {
        const end = await decoration(transition);
        return (
          end.line > start.line + 0.15 &&
          end.stem > start.stem + 0.4 &&
          end.markerY > start.markerY + 10
        );
      })
      .toBe(true);
    await positionAt(transition, 0.85);
    await expect
      .poll(async () => {
        const reversed = await decoration(transition);
        return (
          Math.abs(reversed.line - start.line) < 0.02 &&
          Math.abs(reversed.markerY - start.markerY) < 0.5
        );
      })
      .toBe(true);
  }
  const after = await documentBoxes(page);
  for (let index = 0; index < before.length; index++) {
    for (const key of ['x', 'y', 'width', 'height'] as const)
      expect(
        Math.abs(after[index][key] - before[index][key]),
        `${index}: ${key} remains steady`,
      ).toBeLessThan(1);
  }
});

test('mobile section connections fit both themes without horizontal overflow', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Checks the touch layout at compact and landscape widths.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    for (const viewport of [
      { width: 320, height: 844 },
      { width: 390, height: 844 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
      for (const transition of await page.locator(transitionSelector).all()) {
        for (const fraction of [0.85, 0.25]) {
          await positionAt(transition, fraction);
          const geometry = await transition.evaluate((node) => {
            const box = node.getBoundingClientRect();
            return {
              left: box.left,
              right: box.right,
              viewport: document.documentElement.clientWidth,
              page: document.documentElement.scrollWidth,
            };
          });
          expect(geometry.left).toBeGreaterThanOrEqual(-1);
          expect(geometry.right).toBeLessThanOrEqual(geometry.viewport + 1);
          expect(geometry.page).toBeLessThanOrEqual(geometry.viewport);
        }
      }
    }
  }
});

test('hidden documents and reduced motion make section connections static while links remain usable', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const transitions = page.locator(transitionSelector);
  await expect(transitions).toHaveCount(transitionKinds.length);
  const first = transitions.first();
  await positionAt(first, 0.85);
  await expect(first).toHaveAttribute('data-ambient-running', 'true');
  await expect.poll(async () => (await decoration(first)).line).toBeLessThan(0.8);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(first).toHaveAttribute('data-ambient-running', 'false');
  await staticAcrossScroll(first);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden');
    Reflect.deleteProperty(document, 'visibilityState');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(first).toHaveAttribute('data-ambient-running', 'true');
  await expect.poll(async () => (await decoration(first)).line).toBeLessThan(0.8);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const transition of await transitions.all()) await staticAcrossScroll(transition);
  await expect(page.locator('#public-work h2')).toContainText('Out of the lab.');
  await expect(page.locator('#method h2')).toContainText('Small teams.');
  await expect(page.locator('#collaboration h2')).toContainText('Connecting existing systems');
  await expect(page.locator('#contact-title')).toContainText('Have a project in mind?');
  await page.getByRole('link', { name: 'Explore all work', exact: true }).click();
  await expect(page).toHaveURL(/\/work$/);
  await expect(page.locator(transitionSelector)).toHaveCount(2);
  expect(
    await page
      .locator(transitionSelector)
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-section-transition'))),
  ).toEqual(['work-repositories', 'work-contact']);
  for (const transition of await page.locator(transitionSelector).all())
    await staticAcrossScroll(transition);
});

test('without JavaScript the completed connections stay static and section links remain usable', async ({
  browser,
  baseURL,
  isMobile,
}) => {
  test.skip(isMobile, 'One no-JavaScript context checks both desktop and mobile widths.');
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    reducedMotion: 'no-preference',
    viewport: { width: 1440, height: 1000 },
  });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator(transitionSelector)).toHaveCount(transitionKinds.length);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const transition of await page.locator(transitionSelector).all())
        await staticAcrossScroll(transition);
    }
    await page.getByRole('link', { name: 'Explore all work', exact: true }).click();
    await expect(page).toHaveURL(/\/work$/);
    await expect(page.locator('h1')).toHaveText('Work');
    await expect(page.locator(transitionSelector)).toHaveCount(2);
    for (const transition of await page.locator(transitionSelector).all())
      await staticAcrossScroll(transition);
  } finally {
    await context.close();
  }
});
