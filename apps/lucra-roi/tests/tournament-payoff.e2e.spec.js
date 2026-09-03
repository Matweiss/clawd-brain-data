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
      customerType: opts.customerType || 'venues',
      // The mini-games product, when a test wants it: the Mini Game tab's inputs drive its head-to-head.
      mini: Object.assign({ on: false, tournamentsOn: true, h2hOn: true }, opts.mini || {}),
      core: opts.core || undefined,
    }));
    if (TP.mini.on && TP.mini.tournamentsOn !== false && !TP.mini.tournaments.length) TP.mini.tournaments = JSON.parse(JSON.stringify(TP_DEFAULT_MINI_TOURNAMENTS));
    // The Mini Game tab holds the working copy of the base; keep it in step.
    MG.tau = TP.mau;
    TPsave(); TPrenderControls(); TPrenderTournaments(); TPrender();
  }, o);
}

// The head-to-head inputs fold by default; tests that touch them open the fold.
async function openH2H(page) {
  await page.evaluate(() => { ['tp-h2h-fold', 'tp-h2h-fold-core'].forEach((id) => { const d = document.getElementById(id); if (d) d.open = true; }); });
}

// A mini-games head-to-head deal: the Mini Game tab's inputs, the original ids.
const MINI_H2H = { includeH2H: false, mini: { on: true, tournamentsOn: false, h2hOn: true } };
// An app-only mini-games deal with both halves, the product the recommender's ladder describes.
const MINI = { includeTournaments: false, includeH2H: false, customerType: 'app', mini: { on: true, tournamentsOn: true, h2hOn: true } };

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
  await expect(page.locator('#tp-prod-core')).toBeVisible();
  await expect(page.locator('#tp-fee-0')).toBeVisible();
  await expect(page.locator('#tp-tournaments-list-core .tp-tour')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('setup sections sit in one top box', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page);
  const box = page.locator('#tp-calc-view .pf-section').first();
  await expect(box).toContainText('Who the customer is, and what they are taking');
  await expect(box.locator('#tp-deal-block')).toBeVisible();
  await expect(box.locator('#tp-split-block')).toBeVisible();
  // The participants box is gone; participation lives on each tournament.
  await expect(page.locator('#tp-participants-block')).toHaveCount(0);
  await expect(page.locator('#tp-part-0')).toBeVisible();
});

test('product cards show and hide each product and each half', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page);
  // A venue customer: core on, mini games off.
  await expect(page.locator('.tp-customer-switch button[data-customer="venues"]')).toHaveClass(/on/);
  await expect(page.locator('#tp-prod-core')).toBeChecked();
  await expect(page.locator('#tp-prod-core-t')).toBeChecked();
  await expect(page.locator('#tp-prod-mini')).not.toBeChecked();
  await expect(page.locator('#tp-h2h-block-core')).toBeHidden();
  await expect(page.locator('#tp-h2h-block')).toBeHidden();
  await expect(page.locator('#tp-tournaments-block-mini')).toBeHidden();

  await page.locator('#tp-prod-core-h').check();
  await expect(page.locator('#tp-h2h-block-core')).toBeVisible();
  await expect(page.locator('#tp-h2h-block')).toBeHidden();

  await page.locator('#tp-prod-core-t').uncheck();
  await expect(page.locator('#tp-tournaments-block-core')).toBeHidden();
  await expect(page.locator('#tp-h2h-block-core')).toBeVisible();

  // Mini games on: its own tournament list, seeded, and its own head-to-head.
  await page.locator('#tp-prod-mini').check();
  await expect(page.locator('#tp-tournaments-block-mini')).toBeVisible();
  await expect(page.locator('#tp-tournaments-list-mini .tp-tour')).toHaveCount(1);
  await expect(page.locator('#tp-h2h-block')).toBeVisible();
  await expect(page.locator('#tp-mini-mau-row')).toBeVisible();

  await page.locator('#tp-prod-core').uncheck();
  await page.locator('#tp-prod-mini').uncheck();
  await expect(page.locator('#tp-product-note')).toContainText('at least one product');
  await expect(page.locator('#tp-deal-block')).toBeHidden();
});

test('the customer step sets the defaults: app-only is one location with mini games', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { termYears: 2, fees: [60000, 60000, 0, 0, 0] });
  await page.locator('#tp-loc-1').fill('4');
  await expect(page.locator('#tp-openings')).toContainText('Opening schedule');
  await page.locator('.tp-customer-switch button[data-customer="app"]').click();
  await expect(page.locator('#tp-prod-mini')).toBeChecked();
  await expect(page.locator('#tp-prod-core')).not.toBeChecked();
  await expect(page.locator('#tp-mau-label')).toHaveText('Monthly active users on the app or site');
  await expect(page.locator('#tp-loc-1')).toHaveCount(0);
  await expect(page.locator('#tp-mini-mau-row')).toBeHidden();
  expect(await page.evaluate(() => TPlocations(TPstate(TP)))).toEqual([1, 1]);
  // A digital platform with its own game switches core back on, still one location.
  await page.locator('#tp-prod-core').check();
  await expect(page.locator('#tp-tournaments-list-core .tp-tour')).toHaveCount(1);
  await expect(page.locator('#tp-tournaments-list-core .tp-scope-switch')).toHaveCount(0);
  expect(await page.evaluate(() => TPcalculate(TP, TPCconfig()).months[23].locationsOpen)).toBe(1);
  // Both: venues and an app. The mini base derives from the venues until entered.
  await page.locator('.tp-customer-switch button[data-customer="both"]').click();
  await expect(page.locator('#tp-prod-core')).toBeChecked();
  await expect(page.locator('#tp-prod-mini')).toBeChecked();
  await expect(page.locator('#tp-mini-mau-row')).toBeVisible();
  await expect(page.locator('#tp-mini-mau-note')).toContainText('grows with every opening');
  await page.locator('#tp-mini-mau-mode').selectOption('entered');
  await expect(page.locator('#tp-mini-mau-group')).toBeVisible();
  await page.locator('#tp-mini-mau').fill('250000');
  expect(await page.evaluate(() => TPminiBase(TPstate(TP), 24))).toBe(250000);
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
  await expect(page.locator('#tp-table tbody tr:not(.tp-subtotal):not(.tp-total)')).toHaveCount(24);
  await expect(page.locator('#tp-table tbody tr.tp-subtotal')).toHaveCount(2);
  await expect(page.locator('#tp-table tbody tr.tp-total')).toHaveCount(1);
  await expect(page.locator('#tp-basis-row')).toBeVisible();
});

test('the results say the licence is retired from the licence share alone, never the operator share', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { termYears: 3, fees: [78000, 102000, 126000], payoffBasis: 'annual', shortfall: 'cash', mau: 8000 });
  // Loco Bear terms: 50 to the licence, 45 to the operator, 5 to Lucra; 90/10 once cleared.
  await page.evaluate(() => {
    TP.splitMode = 'custom'; TP.custom = { credit: 50, operator: 45, lucra: 5 }; TP.post = { operator: 90, lucra: 10 };
    TP.core.tournaments[0].participants = 500; TP.core.tournaments[0].customerCashCost = 250;
    TPsave(); TPrenderControls(); TPrender();
  });
  const box = page.locator('#tp-licence-source');
  await expect(box).toBeVisible();
  await expect(box).toContainText('Retired from the licence share alone. Your share is never diverted to the licence.');
  await expect(box).toContainText('Your 45% is yours from month one, stepping up to 90% once the licence is cleared.');
  await expect(box.locator('.tp-source-row.zero')).toContainText('From your share');
  await expect(box.locator('.tp-source-row.zero b')).toHaveText('$0');
  // Three columns for the licence in both tables: from the licence share, from the operator share, the total.
  const head = page.locator('#tp-table thead');
  await expect(head).toContainText('Licence share → licence');
  await expect(head).toContainText('Operator share → licence');
  await expect(head).toContainText('To licence, total');
  await expect(page.locator('#tp-table tbody tr').first().locator('td.tp-zero')).toHaveText('$0');
  await expect(page.locator('#tp-years thead')).toContainText('From operator share');
  await expect(page.locator('#tp-years tbody tr').first().locator('td.tp-zero')).toHaveText('$0');
  const r = await page.evaluate(() => TPcalculate(TP, TPCconfig()));
  expect(r.licenceFunding.fromOperator).toBe(0);
  expect(r.licenceFunding.fromShare).toBeGreaterThan(0);
  // The brief carries it as a highlighted line and on every year row.
  const brief = await page.evaluate(() => TPbrief());
  expect(brief).toMatch(/Foil: the \$306,000 licence is paid down by activity out of the licence share alone, with \$[\d,]+ settled in cash at year end\. Your share is yours from month one\./);
  expect(brief).toContain("Funded from: the licence share of the pool alone (50% of every pool until the year's fee is cleared). Nothing from the operator's share goes to the licence: it is theirs from month one and steps up once the licence is cleared.  [customer fact] [highlight]");
  expect(brief).toMatch(/Year 1: licence fee 78000 \(\$78,000\) · retired by activity [\d.]+ \(\$[\d,]+\) \(from the licence share [\d.]+ \(\$[\d,]+\), from the operator's share 0 \(\$0\)\)/);
  expect(brief).toContain('It is taken from the licence share only, never from the operator\'s share.');
  // Customer view keeps the box out, as it keeps every licence figure out.
  await page.evaluate(() => { TP.customerMode = true; TPsave(); TPrender(); });
  await expect(box).toBeHidden();
  await page.evaluate(() => { TP.customerMode = false; TPsave(); TPrender(); });
  // A free licence has nothing to retire, so the box goes too.
  await page.locator('#tp-free').check();
  await expect(box).toBeHidden();
});

test('the tables total each year and the term, and say what the operator makes year by year', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { termYears: 3, fees: [78000, 102000, 126000], payoffBasis: 'annual', shortfall: 'cash', mau: 8000 });
  await page.evaluate(() => {
    TP.splitMode = 'custom'; TP.custom = { credit: 50, operator: 45, lucra: 5 }; TP.post = { operator: 90, lucra: 10 };
    TP.core.tournaments[0].participants = 500; TP.core.tournaments[0].customerCashCost = 250;
    TPsave(); TPrenderControls(); TPrender();
  });
  const r = await page.evaluate(() => TPcalculate(TP, TPCconfig()));
  const totals = await page.evaluate(() => TPyearTotals(TPcalculate(TP, TPCconfig())));
  // Monthly table: 36 month rows, a subtotal after each year's month 12, a term total at the bottom.
  const rows = page.locator('#tp-table tbody tr');
  await expect(rows).toHaveCount(36 + 3 + 1);
  await expect(page.locator('#tp-table tbody tr.tp-subtotal')).toHaveCount(3);
  await expect(page.locator('#tp-table tbody tr.tp-total')).toHaveCount(1);
  await expect(rows.nth(12)).toHaveClass(/tp-subtotal/);
  await expect(rows.nth(12)).toContainText('Year 1');
  await expect(rows.nth(25)).toContainText('Year 2');
  await expect(rows.nth(38)).toContainText('Year 3');
  await expect(rows.nth(39)).toHaveClass(/tp-total/);
  await expect(rows.nth(39)).toContainText('Term');
  const money = (v) => (v < 0 ? '-$' : '$') + Math.abs(Math.round(v)).toLocaleString('en-US');
  await expect(rows.nth(12)).toContainText(money(totals[0].toOperator));
  await expect(rows.nth(39)).toContainText(money(r.totalOperator));
  await expect(rows.nth(39)).toContainText(money(r.totalSplitBase));
  // The operator's share is its own column, gross and then after prizes, with a running total.
  const head = page.locator('#tp-table thead');
  await expect(head).toContainText('Operator share (45% then 90%)');
  await expect(head).toContainText('To operator, after prizes');
  await expect(head).toContainText('Operator, cumulative');
  // Month 13's running total is year 1 plus month 13.
  const cells13 = rows.nth(13).locator('td');
  const headers = await head.locator('th').allInnerTexts();
  const cumIdx = headers.findIndex((h) => /operator, cumulative/i.test(h));
  expect(cumIdx).toBeGreaterThan(0);
  await expect(cells13.nth(cumIdx)).toHaveText(money(totals[0].toOperator + r.months[12].toOperator));
  // The operator table, in the one-pager's order: revenue, retired, fee, share, prizes, settled, earns (net), cumulative.
  const op = page.locator('#tp-operator');
  await expect(op).toBeVisible();
  await expect(op).toContainText('What the operator makes');
  const opHeaders = await op.locator('thead th').allInnerTexts();
  expect(opHeaders.map((h) => h.toLowerCase())).toEqual(['year', 'revenue generated', 'retired by activity (50%)', 'licence fee', 'operator share (45% then 90%)', 'prize funding', 'settled directly', 'operator earns', 'operator earns, cumulative']);
  const opRows = op.locator('tbody tr');
  await expect(opRows).toHaveCount(4);
  const earnRows = await page.evaluate(() => TPearnRows(TPcalculate(TP, TPCconfig())));
  for (let y = 0; y < 3; y++) {
    const cells = opRows.nth(y).locator('td');
    await expect(cells.nth(0)).toHaveText('Year ' + (y + 1) + ' · 1 location');
    await expect(cells.nth(1)).toHaveText(money(totals[y].splitBase));
    await expect(cells.nth(2)).toHaveText(money(r.years[y].credited));
    await expect(cells.nth(3)).toHaveText(money(r.years[y].fee));
    await expect(cells.nth(4)).toHaveText(money(totals[y].operatorGross));
    await expect(cells.nth(5)).toHaveText(money(totals[y].prizeCost));
    await expect(cells.nth(6)).toHaveText(totals[y].trueUp + totals[y].balanceDue > 0 ? money(totals[y].trueUp + totals[y].balanceDue) : '—');
    // Earns is net of prizes and of what is settled directly; cumulative runs on that.
    await expect(cells.nth(7)).toHaveText(money(totals[y].operatorAfterTrueUp));
    await expect(cells.nth(8)).toHaveText(money(totals[y].cumulative.operatorAfterTrueUp));
    expect(earnRows.rows[y].earn).toBeCloseTo(totals[y].toOperator - totals[y].trueUp - totals[y].balanceDue, 6);
  }
  await expect(opRows.nth(3)).toContainText('Term');
  await expect(opRows.nth(3).locator('td').nth(7)).toHaveText(money(r.totalOperator - r.trueUpTotal - r.balanceDue));
  // Year 3's fee outruns the activity share on this deal, so that year alone is settled directly.
  expect(totals[0].trueUp).toBe(0);
  expect(totals[2].trueUp).toBeGreaterThan(0);
  await expect(opRows.nth(0).locator('td').nth(6)).toHaveText('—');
  await expect(opRows.nth(2).locator('td').nth(6)).toHaveText(money(totals[2].trueUp));
  // Drop the volume until every year needs settling: earns falls by exactly that.
  await page.evaluate(() => { TP.core.tournaments[0].participants = 50; TP.core.tournaments[0].customerCashCost = 50; TPsave(); TPrender(); });
  const short = await page.evaluate(() => { const rr = TPcalculate(TP, TPCconfig()); return { r: rr, t: TPyearTotals(rr) }; });
  expect(short.r.trueUpTotal).toBeGreaterThan(0);
  await expect(op.locator('tbody tr').nth(2).locator('td').nth(8)).toHaveText(money(short.t[2].cumulative.operatorAfterTrueUp));
  await expect(op.locator('tbody tr').nth(3).locator('td').nth(7)).toHaveText(money(short.r.totalOperator - short.r.trueUpTotal));
  // A loss prints as a loss: nothing clamps money at zero.
  await page.evaluate(() => { TP.core.tournaments[0].customerCashCost = 5000; TPsave(); TPrender(); });
  const loss = await page.evaluate(() => TPcalculate(TP, TPCconfig()));
  expect(loss.months[0].toOperator).toBeLessThan(0);
  await expect(page.locator('#tp-table tbody tr').first().locator('td.tp-neg').first()).toHaveText(money(loss.months[0].toOperator));
  await expect(op.locator('tbody tr').nth(3).locator('td').nth(7)).toHaveText(money(loss.totalOperator - loss.trueUpTotal - loss.balanceDue));
  expect(await page.evaluate(() => TPmoney(-1234.4))).toBe('-$1,234');
  await page.evaluate(() => { TP.core.tournaments[0].customerCashCost = 50; TPsave(); TPrender(); });
  // The brief carries the same table, row by row, with the same definitions.
  const brief = await page.evaluate(() => TPbrief());
  const earnBlock = brief.slice(brief.indexOf('WHAT YOU EARN, YEAR BY YEAR'), brief.indexOf('SENSITIVITY'));
  expect(earnBlock).toContain('Columns: Year | Revenue generated | Retired by activity (50%) | Licence fee | Your share (45% then 90%) | Prize funding | Settled directly | You earn | You earn, cumulative');
  const briefRows = await page.evaluate(() => TPearnRows(TPcalculate(TP, TPCconfig())));
  const n = (v) => Math.round(v * 100) / 100 + ' (' + (v < 0 ? '-$' : '$') + Math.abs(Math.round(v)).toLocaleString('en-US') + ')';
  expect(earnBlock).toContain('Year 1 · 1 location | ' + [n(briefRows.rows[0].revenue), n(briefRows.rows[0].retired), n(briefRows.rows[0].fee), n(briefRows.rows[0].share), n(briefRows.rows[0].prize), briefRows.rows[0].settled > 0 ? n(briefRows.rows[0].settled) : '—', n(briefRows.rows[0].earn), n(briefRows.rows[0].cumulative)].join(' | '));
  expect(earnBlock).toContain('Term | ' + n(briefRows.term.revenue));
  expect(earnBlock).toContain('Print this table in full, in this order, with the headings above.');
  // Customer view hides the operator table with the rest of the licence detail.
  await page.evaluate(() => { TP.customerMode = true; TPsave(); TPrender(); });
  await expect(op).toBeHidden();
  await expect(page.locator('#tp-table tbody tr.tp-total')).toHaveCount(0);
});

test('the combined model reads the partner and the base from the deal card instead of keeping its own', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { termYears: 3, fees: [78000, 102000, 126000], mau: 6000 });
  await expect(page.locator('#tpc-mau')).toHaveCount(0);
  await expect(page.locator('#tpc-name')).toHaveCount(0);
  const strip = page.locator('#tpc-from-deal');
  await expect(strip).toContainText('Fairway Social');
  await expect(strip).toContainText('6,000');
  await expect(strip).toContainText('3 years');
  await page.locator('#tp-deal-name').fill('Loco Bear');
  await page.locator('#tp-partner-site').fill('locobear.com');
  await expect(strip).toContainText('Loco Bear');
  await expect(strip).toContainText('locobear.com');
  await page.locator('#tp-mau').fill('8000');
  await expect(strip).toContainText('8,000');
  await expect(strip).toContainText('Users per location');
  await page.evaluate(() => { TP.openings = [{ month: 1, add: 1 }, { month: 14, add: 1 }, { month: 22, add: 2 }]; TPsave(); TPrenderControls(); TPrender(); });
  await expect(strip).toContainText('1 → 4 → 4');
  // The combined one-pager still labels itself from the deal name.
  await stubPrint(page);
  await page.evaluate(() => TPCprint());
  const html = await page.evaluate(() => window.__printHTML);
  expect(html).toContain('Loco Bear');
  expect(html).toContain('8,000');
});

test('the presenter is picked from the roster and fills the email, with a way to add someone else', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, {});
  const sel = page.locator('#tp-presenter-select');
  await expect(sel).toBeVisible();
  await expect(page.locator('#tp-presenter-other')).toBeHidden();
  const names = await sel.locator('option').allInnerTexts();
  expect(names).toEqual(['Choose…', 'Mat Weiss', 'Phil Probert', 'Brian Fagan', 'Jack Meyer', 'Nick Johnson', 'Dylan Robbins', 'Other…']);
  await sel.selectOption({ label: 'Phil Probert' });
  expect(await page.evaluate(() => [TP.presenter, TP.presenterEmail])).toEqual(['Phil Probert', 'Phil@playlucra.com']);
  await sel.selectOption({ label: 'Mat Weiss' });
  expect(await page.evaluate(() => [TP.presenter, TP.presenterEmail])).toEqual(['Mat Weiss', 'Mat.Weiss@playlucra.com']);
  const brief = await page.evaluate(() => TPbrief());
  expect(brief).toContain('  Mat Weiss · Mat.Weiss@playlucra.com');
  // Someone not on the list.
  await sel.selectOption('other');
  await expect(page.locator('#tp-presenter-other')).toBeVisible();
  await expect(page.locator('#tp-presenter-email-group')).toBeVisible();
  await page.locator('#tp-presenter').fill('Sam Rivera');
  await page.locator('#tp-presenter-email').fill('sam@playlucra.com');
  expect(await page.evaluate(() => [TP.presenter, TP.presenterEmail])).toEqual(['Sam Rivera', 'sam@playlucra.com']);
  await expect(sel).toHaveValue('other');
  // A saved deal that names a roster member comes back on the roster, email in step.
  await page.evaluate(() => { TP.presenter = 'Jack Meyer'; TP.presenterEmail = 'old@example.com'; TPsave(); TPrenderControls(); });
  await expect(sel).toHaveValue('3');
  expect(await page.evaluate(() => TP.presenterEmail)).toBe('Jack@playlucra.com');
});

test('tournaments duplicate, take preset prices and frequencies, and cost a percentage or nothing when sponsored', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 40000 });
  const list = page.locator('#tp-tournaments-list-core');
  await expect(list.locator('.tp-tour')).toHaveCount(1);
  // Duplicate lands right below with the same numbers.
  await list.locator('.tp-duplicate').first().click();
  await expect(list.locator('.tp-tour')).toHaveCount(2);
  await expect(list.locator('.tp-tour').nth(1).locator('.tp-tour-name')).toHaveValue('Weekly open (copy)');
  expect(await page.evaluate(() => [TP.core.tournaments[1].entryPrice, TP.core.tournaments[1].customerCashCost, TP.core.tournaments[0].id !== TP.core.tournaments[1].id])).toEqual([10, 200, true]);
  // Chips set the field and light up; a typed value reads as custom.
  const first = list.locator('.tp-tour').first();
  await first.locator('.tp-chips').first().locator('button', { hasText: '$25' }).click();
  await expect(page.locator('#tp-price-0')).toHaveValue('25');
  await expect(list.locator('.tp-tour').first().locator('.tp-chip.on').first()).toHaveText('$25');
  await list.locator('.tp-tour').first().locator('.tp-chips').nth(1).locator('button', { hasText: 'Daily' }).click();
  await expect(page.locator('#tp-events-0')).toHaveValue('30');
  await page.locator('#tp-events-0').fill('6');
  await expect(list.locator('.tp-tour').first().locator('.tp-chips').nth(1).locator('.tp-chip.on')).toHaveCount(0);
  await page.locator('#tp-events-0').fill('4');
  // Cost as a share of the reward value: the dollars follow the face value, and show for checking.
  const costSwitch = list.locator('.tp-tour').first().locator('.tp-cost-switch');
  await costSwitch.locator('button[data-cost="pct"]').click();
  expect(await page.evaluate(() => [TP.core.tournaments[0].costMode, TP.core.tournaments[0].costPct])).toEqual(['pct', 40]);
  await expect(list.locator('.tp-tour').first()).toContainText('$200 per event at a $500 reward');
  await page.locator('#tp-face-0').fill('1000');
  await expect(list.locator('.tp-tour').first()).toContainText('$400 per event at a $1,000 reward');
  // 400 x 4 for this one, plus the duplicate's 200 x 4.
  expect(await page.evaluate(() => TPcalculate(TP, TPCconfig()).months[0].prizeCost)).toBe(400 * 4 + 200 * 4);
  // Back to dollars keeps the same amount.
  await costSwitch.locator('button[data-cost="amount"]').click();
  await expect(page.locator('#tp-cost-0')).toHaveValue('400');
  // Sponsored: no cost to the customer, a name that reaches the brief.
  await costSwitch.locator('button[data-cost="sponsored"]').click();
  await page.locator('#tp-sponsor-0').fill('Coors Light');
  expect(await page.evaluate(() => TPcalculate(TP, TPCconfig()).months[0].prizeCost)).toBe(200 * 4);
  await expect(list.locator('.tp-tour').first()).toContainText('prizes sponsored by Coors Light, no prize funding');
  const brief = await page.evaluate(() => TPbrief());
  expect(brief).toContain('Sponsored prizes: Weekly open (sponsored by Coors Light).');
  // The customer summary and one-pager keep the reward at face value.
  await page.evaluate(() => { TP.core.tournaments.splice(1, 1); TPsave(); TPrenderTournaments(); TPrender(); });
  expect(await page.evaluate(() => TPcalculate(TP, TPCconfig()).totalPrizeCost)).toBe(0);
});

test('the chart has a size control that is remembered in this browser', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 40000 });
  const ctl = page.locator('#tp-chart-size');
  await expect(ctl).toBeVisible();
  await expect(ctl.locator('button.on')).toHaveText('M');
  const before = await page.locator('#tp-chart svg').getAttribute('viewBox');
  await ctl.locator('button[data-size="large"]').click();
  await expect(page.locator('#tp-chart')).toHaveClass(/size-large/);
  const after = await page.locator('#tp-chart svg').getAttribute('viewBox');
  expect(Number(after.split(' ')[3])).toBeGreaterThan(Number(before.split(' ')[3]));
  await page.reload();
  await page.locator('.tabs button', { hasText: 'Revenue Model' }).click();
  await expect(page.locator('#tp-chart-size button.on')).toHaveText('L');
  await page.locator('#tp-chart-size button[data-size="standard"]').click();
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
  await setBaseDeal(page, Object.assign({ mau: 1000000 }, MINI_H2H));

  await expect(page.locator('#tp-h2h-reach')).toHaveValue('1000000');
  await expect(page.locator('#tp-h2h-reach-note')).toContainText('following the app base');

  await page.locator('#tp-h2h-reach').fill('200000');
  await expect(page.locator('#tp-h2h-reach-note')).toContainText('overriding');
  expect(await page.evaluate(() => TPreach(TPstate(TP), 'mini'))).toBe(200000);

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
  await setBaseDeal(page, MINI_H2H);

  await page.locator('#tp-h2h-block .tp-mode-switch button[data-h2h="wagering"]').click();
  await expect(page.locator('#tph-plays')).toBeVisible();
  await expect(page.locator('#tph-rewardGames')).toHaveCount(0);
  await expect(page.locator('#tph-win')).toHaveCount(0);
  expect(await page.evaluate(() => TPh2h(TPstate(TP), TPCconfig(), 1).rewardValue)).toBe(0);

  await page.locator('#tp-h2h-block .tp-mode-switch button[data-h2h="rewards"]').click();
  await expect(page.locator('#tph-rewardGames')).toBeVisible();
  await expect(page.locator('#tph-plays')).toHaveCount(0);
  expect(await page.evaluate(() => TPh2h(TPstate(TP), TPCconfig(), 1).platformFee)).toBe(0);

  await page.locator('#tp-h2h-block .tp-mode-switch button[data-h2h="both"]').click();
  await expect(page.locator('#tph-plays')).toBeVisible();
  await expect(page.locator('#tph-rewardGames')).toBeVisible();
});

test('core head-to-head has its own inputs and scales with the locations open', async ({ page }) => {
  await openTab(page);
  await openH2H(page);
  await setBaseDeal(page, { includeH2H: true, mau: 8000, termYears: 2, fees: [60000, 60000, 0, 0, 0] });
  await expect(page.locator('#tp-h2h-block-core')).toBeVisible();
  await expect(page.locator('#tp-h2h-block')).toBeHidden();
  await expect(page.locator('#tp-h2h-reach-core')).toHaveValue('8000');
  await expect(page.locator('#tp-h2h-reach-note-core')).toContainText('users per location');
  for (const k of ['eng', 'plays', 'wager', 'rake']) await expect(page.locator('#tph-core-' + k)).toBeVisible();
  // The core inputs live on the deal, not on the Mini Game tab.
  await page.locator('#tph-core-eng').fill('12');
  await page.locator('#tph-core-rake').fill('15');
  expect(await page.evaluate(() => [TP.core.h2h.engagement, TP.core.h2h.feeRate, MG.eng])).toEqual([12, 15, 10]);
  await page.locator('#tp-h2h-block-core .tp-mode-switch button[data-h2h="wagering"]').click();
  await expect(page.locator('#tph-core-rewardGames')).toHaveCount(0);
  // 8,000 x 12% x 20 x $2 x 15% = $5,760 per location; three locations by month 24.
  await page.locator('#tp-loc-1').fill('3');
  const fees = await page.evaluate(() => { const r = TPcalculate(TP, TPCconfig()); return [r.months[0].products.core.h2hFee, r.months[23].products.core.h2hFee]; });
  expect(fees[0]).toBeCloseTo(5760, 6);
  expect(fees[1]).toBeCloseTo(5760 * 3, 6);
  await expect(page.locator('#tp-h2h-readout-core')).toContainText('averaged across the locations open');
});

test('head-to-head inputs stay in step with the Mini Game tab', async ({ page }) => {
  await openTab(page);
  await openH2H(page);
  await setBaseDeal(page, MINI_H2H);
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
  await page.locator('#tp-prod-core-h').uncheck();
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

  await page.locator('#tp-prod-core-h').check();
  await page.locator('#tp-prod-core-t').uncheck();
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

  await page.evaluate(() => { TP.core.tournaments = []; TPsave(); TPrenderTournaments(); TPrender(); });
  await page.locator('#tp-template-list button', { hasText: 'Load' }).click();
  expect(await page.evaluate(() => TP.core.tournaments.length)).toBe(1);

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
  await page.locator('#tp-h2h-reach-core').fill('250000');
  await page.reload();
  await page.locator('.tabs button', { hasText: 'Revenue Model' }).click();
  await expect(page.locator('#tp-fee-0')).toHaveValue('12345');
  await expect(page.locator('#tp-deal-name')).toHaveValue('Fairway Social');
  await expect(page.locator('#tp-h2h-reach-core')).toHaveValue('250000');
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
  await expect(page.locator('#tp-h2h-readout-core')).toContainText('Lucra takes');
  await expect(page.locator('#tpc-cases')).toContainText('To Lucra');

  await page.locator('#tp-show-lucra').uncheck();
  await expect(page.locator('#tp-lucra-note')).toContainText('hidden');
  await expect(page.locator('#tp-summary')).not.toContainText('Lucra earnings');
  await expect(page.locator('#tp-table thead')).not.toContainText('To Lucra');
  await expect(page.locator('#tp-heat thead')).not.toContainText('To Lucra');
  await expect(page.locator('#tp-h2h-readout-core')).not.toContainText('Lucra takes');
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

  await page.locator('#tp-prod-core-h').check();
  await page.locator('#tp-prod-core-t').uncheck();
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
  expect(await page.evaluate(() => TP.core.h2hOn)).toBe(true);

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
  await expect(page.locator('#tp-heat-controls-note')).toContainText('No head-to-head is selected above');
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
  await page.locator('#tp-prod-core-t').uncheck();
  await expect(page.locator('#tp-split-block')).toBeVisible();
  await expect(page.locator('#tp-post-lucra')).toBeEditable();
});

test('the take fee is a custom rate held between 5 and 25 per cent', async ({ page }) => {
  await openTab(page);
  await openH2H(page);
  await setBaseDeal(page, Object.assign({ fee: 60000, mau: 1000000 }, MINI_H2H));
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
  await setBaseDeal(page, Object.assign({ fee: 120000, mau: 1000000 }, MINI));
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
  await setBaseDeal(page, Object.assign({ fee: 120000, mau: 2000 }, MINI));
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
  const rec = await page.evaluate(() => TPrecommend(TP, TPrecBase(), TPrecOpts()));
  expect(rec.licenceGapYear).toBeGreaterThan(0);
  expect(rec.lucraGapYear).toBeGreaterThan(0);
  await expect(page.locator('.tp-rec-gap')).toContainText('not retired by play');
  // On a paid licence Lucra is paid the fee regardless, so the split-share gap
  // is information, not a line in the gap block; the levers are.
  await expect(page.locator('.tp-rec-gap')).not.toContainText("Lucra's share is");
  await expect(page.locator('.tp-rec-gap')).toContainText('What would close it');
  await page.locator('#tp-retarget').fill('5000');
  await expect(page.locator('.tp-rec-gap')).toContainText('stays out of every revenue figure');
  expect(await page.evaluate(() => TPrecommend(TP, TPrecBase(), TPrecOpts()).shortfallYear)).toBeCloseTo(rec.shortfallYear, 6);
});

test('applying the recommendation writes it into the model', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, Object.assign({ fee: 120000, mau: 1000000 }, MINI));
  await page.locator('#tp-rec-block button', { hasText: 'Recommend from the base' }).click();
  const before = await page.evaluate(() => ({ eng: MG.eng, rake: MG.rake, tours: TP.mini.tournaments.length }));
  await page.locator('#tp-rec-out button', { hasText: 'Apply these numbers' }).click();

  const after = await page.evaluate(() => ({
    eng: MG.eng, rake: MG.rake, names: TP.mini.tournaments.map((t) => t.name),
  }));
  expect(after.names).toEqual(['Weekly open', 'Monthly major']);
  expect(after.rake).toBeGreaterThanOrEqual(5);
  expect(after.rake).toBeLessThanOrEqual(25);
  expect(after.eng).toBeGreaterThan(0);
  expect(after).not.toEqual(before);
  // The applied deal is valid and still clears.
  expect(await page.evaluate(() => TPvalidate(TP))).toEqual([]);
  expect(await page.evaluate(() => TPrecommend(TP, TPrecBase(), TPrecOpts()).cleared)).toBe(true);
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

  await page.locator('#tp-prod-core-h').check();
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
  await setBaseDeal(page, Object.assign({ fee: 120000, mau: 2000 }, MINI));
  await page.evaluate(() => TPCsetMau(2000));
  await page.locator('#tp-rec-block button', { hasText: 'Recommend from the base' }).click();
  await expect(page.locator('.tp-rec-banner')).toHaveClass(/short/);
  const gap = await page.evaluate(() => TPrecommend(TP, TPrecBase(), TPrecOpts()).licenceGapYear);
  expect(gap).toBeGreaterThan(0);
  await page.locator('.tp-rec-gap button', { hasText: 'Add a sponsor for' }).click();
  // A sponsor line now exists for the gap, and the licence test passes.
  expect(await page.evaluate(() => TP.sponsors.length)).toBe(1);
  expect(await page.evaluate(() => TPrecommend(TP, TPrecBase(), TPrecOpts()).licenceGapYear)).toBe(0);
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
  await page.locator('#tph-core-eng').fill('20');
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
  await setBaseDeal(page, Object.assign({ fee: 60000, mau: 100000 }, MINI_H2H));
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
  const block = brief.slice(brief.indexOf('THE LICENCE, YEAR BY YEAR'), brief.indexOf('WHAT YOU EARN, YEAR BY YEAR'));
  expect(block).toContain('stepped 40000 / 60000 / 80000');
  expect(block).toContain('180000 ($180,000) over 3 years');
  for (const y of [1, 2, 3]) {
    expect(block).toMatch(new RegExp('Year ' + y + ': licence fee \\d+ \\(\\$[\\d,]+\\) · retired by activity \\d+'));
  }
  // The earnings table reconciles with the engine, year by year: earns is net of prizes and settling.
  const r = await page.evaluate(() => TPcalculate(TP, TPCconfig()));
  const earn = brief.slice(brief.indexOf('WHAT YOU EARN, YEAR BY YEAR'), brief.indexOf('SENSITIVITY'));
  const y2 = await page.evaluate(() => TPyearTotals(TPcalculate(TP, TPCconfig()))[1]);
  expect(earn).toMatch(new RegExp('Year 2 · 1 location \\| ' + Math.round(y2.splitBase * 100) / 100 + ' \\('));
  expect(earn).toContain('| ' + Math.round(y2.operatorAfterTrueUp * 100) / 100 + ' (');
  // Lucra's per-year share stays behind the internal line.
  const printable = brief.slice(0, brief.indexOf('INTERNAL — DO NOT PRINT'));
  expect(printable).not.toMatch(/Lucra share \d/);
  expect(brief.slice(brief.indexOf('INTERNAL'))).toMatch(/Year 2 Lucra share \d+ plus licence fee 60000/);
  // A waived licence says so on every row instead of printing zeros.
  await page.locator('#tp-free').check();
  const waived = await page.evaluate(() => TPbrief());
  expect(waived).toContain('Contract: licence waived');
  expect(waived).toMatch(/Year 1: licence waived/);
  expect(waived).toContain('Columns: Year | Revenue generated | Your share (');
});

test('the recommender names the lever that closes a gap and applies it', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, Object.assign({ fee: 120000, mau: 3000 }, MINI));
  await page.evaluate(() => TPCsetMau(3000));
  await page.locator('#tp-rec-block button', { hasText: 'Recommend from the base' }).click();
  await expect(page.locator('.tp-rec-banner')).toHaveClass(/short/);
  await expect(page.locator('.tp-rec-levers')).toContainText('What would close it');
  const first = page.locator('.tp-rec-levers li').first();
  await expect(first).toHaveClass(/clears/);
  await expect(first).toContainText('Take fee to');
  // Levers that do not clear still say what they do.
  await expect(page.locator('.tp-rec-levers li.short').first()).toContainText(/Gap falls to|Does not move/);
  // Locations never appear as a lever for a single-site customer.
  await expect(page.locator('.tp-rec-levers li', { hasText: 'location' })).toHaveCount(0);

  await first.locator('button', { hasText: 'Apply' }).click();
  const rake = await page.evaluate(() => MG.rake);
  expect(rake).toBeGreaterThan(19);
  expect(rake).toBeLessThanOrEqual(25);
  await expect(page.locator('.tp-rec-banner')).toContainText('clears the licence');
});

test('the reward cost ratio is the venue\'s own number, and the lever uses it', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, Object.assign({ fee: 120000, mau: 3000 }, MINI));
  await page.evaluate(() => TPCsetMau(3000));
  await expect(page.locator('#tp-reward-ratio')).toHaveValue('');
  await page.locator('#tp-reward-ratio').fill('30');
  expect(await page.evaluate(() => TPrewardCostRatio(TPstate(TP)))).toBeCloseTo(0.3, 9);
  await page.locator('#tp-rec-block button', { hasText: 'Recommend from the base' }).click();
  await expect(page.locator('.tp-rec-levers')).toContainText('cost the venue 30% of it, as entered');
});

test('two deal structures can be saved and compared side by side', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 60000, includeH2H: true, mau: 100000 });
  await page.evaluate(() => { TPCsetMau(100000); MG.eng = 10; MG.plays = 20; MG.wager = 2; MG.rake = 10; MGsync(); MGu(); TPrender(); });
  await expect(page.locator('#tp-compare-out')).toContainText('Nothing saved yet');
  await page.locator('#tp-compare-block button', { hasText: 'Save as A' }).click();

  // Change to a waived 50/50 deal and save it as B.
  await page.locator('#tp-free').check();
  await page.locator('#tp-post-operator').fill('50');
  await page.locator('#tp-post-lucra').fill('50');
  await page.locator('#tp-compare-block button', { hasText: 'Save as B' }).click();

  const table = page.locator('.tp-compare');
  await expect(table).toBeVisible();
  await expect(table).toContainText('Fairway Social · paid');
  await expect(table).toContainText('Fairway Social · waived');
  await expect(table.locator('tr', { hasText: 'Licence' }).first()).toContainText('$60,000');
  await expect(table.locator('tr', { hasText: 'Licence' }).first()).toContainText('Waived');
  await expect(table.locator('tr', { hasText: 'Split' })).toContainText('90 / 10');
  await expect(table.locator('tr', { hasText: 'Split' })).toContainText('50 / 50');
  await expect(table.locator('tr', { hasText: 'Payoff' })).toContainText('Nothing to retire');
  // Deltas read B against A, and appear in column B only.
  await expect(table.locator('.tp-compare-delta').first()).toContainText('vs A');
  const revenueRow = table.locator('tr', { hasText: 'Revenue generated' });
  await expect(revenueRow.locator('td').nth(0).locator('.tp-compare-delta')).toHaveCount(0);
  await expect(revenueRow.locator('td').nth(1).locator('.tp-compare-delta')).toHaveCount(1);

  // Loading A restores the paid deal.
  await page.locator('#tp-compare-load-a').click();
  await expect(page.locator('#tp-free')).not.toBeChecked();
  await expect(page.locator('#tp-post-operator')).toHaveValue('90');
  // Customer view keeps the comparison but drops the internal rows.
  await page.locator('#tp-customer-mode').check();
  await expect(table.locator('tr', { hasText: 'Revenue generated' })).toBeVisible();
  await expect(table.locator('tr', { hasText: 'Split' })).toHaveCount(0);
  await page.locator('#tp-customer-mode').uncheck();
  await page.locator('#tp-compare-block button', { hasText: 'Clear both' }).click();
  await expect(page.locator('#tp-compare-out')).toContainText('Nothing saved yet');
});

test('a deal link is created through the API and restores the deal on open', async ({ page }) => {
  let posted = null;
  await page.route('**/api/deal*', async (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      posted = req.postDataJSON();
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, url: 'http://127.0.0.1/?deal=v1.stub', expiresInDays: 14 }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, deal: { kind: 'revenue-model', tp: posted.deal.tp, mg: posted.deal.mg } }) });
  });
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

  await openTab(page);
  await setBaseDeal(page, { fee: 45000, termYears: 2, fees: [45000, 55000, 0, 0, 0], includeH2H: true, mau: 100000 });
  await page.evaluate(() => { TPCsetMau(100000); MG.eng = 13; MG.rake = 11; MGsync(); MGu(); TPrender(); });
  await page.locator('#tp-loc-1').fill('4');
  const share = page.locator('#tp-share-btn');
  await expect(share).toHaveText('Team link (internal)');
  await share.click();
  await expect(share).toContainText(/Link (copied|ready)/);
  await expect(page.locator('#tp-share-out input')).toHaveValue('http://127.0.0.1/?deal=v1.stub');
  expect(posted.deal.tp.locations[1]).toBe(4);
  expect(posted.deal.mg.eng).toBe(13);
  expect(JSON.stringify(posted)).not.toContain('SCENARIO');

  // A fresh page with a stale local state opens the link and lands on the tab.
  await page.evaluate(() => { TP.dealName = 'Something else'; TP.locations = [1, 1, 1, 1, 1]; TPsave(); MG.eng = 2; MGsync(); });
  await page.goto('/?deal=v1.stub');
  await expect(page.locator('#tournaments')).toBeVisible();
  await expect(page.locator('#tp-loc-1')).toHaveValue('4');
  await expect(page.locator('#tp-deal-name')).toHaveValue('Fairway Social');
  expect(await page.evaluate(() => MG.eng)).toBe(13);
  expect(await page.evaluate(() => MG.rake)).toBe(11);
  expect(page.url()).not.toContain('deal=');
});

test('a payment at signing is entered on the deal and printed in the brief', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 60000 });
  await expect(page.locator('#tp-upfront-mode')).toHaveValue('none');
  await expect(page.locator('#tp-upfront-value-group')).toBeHidden();
  await page.locator('#tp-upfront-mode').selectOption('pct');
  await expect(page.locator('#tp-upfront-value-group')).toBeVisible();
  await expect(page.locator('#tp-upfront-suffix')).toBeVisible();
  await page.locator('#tp-upfront-value').fill('25');
  await expect(page.locator('#tp-upfront-note')).toContainText('$15,000 of the year-1 fee');
  const r = await page.evaluate(() => TPcalculate(TP, TPCconfig()));
  expect(r.totalUpfrontCredited).toBe(15000);
  expect(r.months[0].upfrontCredit).toBe(15000);
  const brief = await page.evaluate(() => TPbrief());
  expect(brief).toMatch(/Year 1: licence fee 60000 \(\$60,000\) · retired by activity [\d.]+ \(\$[\d,]+\) \(from the licence share [\d.]+ \(\$[\d,]+\), from the operator's share 0 \(\$0\)\) \(of which paid at signing 15000 \(\$15,000\)\)/);
  expect(brief).toContain('$15,000 paid at signing is credited against the licence in month 1 and is not revenue.  [customer fact]');
  // Switching to a dollar amount keeps the value and swaps the unit.
  await page.locator('#tp-upfront-mode').selectOption('amount');
  await expect(page.locator('#tp-upfront-prefix')).toBeVisible();
  await expect(page.locator('#tp-upfront-suffix')).toBeHidden();
  expect(await page.evaluate(() => TPcalculate(TP, TPCconfig()).totalUpfrontCredited)).toBe(25);
  await page.locator('#tp-upfront-mode').selectOption('none');
  expect(await page.evaluate(() => TPcalculate(TP, TPCconfig()).totalUpfrontCredited)).toBe(0);
});

test('every input carries a provenance badge, and estimates can be shown on their own', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { fee: 60000, includeH2H: true, mau: 100000 });
  await openH2H(page);
  await page.evaluate(() => { TPrenderH2Hfields(true); TPrender(); });
  const untagged = await page.evaluate(() => Array.from(document.querySelectorAll('#tournaments .input-group'))
    .filter((g) => g.querySelector('input,select') && !g.closest('#forecast') && !g.closest('#wagerbreakeven') && !g.dataset.prov)
    .map((g) => (g.querySelector('input,select') || {}).id));
  expect(untagged).toEqual([]);
  // The note wins where it names a source; the field type decides otherwise.
  await expect(page.locator('#tp-fee-0').locator('xpath=ancestor::div[contains(@class,"input-group")][1]')).toHaveAttribute('data-prov', 'fact');
  await expect(page.locator('#tp-part-0').locator('xpath=ancestor::div[contains(@class,"input-group")][1]')).toHaveAttribute('data-prov', 'estimate');
  await expect(page.locator('#tph-eng').locator('xpath=ancestor::div[contains(@class,"input-group")][1]')).toHaveAttribute('data-prov', 'estimate');
  await expect(page.locator('#tp-mau').locator('xpath=ancestor::div[contains(@class,"input-group")][1]')).toHaveAttribute('data-prov', 'system');
  await expect(page.locator('#tp-part-0').locator('xpath=ancestor::div[contains(@class,"input-group")][1]/span[contains(@class,"tp-prov")]')).toHaveText('Estimate');
  await expect(page.locator('#tp-estimates-count')).toHaveText(/\(\d+\)/);

  await page.locator('#tp-estimates-only').check();
  await expect(page.locator('body')).toHaveClass(/tp-estimates/);
  const feeOpacity = await page.locator('#tp-fee-0').locator('xpath=ancestor::div[contains(@class,"input-group")][1]').evaluate((el) => getComputedStyle(el).opacity);
  const partOpacity = await page.locator('#tp-part-0').locator('xpath=ancestor::div[contains(@class,"input-group")][1]').evaluate((el) => getComputedStyle(el).opacity);
  expect(Number(feeOpacity)).toBeLessThan(0.5);
  expect(Number(partOpacity)).toBe(1);
  // Internal control: the customer never sees the filter.
  await page.locator('#tp-customer-mode').check();
  await expect(page.locator('#tp-estimates-only')).toBeHidden();
  await page.locator('#tp-customer-mode').uncheck();
  await page.locator('#tp-estimates-only').uncheck();
  await expect(page.locator('body')).not.toHaveClass(/tp-estimates/);
});

test('the opening schedule is entered in months, shown against the calendar, and printed as fact', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { termYears: 3, fees: [60000, 60000, 60000, 0, 0], mau: 8000 });
  await page.locator('#tp-loc-1').fill('3');
  await page.locator('#tp-loc-2').fill('4');
  // Until months are given, the spread is shown and labelled as an estimate.
  await expect(page.locator('#tp-openings')).toContainText('spread evenly');
  await expect(page.locator('#tp-openings .tp-schedule-item.est')).toHaveCount(3);
  const spread = await page.evaluate(() => TPcalculate(TP, TPCconfig()).totalHandle);
  let brief = await page.evaluate(() => TPbrief());
  expect(brief).toMatch(/Locations: 1 → 3 → 4 across the term: .*\[estimate\]/);

  await page.locator('#tp-openings button', { hasText: 'Set the exact months' }).click();
  await expect(page.locator('#tp-open-month-1')).toHaveValue('13');
  await expect(page.locator('#tp-open-cal-1')).toHaveText('Jan +1y');
  // The customer says month 14 for two and month 30 for the fourth: the same
  // counts per year as the spread, later in each year.
  await page.locator('#tp-open-add-1').fill('2');
  await page.locator('#tp-open-month-1').fill('14');
  await page.locator('#tp-open-month-2').fill('30');
  await page.locator('#tp-open-add-3').fill('0');
  await expect(page.locator('#tp-open-cal-1')).toHaveText('Feb +1y');
  expect(await page.evaluate(() => TPopenings(TPstate(TP)))).toEqual([1, 14, 14, 30]);
  await expect(page.locator('#tp-loc-1')).toHaveValue('3');
  await expect(page.locator('#tp-loc-2')).toHaveValue('4');
  const stated = await page.evaluate(() => TPcalculate(TP, TPCconfig()).totalHandle);
  expect(stated).toBeLessThan(spread);
  brief = await page.evaluate(() => TPbrief());
  expect(brief).toContain('Locations: 1 → 3 → 4 across the term: 1 location in month 1, 2 locations in month 14, 1 location in month 30  [customer fact]');
  expect(brief).toContain('One licence covers every location. Adding sites during the term adds no fee.  [customer fact]');
  // Editing a per-year count drops back to the spread; the schedule can also be cleared.
  await page.locator('#tp-openings button', { hasText: 'Back to counts per year' }).click();
  await expect(page.locator('#tp-openings')).toContainText('spread evenly');
  expect(await page.evaluate(() => TPlocations(TPstate(TP)))).toEqual([1, 3, 4]);
  // It survives a reload.
  await page.locator('#tp-openings button', { hasText: 'Set the exact months' }).click();
  await page.reload();
  await page.locator('.tabs button', { hasText: 'Revenue Model' }).click();
  await expect(page.locator('#tp-open-month-1')).toHaveValue('13');
});

test('a core tournament runs at every location or once across the network, and mini games never per location', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { termYears: 2, fees: [60000, 60000, 0, 0, 0], mau: 8000, customerType: 'both', mini: { on: true, tournamentsOn: true, h2hOn: false } });
  await page.locator('#tp-loc-1').fill('3');
  await expect(page.locator('#tp-tournaments-list-core .tp-tour').first().locator('.tp-scope-switch')).toBeVisible();
  await expect(page.locator('#tp-tournaments-list-mini .tp-scope-switch')).toHaveCount(0);
  let r = await page.evaluate(() => TPcalculate(TP, TPCconfig()));
  expect(r.months[23].products.core.prizeCost).toBe(800 * 3);
  expect(r.months[23].products.mini.prizeCost).toBe(r.months[0].products.mini.prizeCost);
  await expect(page.locator('#tp-tournaments-list-core .tp-tour-readout').first()).toContainText('prize funding');

  await page.locator('#tp-tournaments-list-core .tp-scope-switch button[data-scope="network"]').first().click();
  r = await page.evaluate(() => TPcalculate(TP, TPCconfig()));
  expect(r.months[23].products.core.prizeCost).toBe(800);
  expect(r.months[23].products.core.handle).toBeCloseTo(4000 * 3, 6);
  // The customer summary names where each tournament runs.
  await page.locator('#tp-view-tournaments-btn').click();
  await expect(page.locator('#tp-customer-cards')).toContainText('One across all locations');
  await expect(page.locator('#tp-customer-cards')).toContainText('Across the app');
});

test('one participation figure drives every tournament, and the programme at a glance reads it back', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { termYears: 2, fees: [60000, 60000, 0, 0, 0], mau: 8000, includeH2H: true });
  await page.locator('#tp-loc-1').fill('2');
  await page.evaluate(() => { TPaddTournament('core'); });
  const list = page.locator('#tp-tournaments-list-core');
  // Off by default: every card keeps its own participation controls.
  await expect(list.locator('#tp-universal-on-core')).not.toBeChecked();
  await expect(list.locator('.tp-tour .tp-participation-switch')).toHaveCount(2);
  await list.locator('#tp-universal-on-core').check();
  // Seeded from the first tournament (a count of 100), so nothing jumps.
  await expect(list.locator('#tp-universal-count-core')).toHaveValue('100');
  await expect(list.locator('.tp-tour .tp-participation-switch')).toHaveCount(0);
  await expect(list.locator('.tp-tour .tp-follows')).toHaveCount(2);
  let s = await page.evaluate(() => TPstate(TP));
  expect(s.core.tournaments.map((t) => t.participants)).toEqual([100, 100]);
  // Switch to a share and type: both move; then one keeps its own number.
  await list.locator('.tp-universal .tp-participation-switch button').nth(1).click();
  await list.locator('#tp-universal-pct-core').fill('5');
  s = await page.evaluate(() => TPstate(TP));
  expect(s.core.tournaments.map((t) => t.participantPct)).toEqual([5, 5]);
  expect(s.core.tournaments.map((t) => t.basis)).toEqual(['mau', 'mau']);
  await list.locator('.tp-tour').nth(1).locator('input[id^="tp-own"]').check();
  await expect(list.locator('.tp-tour').nth(1).locator('.tp-participation-switch')).toBeVisible();
  await list.locator('.tp-tour').nth(1).locator('input[id^="tp-part"]').fill('2');
  s = await page.evaluate(() => TPstate(TP));
  expect(s.core.tournaments.map((t) => t.participantPct)).toEqual([5, 2]);
  expect(s.core.tournaments[1].own).toBe(true);
  await expect(list.locator('.tp-universal')).toContainText('Applies to 1 of 2 tournaments');
  // The case band scales the shared figure like any other.
  const cases = await page.evaluate(() => TPCcases(TPCconfig()).map((c) => c.result.annualRevenueGenerated));
  expect(cases[0]).toBeLessThan(cases[1]); expect(cases[1]).toBeLessThan(cases[2]);

  // The programme at a glance: cadence, cost, participation, margin, per tournament; head-to-head in short.
  const prog = page.locator('#tp-programme');
  await expect(prog).toBeVisible();
  await expect(prog).toContainText('Programme at a glance');
  await expect(prog.locator('.tp-programme-table tbody tr')).toHaveCount(3);
  const first = prog.locator('.tp-programme-table tbody tr').first();
  await expect(first).toContainText('Weekly · 4 a month');
  await expect(first).toContainText('5% of users per location ≈ 400');
  await expect(first).toContainText('$200');
  await expect(first).toContainText('At every location (2)');
  await expect(prog.locator('.tp-programme-table tr.tp-total')).toContainText('Margin a month');
  await expect(prog.locator('.tp-h2h-short')).toContainText('Matchups per player');
  await expect(prog.locator('.tp-h2h-short')).toContainText('Take fee');
  // Copy gives the same table as text, and the brief carries both blocks.
  const text = await page.evaluate(() => TPprogrammeText({ who: 'You' }) + '\n' + TPh2hSummaryText({ customer: true }));
  expect(text).toContain('Columns: Tournament | Cadence | Entry | Participation');
  expect(text).toContain('Weekly open | Weekly · 4 a month | $10 | 5% of users per location ≈ 400');
  expect(text).toContain('HEAD-TO-HEAD · IN YOUR VENUES');
  expect(text).not.toMatch(/take fee/i);
  const brief = await page.evaluate(() => TPbrief());
  expect(brief).toContain('PROGRAMME AT A GLANCE');
  expect(brief).toContain('HEAD-TO-HEAD, IN SHORT');
  expect(brief).toContain('In short: About');
  // A subsidised tournament shows a negative margin, in red, never clamped.
  await page.evaluate(() => { TP.core.tournaments[0].customerCashCost = 9000; TPsave(); TPrender(); });
  await expect(prog.locator('.tp-programme-table tbody tr').first().locator('td.tp-neg')).toContainText('-$');
  // Customer view keeps the block (without the take fee) and hides the copy button.
  await page.locator('#tp-customer-mode').check();
  await expect(prog.locator('.tp-h2h-short')).not.toContainText('Take fee');
  await expect(prog.locator('button')).toBeHidden();
  await page.locator('#tp-customer-mode').uncheck();
});

test('a deal saved before the split migrates onto core with the head-to-head numbers it had', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('lucra-tournament-payoff-v1', JSON.stringify({
      dealName: 'Old venue', termYears: 2, annualFees: [60000, 60000], includeTournaments: true, includeH2H: true, mau: 50000, h2hReach: 20000, locations: [1, 2],
      tournaments: [{ id: 'a', name: 'Legacy open', entryPrice: 10, eventsPerMonth: 4, basis: 'count', participants: 100, customerCashCost: 200, rewardFaceValue: 500 }],
    }));
    MG.eng = 14; MG.plays = 30; MG.wager = 3; MG.rake = 12;
  });
  await page.locator('.tabs button', { hasText: 'Revenue Model' }).click();
  await expect(page.locator('#tp-deal-name')).toHaveValue('Old venue');
  const s = await page.evaluate(() => ({ core: TP.core, mini: TP.mini.on, ct: TP.customerType, legacy: TP.tournaments }));
  expect(s.legacy).toBeUndefined();
  expect(s.ct).toBe('venues');
  expect(s.mini).toBe(false);
  expect(s.core.on).toBe(true);
  expect(s.core.h2hOn).toBe(true);
  expect(s.core.h2h.reach).toBe(20000);
  expect(s.core.h2h.engagement).toBe(14);
  expect(s.core.h2h.playsPerUser).toBe(30);
  expect(s.core.h2h.feeRate).toBe(12);
  expect(s.core.tournaments.map((t) => t.name)).toEqual(['Legacy open']);
  await expect(page.locator('#tp-h2h-block-core')).toBeVisible();
  await expect(page.locator('#tp-loc-1')).toHaveValue('2');
  // 20,000 x 14% x 30 x $3 x 12% = $30,240 in month 1.
  expect(await page.evaluate(() => TPcalculate(TP, TPCconfig()).months[0].products.core.h2hFee)).toBeCloseTo(30240, 6);
});

test('the customer sandbox: a passcoded page that plays with their numbers and never shows the terms', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { termYears: 3, fees: [60000, 60000, 60000, 0, 0], mau: 8000, includeH2H: true });
  await page.locator('#tp-loc-1').fill('3');
  await page.locator('#tp-loc-2').fill('5');
  await page.evaluate(() => { TP.presenter = 'Mat'; TP.splitMode = 'custom'; TP.custom = { credit: 55, operator: 35, lucra: 10 }; TPsave(); TPrender(); });
  const fold = page.locator('#tp-sandbox-fold');
  // The fold is open by default; the Customer link button beside the team
  // link lands in it with a suggested passcode ready to overwrite.
  await expect(fold).toHaveAttribute('open', '');
  await page.evaluate(() => { document.getElementById('tp-sandbox-fold').open = false; });
  await page.locator('#tp-customer-link-btn').click();
  await expect(fold).toHaveAttribute('open', '');
  await expect(page.locator('#tp-sandbox-pass')).toBeFocused();
  expect(await page.locator('#tp-sandbox-pass').inputValue()).toMatch(/^[a-z]+-\d{4}$/);
  await expect(page.locator('#tp-sandbox-btn')).toHaveText('Create customer link');
  await page.locator('#tp-sandbox-days').selectOption('7');
  await page.locator('#tp-sandbox-pass').fill('bear');
  await page.locator('#tp-sandbox-btn').click();
  await expect(page.locator('#tp-sandbox-btn')).toContainText(/Link (copied|ready)/);
  const url = await page.locator('#tp-sandbox-out input').inputValue();
  expect(url).toMatch(/\/play\?deal=v1\./);
  await expect(page.locator('#tp-sandbox-note')).toContainText('7 days · passcode required');
  // The sandbox is internal: customer view hides the control.
  await page.locator('#tp-customer-mode').check();
  await expect(fold).toBeHidden();
  await page.locator('#tp-customer-mode').uncheck();

  // The customer opens it in a browser with nothing of ours in it.
  const customer = await page.context().browser().newContext();
  const cp = await customer.newPage();
  await cp.goto(url);
  await expect(cp.locator('#gate')).toBeVisible();
  await cp.locator('#pass').fill('wrong');
  await cp.locator('#gate button').click();
  await expect(cp.locator('#gate-err')).toContainText('passcode');
  await cp.locator('#pass').fill('bear');
  await cp.locator('#gate button').click();
  await expect(cp.locator('#model h1')).toHaveText('Fairway Social');
  await expect(cp.locator('#model')).toContainText('Prepared by Mat');
  // The headline numbers sit in a bar that stays on screen; no side column.
  await expect(cp.locator('#bar')).toContainText('Revenue generated / yr');
  await expect(cp.locator('#bar')).toContainText('You earn / yr');
  await expect(cp.locator('#bar')).toContainText('Licence retired by activity');
  expect(await cp.locator('#bar').evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
  expect(await cp.locator('#results').evaluate((el) => el.textContent)).not.toContain('What the model says');
  expect(await cp.evaluate(() => { const a = document.getElementById('inputs').getBoundingClientRect(), b = document.getElementById('results').getBoundingClientRect(); return b.top >= a.bottom && Math.abs(a.left - b.left) < 2; })).toBe(true);
  await expect(cp.locator('#term .keep')).toContainText('The licence is retired out of the licence share alone. Your share is never diverted to it.');
  await expect(cp.locator('#term .keep .rows b.zero')).toHaveText('$0');
  const text = await cp.locator('#model').innerText();
  expect(text).not.toMatch(BLOCKED);
  // The customer sees the licence share and their own share as percentages; Lucra's is never printed.
  const rates = await page.evaluate(() => TPsplitRates(TPstate(TP)));
  const pc = (v) => (Math.round(v * 1000) / 10) + '%';
  expect(text.toLowerCase()).toContain('to licence share (' + pc(rates.credit) + ')');
  expect(text.toLowerCase()).toContain('your share (' + pc(rates.operator) + ' then ' + pc(rates.postOperator) + ')');
  expect(text).not.toMatch(/Lucra['’]s share|split/);
  // (Head-to-head engagement is a customer input and may print as a bare percentage; the split never does.)
  expect(text).not.toMatch(new RegExp('\\(' + pc(rates.lucra) + '\\)|' + pc(rates.lucra) + ' (then|of the pool|share)'));
  expect(text).not.toContain('(' + pc(rates.postLucra) + ')');
  // The combined model, the payoff over the term, what they make, and the month-by-month map.
  await expect(cp.locator('#results')).toContainText('Combined revenue model');
  await expect(cp.locator('#results .stat')).toHaveCount(4);
  await expect(cp.locator('#results .case')).toHaveCount(3);
  await expect(cp.locator('#term')).toContainText('Licence payoff over the term');
  await expect(cp.locator('#term .bars.pay i')).toHaveCount(36);
  await expect(cp.locator('#term .keep .rows div')).toHaveCount(5);
  await expect(cp.locator('#term .keep')).toContainText('You earn over the term');
  await expect(cp.locator('#term .keep')).toContainText('Settled directly');
  await expect(cp.locator('#term')).toContainText('What you make');
  const makeHeaders = (await cp.locator('#term table').nth(1).locator('thead th').allInnerTexts()).map((h) => h.toLowerCase());
  expect(makeHeaders).toEqual(['year', 'revenue generated', 'retired by activity (' + pc(rates.credit) + ')', 'licence fee', 'your share (' + pc(rates.operator) + ' then ' + pc(rates.postOperator) + ')', 'prize funding', 'settled directly', 'you earn', 'you earn, cumulative']);
  await expect(cp.locator('#term')).toContainText('Month by month');
  // Licence by year, what you make, the programme at a glance, head-to-head in short, month by month.
  const tables = cp.locator('#term table');
  await expect(tables).toHaveCount(5);
  await expect(tables.nth(4).locator('tbody tr')).toHaveCount(36 + 3 + 1);
  await expect(tables.nth(4).locator('tbody tr.total')).toContainText('Term');
  const html = await cp.content();
  expect(html).not.toContain('"credit"');
  expect(html).not.toContain('lucra');

  // Three location scenarios, side by side; picking one sets the openings, and its month is theirs.
  await expect(cp.locator('#scen .sc')).toHaveCount(3);
  await expect(cp.locator('#scen .sc.on')).toHaveCount(0);
  await expect(cp.locator('#scen .sc').nth(0)).toContainText('This location only');
  await expect(cp.locator('#scen .sc').nth(1)).toContainText('A second location');
  await expect(cp.locator('#scen .sc').nth(2)).toContainText('A second and a third');
  await cp.locator('#scen .sc').nth(1).locator('button').click();
  await expect(cp.locator('#scen .sc.on')).toHaveCount(1);
  await expect(cp.locator('#scen .sc.on')).toContainText('A second location');
  await expect(cp.locator('#sched .row')).toHaveCount(2);
  await expect(cp.locator('#sched .row').nth(1).locator('input').first()).toHaveValue('13');
  await expect(cp.locator('#bar')).toContainText('$180,000 over the term');
  await cp.locator('#scen input[data-which="B-second"]').fill('20');
  await expect(cp.locator('#sched .row').nth(1).locator('input').first()).toHaveValue('20');
  await expect(cp.locator('#scen .sc.on')).toContainText('A second location');
  await cp.locator('#scen .sc').nth(0).locator('button').click();
  await expect(cp.locator('#scen .sc.on')).toContainText('This location only');
  const soloFacts = await cp.evaluate(() => FACTS.locations);
  expect(soloFacts).toEqual([1, 1, 1]);
  // Back to the proposal's own counts per year: no scenario in use.
  await cp.locator('#sched button', { hasText: 'Back to counts per year' }).click();
  await expect(cp.locator('#sched button', { hasText: 'Set the exact months' })).toBeVisible();
  // One location all term still reads as scenario A; their own counts (1 → 3 → 5) match none.
  await expect(cp.locator('#scen .sc.on')).toContainText('This location only');
  const yearInputs = cp.locator('#inputs .f').nth(1).locator('input[type="number"]');
  await yearInputs.nth(1).fill('3');
  await yearInputs.nth(2).fill('5');
  await expect(cp.locator('#scen .sc.on')).toHaveCount(0);
  // Their numbers move the model; the licence does not move.
  const before = await cp.locator('#bar .tile strong').first().innerText();
  await cp.locator('#inputs input[type="number"]').first().fill('16000');
  await expect(cp.locator('#bar .tile strong').first()).not.toHaveText(before);
  await expect(cp.locator('#bar')).toContainText('$180,000 over the term');
  // Exact months, and a new tournament.
  await cp.locator('#sched button', { hasText: 'Set the exact months' }).click();
  await expect(cp.locator('#sched .row')).toHaveCount(5);
  // One participation figure for every tournament, on their side too; the programme table reads it back.
  await cp.locator('#inputs .tour.uni input[type="checkbox"]').first().check();
  await expect(cp.locator('#inputs .tour.uni select')).toBeVisible();
  await cp.locator('#inputs .tour.uni select').selectOption('mau');
  await cp.locator('#inputs .tour.uni input[type="number"]').fill('6');
  await expect(cp.locator('#inputs .tour').nth(1)).toContainText('6% of users, set above for every tournament');
  await expect.poll(async () => cp.evaluate(() => FACTS.core.tournaments.map((t) => t.basis + ':' + t.participantPct).join(','))).toMatch(/^(mau:6,?)+$/);
  await expect(cp.locator('#term')).toContainText('Your programme at a glance');
  await expect(cp.locator('#term')).toContainText('Head-to-head, in short');
  await expect(cp.locator('#term table.h2s')).toContainText('Matchups per player');
  expect(await cp.locator('#term').evaluate((el) => el.textContent)).not.toMatch(/take fee|rake/i);
  await cp.locator('#inputs .tour').nth(1).locator('label.row input[type="checkbox"]').check();
  await expect(cp.locator('#inputs .tour').nth(1).locator('input[type="number"]').nth(2)).toBeVisible();
  await cp.locator('#inputs .tour.uni input[type="checkbox"]').first().uncheck();
  await cp.locator('#inputs button', { hasText: 'Add a tournament' }).first().click();
  await expect(cp.locator('#inputs .tour:not(.uni)')).toHaveCount(2);
  await expect(cp.locator('#res-err')).toBeHidden();

  // The seller's dashboard saw all of it: the wrong passcode, the open, the edits.
  await expect(page.locator('#tp-sandbox-note')).toContainText('recorded on the links dashboard');
  await expect(page.locator('#tp-sandbox-manage')).toHaveAttribute('href', '/links');
  const dp = await page.context().newPage();
  await dp.goto('/links');
  await expect(dp.locator('#gate')).toBeVisible();
  await dp.locator('#key').fill('wrong');
  await dp.locator('#enter').click();
  await expect(dp.locator('#gate-err')).toContainText('not right');
  await dp.locator('#key').fill('playwright-dashboard-key');
  await dp.locator('#enter').click();
  await expect(dp.locator('#main')).toBeVisible();
  const row = dp.locator('#main tbody tr').filter({ hasText: 'Fairway Social' }).first();
  await expect(row).toBeVisible();
  await expect(row.locator('.pill')).toHaveText('open');
  await expect(row).toContainText('1 wrong attempt');
  await expect(row.locator('td').nth(5)).toContainText('1');
  await expect(row.locator('td').nth(5)).toContainText('first');
  await expect(row.locator('td').nth(4).locator('code')).toHaveText('bear');
  // Change the passcode from the dashboard: the customer's page, still open, needs the new one from now on.
  dp.once('dialog', (d) => d.accept('otter-9001'));
  await row.locator('button[data-act="passcode"]').click();
  await expect(dp.locator('#main tbody tr').filter({ hasText: 'Fairway Social' }).first().locator('td').nth(4).locator('code')).toHaveText('otter-9001');
  await cp.locator('#inputs input[type="number"]').first().fill('16500');
  await expect(cp.locator('#res-err')).toContainText('passcode is not right');
  const cpNew = await customer.newPage();
  await cpNew.goto(url);
  await cpNew.locator('#pass').fill('bear');
  await cpNew.locator('#gate button').click();
  await expect(cpNew.locator('#gate-err')).toContainText('passcode');
  await cpNew.locator('#pass').fill('otter-9001');
  await cpNew.locator('#gate button').click();
  await expect(cpNew.locator('#model h1')).toHaveText('Fairway Social');
  await cpNew.close();
  await cp.reload();
  await cp.locator('#pass').fill('otter-9001');
  await cp.locator('#gate button').click();
  await expect(cp.locator('#model h1')).toHaveText('Fairway Social');
  const edits = Number((await row.locator('td').nth(6).innerText()).split('\n')[0]);
  expect(edits).toBeGreaterThanOrEqual(2);
  await row.locator('summary').click();
  await expect(row.locator('.scenario')).toContainText('Users per location: 16,000');
  await expect(row.locator('.scenario')).toContainText('(months given)');
  const dashText = await dp.locator('#main').innerText();
  expect(dashText).not.toMatch(/55|\$60,000|credit/);
  // Close it: the customer's next recompute is refused and the page will not open again.
  dp.once('dialog', (d) => d.accept());
  await row.locator('button[data-act="revoke"]').click();
  await expect(dp.locator('#main tbody tr').filter({ hasText: 'Fairway Social' }).first().locator('.pill')).toHaveText('closed');
  await cp.locator('#inputs input[type="number"]').first().fill('17000');
  await expect(cp.locator('#res-err')).toContainText('closed by the person who sent it');
  const cp2 = await customer.newPage();
  const closedResponse = await cp2.goto(url);
  expect(closedResponse.status()).toBe(400);
  await expect(cp2.locator('h1')).toHaveText('This link is no longer open');
  await customer.close();
  await dp.close();
});

test('the seller edits a customer\'s sandbox from the dashboard and the customer sees the new version', async ({ page }) => {
  await openTab(page);
  await setBaseDeal(page, { termYears: 3, fees: [78000, 102000, 126000], payoffBasis: 'annual', shortfall: 'cash', mau: 6000 });
  await page.evaluate(() => { TP.dealName = 'Loco Bear'; TP.presenter = 'Mat'; TPsave(); TPrender(); document.getElementById('tp-sandbox-fold').open = true; });
  // A passcode is required; without one the button refuses and nothing is sent.
  await page.locator('#tp-sandbox-pass').fill('');
  await page.locator('#tp-sandbox-btn').click();
  await expect(page.locator('#tp-sandbox-btn')).toContainText('Passcode needed');
  await expect(page.locator('#tp-sandbox-out')).toBeHidden();
  await page.locator('#tp-sandbox-suggest').click();
  const suggested = await page.locator('#tp-sandbox-pass').inputValue();
  expect(suggested).toMatch(/^[a-z]+-\d{4}$/);
  await page.locator('#tp-sandbox-btn').click();
  await expect(page.locator('#tp-sandbox-out')).toBeVisible();
  const url = await page.locator('#tp-sandbox-out input').inputValue();
  await expect(page.locator('#tp-sandbox-cowork')).toBeHidden();

  // The customer opens it with the passcode and changes their base; it is kept for them.
  const customer = await page.context().browser().newContext();
  const open = async (p) => { await p.goto(url); await p.locator('#pass').fill(suggested); await p.locator('#gate button').click(); };
  const cp = await customer.newPage();
  await open(cp);
  await expect(cp.locator('#model h1')).toHaveText('Loco Bear');
  await cp.locator('#inputs input[type="number"]').first().fill('9000');
  await cp.waitForTimeout(500);
  const cp2 = await customer.newPage();
  await open(cp2);
  await expect(cp2.locator('#inputs input[type="number"]').first()).toHaveValue('9000');
  await cp2.close();

  // The seller opens their model from the dashboard: the calculator loads it with the customer's 9,000.
  const dp = await page.context().newPage();
  await dp.goto('/links');
  await dp.locator('#key').fill('playwright-dashboard-key');
  await dp.locator('#enter').click();
  const row = dp.locator('#main tbody tr').filter({ hasText: 'Loco Bear' }).first();
  await expect(row).toBeVisible();
  const [editor] = await Promise.all([page.context().waitForEvent('page'), row.locator('button[data-act="edit"]').click()]);
  await editor.waitForLoadState();
  await expect(editor.locator('#tp-sandbox-cowork')).toBeVisible();
  await expect(editor.locator('#tp-sandbox-cowork-title')).toHaveText('Editing Loco Bear’s sandbox');
  await expect(editor.locator('#tp-mau')).toHaveValue('9000');
  // The seller adds a tournament and raises the base, then saves it to the link.
  await editor.evaluate(() => {
    TP.mau = 10000; MG.tau = 10000;
    TP.core.tournaments.push(Object.assign({}, TP.core.tournaments[0], { id: 'special', name: 'Seller special', eventsPerMonth: 2 }));
    TPsave(); TPrenderControls(); TPrenderTournaments(); TPrender();
  });
  await editor.locator('#tp-sandbox-save').click();
  await expect(editor.locator('#tp-sandbox-cowork-note')).toContainText('Saved as version 2');
  // The customer's open page recomputes with stale inputs and is moved onto the seller's version.
  await cp.locator('#inputs input[type="number"]').first().fill('9500');
  await expect(cp.locator('.banner')).toContainText('Mat updated this model');
  await expect(cp.locator('.banner')).toContainText('Your view has been refreshed');
  await expect(cp.locator('#inputs input[type="number"]').first()).toHaveValue('10000');
  await expect(cp.locator('#inputs .tour .head input').nth(1)).toHaveValue('Seller special');
  // And a fresh visit is the seller's version too.
  const cp3 = await customer.newPage();
  await open(cp3);
  await expect(cp3.locator('#inputs input[type="number"]').first()).toHaveValue('10000');
  await expect(cp3.locator('.banner')).toContainText('This is their latest version');
  await expect(dp.locator('#main')).toBeVisible();
  await dp.locator('#refresh').click();
  await expect(dp.locator('#main tbody tr').filter({ hasText: 'Loco Bear' }).first()).toContainText('you saved 1×');
  await editor.locator('button', { hasText: 'Stop editing' }).click();
  await expect(editor.locator('#tp-sandbox-cowork')).toBeHidden();
  await customer.close();
  await editor.close();
  await dp.close();
});
