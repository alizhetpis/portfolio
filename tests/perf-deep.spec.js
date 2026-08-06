// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Deep performance', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('file:///Users/oui/Documents/portfolio/dist/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(300);
  });

  test('нет long tasks (>50ms) во время скролла', async ({ page }) => {
    const longTaskCount = await page.evaluate(() => {
      return new Promise(resolve => {
        const tasks = [];
        const obs = new PerformanceObserver(list => tasks.push(...list.getEntries()));
        obs.observe({ entryTypes: ['longtask'] });

        const container = document.querySelector('.scroll-container');
        let y = 0;
        let dir = 1;
        const iv = setInterval(() => {
          y += 40 * dir;
          if (y > container.clientHeight * 1.5) dir = -1;
          if (y < 0) { y = 0; dir = 1; }
          container.scrollTop = y;
        }, 16);

        setTimeout(() => {
          clearInterval(iv);
          obs.disconnect();
          resolve(tasks.length);
        }, 1500);
      });
    });

    console.log(`Long tasks during scroll: ${longTaskCount}`);
    expect(longTaskCount).toBe(0);
  });

  test('нет recalc-шторма от @property transition', async ({ page }) => {
    // Считаем сколько раз браузер пересчитывал стили за 400ms после смены хедера
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');

    const container = page.locator('.scroll-container');
    await container.evaluate(el => el.scrollTo({ top: el.clientHeight, behavior: 'instant' }));
    await page.waitForTimeout(50);

    const before = await client.send('Performance.getMetrics');
    const recalcBefore = before.metrics.find(m => m.name === 'RecalcStyleDuration')?.value ?? 0;
    const layoutBefore = before.metrics.find(m => m.name === 'LayoutDuration')?.value ?? 0;

    // Переход обратно на home — тригерит @property transition (если есть)
    await container.evaluate(el => el.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(450);

    const after = await client.send('Performance.getMetrics');
    const recalcAfter = after.metrics.find(m => m.name === 'RecalcStyleDuration')?.value ?? 0;
    const layoutAfter = after.metrics.find(m => m.name === 'LayoutDuration')?.value ?? 0;

    const recalcMs = (recalcAfter - recalcBefore) * 1000;
    const layoutMs = (layoutAfter - layoutBefore) * 1000;

    console.log(`RecalcStyle за навигацию: ${recalcMs.toFixed(1)}ms`);
    console.log(`Layout за навигацию: ${layoutMs.toFixed(1)}ms`);

    // Общий recalc + layout не должен превышать 30ms за 450ms
    expect(recalcMs + layoutMs).toBeLessThan(30);
  });

  test('backdrop-filter не создаёт composite-слой над скроллом', async ({ page }) => {
    const hasBackdrop = await page.evaluate(() => {
      const header = document.querySelector('.header');
      return getComputedStyle(header).backdropFilter !== 'none';
    });
    // Тест документирует текущее состояние — backdrop-filter должен быть убран
    console.log(`Header backdrop-filter активен: ${hasBackdrop}`);
    expect(hasBackdrop).toBe(false);
  });

});
