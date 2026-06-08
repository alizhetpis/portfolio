// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Layout — нет прыжков', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('file:///Users/oui/Desktop/portfolio/index.html');
    await page.waitForLoadState('domcontentloaded');
  });

  test('профиль возвращается на то же место после навигации на главную', async ({ page }) => {
    const container = page.locator('.scroll-container');

    // Ждём завершения reveal-анимации при загрузке (0.65s)
    await page.waitForTimeout(800);
    const initial = await page.locator('.hero__profile').boundingBox();

    // Идём на works
    await container.evaluate(el => el.scrollTo({ top: el.clientHeight, behavior: 'instant' }));
    await page.waitForTimeout(600);

    // Возвращаемся на главную и ждём завершения всех анимаций
    await container.evaluate(el => el.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(900); // reveal (650ms) + header transition (350ms) + буфер

    const final = await page.locator('.hero__profile').boundingBox();

    // После всех анимаций профиль должен быть на том же месте
    expect(Math.abs(final.y - initial.y)).toBeLessThanOrEqual(1);
  });

  test('карточки works не прыгают после snap', async ({ page }) => {
    const container = page.locator('.scroll-container');

    // Скроллим на works и ждём полного завершения snap + анимации хедера
    await container.evaluate(el => el.scrollTo({ top: el.clientHeight, behavior: 'instant' }));
    await page.waitForTimeout(800);

    const before = await page.locator('.works__item').first().boundingBox();
    await page.waitForTimeout(200);
    const after = await page.locator('.works__item').first().boundingBox();

    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1);
  });

  test('hero content прижат к низу вьюпорта', async ({ page }) => {
    const viewportHeight = 900;
    const content = await page.locator('.hero__content').boundingBox();
    const profile = await page.locator('.hero__profile').boundingBox();

    const contentBottom = content.y + content.height;
    const profileBottom = profile.y + profile.height;

    // Контент должен быть в нижней четверти вьюпорта
    expect(contentBottom).toBeGreaterThan(viewportHeight * 0.75);
    expect(contentBottom).toBeLessThanOrEqual(viewportHeight);
    expect(profileBottom).toBeGreaterThan(viewportHeight * 0.75);
    expect(profileBottom).toBeLessThanOrEqual(viewportHeight);
  });

});
