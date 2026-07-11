import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('Brand Arcade prompt builder creates a ChatGPT handoff ZIP', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  // Tab buttons have role="tab" (canonical) or role="button" (fallback)
  const tab = page.getByRole('tab', { name: 'Brand Arcade' });
  const btn = page.getByRole('button', { name: 'Brand Arcade' });
  if (await tab.count() > 0) {
    await tab.click();
  } else {
    await btn.click();
  }

  await expect(page.getByRole('heading', { name: 'Brand Arcade Prompt Builder' })).toBeVisible();
  await expect(page.locator('img[alt="Runaway reference screenshot"]')).toBeVisible();

  await page.locator('#ba-brand').fill('Liquid Death');
  await page.locator('#ba-load-sample').click();

  const prompt = await page.locator('#ba-prompt').inputValue();
  expect(prompt).toContain('Liquid Death');
  expect(prompt).toContain('This is a visual concept mockup, not final production art');
  expect(prompt).toContain('Runaway');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#ba-zip').click()
  ]);

  const zipPath = path.join(os.tmpdir(), download.suggestedFilename());
  await download.saveAs(zipPath);
  expect(fs.statSync(zipPath).size).toBeGreaterThan(100_000);

  const listing = execFileSync('unzip', ['-l', zipPath], { encoding: 'utf8' });
  expect(listing).toContain('prompt.txt');
  expect(listing).toContain('brief.md');
  expect(listing).toContain('skin-map.json');
  expect(listing).toContain('upload-checklist.txt');
  expect(listing).toContain('email-copy.txt');
  expect(listing).toContain('qa-checklist.txt');
  expect(listing).toContain('reference/runaway-reference.png');

  expect(errors).toEqual([]);
});
