import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function expectNoAxeViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test.describe('each mode', () => {
  test('basic mode computes an expression', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Basic' }).click();
    for (const value of ['7', '+', '8', '=']) {
      await page.locator(`[data-value="${value}"]`).first().click();
    }
    await expect(page.getByTestId('display-value')).toHaveText('15');
    await expectNoAxeViolations(page);
  });

  test('scientific mode computes sqrt(16)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Scientific' }).click();
    await expect(page.getByLabel(/angle unit/i)).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('base converter swaps presets', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Base' }).click();
    await expect(page.getByTestId('base-dec')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('programmer mode is reachable', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Programmer' }).click();
    await expect(page.getByRole('heading', { name: /programmer/i }).first()).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('tools mode renders the bit inspector', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Tools' }).click();
    await expect(page.getByTestId('tool-bits')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('history opt-in toggle is keyboard reachable', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open settings' }).click();
    const toggle = page.getByTestId('history-toggle');
    await expect(toggle).toBeVisible();
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await expectNoAxeViolations(page);
  });
});
