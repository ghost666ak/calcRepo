import { test, expect } from '@playwright/test';

test.describe('PWA offline behavior', () => {
  test('manifest is served with required PWA fields', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest');
    expect(response.status()).toBe(200);
    const manifest = (await response.json()) as Record<string, unknown>;
    expect(manifest['name']).toBeTruthy();
    expect(manifest['start_url']).toBeTruthy();
    expect(manifest['display']).toBe('standalone');
    expect(Array.isArray(manifest['icons'])).toBe(true);
    const icons = manifest['icons'] as Array<{ src: string }>;
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      const iconResponse = await request.get(icon.src);
      expect(iconResponse.status(), `icon ${icon.src} must resolve`).toBe(200);
    }
  });

  test('service worker registers and serves the app shell offline', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait for the SW to take control.
    await page.waitForFunction(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration();
      return Boolean(reg && reg.active);
    }, undefined, { timeout: 15_000 });

    // Go offline and reload — the cached shell should still render.
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: /calcRepo/i })).toBeVisible();
    await expect(page.getByTestId('display-value')).toBeVisible();
    await context.setOffline(false);
  });
});
