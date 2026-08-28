import { test, expect } from '@playwright/test';

// Browser coverage for the Tournament Payoff tab: the free-licence toggle,
// all three split modes, a deal that retires mid-month, a deal that never
// retires, both print exports, and the customer export redaction guarantee.

async function openTab(page) {
  await page.goto('/');
  await page.addInitScript(() => {});
  await page.locator('.tabs button', { hasText: 'Tournament Payoff' }).click();
  await expect(page.locator('#tournaments')).toBeVisible();
}

// Deterministic deal: 100 participants, $10 entry, 4 events, $200 cash cost
// per event -> handle 4000, prize 800, net 3200 per month.
async function setBaseDeal(page, { fee = 4000, termYears = 1, fees = null, payoffBasis = 'term', shortfall = 'roll' } = {}) {
  await page.evaluate(({ f, termYears, fees, payoffBasis, shortfall }) => {
    TP = TPstate(Object.assign({}, TP_DEFAULTS, {
      dealName: 'Fairway Social',
      termYears: termYears,
      annualFees: fees || [f, f, f, f, f],
      payoffBasis: payoffBasis,
      shortfall: shortfall,
      freeLicense: false,
      splitMode: 'standard',
      volumeMode: 'flat',
      participants: 100,
      tournaments: [{ id: 't', name: 'Weekly open', entryPrice: 10, eventsPerMonth: 4, rebuys: 0, isCash: false, rewardFaceValue: 500, customerCashCost: 200 }],
    }));
    TPsave(); TPrenderControls(); TPrenderTournaments(); TPrender();
  }, { f: fee, termYears, fees, payoffBasis, shortfall });
}

async function stubPrint(page) {
  await page.evaluate(() => {
    window.__printCalls = 0;
    window.print = () => { window.__printCalls++; window.__printHTML = document.getElementById('tp-print-root').innerHTML; };
  });
}

test('the tab renders its controls without console errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openTab(page);
  await expect(page.locator('#tp-fee-0')).toBeVisible();
  await expect(page.locator('#tp-participants')).toBeVisible();
  await expect(page.locator('.tp-split-switch button[data-split="standard"]')).toBeVisible();
  await expect(page.locator('#tp-tournaments-list .tp-tour')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('free licence toggle removes the licence tracking and simplifies the split', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page);
  await expect(page.locator('#tp-split-block')).toBeVisible();

  await page.locator('#tp-free').check();

  await expect(page.locator('#tp-licence-block')).toBeHidden();
  await expect(page.locator('#tp-split-block')).toBeHidden();
  await expect(page.locator('#tp-free-note')).toBeVisible();

  const r = await page.evaluate(() => TPcalculate(TP));
  expect(r.licenseFee).toBe(0);
  expect(r.free).toBe(true);
  expect(r.months[0].toLicense).toBe(0);
  expect(r.months[0].toOperator + r.months[0].toLucra).toBeCloseTo(r.months[0].netRevenue, 6);

  // The licence columns render as em dashes rather than zeros.
  await expect(page.locator('#tp-progress')).toContainText('No licence balance to track');
});

test('all three split modes drive the model', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 1000000 });

  const standard = await page.evaluate(() => TPcalculate(TP).months[0]);
  expect(standard.toLicense).toBeCloseTo(1600, 6);
  expect(standard.toOperator).toBeCloseTo(1280, 6);

  await page.locator('.tp-split-switch button[data-split="sweep"]').click();
  await expect(page.locator('.tp-split-switch button[data-split="sweep"]')).toHaveAttribute('aria-pressed', 'true');
  const sweep = await page.evaluate(() => TPcalculate(TP).months[0]);
  expect(sweep.toLicense).toBeCloseTo(2880, 6);
  expect(sweep.toOperator).toBe(0);

  await page.locator('.tp-split-switch button[data-split="custom"]').click();
  await expect(page.locator('#tp-custom-split')).toBeVisible();
  await page.locator('#tp-split-credit').fill('60');
  await page.locator('#tp-split-operator').fill('25');
  await page.locator('#tp-split-lucra').fill('15');
  const custom = await page.evaluate(() => TPcalculate(TP).months[0]);
  expect(custom.toLicense).toBeCloseTo(1920, 6);
  expect(custom.toOperator).toBeCloseTo(800, 6);

  // A split that does not sum to 100 surfaces an error instead of silently normalising.
  await page.locator('#tp-split-lucra').fill('30');
  await expect(page.locator('#tp-validation')).toBeVisible();
  await expect(page.locator('#tp-validation')).toContainText('sum to 100');
});

test('a fee that retires mid-month redirects the remainder to the operator', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 4000 });

  const r = await page.evaluate(() => TPcalculate(TP));
  expect(r.payoffMonth).toBeCloseTo(2.5, 6);
  expect(r.months[2].split).toBe('Crossover');
  expect(r.months[2].toLicense).toBeCloseTo(800, 6);
  expect(r.months[2].toOperator).toBeCloseTo(1600 * 0.4 + 1600 * 0.9, 6);
  expect(r.months[3].toOperator).toBeCloseTo(3200 * 0.9, 6);

  await expect(page.locator('#tp-summary')).toContainText('Month 2.5');
  await expect(page.locator('table.tp-months tr.crossover')).toHaveCount(1);
});

test('a deal that never retires shows the balance due instead of a payoff month', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 500000 });

  const r = await page.evaluate(() => TPcalculate(TP));
  expect(r.payoffMonth).toBeNull();
  expect(r.balanceDue).toBeCloseTo(500000 - 1600 * 12, 6);

  await expect(page.locator('#tp-summary')).toContainText('Not retired within 12 months');
  // Label generalised from 'year end' to 'term end' when multi-year support landed.
  await expect(page.locator('#tp-summary')).toContainText('Balance due at term end');
  await expect(page.locator('table.tp-months tr.crossover')).toHaveCount(0);
});

test('the month table reports all nine columns', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page);
  await expect(page.locator('table.tp-months thead th')).toHaveCount(9);
  await expect(page.locator('table.tp-months tbody tr')).toHaveCount(12);
  await expect(page.locator('table.tp-months tbody tr').first()).toContainText('$4,000');
  await expect(page.locator('table.tp-months tbody tr').first()).toContainText('$800');
});

test('cash tournaments collapse to a single prize field', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page);

  await expect(page.locator('#tp-face-0')).toBeVisible();
  await expect(page.locator('#tp-cost-0')).toBeVisible();
  await expect(page.locator('#tp-cashprize-0')).toHaveCount(0);

  await page.locator('#tp-cash-0').check();
  await expect(page.locator('#tp-cashprize-0')).toBeVisible();
  await expect(page.locator('#tp-face-0')).toHaveCount(0);
  await expect(page.locator('#tp-cost-0')).toHaveCount(0);

  await page.locator('#tp-cashprize-0').fill('400');
  const r = await page.evaluate(() => TPcalculate(TP).months[0]);
  expect(r.prizeCost).toBe(1600);
});

test('templates save, load and delete and survive a reload', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page);
  await page.locator('#tp-view-tournaments-btn').click();
  await expect(page.locator('#tp-tournaments-view')).toBeVisible();

  await page.locator('#tp-template-name').fill('Standard golf venue');
  await page.locator('.tp-template-save button').click();
  await expect(page.locator('#tp-template-list .tp-template')).toHaveCount(1);
  await expect(page.locator('#tp-template-status')).toContainText('Saved "Standard golf venue"');

  // Change the calculator, then load the template back.
  await page.evaluate(() => { TP.tournaments = []; TPsave(); TPrenderTournaments(); TPrender(); });
  await page.locator('#tp-template-list button', { hasText: 'Load' }).click();
  expect(await page.evaluate(() => TP.tournaments.length)).toBe(1);

  await page.reload();
  await page.locator('.tabs button', { hasText: 'Tournament Payoff' }).click();
  await page.locator('#tp-view-tournaments-btn').click();
  await expect(page.locator('#tp-template-list .tp-template')).toHaveCount(1);

  await page.locator('#tp-template-list button', { hasText: 'Delete' }).click();
  await expect(page.locator('#tp-template-list .tp-template')).toHaveCount(0);
});

test('the customer summary shows structure and never internal economics', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 987654 });
  await page.evaluate(() => {
    TP.splitMode = 'sweep';
    TP.tournaments = [
      { id: 'a', name: 'Weekly open', entryPrice: 10, eventsPerMonth: 4, rebuys: 3, isCash: false, rewardFaceValue: 500, customerCashCost: 217 },
      { id: 'b', name: 'Championship', entryPrice: 25, eventsPerMonth: 1, rebuys: 0, isCash: true, cashPrizeAmount: 1000 },
    ];
    TPsave(); TPrenderTournaments(); TPrender();
  });
  await page.locator('#tp-view-tournaments-btn').click();

  await expect(page.locator('#tp-customer-deal')).toHaveText('Fairway Social');
  await expect(page.locator('.tp-cust-card')).toHaveCount(2);
  await expect(page.locator('.tp-cust-card').first()).toContainText('$500 value reward');
  await expect(page.locator('.tp-cust-card').first()).toContainText('Up to 3 rebuys');
  await expect(page.locator('.tp-cust-card').first()).toContainText('4x per month');
  await expect(page.locator('.tp-cust-card').nth(1)).toContainText('$1,000 cash prize');
  await expect(page.locator('.tp-cust-card').nth(1)).toContainText('Single entry');

  const html = await page.locator('#tp-customer-cards').innerHTML();
  for (const forbidden of ['987654', '217', 'sweep', 'Licence', 'licence', 'Lucra %', 'cash cost']) {
    expect(html).not.toContain(forbidden);
  }
});

test('both exports produce print output and only the internal one carries economics', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 4000 });
  await stubPrint(page);

  // Internal export
  await page.locator('#tp-calc-view button', { hasText: 'Export Results (Internal)' }).click();
  const internal = await page.evaluate(() => window.__printHTML);
  expect(await page.evaluate(() => window.__printCalls)).toBe(1);
  expect(internal).toContain('Internal only');
  expect(internal).toContain('Fairway Social');
  expect(internal).toContain('Month 2.5');
  expect(internal).toContain('Cumulative licence');
  expect(internal).toContain('Not for customer distribution');

  // Customer export
  await page.locator('#tp-view-tournaments-btn').click();
  await page.locator('#tp-tournaments-view button', { hasText: 'Export Summary (Customer-Safe)' }).click();
  const customer = await page.evaluate(() => window.__printHTML);
  expect(await page.evaluate(() => window.__printCalls)).toBe(2);
  expect(customer).toContain('Customer summary');
  expect(customer).toContain('Weekly open');

  for (const forbidden of ['Internal only', 'Cumulative licence', 'To licence', 'Licence retired', '4,000', 'Prize cost', 'Net revenue']) {
    expect(customer).not.toContain(forbidden);
  }

  // The print body class is cleaned up so the app is not left in print mode.
  await page.waitForTimeout(1700);
  expect(await page.evaluate(() => document.body.classList.contains('tp-printing'))).toBe(false);
});

test('state persists across a reload', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 12345 });
  await page.reload();
  await page.locator('.tabs button', { hasText: 'Tournament Payoff' }).click();
  await expect(page.locator('#tp-fee-0')).toHaveValue('12345');
  await expect(page.locator('#tp-deal-name')).toHaveValue('Fairway Social');
});

test('ramp mode replaces the flat input and drives month one', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page);
  await expect(page.locator('#tp-flat-fields')).toBeVisible();
  await expect(page.locator('#tp-ramp-fields')).toBeHidden();

  await page.locator('.tp-volume-switch button[data-volume="ramp"]').click();
  await expect(page.locator('#tp-ramp-fields')).toBeVisible();
  await expect(page.locator('#tp-flat-fields')).toBeHidden();

  await page.locator('#tp-ramp-start').fill('50');
  await page.locator('#tp-ramp-plateau').fill('200');
  await page.locator('#tp-ramp-months').fill('6');
  const r = await page.evaluate(() => TPcalculate(TP));
  expect(r.months[0].participants).toBe(50);
  expect(r.months[5].participants).toBe(200);
  expect(r.months[11].participants).toBe(200);
});

test('the tab is usable at 390px with no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openTab(page);
  await setBaseDeal(page);
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
  await expect(page.locator('#tp-summary .tp-card').first()).toBeVisible();
  await page.locator('#tp-view-tournaments-btn').click();
  await expect(page.locator('.tp-cust-card').first()).toBeVisible();
});

test('the view switch is keyboard reachable and marks selection', async ({ page }) => {
  await openTab(page);
  const tournamentsBtn = page.locator('#tp-view-tournaments-btn');
  await tournamentsBtn.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#tp-tournaments-view')).toBeVisible();
  await expect(tournamentsBtn).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#tp-view-calc-btn')).toHaveAttribute('aria-selected', 'false');
});

test('multi-year term exposes a custom fee input per year', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page);
  await expect(page.locator('#tp-fees .input-group')).toHaveCount(1);
  await expect(page.locator('#tp-basis-row')).toBeHidden();

  await page.locator('#tp-term').selectOption('3');
  await expect(page.locator('#tp-fees .input-group')).toHaveCount(3);
  await expect(page.locator('#tp-basis-row')).toBeVisible();

  await page.locator('#tp-fee-0').fill('12000');
  await page.locator('#tp-fee-1').fill('48000');
  await page.locator('#tp-fee-2').fill('60000');
  await expect(page.locator('#tp-fee-total')).toContainText('$120,000');

  const r = await page.evaluate(() => TPcalculate(TP));
  expect(r.months).toHaveLength(36);
  expect(r.years.map((y) => y.fee)).toEqual([12000, 48000, 60000]);
  expect(r.totalContract).toBe(120000);
});

test('payoff basis switches between one balance and a balance per year', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { termYears: 3, fees: [12000, 12000, 12000], payoffBasis: 'term' });

  const term = await page.evaluate(() => TPcalculate(TP));
  expect(term.payoffMonth).toBeCloseTo(22.5, 4);
  expect(term.months[35].split).toBe('Post-payoff');

  await page.locator('.tp-basis-switch button[data-basis="annual"]').click();
  await expect(page.locator('.tp-basis-switch button[data-basis="annual"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#tp-shortfall-row')).toBeVisible();

  const annual = await page.evaluate(() => TPcalculate(TP));
  expect(annual.years[0].clearMonth).toBeGreaterThan(7);
  expect(annual.years[1].opening).toBe(12000);
  expect(annual.months[12].split).toBe('Payoff');
});

test('year-end shortfall rolls forward or is charged as cash', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { termYears: 3, fees: [30000, 10000, 10000], payoffBasis: 'annual', shortfall: 'roll' });

  const rolled = await page.evaluate(() => TPcalculate(TP));
  expect(rolled.trueUpTotal).toBe(0);
  expect(rolled.years[1].opening).toBeCloseTo(20800, 4);

  await page.locator('.tp-shortfall-switch button[data-shortfall="cash"]').click();
  const cash = await page.evaluate(() => TPcalculate(TP));
  expect(cash.years[0].trueUp).toBeCloseTo(10800, 4);
  expect(cash.years[1].opening).toBe(10000);
  await expect(page.locator('#tp-summary')).toContainText('Cash true-ups');
});

test('a multi-year term adds a per-year table and a year column', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { termYears: 2, fees: [12000, 12000] });
  await expect(page.locator('#tp-years')).toBeVisible();
  await expect(page.locator('#tp-years tbody tr')).toHaveCount(2);
  await expect(page.locator('table.tp-months').first().locator('thead th').first()).toHaveText('Year');
  await expect(page.locator('#tp-table tbody tr')).toHaveCount(24);

  await page.locator('#tp-term').selectOption('1');
  await expect(page.locator('#tp-years')).toBeHidden();
  await expect(page.locator('#tp-table tbody tr')).toHaveCount(12);
});

test('the customer export stays clean on a multi-year deal', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { termYears: 3, fees: [12000, 48000, 60000], payoffBasis: 'annual', shortfall: 'cash' });
  await stubPrint(page);
  await page.locator('#tp-view-tournaments-btn').click();
  await page.locator('#tp-tournaments-view button', { hasText: 'Export Summary (Customer-Safe)' }).click();
  const customer = await page.evaluate(() => window.__printHTML);
  for (const forbidden of ['12,000', '48,000', '60,000', 'true-up', 'True-up', 'Opening balance', 'Year 2', 'Internal only']) {
    expect(customer).not.toContain(forbidden);
  }
});
