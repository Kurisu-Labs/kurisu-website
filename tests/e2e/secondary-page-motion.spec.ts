import { test, expect, type Locator, type Page } from '@playwright/test';

const pages = [
  { path: '/work', name: 'Work', kinds: ['work-repositories', 'work-contact'] },
  {
    path: '/research',
    name: 'Research',
    kinds: ['research-directions', 'research-practice', 'research-contact'],
  },
  {
    path: '/about',
    name: 'About',
    kinds: ['about-collective', 'about-principles', 'about-applied', 'about-contact'],
  },
] as const;

async function positionAt(node: Locator, fraction: number) {
  await node.evaluate((element, position) => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({
      top: window.scrollY + element.getBoundingClientRect().top - innerHeight * position,
      behavior: 'instant',
    });
  }, fraction);
}

async function progress(transition: Locator) {
  return transition.evaluate((node) => {
    const matrix = (selector: string) => {
      const transform = getComputedStyle(node.querySelector(selector)!).transform;
      return new DOMMatrixReadOnly(transform === 'none' ? undefined : transform);
    };
    return {
      line: matrix('.section-transition-line').m11,
      stem: matrix('.section-transition-stem-fill').m22,
      markerY: matrix('.section-transition-marker').m42,
    };
  });
}

async function routeConnections(page: Page, expected: readonly string[]) {
  const transitions = page.locator('.section-transition');
  await expect(transitions).toHaveCount(expected.length);
  expect(
    await transitions.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-section-transition')),
    ),
  ).toEqual(expected);
  for (const transition of await transitions.all()) {
    await expect(transition).toHaveAttribute('aria-hidden', 'true');
    await expect(transition.locator('a, button, input, [tabindex]')).toHaveCount(0);
  }
  return transitions;
}

async function bounds(transition: Locator) {
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

async function documentBox(target: Locator) {
  return target.evaluate((node) => {
    const box = node.getBoundingClientRect();
    return { x: box.x + scrollX, y: box.y + scrollY, width: box.width, height: box.height };
  });
}

async function settledHeading(page: Page) {
  const heading = page.locator('.page-passage h2').first();
  await positionAt(heading, 0.5);
  await page.evaluate(async () => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
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
  return heading;
}

async function staticConnections(page: Page) {
  for (const transition of await page.locator('.section-transition').all()) {
    await positionAt(transition, 0.85);
    await expect
      .poll(() => transition.evaluate((node) => node.getAnimations({ subtree: true }).length))
      .toBe(0);
    const before = await progress(transition);
    expect(before.line).toBeCloseTo(1, 3);
    await positionAt(transition, 0.25);
    expect(await progress(transition)).toEqual(before);
    await bounds(transition);
  }
  expect(
    await page
      .locator('.ambient-signal')
      .evaluateAll((nodes) =>
        nodes.every((node) => node.getAnimations({ subtree: true }).length === 0),
      ),
  ).toBe(true);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.contact-email')).toHaveAttribute('href', /^mailto:/);
}

test('secondary pages have bounded connections that reverse with scroll without shifting their headings', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  // A compact desktop height keeps the first boundary below the completed timeline range.
  await page.setViewportSize({ width: isMobile ? 320 : 1440, height: isMobile ? 844 : 700 });
  for (const route of pages) {
    await page.goto(route.path);
    await page.mouse.move(1, 1);
    await page.evaluate(() => document.fonts.ready);
    const transitions = await routeConnections(page, route.kinds);
    const heading = await settledHeading(page);
    const before = await documentBox(heading);
    // On tall phones the intro boundary is already midway through its timeline at scrollY=0.
    // Use Contact there so both ends of the tested progress range are reachable by real scrolling.
    const passage = isMobile ? transitions.last() : transitions.first();
    await positionAt(passage, 0.85);
    await expect(passage).toHaveAttribute('data-ambient-running', 'true');
    await expect.poll(async () => (await progress(passage)).line).toBeLessThan(0.8);
    const start = await progress(passage);
    await positionAt(passage, 0.25);
    await expect
      .poll(async () => {
        const end = await progress(passage);
        return end.line > start.line + 0.15 && end.markerY > start.markerY + 10;
      })
      .toBe(true);
    await positionAt(passage, 0.85);
    await expect
      .poll(async () => {
        const reversed = await progress(passage);
        return (
          Math.abs(reversed.line - start.line) < 0.02 &&
          Math.abs(reversed.markerY - start.markerY) < 0.5
        );
      })
      .toBe(true);
    const after = await documentBox(heading);
    for (const key of ['x', 'y', 'width', 'height'] as const)
      expect(Math.abs(after[key] - before[key]), `${route.name} heading ${key}`).toBeLessThan(1);
    for (const transition of await transitions.all()) {
      await positionAt(transition, 0.5);
      await bounds(transition);
    }
    if (isMobile) {
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      for (const transition of await transitions.all()) {
        await positionAt(transition, 0.5);
        await bounds(transition);
        const layout = await transition.evaluate((node) => {
          const root = node.getBoundingClientRect();
          const label = node.querySelector('.section-transition-label')!.getBoundingClientRect();
          const track = node.querySelector('.section-transition-track')!.getBoundingClientRect();
          const marker = node.querySelector('.section-transition-marker')!.getBoundingClientRect();
          const section = node.closest('.page-passage') ?? node.parentElement?.nextElementSibling;
          const heading = section?.querySelector('h2')?.getBoundingClientRect();
          return {
            partsFit: [label, track].every(
              (part) => part.left >= root.left - 1 && part.right <= root.right + 1,
            ),
            labelBottom: label.bottom,
            labelClearOfMarker:
              label.left >= marker.right ||
              label.right <= marker.left ||
              label.top >= marker.bottom ||
              label.bottom <= marker.top,
            headingTop: heading?.top,
          };
        });
        expect(layout.partsFit, `${route.name}: label and rail fit at 200% text`).toBe(true);
        expect(layout.labelClearOfMarker, `${route.name}: label leaves the marker clear`).toBe(
          true,
        );
        expect(layout.headingTop).toBeDefined();
        expect(layout.labelBottom).toBeLessThanOrEqual(layout.headingTop!);
      }
    }
  }
});

test('client navigation initializes each page’s signals, reading emphasis, and connections', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const initialDocument = await page.evaluate(() => performance.timeOrigin);
  for (const route of pages) {
    await page
      .getByRole('navigation', { name: 'Footer', exact: true })
      .getByRole('link', { name: route.name, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`${route.path}$`));
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(initialDocument);
    const transitions = await routeConnections(page, route.kinds);
    const signal = page.locator('.page-intro .ambient-signal');
    await positionAt(signal, 0.5);
    await expect(signal).toHaveAttribute('data-ambient-ready', 'true');
    await expect(signal).toHaveAttribute('data-ambient-running', 'true');
    const animationState = () =>
      signal.locator('.ambient-signal-packet').evaluate((node) => {
        const animation = node.getAnimations()[0];
        return {
          time: Number(animation?.currentTime ?? 0),
          running: animation?.playState,
          transform: getComputedStyle(node).transform,
        };
      });
    const start = await animationState();
    await expect
      .poll(async () => {
        const current = await animationState();
        return (
          current.running === 'running' &&
          current.time > start.time + 150 &&
          current.transform !== start.transform
        );
      })
      .toBe(true);
    await positionAt(transitions.first(), 0.85);
    await expect(transitions.first()).toHaveAttribute('data-ambient-running', 'true');
    await expect
      .poll(() =>
        transitions
          .first()
          .evaluate(
            (node) =>
              node
                .getAnimations({ subtree: true })
                .filter((animation) => animation.timeline !== document.timeline).length,
          ),
      )
      .toBeGreaterThan(0);
    const readingTarget = page.locator('[data-scroll-focus]').first();
    await positionAt(readingTarget, 0.3);
    await expect(readingTarget).toHaveAttribute('data-scroll-focused', 'true');
  }
});

test('reduced motion leaves every secondary boundary completed and content usable', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of pages) {
    await page.goto(route.path);
    await routeConnections(page, route.kinds);
    await staticConnections(page);
  }
});

test('without JavaScript secondary pages retain static connections and native navigation', async ({
  browser,
  baseURL,
  isMobile,
}) => {
  test.skip(
    isMobile,
    'One JavaScript-free context checks the compact layout and native route links.',
  );
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    reducedMotion: 'no-preference',
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    await page.goto('/');
    for (const route of pages) {
      await page
        .getByRole('navigation', { name: 'Footer', exact: true })
        .getByRole('link', { name: route.name, exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`${route.path}$`));
      await routeConnections(page, route.kinds);
      await staticConnections(page);
    }
  } finally {
    await context.close();
  }
});
