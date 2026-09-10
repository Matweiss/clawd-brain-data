import { test, expect } from '@playwright/test';

test('standard proposal supports a distinct, validated annual schedule', async ({ page }) => {
  const pageErrors = [];
  let generatedPayload;
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route('**/api/generate', async (route) => {
    generatedPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, name: 'Test agreement', docUrl: 'https://docs.google.com/document/d/test/edit', pdf: '', docx: '' }),
    });
  });

  await page.goto('/');
  await page.getByRole('tab', { name: 'Proposal Builder' }).click();
  await page.locator('#gm-A').click();
  await page.locator('#gm-B').click();
  await page.locator('#gm-D').click();
  await page.locator('#gm-term-3').click();

  await expect(page.locator('#gm-year-amount-1')).toHaveValue('300000');
  await expect(page.locator('#gm-year-amount-2')).toHaveValue('300000');
  await expect(page.locator('#gm-year-monthly-2')).toContainText('$25,000/month equivalent');
  await expect(page.locator('#gm-year-monthly-2')).toContainText('follows Year 1');

  await page.locator('#gm-year-amount-1').fill('270000');
  await expect(page.locator('#gm-year-disc-1')).toHaveValue('10');
  await expect(page.locator('#gm-year-amount-2')).toHaveValue('270000');

  await page.locator('#gm-year-flat-2').click();
  await page.locator('#gm-year-disc-2').fill('45000');
  await expect(page.locator('#gm-year-amount-2')).toHaveValue('255000');
  await expect(page.locator('#gm-year-monthly-2')).toContainText('$21,250/month equivalent');

  await page.locator('#gm-year-amount-3').fill('240000');
  await expect(page.locator('#gm-year-disc-3')).toHaveValue('20');
  await expect(page.locator('#gm-year-monthly-3')).toContainText('$20,000/month equivalent');
  await expect(page.locator('#gm-metrics')).toContainText('$765,000');
  await expect(page.locator('#gm-pitch')).toContainText('Year 1 $270,000');
  await expect(page.locator('#gm-pitch')).toContainText('Year 2 $255,000');
  await expect(page.locator('#gm-pitch')).toContainText('Year 3 $240,000');

  await page.locator('#gm-client').fill('Multi-Year QA');
  await page.locator('#gm-go').click();
  await expect(page.locator('#gm-result')).toContainText('agreement generated');

  expect(generatedPayload.annualSchedule).toEqual([
    { year: 1, licenseFee: 300000, amountDue: 270000, monthlyEquivalent: 22500, discountMode: 'pct', discountValue: 10 },
    { year: 2, licenseFee: 300000, amountDue: 255000, monthlyEquivalent: 21250, discountMode: 'flat', discountValue: 45000 },
    { year: 3, licenseFee: 300000, amountDue: 240000, monthlyEquivalent: 20000, discountMode: 'pct', discountValue: 20 },
  ]);
  expect(generatedPayload.tokens['{{LICENSE_FEE}}']).toBe('300,000');
  expect(generatedPayload.tokens['{{AMOUNT_DUE}}']).toBe('270,000');
  expect(generatedPayload.tokens['{{DISCOUNT_PERCENTAGE}}']).toBe('10');
  expect(pageErrors).toEqual([]);
});

test('standard proposal schedule stays usable on a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#mobile-workflow').selectOption('gamification');
  await page.locator('#gm-A').click();
  await page.locator('#gm-term-3').click();

  await expect(page.locator('#gm-year-card-3')).toBeVisible();
  await expect(page.locator('#gm-year-amount-3')).toBeEditable();
  const sizes = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
});
