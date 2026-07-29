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
  await expect(page.locator('#wb-results')).toContainText('$10,000');
  await expect(page.locator('#wb-results')).toContainText('$333.34');
  await expect(page.locator('#wb-results')).toContainText('10%');
  await expect(page.locator('#wb-pitch-text')).toContainText('$10,000');
  await expect(page.locator('#wb-pitch-text')).toContainText('50% customer share');
  await expect(page.locator('#wb-pitch-text')).toContainText('20% take rate');
  await expect(page.locator('#wb-wager')).toHaveCount(0);
  await expect(page.locator('#wb-days')).toHaveCount(0);

  await page.locator('#wb-locations').fill('250');
  await expect(page.locator('#wb-breakdowns')).toContainText('Monthly handle / location');
  await expect(page.locator('#wb-breakdowns')).toContainText('$40');
  await expect(page.locator('#wb-breakdowns')).toContainText('$1.34');

  await page.locator('#wb-audience-basis').selectOption('portfolio');
  await page.locator('#wb-mau').fill('50000');
  await expect(page.locator('#wb-breakdowns')).toContainText('5,000');
  await expect(page.locator('#wb-breakdowns')).toContainText('$2 / month');
  await expect(page.locator('#wb-breakdowns')).toContainText('$0.07');
  await expect(page.locator('#wb-breakdowns')).toContainText('200');

  await page.locator('#wb-monthly-wager').fill('5');
  const monthlyScenario = page.locator('#wb-scenarios').getByText('Monthly wager scenario').locator('..');
  await expect(monthlyScenario).toContainText('$25,000');
  await expect(monthlyScenario).toContainText('$5,000');
  await expect(monthlyScenario).toContainText('$2,500');
  await expect(monthlyScenario).toContainText('$1,500');

  await page.locator('#wb-daily-wager').fill('1');
  await expect(page.locator('#wb-scenarios')).toContainText('Daily wager scenario');
  await expect(page.locator('#wb-scenarios')).toContainText('$150,000');
  await expect(page.locator('#wb-scenarios')).toContainText('$14,000');

  await page.locator('#wb-dau-location').fill('40');
  await expect(page.locator('#wb-breakdowns')).toContainText('10,000');
  await expect(page.locator('#wb-breakdowns')).toContainText('$0.04');
  await expect(page.locator('#wb-pitch-text')).toContainText('250 locations');
  await expect(page.locator('#wb-pitch-text')).toContainText('50,000 total monthly users');
  await expect(page.locator('#wb-pitch-text')).toContainText('5,000 engaged users');
  await expect(page.locator('#wb-pitch-text')).toContainText('40 daily active users per location');
  await expect(page.locator('#wb-pitch-text')).toContainText('$1,500 above the license fee');
});

test('wager break-even applies location count to scoped audience and license inputs', async ({ page }) => {
  await page.goto('/api/app.html');
  await page.getByRole('tab', { name: 'Wager Break-even' }).click();

  await page.locator('#wb-locations').fill('5');
  await page.locator('#wb-mau').fill('10000');
  await page.locator('#wb-monthly-wager').fill('5');

  await expect(page.locator('#wb-scope-summary')).toContainText('50,000 total monthly users');
  await expect(page.locator('#wb-breakdowns')).toContainText('5,000');
  await expect(page.locator('#wb-scenarios')).toContainText('$25,000');

  await page.locator('#wb-audience-basis').selectOption('portfolio');
  await expect(page.locator('#wb-scope-summary')).toContainText('10,000 total monthly users');
  await expect(page.locator('#wb-breakdowns')).toContainText('1,000');
  await expect(page.locator('#wb-scenarios')).toContainText('$5,000');

  await page.locator('#wb-license-basis').selectOption('location');
  await expect(page.locator('#wb-scope-summary')).toContainText('$5,000 total monthly license');
  await expect(page.locator('#wb-results')).toContainText('$50,000');
  await expect(page.locator('#wb-breakdowns')).toContainText('$10,000');
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
