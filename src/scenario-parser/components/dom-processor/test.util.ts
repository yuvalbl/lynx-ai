import { Page } from 'playwright';

// Helper to create a simple test page with known structure
export async function createTestPage(page: Page, html: string): Promise<void> {
  await page.goto('https://www.webpagetest.org/blank.html');
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(100);
}
