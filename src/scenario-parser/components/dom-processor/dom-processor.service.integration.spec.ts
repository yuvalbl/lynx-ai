// Mock the logger to prevent console clutter during tests
jest.mock('@common/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

import { Page } from 'playwright';
import { PlaywrightBridgeService } from '../playwright-bridge/playwright-bridge.service';
import { DomProcessorService } from './dom-processor.service';
import { createTestPage } from '../../test.util';

// Use a longer timeout for these tests as they involve real browser operations
jest.setTimeout(30000);

describe('DomProcessorService', () => {
  let playwrightBridge: PlaywrightBridgeService;
  let domProcessor: DomProcessorService;
  let page: Page;

  // Set up test environment - create a real browser instance and navigable page
  beforeAll(async () => {
    // should always run in full browser mode
    playwrightBridge = new PlaywrightBridgeService({ launchOptions: { headless: false } });
    await playwrightBridge.initialize();
    domProcessor = new DomProcessorService(playwrightBridge);

    // Get the raw objects to manipulate directly for tests
    page = await playwrightBridge.getPage();
  });

  afterAll(async () => {
    await playwrightBridge.close();
  });

  describe('Integration Tests', () => {
    it('should initialize correctly', () => {
      expect(domProcessor).toBeDefined();
      expect(playwrightBridge).toBeDefined();
      expect(page).toBeDefined();
    });

    it('should be able to navigate to about:blank', async () => {
      await page.goto('about:blank');
      expect(page.url()).toBe('about:blank');
    });

    it('should handle empty/blank pages with proper fallback', async () => {
      await page.goto('about:blank');

      const result = await domProcessor.getDomState();

      // Should return default empty body
      expect(result.domTree).toBeDefined();
      expect(result.domTree.tag).toBe('body');
      expect(result.domTree.children.length).toBe(0);
      expect(Object.keys(result.selectorMap).length).toBe(0);
    });

    it('should handle setting page content', async () => {
      const html = `
        <html><body>
          <div>Test</div>
        </body></html>
      `;
      await createTestPage(page, html);

      const result = await domProcessor.getDomState();
      // Verify the structure and content of the result
      expect(result).toBeDefined();
      expect(result.domTree).toBeDefined();
      expect(result.selectorMap).toBeDefined();
      // Verify the DOM tree structure
      expect(result.domTree.tag).toBe('body');
      expect(result.domTree.children.length).toBe(1);
      // Verify the div element
      const divElement = result.domTree.children[0];
      expect(divElement.tag).toBe('div');
      expect(divElement.children.length).toBe(1);
      // Verify the text content
      expect(divElement.children[0].text).toBe('Test');
    });

    it('should handle a simple DOM structure', async () => {
      const html = `
        <html><body>
          <button>Click me</button>
        </body></html>
      `;
      await createTestPage(page, html);

      const result = await domProcessor.getDomState();

      // Verify the DOM tree structure
      expect(result.domTree.tag).toBe('body');
      expect(result.domTree.children.length).toBe(1);
      // Verify the button element
      const buttonElement = result.domTree.children[0];
      expect(buttonElement.tag).toBe('button');
      expect(buttonElement.children.length).toBe(1);
      expect(buttonElement.children[0].text).toBe('Click me');
      // Verify the button is marked as interactive
      expect(buttonElement.isInteractive).toBe(true);
      // Verify the selector map includes the button
      console.log('result.selectorMap', result.selectorMap);
      console.log('Object.keys(result.selectorMap)', Object.keys(result.selectorMap));
      expect(Object.keys(result.selectorMap).length).toBeGreaterThan(0);
      // Find a button element in the selectorMap values
      const buttonInSelectorMap = Object.values(result.selectorMap).find((element) => element.tag === 'button');
      expect(buttonInSelectorMap).toBeDefined();
      expect(buttonInSelectorMap?.isInteractive).toBe(true);
    });
  });
});
