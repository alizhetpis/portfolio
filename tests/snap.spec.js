// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Scroll snap', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('file:///Users/oui/Documents/portfolio/dist/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(200);
  });

  test('snap не отключается при начале скролла с главной', async ({ page }) => {
    const container = page.locator('.scroll-container');

    // Симулируем реальный скролл колёсиком
    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, 80);
    await page.waitForTimeout(80);

    const snapType = await container.evaluate(el => el.style.scrollSnapType);
    // Inline style должен быть пустым — snap управляется только через CSS
    expect(snapType).toBe('');
  });

  test('страница снапается к ближайшей точке после wheel-скролла', async ({ page }) => {
    const container = page.locator('.scroll-container');

    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(1000);

    const scrollTop = await container.evaluate(el => el.scrollTop);
    const clientH   = await container.evaluate(el => el.clientHeight);

    const snappedToHome  = scrollTop < 5;
    const snappedToWorks = Math.abs(scrollTop - clientH) < 5;
    expect(snappedToHome || snappedToWorks).toBe(true);
  });

});
