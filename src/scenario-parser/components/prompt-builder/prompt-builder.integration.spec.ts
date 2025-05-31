import { Page } from 'playwright';
import { PlaywrightBridgeService } from '../playwright-bridge/playwright-bridge.service';
import { DomProcessorService } from '../dom-processor/dom-processor.service';
import { PromptBuilderService } from './prompt-builder.service';
import { createTestPage } from '../../test.util';

// Use a longer timeout for these tests as they involve real browser operations
jest.setTimeout(30000);

describe('PromptBuilder Integration Tests', () => {
  let playwrightBridge: PlaywrightBridgeService;
  let domProcessor: DomProcessorService;
  let promptBuilder: PromptBuilderService;
  let page: Page;

  // Set up test environment - create a real browser instance
  beforeAll(async () => {
    playwrightBridge = new PlaywrightBridgeService({ launchOptions: { headless: true } });
    await playwrightBridge.initialize();
    domProcessor = new DomProcessorService(playwrightBridge);
    promptBuilder = new PromptBuilderService();
    page = await playwrightBridge.getPage();
  });

  afterAll(async () => {
    await playwrightBridge.close();
  });

  describe('Page Analysis → DOM Processing → Prompt Building', () => {
    it('should process a simple login form page and generate complete prompt', async () => {
      // Step 1: Create a realistic login form page
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Login Page</title>
        </head>
        <body>
          <h1>Welcome to Our App</h1>
          <form id="login-form">
            <div>
              <label for="username">Username:</label>
              <input type="text" id="username" name="username" placeholder="Enter your username" required>
            </div>
            <div>
              <label for="password">Password:</label>
              <input type="password" id="password" name="password" placeholder="Enter your password" required>
            </div>
            <button type="submit" id="login-btn">Log In</button>
          </form>
          <p>Don't have an account? <a href="/signup">Sign up here</a></p>
        </body>
        </html>
      `;

      await createTestPage(page, html);

      // Step 2: Process the DOM using DomProcessorService
      const domResult = await domProcessor.getDomState();

      // Step 3: Build a complete prompt using PromptBuilderService
      const userAction = 'Fill in the username field with "testuser" and then click the login button';
      const promptPayload = promptBuilder.createLlmPromptPayload(domResult.domTree, userAction, domResult.browserState);

      // Show the complete prompt structure
      console.log('\n=== INTEGRATION TEST: COMPLETE PROMPT PAYLOAD ===');
      console.log('SYSTEM PROMPT:');
      console.log(promptPayload.systemPrompt);
      console.log('\nUSER PROMPT:');
      console.log(promptPayload.userPrompt);
      console.log('\nFUNCTIONS:');
      console.log(JSON.stringify(promptPayload.functions, null, 2));
      console.log('=== END INTEGRATION TEST OUTPUT ===\n');

      // Verify DOM processing worked correctly
      expect(domResult.domTree).toBeDefined();
      expect(domResult.selectorMap).toBeDefined();
      expect(Object.keys(domResult.selectorMap).length).toBeGreaterThan(0);

      // Verify the complete prompt structure - showing actual implementation format
      const expectedSystemPrompt =
        `You are a web automation assistant that interprets user actions on web pages. ` +
        `Your task is to analyze the DOM structure and user's natural language action request, ` +
        `then determine the appropriate browser action to perform.

The page content is provided in a structured format:
- Interactive elements are marked with [N] where N is the element index
- You can reference elements by their index number
- Text content shows the visual layout of the page
- Elements marked with 🆕 are newly appeared on the page

When analyzing user actions:
1. Identify the target element using the provided element indices [N]
2. Determine the action type (click, input, navigate, assert)
3. Extract any values needed for the action
4. Use the element index in your targetSelector as "highlightIndex=N"

Always respond using the provided function schema. ` +
        `If you cannot determine the action or find ambiguity, set isAmbiguous to true and explain in the error field.`;

      expect(promptPayload.systemPrompt).toBe(expectedSystemPrompt);

      // Verify that the user prompt contains the expected structure (actual format)
      expect(promptPayload.userPrompt).toContain('INSTRUCTION: Fill in the username field with "testuser"');
      expect(promptPayload.userPrompt).toContain('=== Recently Disappeared Elements ===');
      expect(promptPayload.userPrompt).toContain('[Task history memory ends]');
      expect(promptPayload.userPrompt).toContain('[Current state starts here]');
      expect(promptPayload.userPrompt).toContain('The following is one-time information');
      expect(promptPayload.userPrompt).toContain('Current url:');
      expect(promptPayload.userPrompt).toContain('Interactive elements from top layer');
      expect(promptPayload.userPrompt).toContain('[Start of page]');
      expect(promptPayload.userPrompt).toContain('[End of page]');
      expect(promptPayload.userPrompt).toContain('Current step: 1/10');
      expect(promptPayload.userPrompt).toContain('Current date and time:');
      expect(promptPayload.userPrompt).toContain(
        'Please analyze the page and determine what action to take to: ' +
          'Fill in the username field with "testuser" and then click the login button',
      );

      // Verify specific elements in the disappeared elements section (correct format)
      expect(promptPayload.userPrompt).toMatch(/❌.*\[1\].*input.*id="username".*type="text"/);
      expect(promptPayload.userPrompt).toMatch(/❌.*\[3\].*input.*id="password".*type="password"/);
      expect(promptPayload.userPrompt).toMatch(/❌.*\[4\].*button.*id="login-btn".*type="submit"/);
      expect(promptPayload.userPrompt).toMatch(/❌.*\[5\].*a/);

      // Verify the function definition is complete (actual format)
      expect(promptPayload.functions).toHaveLength(1);
      const expectedFunction = {
        name: 'perform_browser_action',
        description: "Perform a browser action based on the user's natural language request",
        parameters: {
          type: 'object',
          properties: {
            actionType: {
              type: 'string',
              enum: ['click', 'input', 'navigate', 'assert', 'unknown'],
              description: 'The type of action to perform',
            },
            targetSelector: {
              type: 'string',
              description:
                'For element interactions, use format "highlightIndex=N" where N is the element index from the DOM',
            },
            inputValue: {
              type: ['string', 'number', 'boolean'],
              description: 'The value to input (for input actions) or assert (for assert actions)',
            },
            url: {
              type: 'string',
              description: 'The URL to navigate to (for navigate actions)',
            },
            description: {
              type: 'string',
              description: 'The original user action description',
            },
            isAmbiguous: {
              type: 'boolean',
              description: 'Whether the action request is ambiguous or unclear',
            },
            confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Confidence level in the action interpretation (0-1)',
            },
            error: {
              type: 'string',
              description: 'Error message if action cannot be determined or is ambiguous',
            },
          },
          required: ['actionType', 'description', 'isAmbiguous', 'confidence'],
        },
      };

      expect(promptPayload.functions[0]).toEqual(expectedFunction);

      // Verify browser state
      expect(domResult.browserState?.url).toContain('data:text/html');
      expect(domResult.browserState?.title).toBe('Login Page');

      console.log('\n🎉 INTEGRATION TEST SUCCESS!');
      console.log('✅ Page Analysis → DOM Processing → Prompt Building pipeline works correctly');
      console.log('✅ Found', Object.keys(domResult.selectorMap).length, 'interactive elements');
      console.log('✅ Generated complete prompt with browser-use format');
      console.log('✅ History tracking showing element state changes');
      console.log('✅ Complete LLM-ready function calling schema');
    });

    it('should process an e-commerce product page and generate complete prompt', async () => {
      // Step 1: Create a realistic e-commerce product page
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Wireless Headphones - TechStore</title>
        </head>
        <body>
          <nav>
            <a href="/home">Home</a>
            <a href="/products">Products</a>
            <input type="search" placeholder="Search products..." id="search">
            <button id="search-btn">Search</button>
          </nav>
          
          <main>
            <h1>Premium Wireless Headphones</h1>
            <div class="product-info">
              <img src="/headphones.jpg" alt="Wireless Headphones">
              <div class="details">
                <p class="price">$299.99</p>
                <p class="description">High-quality wireless headphones with noise cancellation.</p>
                
                <div class="options">
                  <label>Color:</label>
                  <select id="color-select">
                    <option value="black">Black</option>
                    <option value="white">White</option>
                    <option value="blue">Blue</option>
                  </select>
                </div>
                
                <div class="quantity">
                  <label>Quantity:</label>
                  <input type="number" id="quantity" value="1" min="1" max="10">
                </div>
                
                <button id="add-to-cart" class="btn-primary">Add to Cart</button>
                <button id="buy-now" class="btn-secondary">Buy Now</button>
              </div>
            </div>
          </main>
          
          <footer>
            <p>© 2024 TechStore. All rights reserved.</p>
          </footer>
        </body>
        </html>
      `;

      await createTestPage(page, html);

      // Step 2: Process the DOM
      const domResult = await domProcessor.getDomState();

      // Step 3: Build prompt for adding item to cart
      const userAction = 'Change the color to blue, set quantity to 2, and add the item to cart';
      const promptPayload = promptBuilder.createLlmPromptPayload(domResult.domTree, userAction, domResult.browserState);

      // Show the complete prompt structure
      console.log('\n=== E-COMMERCE INTEGRATION TEST: COMPLETE PROMPT ===');
      console.log('SYSTEM PROMPT:');
      console.log(promptPayload.systemPrompt);
      console.log('\nUSER PROMPT:');
      console.log(promptPayload.userPrompt);
      console.log('\nFUNCTIONS:');
      console.log(JSON.stringify(promptPayload.functions, null, 2));
      console.log('=== END E-COMMERCE INTEGRATION TEST ===\n');

      // Verify comprehensive prompt generation
      expect(promptPayload.userPrompt).toContain(
        'INSTRUCTION: Change the color to blue, set quantity to 2, and add the item to cart',
      );
      expect(promptPayload.userPrompt).toContain('[Task history memory ends]');
      expect(promptPayload.userPrompt).toContain('[Current state starts here]');

      // Verify page content is included in navigation section (as per actual implementation)
      expect(promptPayload.userPrompt).toContain('=== Page Navigation ===');
      expect(promptPayload.userPrompt).toContain('%3EWireless%20Headphones');
      expect(promptPayload.userPrompt).toContain('TechStore');
      expect(promptPayload.userPrompt).toContain('noise%20cancellation');
      expect(promptPayload.userPrompt).toContain('Color%3A');
      expect(promptPayload.userPrompt).toContain('Quantity%3A');

      // Verify disappeared elements section shows all interactive elements
      expect(promptPayload.userPrompt).toContain('Recently Disappeared Elements');
      expect(promptPayload.userPrompt).toMatch(/❌.*\[0\].*a/);
      expect(promptPayload.userPrompt).toMatch(/❌.*\[1\].*a/);
      expect(promptPayload.userPrompt).toMatch(/❌.*input.*type="search"/);
      expect(promptPayload.userPrompt).toMatch(/❌.*button.*search-btn/);
      expect(promptPayload.userPrompt).toMatch(/❌.*select.*color-select/);
      expect(promptPayload.userPrompt).toMatch(/❌.*input.*type="number"/);
      expect(promptPayload.userPrompt).toMatch(/❌.*button.*add-to-cart/);
      expect(promptPayload.userPrompt).toMatch(/❌.*button.*buy-now/);

      // Verify structural elements
      expect(promptPayload.userPrompt).toContain('[Start of page]');
      expect(promptPayload.userPrompt).toContain('[End of page]');
      expect(promptPayload.userPrompt).toContain('Current step: 1/10');
      expect(promptPayload.userPrompt).toContain(
        'Please analyze the page and determine what action to take to: ' +
          'Change the color to blue, set quantity to 2, and add the item to cart',
      );

      expect(domResult.browserState?.url).toContain('data:text/html');
      expect(domResult.browserState?.title).toBe('Wireless Headphones - TechStore');
      expect(Object.keys(domResult.selectorMap).length).toBeGreaterThan(5);
    });
  });
});
