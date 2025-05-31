import { PromptBuilderService } from './prompt-builder.service';
import { SerializableDOMNode, BrowserState } from '@scenario-parser/interfaces';

describe('PromptBuilderService', () => {
  let service: PromptBuilderService;

  beforeEach(() => {
    service = new PromptBuilderService();
  });

  describe('formatDomForLLM', () => {
    it('should format a simple DOM tree in browser-use format', () => {
      const domTree: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const result = service.formatDomForLLM(domTree);

      const expectedOutput = `Interactive elements from top layer of the current page inside the viewport:
[Start of page]
[End of page]`;

      expect(result).toBe(expectedOutput);
    });

    it('should include interactive elements with highlight indices', () => {
      const domTree: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [
          {
            tag: 'button',
            xpath: '/body/button',
            attributes: { id: 'submit-btn', class: 'primary' },
            text: 'Submit',
            children: [],
            isVisible: true,
            isInteractive: true,
            isTopElement: true,
            isInViewport: true,
            highlightIndex: 1,
            shadowRoot: false,
          },
          {
            tag: 'input',
            xpath: '/body/input',
            attributes: { type: 'text', placeholder: 'Enter name', id: 'name-input' },
            children: [],
            isVisible: true,
            isInteractive: true,
            isTopElement: true,
            isInViewport: true,
            highlightIndex: 2,
            shadowRoot: false,
          },
        ],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const result = service.formatDomForLLM(domTree);

      const expectedOutput = `Interactive elements from top layer of the current page inside the viewport:
[Start of page]
[1]<button id='submit-btn' class='primary'> />
[2]<input type='text' id='name-input' placeholder='Enter name'> />
[End of page]`;

      expect(result).toBe(expectedOutput);
    });

    it('should skip invisible elements without children', () => {
      const domTree: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [
          {
            tag: 'div',
            xpath: '/body/div',
            attributes: { style: 'display: none' },
            children: [],
            isVisible: false,
            isInteractive: false,
            isTopElement: false,
            isInViewport: false,
            shadowRoot: false,
          },
          {
            tag: 'button',
            xpath: '/body/button',
            attributes: {},
            text: 'Click me',
            children: [],
            isVisible: true,
            isInteractive: true,
            isTopElement: true,
            isInViewport: true,
            highlightIndex: 1,
            shadowRoot: false,
          },
        ],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const result = service.formatDomForLLM(domTree);

      const expectedOutput = `Interactive elements from top layer of the current page inside the viewport:
[Start of page]
[1]<button> />
[End of page]`;

      expect(result).toBe(expectedOutput);
    });

    it('should include standalone text nodes', () => {
      const domTree: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [
          {
            tag: 'h1',
            xpath: '/body/h1',
            attributes: {},
            children: [
              {
                tag: '#text',
                xpath: '',
                attributes: {},
                text: 'Page Title',
                children: [],
                isVisible: true,
                isInteractive: false,
                isTopElement: true,
                isInViewport: true,
                shadowRoot: false,
              },
            ],
            isVisible: true,
            isInteractive: false,
            isTopElement: true,
            isInViewport: true,
            shadowRoot: false,
          },
        ],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      // Set up parent relationships for text inclusion logic
      domTree.children[0].children[0].parent = domTree.children[0];
      domTree.children[0].parent = domTree;

      const result = service.formatDomForLLM(domTree);

      const expectedOutput = `Interactive elements from top layer of the current page inside the viewport:
[Start of page]
Page Title
[End of page]`;

      expect(result).toBe(expectedOutput);
    });
  });

  describe('createLlmPromptPayload', () => {
    it('should create a complete prompt payload in browser-use format', () => {
      const domTree: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };
      const userAction = 'Click the submit button';
      const browserState: BrowserState = {
        url: 'https://example.com',
        title: 'Example',
        domTree,
        selectorMap: {},
      };

      const result = service.createLlmPromptPayload(domTree, userAction, browserState);

      // Show the complete prompt structure
      console.log('\n=== COMPLETE PROMPT PAYLOAD ===');
      console.log('SYSTEM PROMPT:');
      console.log(result.systemPrompt);
      console.log('\nUSER PROMPT:');
      console.log(result.userPrompt);
      console.log('\nFUNCTIONS:');
      console.log(JSON.stringify(result.functions, null, 2));
      console.log('=== END PROMPT PAYLOAD ===\n');

      // Verify structure
      expect(result).toHaveProperty('systemPrompt');
      expect(result).toHaveProperty('userPrompt');
      expect(result).toHaveProperty('functions');

      // System prompt should contain browser automation guidance
      expect(result.systemPrompt).toContain('web automation assistant');
      expect(result.systemPrompt).toContain('Interactive elements are marked with [N]');
      expect(result.systemPrompt).toContain('highlightIndex=N');

      // User prompt should follow browser-use format structure
      const expectedUserPromptParts = [
        'INSTRUCTION: Click the submit button',
        '[Task history memory ends]',
        '[Current state starts here]',
        'Current url: https://example.com',
        'Interactive elements from top layer of the current page inside the viewport:',
        '[Start of page]',
        '[End of page]',
        'Current step: 1/10',
        'Current date and time:',
        'Please analyze the page and determine what action to take to: Click the submit button',
      ];

      for (const part of expectedUserPromptParts) {
        expect(result.userPrompt).toContain(part);
      }

      // Function definition
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].name).toBe('perform_browser_action');
      expect(result.functions[0].parameters.required).toEqual([
        'actionType',
        'description',
        'isAmbiguous',
        'confidence',
      ]);
    });

    it('should include tab information when provided', () => {
      const domTree: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };
      const userAction = 'Switch to the second tab';
      const browserState: BrowserState = {
        url: 'https://example.com',
        title: 'Example',
        domTree,
        selectorMap: {},
        tabs: [
          { pageIndex: 0, url: 'https://example.com', title: 'Example' },
          { pageIndex: 1, url: 'https://google.com', title: 'Google' },
        ],
      };

      const result = service.createLlmPromptPayload(domTree, userAction, browserState);

      expect(result.userPrompt).toContain('Available tabs:');
      expect(result.userPrompt).toContain("{'url': 'https://example.com', 'title': 'Example'}");
      expect(result.userPrompt).toContain("{'url': 'https://google.com', 'title': 'Google'}");
    });

    it('should have proper function definition structure', () => {
      const domTree: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const result = service.createLlmPromptPayload(domTree, 'test action');

      const functionDef = result.functions[0];
      expect(functionDef.parameters.type).toBe('object');
      expect(functionDef.parameters.properties).toHaveProperty('actionType');
      expect(functionDef.parameters.properties).toHaveProperty('targetSelector');
      expect(functionDef.parameters.properties).toHaveProperty('inputValue');
      expect(functionDef.parameters.properties).toHaveProperty('url');
      expect(functionDef.parameters.properties).toHaveProperty('description');
      expect(functionDef.parameters.properties).toHaveProperty('isAmbiguous');
      expect(functionDef.parameters.properties).toHaveProperty('confidence');
      expect(functionDef.parameters.properties).toHaveProperty('error');
      expect(functionDef.parameters.required).toEqual(['actionType', 'description', 'isAmbiguous', 'confidence']);
    });
  });

  describe('edge cases', () => {
    it('should handle empty DOM tree', () => {
      const domTree: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const result = service.formatDomForLLM(domTree);

      expect(result).toBeDefined();
      expect(result).toContain('[Start of page]');
      expect(result).toContain('[End of page]');
    });

    it('should handle special characters in attribute values', () => {
      const domTree: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [
          {
            tag: 'input',
            xpath: '/body/input',
            attributes: { value: 'Test "quoted" & <tagged>' },
            children: [],
            isVisible: true,
            isInteractive: true,
            isTopElement: true,
            isInViewport: true,
            highlightIndex: 1,
            shadowRoot: false,
          },
        ],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const result = service.formatDomForLLM(domTree);

      // Should include the element with attributes (value attribute is included but no text content)
      expect(result).toContain('[1]<input> />');
    });

    it('should handle elements without parent relationships', () => {
      const domTree: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [
          {
            tag: 'button',
            xpath: '/body/button',
            attributes: {},
            children: [],
            isVisible: true,
            isInteractive: true,
            isTopElement: true,
            isInViewport: true,
            highlightIndex: 0,
            shadowRoot: false,
            // No parent set intentionally
          },
        ],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      // Should not throw an error
      expect(() => {
        service.formatDomForLLM(domTree);
      }).not.toThrow();

      const result = service.formatDomForLLM(domTree);
      expect(result).toContain('[0]<button> />');
    });
  });
});
