import { test, expect } from '@playwright/test';

// Browser coverage for the Revenue Model tab: product selection, the recapture
// toggle, per-tournament participation, the head-to-head funnel and its modes,
// the launch ramp, both pitches, and the one-pager.

async function openTab(page) {
  await page.goto('/');
  await page.addInitScript(() => {});
  const desktopTab = page.locator('.tabs button', { hasText: 'Revenue Model' });
  if (await desktopTab.isVisible()) {
    await desktopTab.click();
  } else {
    await page.locator('#mobile-workflow').selectOption('tournaments');
  }
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

// The head-to-head inputs fold by default; tests that touch them open the fold.
async function openH2H(page) {
  await page.evaluate(() => { const d = document.getElementById('tp-h2h-fold'); if (d) d.open = true; });
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
  await openH2H(page);
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
  await openH2H(page);
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
  await openH2H(page);
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

  await page.locator('#tp-brief-block button', { hasText: 'Show what this copies' }).click();
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
  await expect(page.locator('#tp-brief-block button', { hasText: 'Copy one-pager brief' })).toBeVisible();
  await expect(page.locator('#tp-brief-out')).toBeHidden();
  await page.locator('#tp-brief-block button', { hasText: 'Show what this copies' }).click();
  await expect(page.locator('#tp-brief-out')).toBeVisible();
  await expect(page.locator('#tp-brief-out')).toContainText('STAT BAND');
  await expect(page.locator('#tp-brief-out')).toContainText('INTERNAL — DO NOT PRINT');
});

test('a waived licence keeps the revenue split on screen and editable', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 60000 });
  await expect(page.locator('#tp-split-block')).toBeVisible();

  await page.locator('#tp-free').check();
  // The split is how Lucra is paid, so it must survive the waiver.
  await expect(page.locator('#tp-split-block')).toBeVisible();
  await expect(page.locator('#tp-post-operator')).toBeEditable();
  await expect(page.locator('#tp-post-lucra')).toBeEditable();
  // Recapture is meaningless with nothing to retire, so its controls go.
  await expect(page.locator('#tp-recapture-wrap')).toBeHidden();
  await expect(page.locator('#tp-recapture-fields')).toBeHidden();
  await expect(page.locator('#tp-post-title')).toHaveText('Revenue split');
  await expect(page.locator('#tp-split-note')).toContainText('how Lucra is paid');

  // A 50/50 waiver split reaches the engine as entered.
  await page.locator('#tp-post-operator').fill('50');
  await page.locator('#tp-post-lucra').fill('50');
  const m = await page.evaluate(() => TPcalculate(TP).months[0]);
  expect(m.toLicense).toBe(0);
  expect(m.toLucra).toBeCloseTo(m.operatorGross, 6);
});

test('the split stays visible for a head-to-head-only deal', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 60000, includeH2H: true, mau: 1000000 });
  await page.locator('#tp-inc-tournaments').uncheck();
  await expect(page.locator('#tp-split-block')).toBeVisible();
  await expect(page.locator('#tp-post-lucra')).toBeEditable();
});

test('the take fee is a custom rate held between 5 and 25 per cent', async ({ page }) => {
  await openTab(page);
  await openH2H(page);
  await setBaseDeal(page, { fee: 60000, includeH2H: true, mau: 1000000 });
  const box = page.locator('#tph-rake');
  await expect(box).toHaveAttribute('min', '5');
  await expect(box).toHaveAttribute('max', '25');
  await expect(page.locator('#tp-h2h-fields')).toContainText('Take fee');

  // Anything can be typed; committing snaps it back into the sold range.
  await box.fill('40');
  await box.blur();
  expect(await page.evaluate(() => MG.rake)).toBe(25);
  await box.fill('1');
  await box.blur();
  expect(await page.evaluate(() => MG.rake)).toBe(5);
  // A rate inside the range is left exactly as entered.
  await box.fill('12.5');
  await box.blur();
  expect(await page.evaluate(() => MG.rake)).toBe(12.5);
});

test('the recommender proposes a configuration and shows where each number came from', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 120000, includeH2H: true, mau: 1000000 });
  await page.locator('#tp-rec-block button', { hasText: 'Recommend from the base' }).click();

  await expect(page.locator('.tp-rec-banner')).toContainText('clears the licence');
  // Three tests, all reported, not just the flattering one.
  await expect(page.locator('.tp-rec-test')).toHaveCount(3);
  await expect(page.locator('.tp-rec-tests')).toContainText('Licence retired inside the term');
  await expect(page.locator('.tp-rec-tests')).toContainText("Lucra's share covers the licence");
  await expect(page.locator('.tp-rec-tests')).toContainText('Operator nets positive');
  // Every recommended input carries its provenance.
  const sources = await page.locator('.tp-rec-table td.tp-rec-src').allInnerTexts();
  expect(sources.length).toBeGreaterThan(4);
  expect(sources.every((s) => s.trim().length > 0)).toBe(true);
  await expect(page.locator('.tp-rec-table')).toContainText('Antavo');
  await expect(page.locator('.tp-rec-table')).toContainText('Lucra reference deals');
  // Reward value is named as a benefit and kept out of revenue.
  await expect(page.locator('#tp-rec-out')).toContainText('excluded from that figure');
});

test('a base too small to clear the licence says so and sizes the gap', async ({ page }) => {
  await openTab(page);
  // Head-to-head now credits the licence too, so it takes a very small base to fail.
  await setBaseDeal(page, { fee: 120000, includeH2H: true, mau: 2000 });
  await page.evaluate(() => TPCsetMau(2000));
  await page.locator('#tp-rec-block button', { hasText: 'Recommend from the base' }).click();

  await expect(page.locator('.tp-rec-banner')).toHaveClass(/short/);
  await expect(page.locator('.tp-rec-banner')).toContainText('does not clear the licence');
  await expect(page.locator('.tp-rec-banner')).toContainText('no published figure to justify it');
  await expect(page.locator('.tp-rec-gap')).toBeVisible();
  // Reaching for the ceiling is the one case that cites the published figure.
  await expect(page.locator('.tp-rec-table')).toContainText('Skillz');

  // The two kinds of gap are named separately: a sponsor can cover an unretired
  // licence, and cannot lift Lucra's share. Retargeting value is recorded beside
  // the gap and never added in.
  const rec = await page.evaluate(() => TPrecommend(TP, TPrecMau()));
  expect(rec.licenceGapYear).toBeGreaterThan(0);
  expect(rec.lucraGapYear).toBeGreaterThan(0);
  await expect(page.locator('.tp-rec-gap')).toContainText('not retired by play');
  await expect(page.locator('.tp-rec-gap')).toContainText("Lucra's share is");
  await page.locator('#tp-retarget').fill('5000');
  await expect(page.locator('.tp-rec-gap')).toContainText('stays out of every revenue figure');
  expect(await page.evaluate(() => TPrecommend(TP, TPrecMau()).shortfallYear)).toBeCloseTo(rec.shortfallYear, 6);
});

test('applying the recommendation writes it into the model', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 120000, includeH2H: true, mau: 1000000 });
  await page.locator('#tp-rec-block button', { hasText: 'Recommend from the base' }).click();
  const before = await page.evaluate(() => ({ eng: MG.eng, rake: MG.rake, tours: TP.tournaments.length }));
  await page.locator('#tp-rec-out button', { hasText: 'Apply these numbers' }).click();

  const after = await page.evaluate(() => ({
    eng: MG.eng, rake: MG.rake, names: TP.tournaments.map((t) => t.name),
  }));
  expect(after.names).toEqual(['Weekly open', 'Monthly major']);
  expect(after.rake).toBeGreaterThanOrEqual(5);
  expect(after.rake).toBeLessThanOrEqual(25);
  expect(after.eng).toBeGreaterThan(0);
  expect(after).not.toEqual(before);
  // The applied deal is valid and still clears.
  expect(await page.evaluate(() => TPvalidate(TP))).toEqual([]);
  expect(await page.evaluate(() => TPrecommend(TP, TPrecMau()).cleared)).toBe(true);
});

test('locations per contract year scale the model and explain themselves', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { termYears: 3, fees: [60000, 60000, 60000, 60000, 60000] });
  // One input per contract year, defaulting to a single location.
  await expect(page.locator('#tp-locations input')).toHaveCount(3);
  await expect(page.locator('#tp-loc-0')).toHaveValue('1');
  await expect(page.locator('#tp-growth-note')).toContainText('One location');

  await page.locator('#tp-loc-1').fill('3');
  await page.locator('#tp-loc-2').fill('7');
  await expect(page.locator('#tp-growth-note')).toContainText('1 → 3 → 7 locations');
  await expect(page.locator('#tp-growth-note')).toContainText('Audience averages');

  const r = await page.evaluate(() => TPcalculate(TP));
  expect(r.months[35].handle).toBeCloseTo(r.months[0].handle * 7, 6);
  // The licence one location could not retire now clears late in the term.
  expect(r.payoffMonth).not.toBeNull();
  await expect(page.locator('#tp-summary')).not.toContainText('Not retired');

  // Persisted across a reload like everything else on the tab.
  await page.reload();
  await page.locator('.tabs button', { hasText: 'Revenue Model' }).click();
  await expect(page.locator('#tp-loc-2')).toHaveValue('7');
});

test('a shrinking location count is held flat rather than modelled as closures', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { termYears: 2, fees: [60000, 60000, 60000, 60000, 60000] });
  await page.locator('#tp-loc-0').fill('4');
  await page.locator('#tp-loc-1').fill('2');
  expect(await page.evaluate(() => TPlocations(TPstate(TP)))).toEqual([4, 4]);
});

test('the ramp applies to each location and the brief says so', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { termYears: 2, fees: [60000, 60000, 60000, 60000, 60000], includeH2H: true, mau: 100000 });
  await page.locator('#tp-loc-1').fill('3');
  await page.locator('#tp-ramp-on').check();
  await expect(page.locator('#tp-ramp-fields')).toBeVisible();
  await expect(page.locator('#tp-growth-note')).toContainText('ramping in');
  const brief = await page.evaluate(() => TPbrief());
  expect(brief).toContain('Locations: 1 -> 3');
  expect(brief).toContain('each location opens at');
});

test('head-to-head credits the licence at the same share, and the table shows it', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 60000, mau: 100000 });
  await page.evaluate(() => { TPCsetMau(100000); MG.eng = 10; MG.plays = 20; MG.wager = 2; MG.rake = 10; MGsync(); MGu(); TPrender(); });
  // Tournaments alone at 4,000 a month cannot retire 60,000 inside a year.
  let r = await page.evaluate(() => TPcalculate(TP, TPCconfig()));
  expect(r.includesH2H).toBe(false);
  expect(r.payoffMonth).toBeNull();
  await expect(page.locator('#tp-table thead')).not.toContainText('Head-to-head fee');

  await page.locator('#tp-inc-h2h').check();
  r = await page.evaluate(() => TPcalculate(TP, TPCconfig()));
  expect(r.includesH2H).toBe(true);
  expect(r.months[0].h2hFee).toBeCloseTo(40000, 3);
  expect(r.payoffMonth).not.toBeNull();
  await expect(page.locator('#tp-table thead')).toContainText('Head-to-head fee');
  await expect(page.locator('#tp-table thead')).toContainText('Pool to split');
  await expect(page.locator('#tp-summary')).not.toContainText('Not retired');
});

test('sponsors are entered in the deal and credit the licence before the split', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 60000 });
  await expect(page.locator('#tp-sponsors-list')).toContainText('No sponsors');
  await page.locator('#tp-sponsors-block button', { hasText: 'Add a sponsor' }).click();
  await page.locator('#tp-sp-name-0').fill('Launch partner');
  await page.locator('#tp-sp-amount-0').fill('20000');
  await page.locator('#tp-sp-month-0').fill('3');

  const r = await page.evaluate(() => TPcalculate(TP, TPCconfig()));
  expect(r.months[2].sponsorCredit).toBe(20000);
  expect(r.totalSponsorCredited).toBe(20000);
  await expect(page.locator('#tp-table thead')).toContainText('Sponsor to licence');
  // Waiving the licence hides the sponsor block with the rest of the licence inputs.
  await page.locator('#tp-free').check();
  await expect(page.locator('#tp-sponsors-block')).toBeHidden();
  await page.locator('#tp-free').uncheck();
  await page.locator('#tp-sponsors-list .tp-remove').first().click();
  await expect(page.locator('#tp-sponsors-list')).toContainText('No sponsors');
});

test('the recommender offers a sponsor for exactly the unretired licence', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 120000, includeH2H: true, mau: 2000 });
  await page.evaluate(() => TPCsetMau(2000));
  await page.locator('#tp-rec-block button', { hasText: 'Recommend from the base' }).click();
  await expect(page.locator('.tp-rec-banner')).toHaveClass(/short/);
  const gap = await page.evaluate(() => TPrecommend(TP, TPrecMau()).licenceGapYear);
  expect(gap).toBeGreaterThan(0);
  await page.locator('.tp-rec-gap button', { hasText: 'Add a sponsor for' }).click();
  // A sponsor line now exists for the gap, and the licence test passes.
  expect(await page.evaluate(() => TP.sponsors.length)).toBe(1);
  expect(await page.evaluate(() => TPrecommend(TP, TPrecMau()).licenceGapYear)).toBe(0);
  await expect(page.locator('#tp-sp-name-0')).toHaveValue('Gap sponsor');
});

test('decay and season are off by default and switch on with their controls', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { termYears: 3, fees: [60000, 60000, 60000, 60000, 60000] });
  await expect(page.locator('#tp-decay-fields')).toBeHidden();
  await expect(page.locator('#tp-season-fields')).toBeHidden();
  const flat = await page.evaluate(() => TPcalculate(TP, TPCconfig()));

  await page.locator('#tp-decay-on').check();
  await expect(page.locator('#tp-decay-fields')).toBeVisible();
  await expect(page.locator('#tp-decay-rate')).toHaveValue('95');
  await expect(page.locator('#tp-growth-note')).toContainText('95% of the prior year');
  const decayed = await page.evaluate(() => TPcalculate(TP, TPCconfig()));
  expect(decayed.months[24].handle).toBeCloseTo(flat.months[24].handle * 0.9025, 3);
  expect(decayed.months[0].handle).toBeCloseTo(flat.months[0].handle, 3);

  await page.locator('#tp-season-on').check();
  await expect(page.locator('#tp-season-fields')).toBeVisible();
  await page.locator('#tp-season-preset').selectOption('nfl');
  await page.locator('#tp-season-start').selectOption('9');
  await expect(page.locator('#tp-season-grid input')).toHaveCount(12);
  await expect(page.locator('#tp-season-note')).toContainText('Peak');
  const seasonal = await page.evaluate(() => TPcalculate(TP, TPCconfig()));
  // The season moves volume around the year without changing the year.
  expect(seasonal.totalHandle).toBeCloseTo(decayed.totalHandle, 1);
  expect(seasonal.months[0].handle).toBeGreaterThan(seasonal.months[8].handle); // September start beats the following May
  // Editing a month makes the profile custom.
  await page.locator('#tp-season-grid input').first().fill('3');
  expect(await page.evaluate(() => TP.seasonPreset)).toBe('custom');
});

test('the page carries a build stamp', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#build-stamp')).toContainText('Build local');
  await expect(page.locator('#build-stamp')).toContainText(new Date().getFullYear().toString());
});

test('the payoff chart draws three cases against the licence, with openings and a revenue panel', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { termYears: 3, fees: [60000, 60000, 60000, 60000, 60000], includeH2H: true, mau: 100000 });
  await page.evaluate(() => { TPCsetMau(100000); MG.eng = 10; MG.plays = 20; MG.wager = 2; MG.rake = 10; MGsync(); MGu(); });
  await page.locator('#tp-loc-1').fill('3');
  await page.locator('#tp-loc-2').fill('7');

  const svg = page.locator('#tp-chart svg');
  await expect(svg).toBeVisible();
  await expect(svg).toContainText('Licence retired, cumulative');
  await expect(svg).toContainText('Revenue generated by month');
  // Three case lines, each labelled at its end, plus the licence reference.
  await expect(svg.locator('path.tp-ch-line')).toHaveCount(4); // three cases + Lucra
  for (const label of ['Conservative', 'Expected', 'Best case', 'Lucra, cumulative']) await expect(svg).toContainText(label);
  await expect(svg.locator('line.tp-ch-ref')).toHaveCount(1);
  // Six openings after month one: two in year two, four in year three.
  await expect(svg.locator('line.tp-ch-open')).toHaveCount(6);
  // Stacked bars for both products.
  expect(await svg.locator('rect.tp-ch-bar').count()).toBeGreaterThan(36);
  // Legend names every series, so identity never rests on colour alone.
  await expect(page.locator('.tp-ch-legend')).toContainText('Licence balance');
  await expect(page.locator('.tp-ch-legend')).toContainText('Head-to-head fee');
  // Hover layer.
  const hit = svg.locator('rect.tp-ch-hit');
  await hit.hover();
  await expect(page.locator('#tp-ch-tip')).toBeVisible();
  await expect(page.locator('#tp-ch-tip')).toContainText('Month');
  await expect(page.locator('#tp-ch-tip')).toContainText('retired');
});

test('customer view hides every internal figure at once and keeps the inputs live', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 60000, includeH2H: true, mau: 100000 });
  await page.evaluate(() => { TPCsetMau(100000); MG.eng = 10; MG.plays = 20; MG.wager = 2; MG.rake = 10; MGsync(); MGu(); TPrender(); });
  await expect(page.locator('#tp-deal-block')).toBeVisible();
  await expect(page.locator('#tp-strip')).toContainText('Payoff');

  await page.locator('#tp-customer-mode').check();
  await expect(page.locator('body')).toHaveClass(/tp-customer/);
  for (const sel of ['#tp-deal-block', '#tp-split-block', '#tp-rec-block', '#tp-brief-block', '.tp-heat-wrap', '#tp-tour-pitch', '#tp-h2h-pitch', '#tp-cost-0']) {
    await expect(page.locator(sel)).toBeHidden();
  }
  await expect(page.locator('#tp-strip')).not.toContainText('Payoff');
  await expect(page.locator('#tp-strip')).not.toContainText('Lucra');
  await expect(page.locator('#tp-summary')).toContainText('Revenue generated / yr');
  await expect(page.locator('#tp-summary')).not.toContainText('Licence');
  await expect(page.locator('#tp-summary')).not.toContainText('Lucra');
  await expect(page.locator('#tp-table thead')).not.toContainText('To licence');
  await expect(page.locator('#tp-table thead')).not.toContainText('Prize');
  // The chart drops its licence panel and keeps the revenue panel.
  await expect(page.locator('#tp-chart svg')).not.toContainText('Licence retired');
  await expect(page.locator('#tp-chart svg')).toContainText('Revenue generated by month');

  // Nothing visible uses a blocked word, and the vocabulary guard is the same one the exports use.
  const visible = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.getElementById('tournaments'), NodeFilter.SHOW_TEXT);
    const out = []; let n;
    while ((n = walker.nextNode())) {
      const el = n.parentElement; if (!el) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[hidden]')) continue;
      if (el.closest('.tp-internal')) continue;
      out.push(n.textContent);
    }
    return out.join(' ');
  });
  expect(visible).not.toMatch(BLOCKED);

  // Inputs stay live: moving engagement moves the strip.
  const before = await page.locator('#tp-strip-items').innerText();
  await openH2H(page);
  await page.locator('#tph-eng').fill('20');
  await expect(page.locator('#tp-strip-items')).not.toHaveText(before);

  await page.locator('#tp-customer-mode').uncheck();
  await expect(page.locator('#tp-deal-block')).toBeVisible();
  await expect(page.locator('#tp-strip')).toContainText('Payoff');
});

test('the sticky strip tracks the deal as it is edited', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 60000, includeH2H: true, mau: 100000 });
  await page.evaluate(() => { TPCsetMau(100000); MG.eng = 10; MG.plays = 20; MG.wager = 2; MG.rake = 10; MGsync(); MGu(); TPrender(); });
  await expect(page.locator('#tp-strip')).toContainText('Revenue generated / yr');
  await expect(page.locator('#tp-strip')).toContainText('Month');
  const before = await page.locator('#tp-strip-items').innerText();
  await page.locator('#tp-free').check();
  await expect(page.locator('#tp-strip')).toContainText('Licence waived');
  expect(await page.locator('#tp-strip-items').innerText()).not.toBe(before);
  const pos = await page.evaluate(() => getComputedStyle(document.getElementById('tp-strip')).position);
  expect(pos).toBe('sticky');
});

test('the head-to-head inputs fold behind a summary line, and the brief folds behind its copy button', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 60000, includeH2H: true, mau: 100000 });
  await page.evaluate(() => { MG.eng = 12; MG.plays = 18; MG.wager = 3; MG.rake = 12; MGsync(); MGu(); TPrender(); });
  const fold = page.locator('#tp-h2h-fold');
  expect(await fold.evaluate((el) => el.open)).toBe(false);
  await expect(page.locator('#tp-h2h-fold-summary')).toContainText('12% engaged');
  await expect(page.locator('#tp-h2h-fold-summary')).toContainText('18 plays at $3, 12% take fee');
  await expect(page.locator('#tph-eng')).toBeHidden();
  await fold.locator('summary').click();
  await expect(page.locator('#tph-eng')).toBeVisible();

  await expect(page.locator('#tp-brief-detail')).toBeHidden();
  await expect(page.locator('#tp-brief-block button', { hasText: 'Copy one-pager brief' })).toBeVisible();
  await page.locator('#tp-brief-block button', { hasText: 'Show what this copies' }).click();
  await expect(page.locator('#tp-brief-detail')).toBeVisible();
  await expect(page.locator('#tp-brief-out')).toContainText('STAT BAND');
  await page.locator('#tp-brief-block button', { hasText: 'Hide the brief' }).click();
  await expect(page.locator('#tp-brief-detail')).toBeHidden();
});

test('the brief states the contract by year, what activity retires, and what the operator earns', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { termYears: 3, fees: [40000, 60000, 80000, 80000, 80000], includeH2H: true, mau: 100000 });
  await page.evaluate(() => { TPCsetMau(100000); MG.eng = 10; MG.plays = 20; MG.wager = 2; MG.rake = 10; MGsync(); MGu(); TPrender(); });
  const brief = await page.evaluate(() => TPbrief());
  const block = brief.slice(brief.indexOf('LICENCE AND EARNINGS BY YEAR'), brief.indexOf('SENSITIVITY'));
  expect(block).toContain('stepped 40000 / 60000 / 80000');
  expect(block).toContain('180000 ($180,000) over 3 years');
  for (const y of [1, 2, 3]) {
    expect(block).toMatch(new RegExp('Year ' + y + ': licence fee \\d+ \\(\\$[\\d,]+\\) · retired by activity \\d+'));
    expect(block).toMatch(new RegExp('Year ' + y + ':.*operator earns \\d+ \\(\\$[\\d,]+\\) after prize funding'));
  }
  // The rows reconcile with the engine, year by year.
  const r = await page.evaluate(() => TPcalculate(TP, TPCconfig()));
  const y2op = r.months.filter((m) => m.year === 2).reduce((a, m) => a + m.toOperator, 0);
  expect(block).toContain('operator earns ' + Math.round(y2op * 100) / 100 + ' (');
  // Lucra's per-year share stays behind the internal line.
  const printable = brief.slice(0, brief.indexOf('INTERNAL — DO NOT PRINT'));
  expect(printable).not.toMatch(/Lucra share \d/);
  expect(brief.slice(brief.indexOf('INTERNAL'))).toMatch(/Year 2 Lucra share \d+ plus licence fee 60000/);
  // A waived licence says so on every row instead of printing zeros.
  await page.locator('#tp-free').check();
  const waived = await page.evaluate(() => TPbrief());
  expect(waived).toContain('Contract: licence waived');
  expect(waived).toMatch(/Year 1: licence waived · revenue generated/);
});
