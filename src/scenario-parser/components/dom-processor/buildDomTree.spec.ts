import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { BuildDomTreeResult, ElementNodeData, TextNodeData } from './buildDomTree.types';
import { createTestPage } from '../../test.util';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const buildDomTreeFunction = require('./buildDomTree.js'); // Points to your main refactored script

// Increase Jest's default timeout as Playwright operations are slower
jest.setTimeout(30000); // 30 seconds

describe('buildDomTree.js Direct Execution', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: false, slowMo: 50 });
    context = await browser.newContext();
    page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  afterAll(async () => {
    if (context) await context.close();
    if (browser) await browser.close();
  });

  it('should build a DOM tree with correct parent-child relationships for basic HTML', async () => {
    const html = '<html><body><p>Minimal content</p></body></html>';
    await createTestPage(page, html);

    const result: BuildDomTreeResult = await page.evaluate(buildDomTreeFunction);

    expect(result).toBeDefined();
    expect(result.rootId).toBeDefined();
    expect(result.map).toBeDefined();
    expect(typeof result.map).toBe('object');

    // Check body element
    const bodyNode = result.map[result.rootId] as ElementNodeData;
    expect(bodyNode).toBeDefined();
    expect(bodyNode.tagName).toBe('body');
    expect(bodyNode.children).toHaveLength(1);

    // Check paragraph element
    const paragraphNodeId = bodyNode.children[0];
    const paragraphNode = result.map[paragraphNodeId] as ElementNodeData;
    expect(paragraphNode).toBeDefined();
    expect(paragraphNode.tagName).toBe('p');
    expect(paragraphNode.children).toHaveLength(1);

    // Check text node
    const textNodeId = paragraphNode.children[0];
    const textNode = result.map[textNodeId] as TextNodeData;
    expect(textNode).toBeDefined();
    expect(textNode.type).toBe('TEXT_NODE');
    expect(textNode.text).toBe('Minimal content');
  });

  it('should identify interactive elements with correct attributes and interactivity flags', async () => {
    const html = `
      <html><body>
        <button id="testButton">Click Me</button>
        <input id="textInput" type="text" placeholder="Type here" />
        <input id="checkbox" type="checkbox" />
      </body></html>
    `;
    await createTestPage(page, html);

    const result: BuildDomTreeResult = await page.evaluate(buildDomTreeFunction);

    expect(result).toBeDefined();
    expect(result.rootId).toBeDefined();
    expect(result.map).toBeDefined();

    // Get body element
    const bodyNode = result.map[result.rootId] as ElementNodeData;
    expect(bodyNode).toBeDefined();
    expect(bodyNode.tagName).toBe('body');
    expect(bodyNode.children).toHaveLength(3);

    // Find button node
    const buttonNodeId = bodyNode.children[0];
    const buttonNode = result.map[buttonNodeId] as ElementNodeData;
    expect(buttonNode).toBeDefined();
    expect(buttonNode.tagName).toBe('button');
    expect(buttonNode.attributes).toEqual(
      expect.objectContaining({
        id: 'testButton',
      }),
    );
    expect(buttonNode.isInteractive).toBe(true);

    // Find text input node
    const inputNodeId = bodyNode.children[1];
    const inputNode = result.map[inputNodeId] as ElementNodeData;
    expect(inputNode).toBeDefined();
    expect(inputNode.tagName).toBe('input');
    expect(inputNode.attributes).toEqual(
      expect.objectContaining({
        id: 'textInput',
        type: 'text',
        placeholder: 'Type here',
      }),
    );
    expect(inputNode.isInteractive).toBe(true);

    // Find checkbox node
    const checkboxNodeId = bodyNode.children[2];
    const checkboxNode = result.map[checkboxNodeId] as ElementNodeData;
    expect(checkboxNode).toBeDefined();
    expect(checkboxNode.tagName).toBe('input');
    expect(checkboxNode.attributes).toEqual(
      expect.objectContaining({
        id: 'checkbox',
        type: 'checkbox',
      }),
    );
    expect(checkboxNode.isInteractive).toBe(true);
  });
});
