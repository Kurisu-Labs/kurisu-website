import { test, expect, type Locator, type Page } from '@playwright/test';

const viewports = [
  { width: 320, height: 844 },
  { width: 375, height: 844 },
  { width: 390, height: 844 },
  { width: 430, height: 844 },
  { width: 844, height: 390 },
];

async function auditTextBounds(page: Page) {
  return page.evaluate(() => {
    const tolerance = 2;
    const viewport = document.documentElement.clientWidth;
    const problems: string[] = [];
    const describe = (node: Element) => `${node.tagName.toLowerCase()}.${node.className}`;
    const roots = document.querySelectorAll('.hero-copy, .hero-index, .repository-row');

    for (const root of roots) {
      const owner = root.getBoundingClientRect();
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let text: Node | null;
      while ((text = walker.nextNode())) {
        const parent = text.parentElement;
        if (
          !parent ||
          !text.textContent?.trim() ||
          parent.closest('[aria-hidden="true"], .sr-only')
        )
          continue;
        const style = getComputedStyle(parent);
        if (style.display === 'none' || style.visibility !== 'visible') continue;
        const range = document.createRange();
        range.selectNodeContents(text);
        const label = text.textContent.trim().replace(/\s+/g, ' ').slice(0, 65);

        for (const rect of range.getClientRects()) {
          if (!rect.width || !rect.height) continue;
          if (rect.left < -tolerance || rect.right > viewport + tolerance)
            problems.push(`Text outside viewport: "${label}" (${rect.left}, ${rect.right})`);
          if (
            rect.left < owner.left - tolerance ||
            rect.right > owner.right + tolerance ||
            rect.top < owner.top - tolerance ||
            rect.bottom > owner.bottom + tolerance
          )
            problems.push(`Text outside ${describe(root)}: "${label}"`);

          for (
            let ancestor: HTMLElement | null = parent;
            ancestor && ancestor !== document.body;
            ancestor = ancestor.parentElement
          ) {
            const ancestorStyle = getComputedStyle(ancestor);
            const box = ancestor.getBoundingClientRect();
            const left = box.left + ancestor.clientLeft;
            const top = box.top + ancestor.clientTop;
            const right = left + ancestor.clientWidth;
            const bottom = top + ancestor.clientHeight;
            if (
              /(hidden|clip|auto|scroll)/.test(ancestorStyle.overflowX) &&
              (rect.left < left - tolerance || rect.right > right + tolerance)
            )
              problems.push(`Horizontal clipping in ${describe(ancestor)}: "${label}"`);
            if (
              /(hidden|clip|auto|scroll)/.test(ancestorStyle.overflowY) &&
              (rect.top < top - tolerance || rect.bottom > bottom + tolerance)
            )
              problems.push(`Vertical clipping in ${describe(ancestor)}: "${label}"`);
          }
        }
      }
    }

    return {
      rootCount: roots.length,
      viewport,
      documentWidth: document.documentElement.scrollWidth,
      problems: [...new Set(problems)],
    };
  });
}

async function settledDocumentBox(element: Locator) {
  return element.evaluate(async (node) => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    );
    const box = node.getBoundingClientRect();
    return {
      x: box.x + window.scrollX,
      y: box.y + window.scrollY,
      width: box.width,
      height: box.height,
    };
  });
}

async function center(element: Locator) {
  await element.evaluate((node) => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
}

async function accent(element: Locator) {
  return element.evaluate((node) => {
    const style = getComputedStyle(node, '::after');
    return { opacity: Number(style.opacity), transform: style.transform };
  });
}

async function swipeUp(page: Page, x: number, startY: number, endY: number) {
  // Browser input events exercise native scrolling; DOM-dispatched TouchEvents do not.
  const session = await page.context().newCDPSession(page);
  try {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y: startY, id: 1 }],
    });
    for (let step = 1; step <= 8; step++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y: startY + ((endY - startY) * step) / 8, id: 1 }],
      });
      await page.evaluate(
        () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
      );
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await session.detach();
  }
}

test.describe('mobile hero and portfolio', () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Exercises the Chromium touch project, including landscape.');
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  for (const viewport of viewports) {
    test(`content and tap targets fit ${viewport.width}×${viewport.height} at normal and doubled text size`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      for (const fontSize of ['100%', '200%']) {
        await page.evaluate(async (size) => {
          document.documentElement.style.fontSize = size;
          await document.fonts.ready;
        }, fontSize);
        await expect(page.locator('.hero h1')).toBeVisible();
        await expect(page.locator('.repository-row')).toHaveCount(3);
        const report = await auditTextBounds(page);
        expect(report.rootCount).toBe(5);
        expect(report.documentWidth, JSON.stringify(report)).toBeLessThanOrEqual(report.viewport);
        expect(report.problems, `${viewport.width}px / ${fontSize}`).toEqual([]);

        const heroFlow = await page
          .locator('.hero-eyebrow, .hero h1, .hero-description, .hero-actions')
          .evaluateAll((nodes) =>
            nodes.map((node) => {
              const box = node.getBoundingClientRect();
              return { top: box.top, bottom: box.bottom };
            }),
          );
        for (let index = 1; index < heroFlow.length; index++) {
          expect(
            heroFlow[index].top,
            `Hero copy overlap at ${viewport.width}px / ${fontSize}`,
          ).toBeGreaterThanOrEqual(heroFlow[index - 1].bottom - 1);
        }
        for (const link of await page.locator('.hero-actions a, .repository-link').all()) {
          await link.tap({ trial: true });
          const box = (await link.boundingBox())!;
          expect(box.width).toBeGreaterThanOrEqual(24);
          expect(box.height).toBeGreaterThanOrEqual(24);
        }
      }
    });
  }

  test('hero and portfolio links navigate with taps at doubled text size', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await page.getByRole('link', { name: 'Explore our research', exact: true }).tap();
    await expect(page).toHaveURL(/\/research$/);
    await expect(page.locator('h1')).toContainText('An agenda, shaped');

    await page.goto('/');
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await page.getByRole('link', { name: 'Explore all work', exact: true }).tap();
    await expect(page).toHaveURL(/\/work$/);
    await page.route('https://github.com/**', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<title>Public repository navigation</title>',
      }),
    );
    await page.getByRole('link', { name: 'zecsolve on GitHub', exact: true }).tap();
    await expect(page).toHaveURL('https://github.com/Kurisu-Labs/zecsolve');
  });

  test('touch swipes scroll naturally over the hero and repository cards', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const viewport = page.viewportSize()!;
    await swipeUp(page, viewport.width * 0.82, viewport.height * 0.75, viewport.height * 0.3);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
    await expect(page).toHaveURL(/\/$/);

    const card = page.locator('.repository-row').first();
    await center(card);
    await settledDocumentBox(card);
    const box = (await card.boundingBox())!;
    const startY = Math.min(box.y + box.height - 24, viewport.height * 0.8);
    const before = await page.evaluate(() => window.scrollY);
    await swipeUp(page, box.x + box.width * 0.82, startY, Math.max(30, startY - 260));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 80);
    await expect(page).toHaveURL(/\/$/);
  });

  test('scroll emphasis changes the accent without moving card content', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const card = page.locator('.repository-row').first();
    await expect(card).toHaveAttribute('data-motion-enabled', 'true');
    const inactive = await accent(card);
    await center(card);
    await expect(card).toHaveAttribute('data-scroll-focused', 'true');
    await expect
      .poll(async () => (await accent(card)).opacity)
      .toBeGreaterThan(inactive.opacity + 0.5);
    const focused = await accent(card);
    expect(focused.transform).not.toBe(inactive.transform);
    const content = card.locator('.repository-content');
    const before = await settledDocumentBox(content);

    const process = page.locator('.process-list li').first();
    await center(process);
    await expect(process).toHaveAttribute('data-scroll-focused', 'true');
    await expect.poll(async () => (await accent(process)).opacity).toBeGreaterThan(0.9);
    await expect.poll(async () => (await accent(card)).opacity).toBeLessThan(0.1);
    const after = await settledDocumentBox(content);
    for (const key of ['x', 'y', 'width', 'height'] as const) {
      expect(
        Math.abs(after[key] - before[key]),
        `Card ${key} changed with scroll emphasis`,
      ).toBeLessThan(1);
    }
    await expect(process.getByRole('heading', { name: 'Investigate', exact: true })).toBeVisible();
  });

  test('reduced motion and no JavaScript keep portfolio content usable and scroll accents static', async ({
    page,
    browser,
  }) => {
    await page.goto('/');
    const reducedCard = page.locator('.repository-row').first();
    const before = await accent(reducedCard);
    await center(reducedCard);
    await expect(reducedCard).not.toHaveAttribute('data-scroll-focused', 'true');
    expect(await accent(reducedCard)).toEqual(before);
    await reducedCard.getByRole('link', { name: 'Rentra on GitHub' }).tap({ trial: true });

    const context = await browser.newContext({
      javaScriptEnabled: false,
      hasTouch: true,
      isMobile: true,
      viewport: { width: 390, height: 844 },
      reducedMotion: 'no-preference',
    });
    try {
      const noJs = await context.newPage();
      await noJs.goto('http://127.0.0.1:3100/');
      const card = noJs.locator('.repository-row').first();
      const staticAccent = await accent(card);
      await center(card);
      await expect(card).not.toHaveAttribute('data-scroll-focused', 'true');
      expect(await accent(card)).toEqual(staticAccent);
      await expect(card.getByRole('heading', { name: 'Rentra on GitHub' })).toBeVisible();
      await card.getByRole('link', { name: 'Rentra on GitHub' }).tap({ trial: true });
      expect((await auditTextBounds(noJs)).problems).toEqual([]);
    } finally {
      await context.close();
    }
  });
});
