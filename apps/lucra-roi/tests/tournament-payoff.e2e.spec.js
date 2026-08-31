import { test, expect } from '@playwright/test';

// Browser coverage for the Revenue Model tab: product selection, the recapture
// toggle, per-tournament participation, the head-to-head funnel and its modes,
// the launch ramp, both pitches, and the one-pager.

async function openTab(page) {
  await page.goto('/');
  await page.locator('.tabs button', { hasText: 'Revenue Model' }).click();
  await expect(page.locator('#tournaments')).toBeVisible();
}

// Deterministic deal: 100 participants, $10 entry, 4 events, $200 cost per
// event -> 4,000 of entries a month, the pool that is split. The 800 of prize
// funding is the operator's own cost, taken out of their share afterwards.
async function setBaseDeal(page, o = {}) {
  await page.evaluate((opts) => {
    TP = TPstate(Object.assign({}, TP_DEFAULTS, {
      dealName: 'Fairway Social',
      termYears: opts.termYears || 1,
      annualFees: opts.fees || [opts.fee || 4000, opts.fee || 4000, opts.fee || 4000, opts.fee || 4000, opts.fee || 4000],
      payoffBasis: opts.payoffBasis || 'term',
      shortfall: opts.shortfall || 'roll',
      includeTournaments: opts.includeTournaments !== false,
      includeH2H: !!opts.includeH2H,
      mau: opts.mau || 1000000,
      tournaments: [{ id: 't', name: 'Weekly open', entryPrice: 10, eventsPerMonth: 4, basis: 'count', participants: 100, rebuyMode: 'avg', rebuys: 0, isCash: false, rewardFaceValue: 500, customerCashCost: 200 }],
    }));
    TPsave(); TPrenderControls(); TPrenderTournaments(); TPrender();
  }, o);
}

async function stubPrint(page) {
  await page.evaluate(() => {
    window.__printCalls = 0;
    window.print = () => { window.__printCalls++; window.__printHTML = document.getElementById('tp-print-root').innerHTML; };
  });
}

const BLOCKED = /cash|wager|betting|\bbet\b|gambl|casino|prize money|stakes|buy-in|payout|\brake\b|\bhandle\b/i;

test('the tab renders without console errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openTab(page);
  await expect(page.locator('#tp-mau')).toBeVisible();
  await expect(page.locator('#tp-inc-tournaments')).toBeVisible();
  await expect(page.locator('#tp-fee-0')).toBeVisible();
  await expect(page.locator('#tp-tournaments-list .tp-tour')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('setup sections sit in one top box', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page);
  const box = page.locator('#tp-calc-view .pf-section').first();
  await expect(box).toContainText('What the customer is taking');
  await expect(box.locator('#tp-deal-block')).toBeVisible();
  await expect(box.locator('#tp-split-block')).toBeVisible();
  // The participants box is gone; participation lives on each tournament.
  await expect(page.locator('#tp-participants-block')).toHaveCount(0);
  await expect(page.locator('#tp-part-0')).toBeVisible();
});

test('product checkboxes show and hide each half', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page);
  await expect(page.locator('#tp-inc-tournaments')).toBeChecked();
  await expect(page.locator('#tp-h2h-block')).toBeHidden();

  await page.locator('#tp-inc-h2h').check();
  await expect(page.locator('#tp-h2h-block')).toBeVisible();
  await expect(page.locator('#tpc-title')).toContainText('head-to-head + tournaments');

  await page.locator('#tp-inc-tournaments').uncheck();
  await expect(page.locator('#tp-deal-block')).toBeHidden();
  await expect(page.locator('#tp-tournaments-block')).toBeHidden();
  await expect(page.locator('#tp-results-section')).toBeHidden();
  await expect(page.locator('#tp-h2h-block')).toBeVisible();

  await page.locator('#tp-inc-h2h').uncheck();
  await expect(page.locator('#tp-product-note')).toContainText('at least one product');
});

test('the recapture toggle reveals the licence share and the after-retirement fields', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page);

  await expect(page.locator('#tp-recapture')).toBeChecked();
  await expect(page.locator('#tp-recapture-fields')).toBeVisible();
  await expect(page.locator('#tp-split-credit')).toBeVisible();
  await expect(page.locator('#tp-post-operator')).toBeVisible();

  await page.locator('#tp-recapture').uncheck();
  await expect(page.locator('#tp-recapture-fields')).toBeHidden();
  await expect(page.locator('#tp-recapture-note')).toContainText('does not pay the licence down');
  // The fee still exists, it is just not retired by play.
  const off = await page.evaluate(() => TPcalculate(TP));
  expect(off.recapturing).toBe(false);
  expect(off.totalContract).toBe(4000);
  expect(off.cumulativeLicense).toBe(0);
  expect(off.balanceDue).toBe(4000);

  await page.locator('#tp-recapture').check();
  await expect(page.locator('#tp-recapture-fields')).toBeVisible();
});

test('recapture and sweep set the split, and editing a percentage makes it custom', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 1000000 });

  await expect(page.locator('#tp-split-credit')).toHaveValue('50');
  let m = await page.evaluate(() => TPcalculate(TP).months[0]);
  expect(m.toLicense).toBeCloseTo(2000, 6);

  await page.locator('.tp-split-switch button[data-split="sweep"]').click();
  await expect(page.locator('#tp-split-credit')).toHaveValue('90');
  m = await page.evaluate(() => TPcalculate(TP).months[0]);
  // Sweep leaves the operator no share, so their prize funding shows as a loss.
  expect(m.operatorGross).toBe(0);
  expect(m.toOperator).toBe(-800);

  await page.locator('#tp-split-credit').fill('60');
  await page.locator('#tp-split-operator').fill('25');
  await page.locator('#tp-split-lucra').fill('15');
  expect(await page.evaluate(() => TP.splitMode)).toBe('custom');
  m = await page.evaluate(() => TPcalculate(TP).months[0]);
  expect(m.toLicense).toBeCloseTo(2400, 6);

  await page.locator('#tp-split-lucra').fill('30');
  await expect(page.locator('#tp-validation')).toContainText('sum to 100');
});

test('a free licence on this tab waives the Lucra cost whatever other tabs hold', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 120000, includeH2H: true });
  // Give the Mini Game tab its own licence and share, which must not leak in.
  await page.evaluate(() => { MG.license = 9999; MG.rs = 45; MGsync(); MGu(); TPrender(); });

  let h = await page.evaluate(() => TPh2h(TPstate(TP), TPCconfig(), 1));
  expect(h.licenseMonthly).toBe(10000);
  expect(h.lucraShare).toBeCloseTo(h.platformFee * 0.1, 6);

  await page.locator('#tp-free').check();
  await expect(page.locator('#tp-recapture-note')).toContainText('waived');
  h = await page.evaluate(() => TPh2h(TPstate(TP), TPCconfig(), 1));
  expect(h.licenseMonthly).toBe(0);
  expect(h.licenseWaived).toBe(true);
  const r = await page.evaluate(() => TPcalculate(TP));
  expect(r.free).toBe(true);
  expect(r.totalContract).toBe(0);
});

test('participation is set per tournament type, as a count or a share of users', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page);

  await expect(page.locator('#tp-part-0')).toHaveValue('100');
  await page.locator('#tp-part-0').fill('400');
  expect(await page.evaluate(() => TPcalculate(TP).months[0].detail[0].participants)).toBe(400);

  await page.locator('.tp-tour[data-tour="0"] .tp-participation-switch button[data-participation="mau"]').click();
  await page.locator('#tp-part-0').fill('0.05');
  expect(await page.evaluate(() => TPcalculate(TP).months[0].detail[0].participants)).toBeCloseTo(500, 6);
  await expect(page.locator('.tp-tour[data-tour="0"] .tp-tour-readout')).toContainText('500 participants');
});

test('rebuys can be an average or a percentage of participants', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page);
  await expect(page.locator('#tp-rebuys-0')).toBeVisible();

  await page.locator('.tp-tour[data-tour="0"] .tp-rebuy-switch button[data-rebuy="pct"]').click();
  await expect(page.locator('#tp-rebuypct-0')).toBeVisible();
  await page.locator('#tp-rebuypct-0').fill('40');
  expect(await page.evaluate(() => TPcalculate(TP).months[0].detail[0].entriesPerEvent)).toBe(140);
});

test('a cash tournament collapses to a single prize field', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page);
  await expect(page.locator('#tp-face-0')).toBeVisible();
  await page.locator('#tp-cash-0').check();
  await expect(page.locator('#tp-cashprize-0')).toBeVisible();
  await expect(page.locator('#tp-face-0')).toHaveCount(0);
  await page.locator('#tp-cashprize-0').fill('400');
  expect(await page.evaluate(() => TPcalculate(TP).months[0].prizeCost)).toBe(1600);
});

test('a fee that retires mid-month redirects the remainder to the operator', async ({ page }) => {
  await openTab(page);
  // 5,000 against 4,000 of entries a month clears part-way through month three.
  await setBaseDeal(page, { fee: 5000 });
  const r = await page.evaluate(() => TPcalculate(TP));
  expect(r.payoffMonth).toBeCloseTo(2.5, 6);
  expect(r.months[2].split).toBe('Crossover');
  await expect(page.locator('#tp-summary')).toContainText('Month 2.5');
  await expect(page.locator('table.tp-months tr.crossover')).toHaveCount(1);
});

test('a deal that never retires shows the balance due', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 500000 });
  await expect(page.locator('#tp-summary')).toContainText('Not retired within');
  await expect(page.locator('#tp-summary')).toContainText('Balance due at term end');
});

test('a multi-year term adds a per-year table and a year column', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { termYears: 2, fees: [12000, 12000] });
  await page.locator('#tp-term').selectOption('2');
  await expect(page.locator('#tp-fees .input-group')).toHaveCount(2);
  await expect(page.locator('#tp-years')).toBeVisible();
  await expect(page.locator('#tp-table tbody tr')).toHaveCount(24);
  await expect(page.locator('#tp-basis-row')).toBeVisible();
});

test('the break-even map renders a grid and hides on a free licence', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 40000 });
  await expect(page.locator('#tp-heat table.tp-heat')).toBeVisible();
  // Volume columns lead each row now, so count only the shaded cells.
  await expect(page.locator('#tp-heat tbody td:not(.vol)')).toHaveCount(25);
  await page.locator('#tp-free').check();
  await expect(page.locator('#tp-heat')).toContainText('hidden while the licence is free');
});

test('head-to-head carries its own reach and the eight shared inputs', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { includeH2H: true, mau: 1000000 });

  await expect(page.locator('#tp-h2h-reach')).toHaveValue('1000000');
  await expect(page.locator('#tp-reach-note')).toContainText('following addressable users');

  await page.locator('#tp-h2h-reach').fill('200000');
  await expect(page.locator('#tp-reach-note')).toContainText('overriding');
  expect(await page.evaluate(() => TPreach(TPstate(TP)))).toBe(200000);

  for (const k of ['eng', 'plays', 'wager', 'rake', 'rewardGames', 'win', 'redeem', 'rewardValue']) {
    await expect(page.locator('#tph-' + k)).toBeVisible();
    await expect(page.locator('#tphs-' + k)).toBeVisible();
  }
  await expect(page.locator('#tph-rs')).toHaveCount(0);
  await expect(page.locator('#tph-license')).toHaveCount(0);
});

test('the head-to-head mode switch shows only the fields that run', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { includeH2H: true });

  await page.locator('.tp-mode-switch button[data-h2h="wagering"]').click();
  await expect(page.locator('#tph-plays')).toBeVisible();
  await expect(page.locator('#tph-rewardGames')).toHaveCount(0);
  await expect(page.locator('#tph-win')).toHaveCount(0);
  expect(await page.evaluate(() => TPh2h(TPstate(TP), TPCconfig(), 1).rewardValue)).toBe(0);

  await page.locator('.tp-mode-switch button[data-h2h="rewards"]').click();
  await expect(page.locator('#tph-rewardGames')).toBeVisible();
  await expect(page.locator('#tph-plays')).toHaveCount(0);
  expect(await page.evaluate(() => TPh2h(TPstate(TP), TPCconfig(), 1).platformFee)).toBe(0);

  await page.locator('.tp-mode-switch button[data-h2h="both"]').click();
  await expect(page.locator('#tph-plays')).toBeVisible();
  await expect(page.locator('#tph-rewardGames')).toBeVisible();
});

test('head-to-head inputs stay in step with the Mini Game tab', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { includeH2H: true });
  await page.locator('#tph-eng').fill('12');
  await page.locator('#tphs-rewardGames').fill('10');
  expect(await page.evaluate(() => [MG.eng, MG.rewardGames])).toEqual([12, 10]);

  await page.locator('.tabs button', { hasText: 'Mini Game ROI' }).click();
  await expect(page.locator('#mgi-eng')).toHaveValue('12');
  await page.locator('#mgi-eng').fill('20');
  await page.locator('#mgi-eng').dispatchEvent('input');
  await page.locator('.tabs button', { hasText: 'Revenue Model' }).click();
  await expect(page.locator('#tph-eng')).toHaveValue('20');
});

test('both pitches render and carry no blocked vocabulary', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 4000, includeH2H: true });

  const h2h = await page.locator('#tp-h2h-pitch').textContent();
  const tour = await page.locator('#tp-tour-pitch').textContent();
  expect(h2h).toContain('active players');
  expect(h2h).toContain('platform fee');
  expect(tour).toContain('tournament format');
  expect(tour).toMatch(/retired by month/);
  for (const text of [h2h, tour]) expect(text).not.toMatch(BLOCKED);

  // Each pitch disappears with its product.
  await page.locator('#tp-inc-h2h').uncheck();
  await expect(page.locator('#tp-h2h-pitch')).toHaveText('');
});

test('the launch ramp lowers early months for both products', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 40000, includeH2H: true });
  await expect(page.locator('#tp-ramp-fields')).toBeHidden();

  const flat = await page.evaluate(() => TPCcase(TPCconfig(), 1).revenueGenerated);
  await page.locator('#tp-ramp-on').check();
  await expect(page.locator('#tp-ramp-fields')).toBeVisible();
  await page.locator('#tp-ramp-start-pct').fill('25');
  await page.locator('#tp-ramp-months').fill('6');

  const ramped = await page.evaluate(() => TPCcase(TPCconfig(), 1).revenueGenerated);
  expect(ramped).toBeLessThan(flat);
  const r = await page.evaluate(() => TPcalculate(TP));
  expect(r.months[0].handle).toBeLessThan(r.months[11].handle);
});

test('the combined cases add both products and keep the 50 / entered / 1.5x band', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 60000, includeH2H: true, mau: 1000000 });
  await page.evaluate(() => { MG.eng = 10; MG.plays = 20; MG.wager = 2; MG.rake = 10; MGsync(); MGu(); TPrender(); });

  await expect(page.locator('#tpc-cases .tpc-case')).toHaveCount(3);
  const cases = await page.evaluate(() => TPCcases(TPCconfig()).map((c) => c.result.annualRevenueGenerated));
  expect(cases[0]).toBeLessThan(cases[1]);
  expect(cases[2]).toBeGreaterThan(cases[1]);
  await expect(page.locator('.tpc-case.best')).toContainText('Best case');
  await expect(page.locator('#tpc-detail')).toContainText('Reward value / mo');
  await expect(page.locator('#tpc-detail')).toContainText('excluded from revenue');
});

test('the one-pager breaks out each product and the combination', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 60000, includeH2H: true, mau: 1000000 });
  await stubPrint(page);
  await page.locator('#tpc-section button', { hasText: 'Generate combined one-pager' }).click();

  const html = await page.evaluate(() => window.__printHTML);
  expect(await page.evaluate(() => window.__printCalls)).toBe(1);
  expect(html).toContain('Fairway Social');
  expect(html).toContain('Head-to-head / yr');
  expect(html).toContain('Tournament entries / yr');
  expect(html).toContain('Your prize funding / yr');
  expect(html).toContain('Combined / yr');
  // Input detail for both products.
  expect(html).toContain('Plays per player per month');
  expect(html).toContain('Paid-game volume / mo');
  expect(html).toContain('Participants / event, month 1');
  expect(html).toContain('Conservative');
  // Structure and vocabulary.
  expect(html).not.toMatch(BLOCKED);
  expect(html).not.toContain('To licence');
  expect(html).not.toContain('Lucra earnings');
});

test('the one-pager drops the product that is not selected', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 60000 });
  await stubPrint(page);

  await page.locator('#tpc-section button', { hasText: 'Generate combined one-pager' }).click();
  let html = await page.evaluate(() => window.__printHTML);
  expect(html).toContain('Tournament entries / yr');
  expect(html).not.toContain('Head-to-head / yr');

  await page.locator('#tp-inc-h2h').check();
  await page.locator('#tp-inc-tournaments').uncheck();
  await page.locator('#tpc-section button', { hasText: 'Generate combined one-pager' }).click();
  html = await page.evaluate(() => window.__printHTML);
  expect(html).toContain('Head-to-head / yr');
  expect(html).not.toContain('Tournaments / yr');
  expect(html).not.toMatch(BLOCKED);
});

test('templates save, load and delete and survive a reload', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page);
  await page.locator('#tp-view-tournaments-btn').click();
  await page.locator('#tp-template-name').fill('Standard golf venue');
  await page.locator('.tp-template-save button').click();
  await expect(page.locator('#tp-template-list .tp-template')).toHaveCount(1);

  await page.evaluate(() => { TP.tournaments = []; TPsave(); TPrenderTournaments(); TPrender(); });
  await page.locator('#tp-template-list button', { hasText: 'Load' }).click();
  expect(await page.evaluate(() => TP.tournaments.length)).toBe(1);

  await page.reload();
  await page.locator('.tabs button', { hasText: 'Revenue Model' }).click();
  await page.locator('#tp-view-tournaments-btn').click();
  await expect(page.locator('#tp-template-list .tp-template')).toHaveCount(1);
  await page.locator('#tp-template-list button', { hasText: 'Delete' }).click();
  await expect(page.locator('#tp-template-list .tp-template')).toHaveCount(0);
});

test('the customer summary shows structure and no internal economics', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 987654 });
  await page.locator('#tp-view-tournaments-btn').click();
  await expect(page.locator('#tp-customer-deal')).toHaveText('Fairway Social');
  await expect(page.locator('.tp-cust-card').first()).toContainText('$500 value reward');
  const html = await page.locator('#tp-customer-cards').innerHTML();
  for (const forbidden of ['987654', '200', 'licence', 'Licence']) expect(html).not.toContain(forbidden);
});

test('state persists across a reload', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 12345, includeH2H: true });
  await page.locator('#tp-h2h-reach').fill('250000');
  await page.reload();
  await page.locator('.tabs button', { hasText: 'Revenue Model' }).click();
  await expect(page.locator('#tp-fee-0')).toHaveValue('12345');
  await expect(page.locator('#tp-deal-name')).toHaveValue('Fairway Social');
  await expect(page.locator('#tp-h2h-reach')).toHaveValue('250000');
});

test('the Mini Game tab keeps its own generator and no combined section', async ({ page }) => {
  await page.goto('/');
  await page.locator('.tabs button', { hasText: 'Mini Game ROI' }).click();
  await expect(page.locator('#minigame #tpc-section')).toHaveCount(0);
  await expect(page.locator('#minigame button', { hasText: 'Generate one-pager' })).toBeVisible();
  await expect(page.locator('#mgi-rs')).toBeVisible();
  await expect(page.locator('#mgi-license')).toBeVisible();
});

test('the tab is usable at 390px with no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openTab(page);
  await setBaseDeal(page, { includeH2H: true });
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
  await expect(page.locator('#tpc-cases .tpc-case').first()).toBeVisible();
});

test('the view switch is keyboard reachable and marks selection', async ({ page }) => {
  await openTab(page);
  const btn = page.locator('#tp-view-tournaments-btn');
  await btn.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#tp-tournaments-view')).toBeVisible();
  await expect(btn).toHaveAttribute('aria-selected', 'true');
});

test('the break-even map shows the volume behind each row', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 40000, includeH2H: true, mau: 1000000 });
  await page.evaluate(() => { MG.eng = 10; MG.plays = 20; MG.wager = 2; MG.rake = 10; MGsync(); MGu(); TPrender(); });

  const heads = await page.locator('#tp-heat thead th').allTextContents();
  expect(heads[0]).toContain('Participants');
  expect(heads[1]).toContain('Entries value');
  expect(heads[2]).toContain('Paid-game volume');
  expect(heads[3]).toContain('To Lucra');
  // Five price columns after the lead columns.
  await expect(page.locator('#tp-heat thead th')).toHaveCount(9);
  await expect(page.locator('#tp-heat tbody tr').first().locator('td.vol')).toHaveCount(3);

  // Volume rises with participation.
  const firstRow = await page.locator('#tp-heat tbody tr').nth(0).locator('td.vol').first().textContent();
  const lastRow = await page.locator('#tp-heat tbody tr').nth(4).locator('td.vol').first().textContent();
  expect(firstRow).not.toBe(lastRow);
});

test('the map drops the paid-game column when head-to-head is off', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 40000 });
  const heads = await page.locator('#tp-heat thead th').allTextContents();
  expect(heads.join(' ')).not.toContain('Paid-game volume');
  await expect(page.locator('#tp-heat tbody tr').first().locator('td.vol')).toHaveCount(2);
});

test('the Lucra toggle hides Lucra economics across the tab', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 4000, includeH2H: true, mau: 1000000 });

  await expect(page.locator('#tp-show-lucra')).toBeChecked();
  await expect(page.locator('#tp-summary')).toContainText('Lucra earnings');
  await expect(page.locator('#tp-table thead')).toContainText('To Lucra');
  await expect(page.locator('#tp-heat thead')).toContainText('To Lucra');
  await expect(page.locator('#tp-h2h-readout')).toContainText('Lucra takes');
  await expect(page.locator('#tpc-cases')).toContainText('To Lucra');

  await page.locator('#tp-show-lucra').uncheck();
  await expect(page.locator('#tp-lucra-note')).toContainText('hidden');
  await expect(page.locator('#tp-summary')).not.toContainText('Lucra earnings');
  await expect(page.locator('#tp-table thead')).not.toContainText('To Lucra');
  await expect(page.locator('#tp-heat thead')).not.toContainText('To Lucra');
  await expect(page.locator('#tp-h2h-readout')).not.toContainText('Lucra takes');
  await expect(page.locator('#tpc-cases')).not.toContainText('To Lucra');
  await expect(page.locator('#tp-tour-pitch')).not.toContainText('and Lucra $');

  // The customer summary never showed it either way.
  await page.locator('#tp-view-tournaments-btn').click();
  const html = await page.locator('#tp-customer-cards').innerHTML();
  expect(html).not.toContain('Lucra');
});

test('the one-pager brief emits every block the generator expects, in order', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 60000, includeH2H: true, mau: 1000000 });
  await page.evaluate(() => { MG.eng = 10; MG.plays = 20; MG.wager = 2; MG.rake = 10; MGsync(); MGu(); TPrender(); });

  const brief = await page.evaluate(() => TPbrief());
  const blocks = ['PARTNER', 'CONTACT', 'PRODUCTS IN SCOPE', 'DISCLOSURE', 'HERO',
    'STAT BAND — HEAD-TO-HEAD', 'STAT BAND — TOURNAMENTS', 'HOW IT RUNS', 'ONE PLAYER',
    'ACROSS A YEAR', 'SENSITIVITY', 'EXCLUSIONS', 'FOOTNOTE', 'VOCABULARY', 'PROVENANCE',
    'INTERNAL — DO NOT PRINT'];
  let cursor = -1;
  for (const b of blocks) {
    const at = brief.indexOf(b);
    expect(at, `${b} missing from the brief`).toBeGreaterThan(-1);
    expect(at, `${b} out of order`).toBeGreaterThan(cursor);
    cursor = at;
  }
  expect(brief).toContain('Fairway Social');
  expect(brief).toContain('Never: cash, wager');
  // Exactly two highlighted tiles per stat band.
  const bandH = brief.slice(brief.indexOf('STAT BAND — HEAD-TO-HEAD'), brief.indexOf('STAT BAND — TOURNAMENTS'));
  const bandT = brief.slice(brief.indexOf('STAT BAND — TOURNAMENTS'), brief.indexOf('HOW IT RUNS'));
  expect(bandH.match(/\[highlight\]/g)).toHaveLength(2);
  expect(bandT.match(/\[highlight\]/g)).toHaveLength(2);

  await page.locator('#tpc-section button', { hasText: 'Copy one-pager brief' }).click();
  await expect(page.locator('#tp-brief-out')).toBeVisible();
  await expect(page.locator('#tp-brief-out')).toContainText('SENSITIVITY');
});

test('the brief totals two pools of the same kind and keeps prize funding out of them', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 60000, includeH2H: true, mau: 1000000 });
  await page.evaluate(() => { MG.eng = 10; MG.plays = 20; MG.wager = 2; MG.rake = 10; MGsync(); MGu(); TPrender(); });

  const brief = await page.evaluate(() => TPbrief());
  const num = (label) => {
    const m = brief.match(new RegExp(label + ':?\\s+([\\d.]+) \\('));
    expect(m, `${label} not found`).not.toBeNull();
    return Number(m[1]);
  };
  const fee = num('X  platform fee generated');
  const entries = num('Y  tournament entries generated');
  const total = num('TOTAL REVENUE GENERATED');
  expect(total).toBeCloseTo(fee + entries, 2);
  // Prize funding is printed, but never inside the total.
  const prize = num('Your prize funding');
  expect(prize).toBeGreaterThan(0);
  expect(total).not.toBeCloseTo(fee + entries - prize, 2);
});

test('the brief keeps the split internal and prints no net beside a pool', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 60000, includeH2H: true, mau: 1000000 });
  const brief = await page.evaluate(() => TPbrief());
  const internalAt = brief.indexOf('INTERNAL — DO NOT PRINT');
  const printable = brief.slice(0, internalAt);
  // The rate lives only in the internal block, so it cannot be recovered by division.
  expect(brief.slice(internalAt)).toMatch(/Rev share: \d+ \/ \d+/);
  expect(printable).not.toMatch(/Rev share/);
  expect(printable).not.toMatch(/To Lucra|Lucra share|operator share/i);
});

test('the brief refuses to build on invalid inputs rather than emitting a broken page', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 60000 });
  await page.evaluate(() => { TP.splitMode = 'custom'; TP.custom = { credit: 60, operator: 30, lucra: 15 }; TPsave(); TPrender(); });
  const brief = await page.evaluate(() => TPbrief());
  expect(brief).toContain('cannot be built yet');
  expect(brief).not.toContain('TOTAL REVENUE GENERATED');
});

test('the brief drops the product that is not selected', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 60000 });
  let brief = await page.evaluate(() => TPbrief());
  expect(brief).toContain('tournaments');
  expect(brief).not.toContain('STAT BAND — HEAD-TO-HEAD');
  expect(brief).not.toContain('ONE PLAYER');

  await page.locator('#tp-inc-h2h').check();
  await page.locator('#tp-inc-tournaments').uncheck();
  brief = await page.evaluate(() => TPbrief());
  expect(brief).toContain('head-to-head');
  expect(brief).not.toContain('STAT BAND — TOURNAMENTS');
  expect(brief).not.toContain('prize funding');
});

test('the break-even map carries its own head-to-head and Lucra switches', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 60000, includeH2H: true, mau: 1000000 });
  await page.evaluate(() => { MG.eng = 10; MG.plays = 20; MG.wager = 2; MG.rake = 10; MGsync(); MGu(); TPrender(); });

  // The header is uppercased by CSS, and innerText reflects that, so compare folded.
  const headers = async () => (await page.locator('#tp-heat thead th').allInnerTexts()).join('|').toLowerCase();
  expect(await headers()).toContain('paid-game volume');
  await expect(page.locator('#tp-heat-h2h')).toBeChecked();
  await expect(page.locator('#tp-heat-lucra')).toBeChecked();

  // Turning the map switch off drops the column without touching product selection.
  await page.locator('#tp-heat-h2h').uncheck();
  expect(await headers()).not.toContain('paid-game volume');
  expect(await page.evaluate(() => TP.includeH2H)).toBe(true);

  await page.locator('#tp-heat-h2h').check();
  expect(await headers()).toContain('paid-game volume');

  // The Lucra switch in the map is the same state the rest of the tab uses.
  await page.locator('#tp-heat-lucra').uncheck();
  expect(await headers()).not.toContain('to lucra');
  expect(await page.evaluate(() => TP.showLucra)).toBe(false);
  await expect(page.locator('#tp-show-lucra')).not.toBeChecked();
});

test('the map explains a missing head-to-head column rather than hiding it silently', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 60000 });
  await expect(page.locator('#tp-heat-h2h')).toBeDisabled();
  await expect(page.locator('#tp-heat-controls-note')).toContainText('not selected at the top');
  expect((await page.locator('#tp-heat thead th').allInnerTexts()).join('|').toLowerCase()).not.toContain('paid-game volume');
});

test('the brief has its own block and previews without the clipboard', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 60000, includeH2H: true, mau: 1000000 });
  await expect(page.locator('#tp-brief-block .pf-section-title')).toContainText('One-pager brief');
  await expect(page.locator('#tp-brief-out')).toBeHidden();
  await page.locator('#tp-brief-block button', { hasText: 'Preview it' }).click();
  await expect(page.locator('#tp-brief-out')).toBeVisible();
  await expect(page.locator('#tp-brief-out')).toContainText('STAT BAND');
  await expect(page.locator('#tp-brief-out')).toContainText('INTERNAL — DO NOT PRINT');
});
