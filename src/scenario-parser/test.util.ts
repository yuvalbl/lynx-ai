import { Page } from 'playwright';

// Helper to create a test page with reliable content using data URLs
export async function createTestPage(page: Page, html: string): Promise<void> {
  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  await page.goto(dataUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(200); // Give time for DOM to stabilize
}
