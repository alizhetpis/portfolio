// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Performance', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('file:///Users/oui/Documents/portfolio/dist/index.html');
    await page.waitForLoadState('domcontentloaded');
  });

  test('works-label скрыт на главной', async ({ page }) => {
    const label = page.locator('#works-label');
    const opacity = await label.evaluate(el => parseFloat(getComputedStyle(el).opacity));
    expect(opacity).toBe(0);
  });

  test('works-label виден на странице works', async ({ page }) => {
    const container = page.locator('.scroll-container');
    await container.evaluate(el => el.scrollTo({ top: el.clientHeight + 50, behavior: 'instant' }));
    await page.waitForTimeout(200);
    const opacity = await page.locator('#works-label').evaluate(
      el => parseFloat(getComputedStyle(el).opacity)
    );
    expect(opacity).toBeGreaterThan(0);
  });

  test('works-label скрыт на странице info', async ({ page }) => {
    const container = page.locator('.scroll-container');
    // Скроллим глубоко в info секцию
    await container.evaluate(el => el.scrollTo({ top: el.clientHeight * 2 + 50, behavior: 'instant' }));
    await page.waitForTimeout(200);
    const opacity = await page.locator('#works-label').evaluate(
      el => parseFloat(getComputedStyle(el).opacity)
    );
    expect(opacity).toBe(0);
  });

  test('scroll не вызывает форс-лейаут — offsetTop не читается в хэндлере', async ({ page }) => {
    // Патчим offsetTop чтобы считать вызовы
    const callsBefore = await page.evaluate(() => {
      window._offsetTopCalls = 0;
      const orig = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop');
      Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
        get() {
          window._offsetTopCalls++;
          return orig.get.call(this);
        },
        configurable: true,
      });
      return window._offsetTopCalls;
    });

    const container = page.locator('.scroll-container');
    // Скроллим на works — триггерим updateLabels
    await container.evaluate(el => el.scrollTo({ top: el.clientHeight + 100, behavior: 'instant' }));
    await page.waitForTimeout(300);

    const callsAfterScroll = await page.evaluate(() => window._offsetTopCalls);
    const scrollEvents = await page.evaluate(() => window._scrollEvents || 0);

    // После кеширования offsetTop должен читаться только при инициализации и resize,
    // не при каждом scroll событии. Допускаем максимум 10 вызовов (инит + запас).
    console.log(`offsetTop calls: ${callsAfterScroll}, scroll events: ${scrollEvents}`);
    expect(callsAfterScroll).toBeLessThanOrEqual(10);
  });

  test('labels корректны после быстрого скролла туда-обратно', async ({ page }) => {
    const container = page.locator('.scroll-container');

    // Быстро скроллим на works и обратно несколько раз
    for (let i = 0; i < 4; i++) {
      await container.evaluate(el => el.scrollTo({ top: el.clientHeight + 100, behavior: 'instant' }));
      await page.waitForTimeout(40);
      await container.evaluate(el => el.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(500);

    // На главной: works-label скрыт
    const opacity = await page.locator('#works-label').evaluate(
      el => parseFloat(getComputedStyle(el).opacity)
    );
    expect(opacity).toBe(0);
  });

});
