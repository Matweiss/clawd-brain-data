import { test, expect } from '@playwright/test';

async function openPayoff(page) {
  await page.goto('/');
  await page.locator('.tabs button', { hasText: 'Wager Break-even' }).click();
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
  await expect(page.getByText('Gross available to split = entries × entry price. No rake is applied.')).toBeVisible();
  await page.getByText('Head-to-head / peer-to-peer').click();
  await expect(page.getByText('Gross available to split = handle × rake.')).toBeVisible();
  expect(errors).toEqual([]);
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

  await expect(page.locator('#lp-warnings')).toContainText('Cash-negative prize warning');
  await expect(page.locator('#lp-months tr').first()).toHaveClass(/cash-negative/);
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
  expect(download.suggestedFilename()).toBe('acme-structure-licence-payoff.pdf');
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
