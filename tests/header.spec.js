// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Header', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('file:///Users/oui/Desktop/portfolio/index.html');
    await page.waitForLoadState('domcontentloaded');
  });

  test('показывает "2021 – Today" на главной странице', async ({ page }) => {
    const year = page.locator('.header__year');
    await expect(year).toBeVisible();
  });

  test('скрывает "2021 – Today" при скролле на works', async ({ page }) => {
    const container = page.locator('.scroll-container');
    // Скроллим до snap-точки works (один clientHeight)
    await container.evaluate(el => el.scrollTo({ top: el.clientHeight, behavior: 'instant' }));
    await page.waitForTimeout(500);

    const opacity = await page.locator('.header__year').evaluate(
      el => parseFloat(getComputedStyle(el).opacity)
    );
    expect(opacity).toBe(0);
  });

  test('--header-h соответствует фактической высоте хедера', async ({ page }) => {
    const { cssVar, actual } = await page.evaluate(() => {
      const h = document.querySelector('.header');
      const cssVar = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--header-h')
      );
      return { cssVar, actual: h.offsetHeight };
    });
    expect(Math.abs(cssVar - actual)).toBeLessThanOrEqual(1);
  });

  test('--header-h уменьшается после скролла на works', async ({ page }) => {
    const container = page.locator('.scroll-container');

    const expandedH = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h'))
    );

    await container.evaluate(el => el.scrollTo({ top: el.clientHeight, behavior: 'instant' }));
    await page.waitForTimeout(500);

    const collapsedH = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h'))
    );

    expect(collapsedH).toBeLessThan(expandedH);
  });

});
