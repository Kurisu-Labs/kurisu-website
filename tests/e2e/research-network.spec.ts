import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import configuration from '../../lib/site-content.json' with { type: 'json' };

const { directions } = configuration;

test('research selection exposes the real description and deep link without moving focus', async ({
  page,
}) => {
  await page.goto('/');
  const network = page.getByRole('group', { name: 'Choose a research direction' });
  await expect(network.getByRole('radio')).toHaveCount(directions.length);
  for (const direction of directions) {
    const radio = network.getByRole('radio', { name: direction.title, exact: true });
    await network.locator('label').filter({ hasText: direction.title }).click();
    await expect(radio).toBeChecked();
    await expect(radio).toBeFocused();
    const panel = network.locator('.research-network-detail:visible');
    await expect(panel).toHaveCount(1);
    await expect(panel).toContainText(direction.question);
    await expect(panel).toContainText(direction.description);
    await expect(panel.getByRole('link', { name: 'Explore this direction' })).toHaveAttribute(
      'href',
      `/research#${direction.id}`,
    );
  }
  expect(
    (await new AxeBuilder({ page }).include('.research-network-shell').analyze()).violations,
  ).toEqual([]);
});

test('native arrow-key selection works and hover preserves the selected direction', async ({
  page,
}) => {
  await page.goto('/');
  const network = page.getByRole('group', { name: 'Choose a research direction' });
  const first = network.getByRole('radio', { name: directions[0].title, exact: true });
  const second = network.getByRole('radio', { name: directions[1].title, exact: true });
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(second).toBeChecked();
  await expect(second).toBeFocused();
  const label = network.locator('label').filter({ hasText: directions[1].title });
  expect(await label.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');
  await network.locator('label').filter({ hasText: directions[2].title }).hover();
  await expect(second).toBeChecked();
  await page.keyboard.press('Tab');
  await expect(network.locator('.research-network-detail:visible a')).toBeFocused();
});

test('research controls and descriptions work without JavaScript on mobile', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3100/');
  const network = page.getByRole('group', { name: 'Choose a research direction' });
  await expect(network.locator('.research-network-map')).toBeHidden();
  for (const direction of directions) {
    await network.locator('label').filter({ hasText: direction.title }).tap();
    await expect(network.getByRole('radio', { name: direction.title, exact: true })).toBeChecked();
    await expect(network.locator('.research-network-detail:visible')).toContainText(
      direction.description,
    );
  }
  await network.locator('.research-network-detail:visible a').click();
  await expect(page).toHaveURL(new RegExp(`/research#${directions.at(-1)!.id}$`));
  await expect(page.locator(`#${directions.at(-1)!.id}`)).toBeInViewport();
  await context.close();
});

test('every research state reflows and reduced motion stops decorative animation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(
    await page
      .locator('.research-network-halo')
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none');
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const direction of directions) {
      await page.locator('.research-network-node').filter({ hasText: direction.title }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      ).toBe(true);
      await expect(page.locator('.research-network-detail:visible')).toContainText(
        direction.description,
      );
    }
  }
});

test('enlarged text keeps research labels and the active description from overlapping', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const direction of directions) {
      await page.locator('.research-network-node').filter({ hasText: direction.title }).click();
      const labels = await page.locator('.research-network-node').all();
      const boxes = await Promise.all(labels.map(async (label) => (await label.boundingBox())!));
      const panel = (await page.locator('.research-network-detail:visible').boundingBox())!;
      const overlaps = (a: typeof panel, b: typeof panel) =>
        a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
      for (let index = 0; index < boxes.length; index++) {
        expect(overlaps(boxes[index], panel), `${direction.id}: label/panel at ${width}px`).toBe(
          false,
        );
        for (let other = index + 1; other < boxes.length; other++) {
          expect(
            overlaps(boxes[index], boxes[other]),
            `labels ${index}/${other} at ${width}px`,
          ).toBe(false);
        }
      }
      const overflow = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth;
        const describe = (element: Element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            id: element.id,
            class: element.getAttribute('class'),
            text: element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 80),
            left: rect.left,
            right: rect.right,
            width: rect.width,
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth,
          };
        };
        const visible = [...document.body.querySelectorAll('*')].filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 2 && rect.height > 0;
        });
        return {
          clientWidth: viewport,
          scrollWidth: document.documentElement.scrollWidth,
          scrollX: window.scrollX,
          outside: visible
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.right > viewport + 0.5 || rect.left < -0.5;
            })
            .slice(0, 20)
            .map(describe),
          overflowingContent: visible
            .filter((element) => element.scrollWidth > element.clientWidth + 1)
            .slice(0, 20)
            .map(describe),
        };
      });
      expect(
        overflow.scrollWidth,
        `${direction.id} at ${width}px / 200% text: ${JSON.stringify(overflow)}`,
      ).toBeLessThanOrEqual(overflow.clientWidth);
    }
  }
});
