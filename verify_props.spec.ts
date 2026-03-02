import { test, expect } from '@playwright/test';

test('property panel visibility', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('http://localhost:5173');

  // Wait for canvas to load
  await page.waitForSelector('canvas');

  // Click on "Editor" mode if not default (it should be default)

  // Create a section to select it
  await page.click('button[title="Nuevo Sector"]');

  // The new sector should be selected automatically. Check if Property Panel is visible
  // It has "Propiedades" text
  const propsHeader = page.locator('h2:has-text("Propiedades")');
  await expect(propsHeader).toBeVisible();

  // Check if width is correct
  const panel = page.locator('aside').nth(1); // Second aside should be Property Panel
  const box = await panel.boundingBox();
  console.log('Panel width:', box?.width);

  await page.screenshot({ path: '/home/jules/verification/property_panel_visible.png', fullPage: true });
});
