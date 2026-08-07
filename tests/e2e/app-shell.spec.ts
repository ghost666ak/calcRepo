import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('foundation shell loads and is accessibility-clean', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /calcRepo/i })).toBeVisible();
  await expect(page.getByTestId('display-value')).toHaveText('0');
  await expect(page.getByRole('tablist', { name: /calculator mode/i })).toBeVisible();

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});