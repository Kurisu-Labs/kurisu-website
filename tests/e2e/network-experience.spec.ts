import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import configuration from '../../lib/site-content.json' with { type: 'json' };

const { directions } = configuration;
const nextName = 'Next direction in research network';

async function selectedDirection(network: Locator, index: number) {
  const direction = directions[index];
  await expect(network.locator('.research-network-radio:checked')).toHaveCount(1);
  await expect(network.getByRole('radio', { name: direction.title, exact: true })).toBeChecked();
  const panel = network.locator('.research-network-detail:visible');
  await expect(panel).toHaveCount(1);
  // Mobile omits the repeated heading visually; the panel keeps its accessible name.
  await expect(panel).toHaveAccessibleName(direction.title);
  await expect(panel).toContainText(direction.description);
  await expect(panel.getByRole('link', { name: 'Explore this direction' })).toHaveAttribute(
    'href',
    `/research#${direction.id}`,
  );
}

async function rotorState(rotor: Locator) {
  return rotor.evaluate((node) => {
    const animation = node
      .getAnimations()
      .find((item) => item.effect?.getTiming().iterations === Infinity);
    return {
      time: typeof animation?.currentTime === 'number' ? animation.currentTime : null,
      state: animation?.playState ?? 'none',
      transform: getComputedStyle(node).transform,
    };
  });
}

async function frozenRotor(rotor: Locator) {
  await expect.poll(async () => (await rotorState(rotor)).state).toBe('paused');
  const sample = await rotor.evaluate(async (node) => {
    const animation = node
      .getAnimations()
      .find((item) => item.effect?.getTiming().iterations === Infinity)!;
    const before = { time: animation.currentTime, transform: getComputedStyle(node).transform };
    // Compare actual animation time and output across elapsed wall-clock time.
    await new Promise((resolve) => setTimeout(resolve, 180));
    return {
      before,
      after: { time: animation.currentTime, transform: getComputedStyle(node).transform },
    };
  });
  expect(typeof sample.before.time).toBe('number');
  expect(typeof sample.after.time).toBe('number');
  expect(Math.abs(Number(sample.after.time) - Number(sample.before.time))).toBeLessThan(1);
  expect(sample.after.transform).toBe(sample.before.transform);
}

async function instantScroll(page: Page, selector: string) {
  await page.evaluate((selector) => {
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelector(selector)?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, selector);
}

async function noHorizontalOverflow(page: Page) {
  const geometry = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(geometry.content).toBeLessThanOrEqual(geometry.viewport);
}

async function ambientRunning(host: Locator) {
  await expect(host).toHaveAttribute('data-ambient-ready', 'true');
  await expect(host).toHaveAttribute('data-ambient-running', 'true');
  await expect
    .poll(() =>
      host.evaluate((node) => {
        const animations = node.getAnimations({ subtree: true });
        return (
          animations.length > 0 &&
          animations.every(
            (animation) =>
              animation.playState === 'running' &&
              animation.effect?.getTiming().iterations === Infinity,
          )
        );
      }),
    )
    .toBe(true);
}

async function visualState(element: Locator) {
  return element.evaluate((node) => {
    const animation = node
      .getAnimations()
      .find((item) => item.effect?.getTiming().iterations === Infinity);
    const style = getComputedStyle(node);
    return {
      time: typeof animation?.currentTime === 'number' ? animation.currentTime : null,
      duration: animation?.effect?.getTiming().duration,
      iteration: animation?.effect?.getComputedTiming().currentIteration ?? null,
      state: animation?.playState ?? 'none',
      visual: `${style.transform}|${style.strokeDashoffset}|${style.opacity}`,
    };
  });
}

async function fullAmbientCycle(part: Locator) {
  const before = await visualState(part);
  expect(before.state).toBe('running');
  expect(before.time).not.toBeNull();
  expect(typeof before.duration).toBe('number');
  const duration = Number(before.duration);
  expect(duration).toBeGreaterThan(0);
  expect(duration).toBeLessThanOrEqual(10000);
  // Observe real elapsed time past a complete loop; do not seek or accelerate it.
  await expect
    .poll(
      async () => {
        const after = await visualState(part);
        return (
          after.state === 'running' &&
          after.time !== null &&
          after.time > before.time! + duration + 100 &&
          after.iteration !== null &&
          after.iteration > before.iteration! &&
          after.visual !== before.visual
        );
      },
      { timeout: duration + 5000, intervals: [100, 250, 500] },
    )
    .toBe(true);
}

async function belowReadingBand(page: Page, selector: string) {
  await page.mouse.move(1, 1);
  await page.evaluate((selector) => {
    const node = document.querySelector(selector)!;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({
      top: window.scrollY + node.getBoundingClientRect().top - window.innerHeight * 0.8,
      behavior: 'instant',
    });
  }, selector);
}

async function noPauseControls(page: Page) {
  await expect(
    page.locator('[data-motion-toggle], [data-network-pause], [data-idle-toggle]'),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', {
      name: /^(Pause|Resume) (motion|decorative|research)/i,
      includeHidden: true,
    }),
  ).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveAttribute('data-motion-paused');
}

test('the network center cycles all four directions by keyboard, preserves focus and announces the result', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'The mobile research explorer keeps the simpler native radio controls.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const shell = page.locator('.research-network-shell');
  const network = shell.getByRole('group', { name: 'Choose a research direction' });
  const next = shell.getByRole('button', { name: nextName, exact: true });
  await expect(shell).toHaveAttribute('data-network-enhanced', 'true');
  await expect(next).toBeVisible();
  await expect(network.getByRole('radio')).toHaveCount(4);
  await selectedDirection(network, 0);
  await next.focus();
  for (let step = 1; step <= directions.length; step++) {
    await next.press(step % 2 ? 'Enter' : 'Space');
    const index = step % directions.length;
    await selectedDirection(network, index);
    await expect(next).toBeFocused();
    await expect(shell.locator('[data-network-counter]')).toHaveText(
      `${String(index + 1).padStart(2, '0')} / 04`,
    );
    const announcement = shell.locator('[data-network-status]');
    await expect(announcement).toHaveAttribute('aria-live', 'polite');
    await expect(announcement).toHaveText(
      `Direction ${index + 1} of 4: ${directions[index].title}.`,
    );
  }
  // Direct selection remains the source of truth for the next activation.
  await network.locator('label').filter({ hasText: directions[2].title }).click();
  await next.click();
  await selectedDirection(network, 3);
  await expect(next).toBeFocused();
  const geometry = await network.evaluate((node) => {
    const map = node.querySelector('.research-network-map')!.getBoundingClientRect();
    return [...node.querySelectorAll('.research-network-node')].map((label) => {
      const box = label.getBoundingClientRect();
      return {
        overlapsMap:
          box.left < map.right &&
          box.right > map.left &&
          box.top < map.bottom &&
          box.bottom > map.top,
        background: getComputedStyle(label).backgroundColor,
      };
    });
  });
  expect(geometry).toHaveLength(4);
  for (const label of geometry) {
    expect(label.overlapsMap).toBe(false);
    expect(label.background).toBe('rgba(0, 0, 0, 0)');
  }
  const selectedLabel = network.locator('label').filter({ hasText: directions[3].title });
  await selectedLabel.hover();
  expect(await selectedLabel.evaluate((node) => getComputedStyle(node).backgroundColor)).toBe(
    'rgba(0, 0, 0, 0)',
  );
  expect(
    (await new AxeBuilder({ page }).include('.research-network-shell').analyze()).violations,
  ).toEqual([]);
});

test('network idle motion visibly advances without changing the selected research direction', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'The network map is hidden on the simplified mobile layout.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await instantScroll(page, '.research-network-map');
  const shell = page.locator('.research-network-shell');
  await expect(shell).toHaveAttribute('data-network-running', 'true');
  const rotor = shell.locator('.research-network-rotor');
  const before = await rotorState(rotor);
  expect(before.state).toBe('running');
  expect(before.time).not.toBeNull();
  await expect
    .poll(async () => {
      const after = await rotorState(rotor);
      return (
        after.time !== null &&
        after.time > before.time! + 80 &&
        after.transform !== before.transform
      );
    })
    .toBe(true);
  await selectedDirection(shell, 0);
  await expect(shell.locator('[data-network-counter]')).toHaveText('01 / 04');
});

test('network motion freezes offscreen and in hidden documents, and reduced motion keeps selection usable', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Desktop verifies the visible network animation lifecycle.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await instantScroll(page, '.research-network-map');
  const shell = page.locator('.research-network-shell');
  const rotor = shell.locator('.research-network-rotor');
  await expect(shell).toHaveAttribute('data-network-running', 'true');
  await shell.getByRole('button', { name: nextName, exact: true }).click();
  await selectedDirection(shell, 1);
  await expect(shell).toHaveAttribute('data-network-running', 'true');

  await instantScroll(page, '.site-footer');
  await expect(shell).toHaveAttribute('data-network-running', 'false');
  await frozenRotor(rotor);
  await instantScroll(page, '.research-network-map');
  await expect(shell).toHaveAttribute('data-network-running', 'true');
  // Simulate the visibility API boundary without suspending the test harness.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(shell).toHaveAttribute('data-network-running', 'false');
  await frozenRotor(rotor);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden');
    Reflect.deleteProperty(document, 'visibilityState');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(shell).toHaveAttribute('data-network-running', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(shell).not.toHaveAttribute('data-network-running', 'true');
  await noPauseControls(page);
  expect(await rotor.evaluate((node) => getComputedStyle(node).animationName)).toBe('none');
  await shell.getByRole('button', { name: nextName, exact: true }).click();
  await selectedDirection(shell, 2);
});

test('mobile research stays simple and ambient portfolio graphics fit both color themes', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Uses touch input and the coarse-pointer mobile layout.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
      const shell = page.locator('.research-network-shell');
      await expect(shell.locator('.research-network-map')).toBeHidden();
      await expect(shell.getByRole('button', { name: nextName })).toHaveCount(0);
      await shell.locator('label').filter({ hasText: directions[1].title }).tap();
      await selectedDirection(shell, 1);
      await noHorizontalOverflow(page);
      await page.goto('/work');
      const diagrams = page.locator('.repository-diagram');
      await expect(diagrams).toHaveCount(3);
      for (const diagram of await diagrams.all()) {
        await diagram.scrollIntoViewIfNeeded();
        const geometry = await diagram.evaluate((node) => {
          const box = node.getBoundingClientRect();
          const card = node.closest('.repository-row')!.getBoundingClientRect();
          return { left: box.left, right: box.right, cardLeft: card.left, cardRight: card.right };
        });
        expect(geometry.left).toBeGreaterThanOrEqual(geometry.cardLeft - 1);
        expect(geometry.right).toBeLessThanOrEqual(geometry.cardRight + 1);
        await ambientRunning(diagram);
      }
      await noHorizontalOverflow(page);
    }
  }
});

test('without JavaScript the center controls stay hidden and native research selection still works', async ({
  browser,
  baseURL,
  isMobile,
}) => {
  test.skip(isMobile, 'One no-JavaScript context covers desktop and mobile widths.');
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 1000 },
  });
  try {
    const page = await context.newPage();
    await page.goto('/');
    const shell = page.locator('.research-network-shell');
    await expect(shell.getByRole('button', { name: nextName })).toHaveCount(0);
    await noPauseControls(page);
    expect(
      await page
        .locator('.process-glyph')
        .evaluateAll(
          (nodes) => nodes.flatMap((node) => node.getAnimations({ subtree: true })).length,
        ),
    ).toBe(0);
    await shell.locator('label').filter({ hasText: directions[1].title }).click();
    await selectedDirection(shell, 1);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(shell.locator('.research-network-map')).toBeHidden();
    await shell.locator('label').filter({ hasText: directions[2].title }).click();
    await selectedDirection(shell, 2);
    await page.goto('/work');
    await expect(page.locator('.repository-diagram')).toHaveCount(3);
    expect(
      await page
        .locator('.repository-diagram')
        .evaluateAll(
          (nodes) => nodes.flatMap((node) => node.getAnimations({ subtree: true })).length,
        ),
    ).toBe(0);
  } finally {
    await context.close();
  }
});

test('repository concepts stay distinct and keep moving beyond a full cycle without hover or reading focus', async ({
  page,
  isMobile,
}) => {
  test.skip(
    isMobile,
    'The mobile case checks all three diagrams; workflow verifies a complete cycle on both layouts.',
  );
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const diagrams = page.locator('.repository-diagram');
  await expect(diagrams).toHaveCount(3);
  const concepts = await diagrams.evaluateAll((nodes) =>
    nodes.map((node) => ({
      concept: node.getAttribute('data-repository-diagram'),
      geometry: [...node.querySelectorAll('path, circle, ellipse, rect, line, polyline, polygon')]
        .map(
          (shape) =>
            `${shape.tagName}:${['d', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'x1', 'y1', 'x2', 'y2', 'points'].map((attribute) => shape.getAttribute(attribute) ?? '').join(',')}`,
        )
        .join('|'),
    })),
  );
  expect(concepts.map(({ concept }) => concept).sort()).toEqual([
    'rentra',
    'ruin-relay',
    'zecsolve',
  ]);
  expect(new Set(concepts.map(({ geometry }) => geometry)).size).toBe(3);
  for (const diagram of await diagrams.all()) {
    await expect(diagram.locator('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(diagram.locator('figcaption')).toContainText('Concept sketch');
  }
  const card = page.locator('.repository-row').first();
  await card.scrollIntoViewIfNeeded();
  const copy = card.locator('.repository-content');
  await expect(copy).toHaveAttribute('data-scroll-entered', 'true');
  await copy.evaluate(async (node) => {
    await Promise.all(
      node.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
    );
  });
  await belowReadingBand(page, '.repository-row');
  await expect(card).not.toHaveAttribute('data-scroll-focused', 'true');
  expect(await card.evaluate((node) => node.matches(':hover, :focus-within'))).toBe(false);
  const diagram = card.locator('.repository-diagram');
  await ambientRunning(diagram);
  const snapshot = () =>
    card.evaluate((node) =>
      [node, ...node.querySelectorAll('.repository-link, .repository-copy p')].map((element) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      }),
    );
  const before = await snapshot();
  await fullAmbientCycle(diagram.locator('.repository-diagram-mechanism'));
  const after = await snapshot();
  for (let index = 0; index < before.length; index++) {
    for (const key of ['x', 'y', 'width', 'height'] as const)
      expect(Math.abs(after[index][key] - before[index][key])).toBeLessThan(0.5);
  }
  await expect(card).not.toHaveAttribute('data-scroll-focused', 'true');
  const artwork = diagram.locator('.repository-diagram-svg');
  const resting = await artwork.evaluate((node) => getComputedStyle(node).transform);
  await diagram.hover();
  await expect
    .poll(() =>
      artwork.evaluate((node) => {
        const transform = getComputedStyle(node).transform;
        return transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42;
      }),
    )
    .toBeLessThan(-1);
  await page.mouse.move(1, 1);
  await expect
    .poll(() => artwork.evaluate((node) => getComputedStyle(node).transform))
    .toBe(resting);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await diagram.hover();
  expect(await artwork.evaluate((node) => getComputedStyle(node).transform)).toBe('none');
});

test('workflow glyphs keep moving beyond a full cycle while stage text and layout remain steady', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const stages = page.locator('.process-list li');
  await expect(stages).toHaveCount(4);
  const first = stages.first();
  await instantScroll(page, '.process-list li');
  await expect(page.locator('.process-list')).toHaveAttribute('data-scroll-entered', 'true');
  await page.locator('.process-list').evaluate(async (node) => {
    await Promise.all(
      node.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
    );
  });
  await belowReadingBand(page, '.process-list li');
  await expect(first).not.toHaveAttribute('data-scroll-focused', 'true');
  expect(await first.evaluate((node) => node.matches(':hover, :focus-within'))).toBe(false);
  const glyph = first.locator('.process-glyph');
  await ambientRunning(glyph);
  const snapshot = () =>
    first.evaluate((node) =>
      [node, ...node.querySelectorAll('h3, p')].map((element) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      }),
    );
  const before = await snapshot();
  await fullAmbientCycle(glyph.locator('.process-glyph-search'));
  const after = await snapshot();
  for (let index = 0; index < before.length; index++) {
    for (const key of ['x', 'y', 'width', 'height'] as const)
      expect(Math.abs(after[index][key] - before[index][key])).toBeLessThan(0.5);
  }
  await expect(first).not.toHaveAttribute('data-scroll-focused', 'true');
  await expect(first.getByRole('heading')).toHaveText('Investigate');
});

test('ambient illustrations pause offscreen and in background documents, resume on return, and respect reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const examples = [
    { host: '.repository-diagram', part: '.repository-diagram-mechanism' },
    { host: '.process-glyph', part: '.process-glyph-search' },
  ];
  for (const example of examples) {
    const host = page.locator(example.host).first();
    const part = host.locator(example.part);
    await instantScroll(page, example.host);
    await ambientRunning(host);
    const initial = await visualState(part);
    await expect
      .poll(async () => {
        const current = await visualState(part);
        return (
          current.time !== null &&
          current.time > initial.time! + 80 &&
          current.visual !== initial.visual
        );
      })
      .toBe(true);
    await instantScroll(page, '.site-footer');
    await expect(host).toHaveAttribute('data-ambient-running', 'false');
    await frozenRotor(part);
    await instantScroll(page, example.host);
    await ambientRunning(host);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(host).toHaveAttribute('data-ambient-running', 'false');
    await frozenRotor(part);
    await page.evaluate(() => {
      Reflect.deleteProperty(document, 'hidden');
      Reflect.deleteProperty(document, 'visibilityState');
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await ambientRunning(host);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const example of examples) {
    const host = page.locator(example.host).first();
    await expect(host).not.toHaveAttribute('data-ambient-running', 'true');
    expect(await host.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
  }
  await expect(page.locator('h1')).toBeVisible();
});

test('illustrations keep moving after client navigation and no pause controls remain', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await noPauseControls(page);
  const timeOrigin = await page.evaluate(() => performance.timeOrigin);
  await page.getByRole('link', { name: 'Explore all work', exact: true }).click();
  await expect(page).toHaveURL(/\/work$/);
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin);
  await noPauseControls(page);
  await instantScroll(page, '.repository-diagram');
  const diagram = page.locator('.repository-diagram').first();
  await ambientRunning(diagram);
  const before = await visualState(diagram.locator('.repository-diagram-mechanism'));
  await expect
    .poll(async () => {
      const after = await visualState(diagram.locator('.repository-diagram-mechanism'));
      return (
        after.time !== null && after.time > before.time! + 80 && after.visual !== before.visual
      );
    })
    .toBe(true);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin);
  await page.mouse.move(1, 1);
  await noPauseControls(page);
  if (!isMobile) {
    await instantScroll(page, '.lab-field');
    await expect(page.locator('.lab-field')).toHaveAttribute('data-idle-running', 'true');
    await instantScroll(page, '.research-network-map');
    await expect(page.locator('.research-network-shell')).toHaveAttribute(
      'data-network-running',
      'true',
    );
  }
  await instantScroll(page, '.process-glyph');
  const glyph = page.locator('.process-glyph').first();
  await ambientRunning(glyph);
  const glyphBefore = await visualState(glyph.locator('.process-glyph-search'));
  await expect
    .poll(async () => {
      const after = await visualState(glyph.locator('.process-glyph-search'));
      return (
        after.time !== null &&
        after.time > glyphBefore.time! + 80 &&
        after.visual !== glyphBefore.visual
      );
    })
    .toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await noPauseControls(page);
  expect(await glyph.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
});
