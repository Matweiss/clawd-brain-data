import { test, expect } from '@playwright/test';

async function openFTP(page) {
  await page.goto('/');
  const tab = page.locator('.tabs button', { hasText: 'Free-to-Play Value' });
  if (await tab.isVisible()) await tab.click();
  else await page.locator('#mobile-workflow').selectOption('freetoplay');
  await expect(page.locator('#freetoplay')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('lucraFreeToPlayValueV1');
    localStorage.removeItem('lucraFreeToPlayScenariosV1');
  });
});

test('BDR Quick Estimate switches between free, paid, and both live-call paths', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#bq-results')).toContainText('Preliminary scenario—not a forecast');
  await expect(page.locator('#bq-license')).toHaveValue('2500');
  await expect(page.locator('#bq-implementation')).toHaveValue('10000');
  await expect(page.locator('#bq-amort')).toHaveValue('12');
  await expect(page.locator('#bq-results')).toContainText('Fully loaded monthly cost');
  await expect(page.locator('#bq-results')).toContainText('$3,333.33');
  await page.getByRole('button', { name: 'Paid Play', exact: true }).click();
  await expect(page.locator('#bq-paid-fields')).toBeVisible();
  await expect(page.locator('#bq-f2p-fields')).toBeHidden();
  await expect(page.locator('#bq-frequency')).toHaveValue('4');
  await expect(page.locator('#bq-frequency-field')).toContainText('Tournaments / month');
  await page.getByRole('button', { name: 'Both', exact: true }).click();
  await expect(page.locator('#bq-paid-fields')).toBeVisible();
  await expect(page.locator('#bq-f2p-fields')).toBeVisible();
});

test('paid quick estimate distinguishes tournament pool from P2P rake', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Paid Play', exact: true }).click();
  await page.locator('#bq-participants').fill('100');
  await page.locator('#bq-price').fill('10');
  await page.locator('#bq-frequency').fill('2');
  await page.locator('#bq-prize').fill('500');
  await expect(page.locator('#bq-results')).toContainText('$2,000');
  await expect(page.locator('#bq-results')).toContainText('$1,000');
  await expect(page.locator('#bq-results')).toContainText('Entries / tournament to cover cost');
  await expect(page.locator('#bq-results')).toContainText('Illustrative operating plan');
  await expect(page.locator('#bq-results')).toContainText('2 tournaments / month');
  await page.locator('#bq-audience').fill('50000');
  await page.locator('#bq-frequency').fill('4');
  await expect(page.locator('#bq-results')).toContainText('1.1% of the audience');
  await page.locator('#bq-paid-format').selectOption('p2p');
  await page.locator('#bq-price').fill('50');
  await page.locator('#bq-rake').fill('20');
  await expect(page.locator('#bq-results')).toContainText('P2P GGR available');
  await expect(page.locator('#bq-results')).toContainText('$1,000');
  await expect(page.locator('#bq-prize-field')).toBeHidden();
  await expect(page.locator('#bq-frequency-field')).toBeHidden();
});

test('routes the multi-tournament plan into Licence Payoff', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Paid Play', exact: true }).click();
  await page.locator('#bq-audience').fill('50000');
  await page.locator('#bq-participants').fill('300');
  await page.locator('#bq-price').fill('10');
  await page.locator('#bq-frequency').fill('4');
  await page.locator('#bq-prize').fill('500');
  await page.getByRole('button', { name: 'Build live scenario' }).click();
  const tournament = page.locator('#lp-tournaments .lp-repeat').first();
  await expect(tournament).toContainText('Planned pool $12,000 / month');
  await expect(tournament.locator('input').nth(1)).toHaveValue('10');
  await expect(tournament.locator('input').nth(2)).toHaveValue('300');
  await expect(tournament.locator('input').nth(3)).toHaveValue('4');
  await expect(tournament.locator('input').nth(4)).toHaveValue('500');
  await expect(tournament.locator('input').nth(5)).toHaveValue('500');
  await expect(tournament.locator('input').nth(6)).toHaveValue('0');
});

test('routes free-to-play discovery answers into the proof-first tab', async ({ page }) => {
  await page.goto('/');
  await page.locator('#bq-customer').fill('Acme Coffee');
  await page.locator('#bq-audience').fill('100000');
  await page.locator('#bq-value').fill('25');
  await page.locator('#bq-reward').fill('2');
  await page.locator('#bq-advanced').evaluate((el) => { el.open = true; });
  await page.locator('#bq-license').fill('12000');
  await page.locator('#bq-implementation').fill('24000');
  await page.locator('#bq-amort').fill('12');
  await page.locator('#bq-opex').fill('500');
  await page.getByRole('button', { name: 'Build live scenario' }).click();
  await expect(page.locator('#freetoplay')).toBeVisible();
  await expect(page.locator('#ftp-customer')).toHaveValue('Acme Coffee');
  await expect(page.locator('#ftp-audience')).toHaveValue('100000');
  await expect(page.locator('#ftp-license')).toHaveValue('12000');
  await expect(page.locator('#ftp-implementation')).toHaveValue('24000');
  await expect(page.locator('#ftp-opex')).toHaveValue('500');
  await expect(page.locator('.deal-setup')).toHaveClass(/bq-collapsed/);
});

test('renders scorecard, 5×5 map, funnel, thresholds, and full opportunity', async ({ page }) => {
  await openFTP(page);
  await page.locator('#ftp-audience').fill('100000');
  await page.locator('#ftp-reward-cost').fill('2');
  await page.locator('#ftp-outcome-rate').fill('50');
  await page.locator('#ftp-outcome-value').fill('30');
  await expect(page.locator('#ftp-scorecard .ftp-score')).toHaveCount(5);
  await expect(page.locator('#ftp-matrix .ftp-matrix td')).toHaveCount(25);
  await expect(page.locator('#ftp-funnel .ftp-funnel-step')).toHaveCount(5);
  await expect(page.locator('#ftp-conditions .ftp-condition')).toHaveCount(3);
  await page.locator('#ftp-full-toggle').click();
  await expect(page.locator('#ftp-full')).toBeVisible();
  await expect(page.locator('#ftp-modules .ftp-module')).toHaveCount(8);
  await expect(page.locator('#ftp-ramp .ftp-ramp-col')).toHaveCount(12);
});

test('Build and Present modes preserve results while hiding controls', async ({ page }) => {
  await openFTP(page);
  await expect(page.locator('.ftp-controls')).toBeVisible();
  await page.getByRole('button', { name: 'Present', exact: true }).click();
  await expect(page.locator('.ftp-controls')).toBeHidden();
  await expect(page.locator('#ftp-scorecard')).toBeVisible();
  await page.getByRole('button', { name: 'Build', exact: true }).click();
  await expect(page.locator('.ftp-controls')).toBeVisible();
});

test('free-to-play view persists scenarios and has no mobile overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openFTP(page);
  await page.locator('#ftp-customer').fill('Mobile Coffee');
  await page.getByRole('button', { name: 'Save scenario' }).click();
  await expect(page.locator('#ftp-scenarios .lp-scenario')).toHaveCount(1);
  const sizes = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
});

test('exports the free-to-play one-page PDF through the existing path', async ({ page }) => {
  await openFTP(page);
  await page.locator('#ftp-customer').fill('Acme Coffee');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export one-page PDF' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('acme-coffee-free-to-play-value.pdf');
});
