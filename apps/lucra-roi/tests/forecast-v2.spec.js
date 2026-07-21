import { test, expect } from '@playwright/test';

async function openServedApp(page) {
  await page.goto('/api/app.html');
  await page.getByRole('tab', { name: 'Launch Forecast' }).click();
  await expect(page.locator('#forecast')).toBeVisible();
}

test('remaining-term forecast starts at the selected contract month', async ({ page }) => {
  await openServedApp(page);
  await page.locator('#lf-startMonth').selectOption('3');
  await page.locator('#lf-startMau').fill('25000');
  await page.locator('#lf-mauGrowth').fill('0');
  await page.locator('#lf-m1Activation').fill('5');
  await page.locator('#lf-targetActivation').fill('10');
  await page.locator('#lf-targetMonth').fill('6');
  await page.locator('#lf-plays').fill('20');
  await page.locator('#lf-wager').fill('2');
  await page.locator('#lf-rake').fill('10');
  await page.locator('#lf-lucraShare').fill('25');
  await page.locator('#lf-license').fill('0');

  await expect(page.locator('[data-lf-month]')).toHaveCount(10);
  await expect(page.locator('[data-lf-month="3"]')).toContainText('1,250');
  await expect(page.locator('[data-lf-month="3"]')).toContainText('$50,000');
  await expect(page.locator('[data-lf-month="2"]')).toHaveCount(0);
});

test('monthly check-ins save actuals and customer export content', async ({ page }) => {
  await openServedApp(page);
  await page.locator('#lf-customerName').fill('OneFootball');
  await page.locator('#lf-startMonth').selectOption('3');
  await page.locator('#lf-checkinMonth').selectOption('3');
  await page.locator('#lf-actualMau').fill('25000');
  await page.locator('#lf-actualActive').fill('1500');
  await page.locator('#lf-actualHandle').fill('60000');
  await page.getByRole('button', { name: 'Save monthly check-in' }).click();

  await expect(page.locator('#lf-checkin-list')).toContainText('Month 3');
  await expect(page.locator('#lf-checkin-list')).toContainText('$60,000');
  const report = await page.evaluate(() => LFreportHTML(LFcalculate(LF)));
  expect(report).toContain('OneFootball');
  expect(report).toContain('Recorded progress');
  expect(report).toContain('Month 3');
});

test('customer plan exports as a named PDF', async ({ page }) => {
  await openServedApp(page);
  await page.locator('#lf-customerName').fill('OneFootball');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download customer plan PDF' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('onefootball-implementation-growth-plan.pdf');
});

test('wager break-even replaces TrackMan and matches the approved example', async ({ page }) => {
  await page.goto('/api/app.html');
  await expect(page.getByRole('tab', { name: 'Trackman Partner' })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Wager Break-even' }).click();
  await expect(page.locator('#wagerbreakeven')).toBeVisible();
  await expect(page.locator('#wb-results')).toContainText('$6,250');
  await expect(page.locator('#wb-results')).toContainText('$208.33');
  await expect(page.locator('#wb-results')).toContainText('42');
  await expect(page.locator('#wb-pitch-text')).toContainText('$6,250');
  await expect(page.locator('#wb-pitch-text')).toContainText('80% Lucra share');
  await expect(page.locator('#wb-pitch-text')).toContainText('20% take rate');
});

test('new planning tools remain usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openServedApp(page);
  await expect(page.getByRole('button', { name: 'Download customer plan PDF' })).toBeVisible();
  expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(375);
  await page.getByRole('tab', { name: 'Wager Break-even' }).click();
  await expect(page.locator('#wb-results')).toBeVisible();
  expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(375);
});
