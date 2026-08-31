import { test, expect } from '@playwright/test';

// All-nine-tabs smoke test.
// Verifies every tab renders without JS errors, all panels become visible,
// console-error capture, and keyboard tab navigation.
//
// The static dev server (python http.server) serves index.html.
// Tab buttons may have role="tab" (canonical) or role="button" (standalone).
// We locate by text to stay compatible with both.

const TAB_NAMES = [
  'Core ROI',
  'Gamification',
  'Mini Game ROI',
  'Launch Forecast',
  'Digital Media ROI',
  'Wager Break-even',
  'Investment Plans',
  'Brand Arcade',
  'Revenue Model',
];

const TAB_PANEL_IDS = [
  'roi',
  'gamification',
  'minigame',
  'forecast',
  'digitalmedia',
  'wagerbreakeven',
  'analytics',
  'brandarcade',
  'tournaments',
];

function tabButton(page, name) {
  return page.locator('.tabs button', { hasText: name });
}

test('all nine tabs load without console errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');

  // The first tab (Core ROI) should already be visible
  await expect(page.locator('#roi')).toBeVisible();

  // Click through each tab and verify the panel becomes visible
  for (let i = 0; i < TAB_NAMES.length; i++) {
    const btn = tabButton(page, TAB_NAMES[i]);
    await btn.click();
    await expect(page.locator('#' + TAB_PANEL_IDS[i])).toBeVisible();
    // Active tab should have the 'active' class
    await expect(btn).toHaveClass(/active/);
  }

  expect(errors).toEqual([]);
});

test('keyboard arrow-key navigation cycles through tabs', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');

  // Check if tabs have role="tab" (canonical/app.html with ARIA)
  const hasTabRole = await page.locator('.tabs button[role="tab"]').count() > 0;

  if (!hasTabRole) {
    // Standalone copy without ARIA keyboard navigation — verify tabs
    // at least respond to click and mark active class
    for (let i = 0; i < TAB_NAMES.length; i++) {
      const btn = tabButton(page, TAB_NAMES[i]);
      await btn.click();
      await expect(btn).toHaveClass(/active/);
      await expect(page.locator('#' + TAB_PANEL_IDS[i])).toBeVisible();
    }
    expect(errors).toEqual([]);
    return;
  }

  // Canonical copy with WAI-ARIA tablist — full keyboard test
  const firstTab = tabButton(page, 'Core ROI');
  await firstTab.focus();
  await expect(firstTab).toBeFocused();

  // Arrow-right through all tabs
  for (let i = 1; i < TAB_NAMES.length; i++) {
    await page.keyboard.press('ArrowRight');
    const tab = tabButton(page, TAB_NAMES[i]);
    await expect(tab).toBeFocused();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#' + TAB_PANEL_IDS[i])).toBeVisible();
  }

  // Arrow-right from last tab wraps to first
  await page.keyboard.press('ArrowRight');
  await expect(firstTab).toBeFocused();

  // Arrow-left from first tab wraps to last
  await page.keyboard.press('ArrowLeft');
  const lastTab = tabButton(page, TAB_NAMES[TAB_NAMES.length - 1]);
  await expect(lastTab).toBeFocused();

  // Home key goes to first tab
  await page.keyboard.press('Home');
  await expect(firstTab).toBeFocused();

  // End key goes to last tab
  await page.keyboard.press('End');
  await expect(lastTab).toBeFocused();

  expect(errors).toEqual([]);
});

test('Core ROI tab has visible inputs and computes values', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');

  // Verify key input elements are present
  await expect(page.locator('#i-vis')).toBeVisible();
  await expect(page.locator('#i-arpu')).toBeVisible();
  await expect(page.locator('#i-fee')).toBeVisible();
  await expect(page.locator('#i-opt')).toBeVisible();
  await expect(page.locator('#i-lift')).toBeVisible();

  // The sticky summary should show computed values
  const summary = page.locator('#sticky-summary');
  await expect(summary).toBeVisible();

  expect(errors).toEqual([]);
});

test('guided archetypes prefill Core ROI without hiding assumptions', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  await page.getByRole('button', { name: /Golf & simulator/ }).click();

  await expect(page.locator('#i-vis')).toHaveValue('120');
  await expect(page.locator('#i-arpu')).toHaveValue('30');
  await expect(page.locator('#i-loc')).toHaveValue('1');
  await expect(page.locator('#archetype-status')).toContainText('Golf & simulator assumptions are loaded');
  await expect(page.locator('#i-vis')).toBeVisible();

  expect(errors).toEqual([]);
});

test('narrow layout has no document-level horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
});

test('Gamification tab renders deal configuration', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  await tabButton(page, 'Gamification').click();

  // Package selection buttons should be present
  await expect(page.locator('#gm-A')).toBeVisible();
  await expect(page.locator('#gm-B')).toBeVisible();

  // Metrics area should render
  await expect(page.locator('#gm-metrics')).toBeVisible();

  expect(errors).toEqual([]);
});

test('Wager Break-even tab renders economics controls', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  await tabButton(page, 'Wager Break-even').click();

  // The required economics and footprint inputs should be visible.
  await expect(page.locator('#wb-license')).toBeVisible();
  await expect(page.locator('#wb-take')).toBeVisible();
  await expect(page.locator('#wb-share')).toBeVisible();
  await expect(page.locator('#wb-locations')).toBeVisible();
  await expect(page.locator('#wb-mau')).toBeVisible();

  // Break-even results should render.
  await expect(page.locator('#wb-results')).toBeVisible();

  expect(errors).toEqual([]);
});

test('Mini Game ROI tab renders inputs', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  await tabButton(page, 'Mini Game ROI').click();

  await expect(page.locator('#minigame')).toBeVisible();
  await expect(page.locator('#mgi-tau')).toBeVisible();

  expect(errors).toEqual([]);
});

test('Digital Media ROI tab calculates, toggles, and persists', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  await tabButton(page, 'Digital Media ROI').click();
  await expect(page.locator('#digitalmedia')).toBeVisible();
  await expect(page.locator('#dm-cost-table')).toBeVisible();
  await expect(page.locator('#dm-funding .stat')).toHaveCount(3);
  await expect(page.locator('#dm-traffic-fields')).toBeHidden();
  await expect(page.locator('#dm-mu')).toHaveValue('');
  await expect(page.locator('#dm-aov')).toHaveValue('');
  await expect(page.locator('#dm-profile-value')).toHaveValue('');
  await expect(page.locator('#dm-cost-table')).not.toContainText('Your CAC: $3.50');

  await page.locator('#dm-mu').fill('100000');
  await page.locator('#dm-aov').fill('55');
  await page.locator('#dm-margin').fill('40');
  await page.locator('#dm-profile-value').fill('3.5');
  await page.locator('#dm-equivalence').fill('50');
  await expect(page.locator('#dm-cost-table')).toContainText('Your CAC (as entered)');

  await page.locator('#dm-traffic-on').check();
  await expect(page.locator('#dm-traffic-fields')).toBeVisible();
  await page.locator('#dm-rpm').fill('12');

  await page.locator('#dm-full-toggle').click();
  await expect(page.locator('#dm-full')).toBeVisible();
  await expect(page.locator('#dm-rollup')).toContainText('Net ROI');
  await page.locator('#dm-pitch .cp-btn').click();
  await expect(page.locator('#dm-pitch .cp-btn')).toHaveText('Copied!');

  await page.reload();
  await tabButton(page, 'Digital Media ROI').click();
  await expect(page.locator('#dm-equivalence')).toHaveValue('50');
  await expect(page.locator('#dm-traffic-on')).toBeChecked();
  await expect(page.locator('#dm-rpm')).toHaveValue('12');

  const overflow = await page.locator('#digitalmedia').evaluate(el => el.scrollWidth - el.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('Digital Media scenarios rebaseline safely and break-even strings render', async ({ page }) => {
  await page.goto('/');
  await tabButton(page, 'Digital Media ROI').click();
  await page.locator('#dm-mu').fill('100000');
  await page.locator('#dm-aov').fill('55');
  await page.locator('#dm-margin').fill('40');
  await page.locator('#dm-profile-value').fill('3.5');
  await page.locator('#dm-equivalence').fill('50');
  await page.locator('#dm-traffic-on').check();
  await page.locator('#dm-rpm').fill('8');

  const lift = page.locator('#dm-break-even .stat').filter({ hasText: 'Sitewide page-view lift' }).locator('.val');
  await expect(lift).not.toHaveText('—');

  await page.locator('[data-dms="cons"]').click();
  await expect(page.locator('#dm-er')).toHaveValue('5');
  await page.locator('#dm-aov').fill('80');
  await expect(page.locator('[data-dms="expected"]')).toHaveClass(/on/);
  await expect(page.locator('#dm-er')).toHaveValue('10');
  await page.locator('[data-dms="aggr"]').click();
  await expect(page.locator('#dm-er')).toHaveValue('17.5');
  await page.locator('[data-dms="expected"]').click();
  await expect(page.locator('#dm-er')).toHaveValue('10');
  await expect(page.locator('#dm-aov')).toHaveValue('80');
});

test('Investment Plans tab renders', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  await tabButton(page, 'Investment Plans').click();

  await expect(page.locator('#analytics')).toBeVisible();

  expect(errors).toEqual([]);
});
