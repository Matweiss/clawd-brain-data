import { test, expect } from '@playwright/test';

async function openPayoff(page) {
  await page.goto('/');
  const tab = page.locator('.tabs button', { hasText: 'Wager Break-even' });
  if (await tab.isVisible()) await tab.click();
  else await page.locator('#mobile-workflow').selectOption('wagerbreakeven');
  await page.getByRole('tab', { name: 'Licence Payoff' }).click();
  await expect(page.locator('#lp-view')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('lucraLicencePayoffV1');
    localStorage.removeItem('lucraLicencePayoffScenariosV1');
  });
});

test('renders the payoff workspace, schedule, and first-class break-even map', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openPayoff(page);

  await expect(page.locator('#lp-headlines .lp-headline')).toHaveCount(4);
  await expect(page.locator('#lp-months tr')).toHaveCount(24);
  await expect(page.locator('#lp-map .lp-map td')).toHaveCount(25);
  await expect(page.locator('#lp-map')).toContainText('required');
  await expect(page.locator('#lp-story')).toContainText('Licence retired from activity');
  await expect(page.getByText('Gross available to split = entries × entry price. No rake is applied.')).toBeVisible();
  await page.getByText('Head-to-head / peer-to-peer').click();
  await expect(page.getByText('Gross available to split = handle × rake.')).toBeVisible();
  expect(errors).toEqual([]);
});

test('heat map responds to usable entry capacity and event cadence', async ({ page }) => {
  await openPayoff(page);
  await page.locator('#lp-term').selectOption('1');
  await page.locator('#lp-fees input').first().fill('12000');
  await page.locator('#lp-audience').fill('1000');
  await page.locator('#lp-rebuy').fill('1');
  await page.locator('#lp-growth').fill('0');
  await page.locator('#lp-tournaments .lp-repeat').nth(1).getByRole('button', { name: 'Remove' }).click();
  const fields = page.locator('#lp-tournaments .lp-repeat').first().locator('input');
  await fields.nth(1).fill('10');
  await fields.nth(2).fill('50');
  await fields.nth(3).fill('1');
  await fields.nth(4).fill('0');
  await fields.nth(5).fill('0');
  const limited = await page.locator('#lp-map').innerText();
  await fields.nth(2).fill('100');
  const moreEntries = await page.locator('#lp-map').innerText();
  await fields.nth(3).fill('4');
  const moreEvents = await page.locator('#lp-map').innerText();
  expect(moreEntries).not.toBe(limited);
  expect(moreEvents).not.toBe(moreEntries);
  await expect(page.locator('#lp-map')).toContainText('400 available slots across 4 events per month');
  await expect(page.locator('#lp-map')).toContainText('Manual tournament inputs drive the dollars');
});

test('generates an audience-guided plan, then honors manual overrides and prize cash', async ({ page }) => {
  await openPayoff(page);
  await page.locator('#lp-term').selectOption('1');
  await page.locator('#lp-fees input').first().fill('12000');
  await page.locator('#lp-audience').fill('1000');
  await page.locator('#lp-engagement').fill('10');
  await page.locator('#lp-rebuy').fill('1');
  await page.locator('#lp-growth').fill('0');
  await page.locator('#lp-plan-count').fill('1');
  await page.locator('#lp-plan-cadence').selectOption('4');
  await page.getByRole('button', { name: 'Create prize-board inputs' }).click();
  const fields = page.locator('#lp-tournaments .lp-repeat').first().locator('input');
  await fields.nth(4).fill('400');
  await fields.nth(5).fill('400');
  await page.getByRole('button', { name: 'Generate minimum plan' }).click();
  await expect(page.locator('#lp-plan-status')).toContainText('Minimum viable plan generated');
  await expect(fields.nth(1)).toHaveValue('10');
  await expect(fields.nth(2)).toHaveValue('100');
  await expect(fields.nth(3)).toHaveValue('4');
  await expect(page.locator('#lp-headlines .lp-headline').nth(2)).toContainText('Month 6');
  await expect(page.locator('#lp-headlines .lp-headline').nth(3)).toContainText('$19,200');
  const grossBefore = await page.locator('#lp-months tr').first().locator('td').nth(1).innerText();
  await page.locator('#lp-engagement').fill('5');
  await expect(page.locator('#lp-months tr').first().locator('td').nth(1)).toHaveText(grossBefore);
  await expect(page.locator('#lp-warnings')).toContainText('Manual plan exceeds audience support');
  await fields.nth(5).fill('500');
  await expect(page.locator('#lp-headlines .lp-headline').nth(2)).toContainText('Month 6');
  await expect(page.locator('#lp-headlines .lp-headline').nth(3)).toContainText('$24,000');
  await expect(page.locator('#lp-warnings')).toContainText('Cash-negative reward warning');
});

test('blocks invalid splits and disables the shared PDF export path', async ({ page }) => {
  await openPayoff(page);
  await page.locator('#lp-pay-c').fill('41');

  await expect(page.locator('#lp-validation')).toBeVisible();
  await expect(page.locator('#lp-validation')).toContainText('Payoff split must sum to 100%');
  await expect(page.locator('#lp-export')).toBeDisabled();
  await expect(page.locator('#lp-months tr')).toHaveCount(0);

  await page.locator('#lp-pay-c').fill('40');
  await expect(page.locator('#lp-validation')).toBeHidden();
  await expect(page.locator('#lp-export')).toBeEnabled();
  await expect(page.locator('#lp-print-report')).toContainText('Tournaments use full entry pools; wagered play uses handle × rake.');
});

test('highlights a mid-month split crossover', async ({ page }) => {
  await openPayoff(page);
  await page.locator('#lp-term').selectOption('1');
  await page.locator('#lp-fees input').first().fill('750');
  await page.locator('#lp-audience').fill('100');
  await page.locator('#lp-engagement').fill('100');
  await page.locator('#lp-rebuy').fill('1');
  await page.locator('#lp-growth').fill('0');
  await page.locator('#lp-tournaments .lp-repeat').nth(1).getByRole('button', { name: 'Remove' }).click();
  const fields = page.locator('#lp-tournaments .lp-repeat').first().locator('input');
  await fields.nth(1).fill('10');
  await fields.nth(2).fill('100');
  await fields.nth(3).fill('1');
  await fields.nth(4).fill('0');
  await fields.nth(5).fill('0');

  await expect(page.locator('#lp-months tr').nth(1)).toHaveClass(/crossover/);
  await expect(page.locator('#lp-months tr').nth(1)).toContainText('Crossover');
});

test('shows the payoff-phase cash-negative prize warning', async ({ page }) => {
  await openPayoff(page);
  await page.locator('#lp-audience').fill('100');
  await page.locator('#lp-engagement').fill('100');
  await page.locator('#lp-rebuy').fill('1');
  await page.locator('#lp-tournaments .lp-repeat').nth(1).getByRole('button', { name: 'Remove' }).click();
  const fields = page.locator('#lp-tournaments .lp-repeat').first().locator('input');
  await fields.nth(1).fill('10');
  await fields.nth(2).fill('100');
  await fields.nth(3).fill('1');
  await fields.nth(4).fill('450');
  await fields.nth(5).fill('450');

  await expect(page.locator('#lp-warnings')).toContainText('Cash-negative reward warning');
  await expect(page.locator('#lp-warnings')).toContainText('maximum safe cost');
  await expect(page.locator('#lp-months tr').first()).toHaveClass(/cash-negative/);
});

test('Build and Present views preserve the payoff story and break-even map', async ({ page }) => {
  await openPayoff(page);
  await expect(page.locator('.lp-controls')).toBeVisible();
  await page.getByRole('button', { name: 'Present', exact: true }).click();
  await expect(page.locator('.lp-controls')).toBeHidden();
  await expect(page.locator('#lp-story')).toBeVisible();
  await expect(page.locator('#lp-map')).toBeVisible();
  await page.getByRole('button', { name: 'Build', exact: true }).click();
  await expect(page.locator('.lp-controls')).toBeVisible();
});

test('saves and restores deal scenarios and states excluded channels', async ({ page }) => {
  await openPayoff(page);
  await page.locator('#lp-customer').fill('Acme structure');
  await page.getByRole('button', { name: 'Save scenario' }).click();
  await expect(page.locator('#lp-scenarios .lp-scenario')).toHaveCount(1);
  await expect(page.locator('#lp-scenarios')).toContainText('Acme structure');
  await expect(page.locator('#lp-exclusions')).toContainText('head-to-head');
  await expect(page.locator('#lp-exclusions')).toContainText('mini games');
  await expect(page.locator('#lp-exclusions')).toContainText('sponsorship');

  await page.locator('.tabs button', { hasText: 'Core ROI' }).click();
  await page.locator('.tabs button', { hasText: 'Wager Break-even' }).click();
  await expect(page.locator('#lp-view')).toBeVisible();
  await expect(page.locator('#lp-customer')).toHaveValue('Acme structure');
});

test('exports the one-page payoff report through the existing PDF workflow', async ({ page }) => {
  await openPayoff(page);
  await page.locator('#lp-customer').fill('Acme Structure');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export one-page PDF' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('acme-structure-license-payoff.pdf');
});

test('shows shared per-tier waterfalls and combined monthly customer net', async ({ page }) => {
  await openPayoff(page);
  await page.locator('#lp-term').selectOption('1');
  await page.locator('#lp-fees input').first().fill('48000');
  await page.locator('#lp-audience').fill('1000');
  await page.locator('#lp-engagement').fill('100');
  await page.locator('#lp-rebuy').fill('1');
  await page.locator('#lp-growth').fill('0');

  const first = page.locator('#lp-tournaments .lp-repeat').nth(0).locator('input');
  await first.nth(1).fill('10');
  await first.nth(2).fill('100');
  await first.nth(3).fill('4');
  await first.nth(4).fill('50');
  await first.nth(5).fill('50');
  const second = page.locator('#lp-tournaments .lp-repeat').nth(1).locator('input');
  await second.nth(1).fill('20');
  await second.nth(2).fill('50');
  await second.nth(3).fill('1');
  await second.nth(4).fill('100');
  await second.nth(5).fill('100');

  const totals = page.locator('#lp-tournament-totals');
  await expect(totals.locator('.lp-total-hero')).toContainText('$1,700');
  await expect(totals).toContainText('License credit');
  await expect(totals).toContainText('$2,500');
  await expect(totals).toContainText('$500');
  await expect(totals).toContainText('Year 1 · monthly license');
  await expect(totals).toContainText('$4,000');
  await expect(totals).toContainText('Customer share needed for gap');
  await expect(totals).toContainText('$1,500');
  await expect(totals).toContainText('Customer net after license gap');
  await expect(totals).toContainText('$200');

  await first.nth(4).fill('100');
  await first.nth(5).fill('100');
  await expect(totals.locator('.lp-total-hero')).toContainText('$1,500');
  await expect(totals).toContainText('Customer net after license gap');
  await expect(totals).toContainText('$0');

  await page.locator('#lp-tour-pay-c').fill('30');
  await page.locator('#lp-tour-pay-l').fill('10');
  await page.locator('#lp-tour-pay-credit').fill('60');
  await expect(page.locator('#lp-pay-c')).toHaveValue('30');
  await expect(page.locator('#lp-pay-l')).toHaveValue('10');
  await expect(page.locator('#lp-pay-credit')).toHaveValue('60');
  await expect(page.locator('#lp-tier-econ-0')).toContainText('$2,400');
  await expect(page.locator('#lp-tier-econ-1')).toContainText('$600');
});

test('toggles from full-term payoff to annual step-up resets and shows yearly earnings', async ({ page }) => {
  await openPayoff(page);
  await page.locator('#lp-term').selectOption('2');
  await page.locator('#lp-fees input').nth(0).fill('12000');
  await page.locator('#lp-fees input').nth(1).fill('48000');
  await page.locator('#lp-audience').fill('1000');
  await page.locator('#lp-engagement').fill('100');
  await page.locator('#lp-rebuy').fill('1');
  await page.locator('#lp-growth').fill('0');
  await page.locator('#lp-tournaments .lp-repeat').nth(1).getByRole('button', { name: 'Remove' }).click();
  const fields = page.locator('#lp-tournaments .lp-repeat').first().locator('input');
  await fields.nth(1).fill('10');
  await fields.nth(2).fill('100');
  await fields.nth(3).fill('4');
  await fields.nth(4).fill('0');
  await fields.nth(5).fill('0');

  await expect(page.locator('#lp-basis-note')).toContainText('Full-term payoff');
  await expect(page.locator('#lp-months tr').nth(6)).toContainText('Payoff');
  await expect(page.locator('#lp-months tr').nth(12).locator('td').nth(4)).toHaveText('$34,000');

  await page.locator('#lp-post-mode').selectOption('year');
  await expect(page.locator('#lp-basis-note')).toContainText('Annual step-up payoff');
  await expect(page.locator('#lp-balance-heading')).toHaveText('Annual balance remaining');
  await expect(page.locator('#lp-months tr').nth(5).locator('td').nth(4)).toHaveText('$0');
  await expect(page.locator('#lp-months tr').nth(6)).toContainText('Post-payoff · Y1');
  await expect(page.locator('#lp-months tr').nth(12)).toHaveClass(/annual-reset/);
  await expect(page.locator('#lp-months tr').nth(12).locator('td').nth(4)).toHaveText('$46,000');
  await expect(page.locator('#lp-yearly-summary .lp-year-card').nth(0)).toContainText('$31,200 net');
  await expect(page.locator('#lp-yearly-summary .lp-year-card').nth(0)).toContainText('Clears month 6');
  await expect(page.locator('#lp-yearly-summary .lp-year-card').nth(1)).toContainText('$-4,800 net');
  await expect(page.locator('#lp-yearly-summary .lp-year-card').nth(1)).toContainText('$24,000');
  await expect(page.locator('#lp-summary')).toContainText('Year 1 customer earnings');
  await expect(page.locator('#lp-summary')).toContainText('$31,200');
  await expect(page.locator('#lp-summary')).toContainText('Year 2 customer earnings');
  await expect(page.locator('#lp-summary')).toContainText('$-4,800');
});

test('payoff view has no document-level mobile overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPayoff(page);
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
  await expect(page.locator('#lp-map .lp-map')).toBeVisible();
});
