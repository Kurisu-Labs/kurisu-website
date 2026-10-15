import { test, expect, type Locator, type Page } from '@playwright/test';

async function pointAt(page: Page, surface: Locator, x: number, y: number) {
  const bounds = await surface.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width * x, bounds!.y + bounds!.height * y);
  await surface.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}

async function readySurface(surface: Locator) {
  await expect(surface).toHaveAttribute('data-motion-enabled', 'true');
  await surface.evaluate(async (node) => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
}

async function transform(element: Locator) {
  return element.evaluate((node) => getComputedStyle(node).transform);
}

async function cardAppearance(card: Locator) {
  return card.evaluate((node) => {
    const style = getComputedStyle(node, '::before');
    return [style.backgroundPosition, style.backgroundImage].join('|');
  });
}

async function expectVisibleContent(page: Page) {
  await expect(page.locator('h1')).toBeVisible();
  const visibility = await page.locator('[data-scroll-reveal]').evaluateAll((nodes) =>
    nodes.map((node) => {
      const style = getComputedStyle(node);
      return (
        style.display !== 'none' && style.visibility === 'visible' && Number(style.opacity) > 0
      );
    }),
  );
  expect(visibility.length).toBeGreaterThan(0);
  expect(visibility.every(Boolean)).toBe(true);
}

test.describe('lightweight laboratory motion', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });
  test('desktop pointer moves the decorative field and leaving restores its resting position', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'The decorative field is simplified away on mobile.');
    await page.goto('/');
    const field = page.locator('.lab-field');
    const diagram = field.locator('.field-diagram');
    await expect(field).toBeVisible();
    await page.mouse.move(1, 1);
    await readySurface(field);
    const resting = await transform(diagram);
    await pointAt(page, field, 0.2, 0.3);
    await expect(field).toHaveAttribute('data-pointer-active', 'true');
    await expect.poll(() => transform(diagram)).not.toBe(resting);
    const firstPosition = await transform(diagram);
    await pointAt(page, field, 0.8, 0.7);
    await expect.poll(() => transform(diagram)).not.toBe(firstPosition);
    await page.mouse.move(1, 1);
    await expect(field).not.toHaveAttribute('data-pointer-active', 'true');
    await expect.poll(() => transform(diagram)).toBe(resting);
    await expect(page.locator('h1')).toContainText('Building a decentralized future, together.');
  });

  test('card motion reinitializes after client navigation and repository links remain keyboard operable', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Fine-pointer card feedback is a desktop enhancement.');
    await page.goto('/');
    const initialDocument = await page.evaluate(() => performance.timeOrigin);
    await page.getByRole('link', { name: 'Explore all work', exact: true }).click();
    await expect(page).toHaveURL(/\/work$/);
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(initialDocument);
    const card = page.locator('.repository-row').first();
    await card.scrollIntoViewIfNeeded();
    await readySurface(card);
    const restingCard = (await card.boundingBox())!;
    await pointAt(page, card, 0.2, 0.3);
    await expect(card).toHaveAttribute('data-pointer-active', 'true');
    const firstPosition = await cardAppearance(card);
    await pointAt(page, card, 0.8, 0.7);
    await expect.poll(() => cardAppearance(card)).not.toBe(firstPosition);
    await expect
      .poll(() =>
        card
          .locator('.repository-copy')
          .evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).m42),
      )
      .toBeLessThan(-3);
    const activeCard = (await card.boundingBox())!;
    expect(Math.abs(activeCard.x - restingCard.x)).toBeLessThan(0.5);
    expect(Math.abs(activeCard.y - restingCard.y)).toBeLessThan(0.5);
    await page.mouse.move(1, 1);
    await expect.poll(() => transform(card.locator('.repository-copy'))).toBe('none');

    const link = card.getByRole('link', { name: 'Rentra on GitHub' });
    await link.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(link).toBeFocused();
    expect(await link.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe('none');
    await page.route('https://github.com/**', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<title>Repository navigation check</title>',
      }),
    );
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('https://github.com/Kurisu-Labs/rentra');
  });

  test('scroll adds bounded decorative movement while the content stays visible', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'The hero field has no mobile parallax.');
    await page.goto('/');
    await page.mouse.move(1, 1);
    await readySurface(page.locator('.lab-field'));
    const orbit = page.locator('.field-orbits');
    const resting = await transform(orbit);
    await page.mouse.wheel(0, 180);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await expect.poll(() => transform(orbit)).not.toBe(resting);
    const movement = await orbit.evaluate((node) => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
      return {
        angle: Math.abs((Math.atan2(matrix.b, matrix.a) * 180) / Math.PI),
        x: Math.abs(matrix.m41),
        y: Math.abs(matrix.m42),
      };
    });
    expect(movement.angle).toBeLessThanOrEqual(17);
    expect(movement.x).toBeLessThanOrEqual(6);
    expect(movement.y).toBeLessThanOrEqual(6);
    const drift = await page.locator('.field-diagram').evaluate((node) => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
      return Math.abs(matrix.m42);
    });
    expect(drift).toBeLessThanOrEqual(11);
    await expectVisibleContent(page);
    await page.locator('.process-list').scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: 'Develop & share', exact: true })).toBeVisible();
    await expectVisibleContent(page);
  });

  test('changing reduced-motion preference live stops and resets decoration', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'This checks disabling already-active fine-pointer motion.');
    await page.goto('/');
    const field = page.locator('.lab-field');
    const diagram = field.locator('.field-diagram');
    await readySurface(field);
    await pointAt(page, field, 0.8, 0.3);
    await expect(field).toHaveAttribute('data-pointer-active', 'true');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(field).not.toHaveAttribute('data-motion-enabled', 'true');
    await expect(field).not.toHaveAttribute('data-pointer-active', 'true');
    await expect
      .poll(() =>
        diagram.evaluate((node) => {
          const value = getComputedStyle(node).transform;
          return value === 'none' || new DOMMatrixReadOnly(value).isIdentity;
        }),
      )
      .toBe(true);
    await expect
      .poll(() =>
        page.locator('.field-orbits').evaluate((node) => {
          const value = getComputedStyle(node).transform;
          return value === 'none' || new DOMMatrixReadOnly(value).isIdentity;
        }),
      )
      .toBe(true);
    const card = page.locator('.repository-row').first();
    await card.scrollIntoViewIfNeeded();
    await pointAt(page, card, 0.2, 0.3);
    const still = await cardAppearance(card);
    await pointAt(page, card, 0.8, 0.7);
    expect(await cardAppearance(card)).toBe(still);
    await expect(card).not.toHaveAttribute('data-pointer-active', 'true');
    const animation = await page
      .locator('.field-diagram, .field-orbits, .repository-copy, [data-scroll-reveal]')
      .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).animationName));
    expect(animation.every((name) => name === 'none')).toBe(true);
    await expectVisibleContent(page);
  });

  test('coarse touch input leaves decoration static and repository links respond to taps', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Uses the mobile project’s real coarse-pointer media query.');
    await page.goto('/work');
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    const card = page.locator('.repository-row').first();
    await card.scrollIntoViewIfNeeded();
    await readySurface(card);
    await pointAt(page, card, 0.2, 0.3);
    const still = await cardAppearance(card);
    await pointAt(page, card, 0.8, 0.7);
    expect(await cardAppearance(card)).toBe(still);
    await expect(card).not.toHaveAttribute('data-pointer-active', 'true');
    await page.route('https://github.com/**', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<title>Repository navigation check</title>',
      }),
    );
    await card.getByRole('link', { name: 'Rentra on GitHub' }).tap();
    await expect(page).toHaveURL('https://github.com/Kurisu-Labs/rentra');
  });
});
