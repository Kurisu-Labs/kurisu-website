import { test, expect, type Page } from '@playwright/test';

type AnimationSample = {
  time: number;
  opacity: number;
  state: string;
  introReveals: number;
};
type TransitionRecord = {
  path: string;
  samples: AnimationSample[];
  outcome: 'pending' | 'finished' | 'cancelled';
  duration: number;
  startScrollY: number;
  headingInViewport: boolean;
};
declare global {
  interface Window {
    __pageTransitionRecords: TransitionRecord[];
    __reduceNextArrival?: boolean;
    __reduceOnArrival?: () => Promise<void>;
  }
}

async function recordTransitions(page: Page) {
  await page.addInitScript(() => {
    window.__pageTransitionRecords = [];
    const original = Element.prototype.animate;
    if (!original) return;
    Element.prototype.animate = function (keyframes, options) {
      // Sample the real animation without seeking, slowing it down, or changing its promises.
      const animation = original.call(this, keyframes, options);
      if (this.id !== 'main-content' || animation.id !== 'page-content-in') return animation;
      const content = document.getElementById('main-content')!;
      const heading = content.querySelector('h1')?.getBoundingClientRect();
      const record: TransitionRecord = {
        path: location.pathname,
        samples: [],
        outcome: 'pending',
        duration: Number(animation.effect?.getTiming().duration ?? 0),
        startScrollY: window.scrollY,
        headingInViewport: !!heading && heading.bottom > 0 && heading.top < innerHeight,
      };
      window.__pageTransitionRecords.push(record);
      const sample = () => {
        const introReveals = [
          ...content.querySelectorAll(
            '.page-intro[data-scroll-reveal], .page-intro [data-scroll-reveal]',
          ),
        ]
          .filter((node) => {
            const box = node.getBoundingClientRect();
            return box.bottom > 0 && box.top < innerHeight;
          })
          .flatMap((node) => node.getAnimations())
          .filter(
            (effect) =>
              effect.playState === 'running' && effect.effect?.getTiming().iterations !== Infinity,
          ).length;
        record.samples.push({
          time: Number(animation.currentTime ?? 0),
          opacity: Number(getComputedStyle(content).opacity),
          state: animation.playState,
          introReveals,
        });
        if (record.outcome === 'pending' && record.samples.length < 60)
          requestAnimationFrame(sample);
      };
      sample();
      void animation.finished.then(
        () => {
          record.outcome = 'finished';
          sample();
        },
        () => {
          record.outcome = 'cancelled';
        },
      );
      if (window.__reduceNextArrival) {
        window.__reduceNextArrival = false;
        void window.__reduceOnArrival?.();
      }
      return animation;
    };
  });
}

async function records(page: Page) {
  return page.evaluate(() => window.__pageTransitionRecords);
}

async function ready(page: Page) {
  // Both select instances become enabled after hydration, including the hidden desktop copy.
  await expect(page.locator('.desktop-navigation select')).toBeEnabled();
}

async function headerLink(page: Page, name: string, mobile: boolean) {
  if (name === 'Home') {
    await page.getByRole('link', { name: 'Kurisu Labs home', exact: true }).click();
    return;
  }
  if (mobile) {
    await page.locator('.mobile-navigation summary').click();
    await expect(page.locator('.mobile-navigation')).toHaveAttribute('open', '');
  }
  await page
    .getByRole('navigation', { name: mobile ? 'Mobile' : 'Main', exact: true })
    .getByRole('link', { name, exact: true })
    .click();
  if (mobile) await expect(page.locator('.mobile-navigation')).not.toHaveAttribute('open');
}

async function settled(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect
    .poll(async () => (await records(page)).every((record) => record.outcome !== 'pending'))
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter(
              (animation) =>
                animation.id === 'page-content-in' && animation.playState === 'running',
            ).length,
      ),
    )
    .toBe(0);
}

async function animatedNavigation(page: Page, since: number) {
  await expect
    .poll(async () => {
      const samples = (await records(page)).slice(since).flatMap((record) => record.samples);
      return samples.some((sample) => sample.state === 'running' && sample.time > 0);
    })
    .toBe(true);
  await settled(page);
  const arrivals = (await records(page)).slice(since);
  expect(arrivals).toHaveLength(1);
  const arrival = arrivals[0];
  expect(arrival.outcome).toBe('finished');
  expect(arrival.duration).toBeGreaterThan(0);
  expect(arrival.duration).toBeLessThanOrEqual(400);
  expect(
    Math.max(...arrival.samples.map((frame) => frame.time)) -
      Math.min(...arrival.samples.map((frame) => frame.time)),
  ).toBeGreaterThan(1);
  expect(
    Math.max(...arrival.samples.map((frame) => frame.opacity)) -
      Math.min(...arrival.samples.map((frame) => frame.opacity)),
  ).toBeGreaterThan(0.5);
  expect(await page.locator('main').evaluate((node) => getComputedStyle(node).opacity)).toBe('1');
  expect(
    await page.locator('main').evaluate((node) => getComputedStyle(node).pointerEvents),
  ).not.toBe('none');
  return arrival;
}

test('page arrivals accompany client navigation and history without reloading or trapping the mobile menu', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await recordTransitions(page);
  await page.goto('/');
  await ready(page);
  expect(await records(page)).toHaveLength(0);
  const initialDocument = await page.evaluate(() => performance.timeOrigin);
  for (const [name, path, title] of [
    ['Work', '/work', 'Work'],
    ['Research', '/research', 'An agenda, shaped'],
    ['About', '/about', 'An independent place'],
    ['Home', '/', 'Building a decentralized future, together.'],
  ]) {
    const since = (await records(page)).length;
    await headerLink(page, name, isMobile);
    await expect(page).toHaveURL((url) => url.pathname === path && !url.hash);
    await expect(page.locator('h1')).toContainText(title);
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(initialDocument);
    await animatedNavigation(page, since);
  }
  for (const direction of ['back', 'forward'] as const) {
    const since = (await records(page)).length;
    if (direction === 'back') await page.goBack();
    else await page.goForward();
    await expect(page).toHaveURL((url) => url.pathname === (direction === 'back' ? '/about' : '/'));
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(initialDocument);
    await animatedNavigation(page, since);
  }
});

test('hash navigation adds no stray arrival and footer navigation restores scroll before animating', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await recordTransitions(page);
  await page.goto('/about');
  await ready(page);
  const initialDocument = await page.evaluate(() => performance.timeOrigin);
  const since = (await records(page)).length;
  await headerLink(page, 'Contact', isMobile);
  await expect(page).toHaveURL((url) => url.pathname === '/' && url.hash === '#contact');
  await expect(page.locator('#contact-title')).toBeInViewport();
  await animatedNavigation(page, since);
  const fadeCount = (await records(page)).length;
  await page.getByRole('link', { name: 'Explore the lab', exact: false }).click();
  await expect(page).toHaveURL((url) => url.pathname === '/' && url.hash === '#research-network');
  await expect(page.locator('#directions-title')).toBeInViewport();
  await settled(page);
  await page
    .getByRole('navigation', { name: 'Footer', exact: true })
    .getByRole('link', { name: 'Contact', exact: true })
    .click();
  await expect(page).toHaveURL((url) => url.hash === '#contact');
  await expect(page.locator('#contact-title')).toBeInViewport();
  await settled(page);
  expect((await records(page)).length).toBe(fadeCount);
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(initialDocument);
  await page
    .getByRole('navigation', { name: 'Footer', exact: true })
    .getByRole('link', { name: 'Work', exact: true })
    .click();
  await expect(page).toHaveURL(/\/work$/);
  const arrival = await animatedNavigation(page, fadeCount);
  expect(arrival.path).toBe('/work');
  expect(arrival.startScrollY).toBeLessThan(120);
  expect(arrival.headingInViewport).toBe(true);
  await expect(page.locator('h1')).toBeInViewport();
  expect(arrival.samples.every((sample) => sample.introReveals === 0)).toBe(true);
  expect(
    await page
      .locator('.page-intro[data-scroll-reveal], .page-intro [data-scroll-reveal]')
      .evaluateAll((nodes) =>
        nodes.every((node) => getComputedStyle(node).animationName === 'none'),
      ),
  ).toBe(true);
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(initialDocument);
});

test('changing reduced-motion preference removes page fades and restoring it resumes navigation feedback', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await recordTransitions(page);
  await page.goto('/about');
  await ready(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await settled(page);
  const since = (await records(page)).length;
  await headerLink(page, 'Work', isMobile);
  await expect(page).toHaveURL(/\/work$/);
  await expect(page.locator('h1')).toHaveText('Work');
  await settled(page);
  expect((await records(page)).slice(since)).toEqual([]);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await settled(page);
  const resumed = (await records(page)).length;
  await headerLink(page, 'Research', isMobile);
  await expect(page).toHaveURL(/\/research$/);
  await animatedNavigation(page, resumed);
  // Switch the real media preference as an arrival starts, without extending its duration.
  await page.exposeFunction('__reduceOnArrival', () =>
    page.emulateMedia({ reducedMotion: 'reduce' }),
  );
  await page.evaluate(() => {
    window.__reduceNextArrival = true;
  });
  const interrupted = (await records(page)).length;
  await headerLink(page, 'About', isMobile);
  await expect(page).toHaveURL(/\/about$/);
  await expect.poll(async () => (await records(page))[interrupted]?.outcome).toBe('cancelled');
  await settled(page);
  expect((await records(page)).length).toBe(interrupted + 1);
  expect(await page.locator('main').evaluate((node) => getComputedStyle(node).opacity)).toBe('1');
  await expect(page.locator('h1')).toContainText('An independent place');
});

test('navigation remains usable without the Web Animations API or JavaScript', async ({
  browser,
  baseURL,
  isMobile,
}) => {
  test.skip(
    isMobile,
    'The fallback contexts cover the same native links without duplicate scenarios.',
  );
  for (const javaScriptEnabled of [true, false]) {
    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled,
      reducedMotion: 'no-preference',
      viewport: { width: 1440, height: 1000 },
    });
    try {
      const page = await context.newPage();
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      if (javaScriptEnabled)
        await page.addInitScript(() => {
          Object.defineProperty(Element.prototype, 'animate', {
            value: undefined,
            configurable: true,
          });
        });
      await page.goto('/');
      if (javaScriptEnabled) await ready(page);
      const initialDocument = await page.evaluate(() => performance.timeOrigin);
      await headerLink(page, 'Work', false);
      await expect(page).toHaveURL(/\/work$/);
      await expect(page.locator('h1')).toHaveText('Work');
      const sameDocument = await page.evaluate(
        (initial) => performance.timeOrigin === initial,
        initialDocument,
      );
      expect(sameDocument).toBe(javaScriptEnabled);
      await headerLink(page, 'Research', false);
      await expect(page).toHaveURL(/\/research$/);
      await expect(page.locator('h1')).toContainText('An agenda, shaped');
      await expect(page.locator('.contact-email')).toHaveAttribute('href', /^mailto:/);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  }
});

test('rapid header navigation reaches the final page and cleans up superseded arrivals', async ({
  page,
  isMobile,
}) => {
  test.skip(
    isMobile,
    'The desktop header keeps the successive targets visible throughout navigation.',
  );
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await recordTransitions(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await ready(page);
  const initialDocument = await page.evaluate(() => performance.timeOrigin);
  const nav = page.getByRole('navigation', { name: 'Main', exact: true });
  for (const name of ['Work', 'Research', 'About'])
    await nav.getByRole('link', { name, exact: true }).click({ noWaitAfter: true });
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.locator('h1')).toContainText('An independent place');
  await settled(page);
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(initialDocument);
  await expect(nav.getByRole('link', { name: 'About', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await page.getByRole('link', { name: 'Kurisu Labs home', exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === '/');
  await expect(page.locator('h1')).toContainText('Building a decentralized future, together.');
  await settled(page);
  expect(errors).toEqual([]);
});
