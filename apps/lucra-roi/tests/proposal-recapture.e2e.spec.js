import { test, expect } from '@playwright/test';

test('imports Revenue Model terms and generates the recapture template', async ({ page }) => {
  let payload;
  await page.route('**/api/generate', async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, name: 'Lucra Agreement', docUrl: 'https://docs.google.com/document/d/generated/edit', pdf: 'AQID', docx: 'AQID' }),
    });
  });

  await page.goto('/');
  await page.evaluate(() => {
    TP.dealName = 'Tidewater Golf, Inc.';
    TP.termYears = 2;
    TP.annualFees = [12000, 48000, 48000, 48000, 48000];
    TP.splitMode = 'custom';
    TP.custom = { credit: 50, operator: 40, lucra: 10 };
    TP.post = { operator: 90, lucra: 10 };
    TPsave();
    TPrenderControls();
    TPrender();
  });

  await page.getByRole('button', { name: 'Import into Proposal Builder' }).click();
  await expect(page.locator('#gamification')).toBeVisible();
  await expect(page.locator('#gm-recapture-panel')).toBeVisible();
  await expect(page.locator('#rp-client')).toHaveValue('Tidewater Golf, Inc.');
  await expect(page.locator('#rp-year-1')).toHaveValue('12000');
  await expect(page.locator('#rp-year-2')).toHaveValue('48000');
  await expect(page.locator('#rp-term-2')).toHaveClass(/on/);
  await expect(page.locator('#rp-year-3')).toBeDisabled();
  await expect(page.locator('#rp-schedule-total')).toContainText('2-year commitment: $60,000');
  await expect(page.locator('#gm-standard-output')).toBeHidden();
  await expect(page.locator('#rp-license-pct')).toHaveValue('50');
  await expect(page.locator('#rp-client-recap')).toHaveValue('40');
  await expect(page.locator('#rp-lucra-recap')).toHaveValue('10');
  await expect(page.locator('#rp-client-post')).toHaveValue('90');

  await page.locator('#rp-go').click();
  await expect(page.locator('#rp-result')).toContainText('Multi-year recapture agreement generated');
  expect(payload.template).toBe('recapture');
  expect(payload.tokens['{{CLIENT_LEGAL_NAME}}']).toBe('Tidewater Golf, Inc.');
  expect(payload.tokens['{{YEAR_1_LICENSE_FEE}}']).toBe('$12,000');
  expect(payload.tokens['{{YEAR_2_LICENSE_FEE}}']).toBe('$48,000');
  expect(payload.tokens['{{YEAR_3_LICENSE_FEE}}']).toBe('N/A');
  expect(payload.tokens['{{TOTAL_LICENSE_COMMITMENT}}']).toBe('$60,000');
  expect(payload.tokens['{{LICENSE_PCT}}']).toBe('50');
  expect(payload.tokens['{{CLIENT_RECAP_PCT}}']).toBe('40');
  expect(payload.tokens['{{LUCRA_RECAP_PCT}}']).toBe('10');
});

test('supports a distinct licence fee for every active contract year', async ({ page }) => {
  let payload;
  await page.route('**/api/generate', async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, name: 'Lucra Agreement', docUrl: 'https://docs.google.com/document/d/generated/edit', pdf: 'AQID', docx: 'AQID' }),
    });
  });

  await page.goto('/');
  await page.evaluate(() => {
    TP.dealName = 'Stepped Pricing Client';
    TP.termYears = 3;
    TP.annualFees = [12000, 48000, 72000, 72000, 72000];
    TPsave();
    TPrenderControls();
    TPrender();
  });

  await page.getByRole('button', { name: 'Import into Proposal Builder' }).click();
  await expect(page.locator('#rp-term-3')).toHaveClass(/on/);
  await expect(page.locator('#rp-year-1')).toHaveValue('12000');
  await expect(page.locator('#rp-year-2')).toHaveValue('48000');
  await expect(page.locator('#rp-year-3')).toHaveValue('72000');
  await expect(page.locator('#rp-schedule-total')).toContainText('3-year commitment: $132,000');

  await page.locator('#rp-go').click();
  await expect(page.locator('#rp-result')).toContainText('Multi-year recapture agreement generated');
  expect(payload.tokens['{{LICENSE_TERM}}']).toBe('3');
  expect(payload.tokens['{{YEAR_1_LICENSE_FEE}}']).toBe('$12,000');
  expect(payload.tokens['{{YEAR_2_LICENSE_FEE}}']).toBe('$48,000');
  expect(payload.tokens['{{YEAR_3_LICENSE_FEE}}']).toBe('$72,000');
  expect(payload.tokens['{{TOTAL_LICENSE_COMMITMENT}}']).toBe('$132,000');
});

test('recapture proposal blocks invalid split totals', async ({ page }) => {
  let called = false;
  await page.route('**/api/generate', async (route) => { called = true; await route.abort(); });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Proposal Builder' }).click();
  await page.locator('#gm-doc-recapture').click();
  await page.locator('#rp-client').fill('Acme, Inc.');
  await page.locator('#rp-year-1').fill('36000');
  await page.locator('#rp-license-pct').fill('60');
  await page.locator('#rp-client-recap').fill('40');
  await page.locator('#rp-lucra-recap').fill('10');
  await page.locator('#gm-A').click();
  await page.locator('#rp-go').click();
  await expect(page.locator('#rp-validation')).toContainText('currently totals 110%');
  expect(called).toBe(false);
});

test('stepped annual pricing remains usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#mobile-workflow').selectOption('gamification');
  await page.locator('#gm-doc-recapture').click();
  await expect(page.getByRole('group', { name: 'Recapture contract term' })).toBeVisible();
  await page.locator('#rp-term-3').click();
  await expect(page.locator('#rp-year-3')).toBeEnabled();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
