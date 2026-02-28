import { test, expect } from '@playwright/test';

test('capture final high quality screenshots', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  // Take screenshot of the editor with Stadium template
  await page.click('button:has-text("Estadio")');
  await page.waitForTimeout(1000);

  // Select an element to show the property panel in action
  await page.mouse.click(500, 500);
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'verification/final_editor_stadium.png', fullPage: true });

  // Switch to View Mode
  await page.click('button:has-text("Vista")');
  await page.waitForTimeout(1000);

  // Select some seats to show the booking HUD
  // We'll click a few spots where we know seats are usually located in the template
  await page.mouse.click(400, 200);
  await page.mouse.click(415, 200, { modifiers: ['Shift'] });
  await page.mouse.click(430, 200, { modifiers: ['Shift'] });
  await page.mouse.click(445, 200, { modifiers: ['Shift'] });

  await page.screenshot({ path: 'verification/final_view_mode.png', fullPage: true });
});
