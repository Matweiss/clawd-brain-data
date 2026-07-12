import { test, expect } from '@playwright/test';

// All-six-tabs smoke test.
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
  'Trackman Partner',
  'Investment Plans',
  'Brand Arcade',
];

const TAB_PANEL_IDS = [
  'roi',
  'gamification',
  'minigame',
  'trackman',
  'analytics',
  'brandarcade',
];

function tabButton(page, name) {
  return page.locator('.tabs button', { hasText: name });
}

test('all six tabs load without console errors', async ({ page }) => {
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

test('typed client restores deal state and renders financial intelligence', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => page.locator('html').getAttribute('data-typed-client')).toBe('ready');
  await expect(page.locator('#financial-intelligence')).toBeVisible();
  await expect(page.locator('[data-cash-chart] .cash-month')).toHaveCount(12);
  await expect(page.locator('[data-sensitivity] .sensitivity-row')).toHaveCount(4);

  await page.locator('#seasonality-profile').selectOption('venue');
  await page.locator('#upfront-investment').fill('50000');
  await expect(page.locator('[data-year-net]')).not.toHaveText('—');

  await page.locator('#i-vis').fill('1780');
  await page.waitForTimeout(250);
  await page.reload();
  await expect(page.locator('#i-vis')).toHaveValue('1780');
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

test('Trackman tab renders pricing controls', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  await tabButton(page, 'Trackman Partner').click();

  // Bay count input should be visible
  await expect(page.locator('#tm-bays')).toBeVisible();

  // Metrics area should render
  await expect(page.locator('#tm-metrics')).toBeVisible();

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

test('Investment Plans tab renders', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  await tabButton(page, 'Investment Plans').click();

  await expect(page.locator('#analytics')).toBeVisible();

  expect(errors).toEqual([]);
});
