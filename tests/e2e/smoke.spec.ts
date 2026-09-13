import { test, expect } from '@playwright/test';

test('starts the game shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Tango Track Guessing Game' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start game' })).toBeVisible();
});
