import { PromptBuilderService } from './prompt-builder.service';
import { SerializableDOMNode, BrowserState } from '@scenario-parser/interfaces';

describe('PromptBuilderService - Browser-Use Alignment', () => {
  let service: PromptBuilderService;

  beforeEach(() => {
    service = new PromptBuilderService();
  });

  describe('formatDomForLLM - Browser-Use Format', () => {
    it('should format DOM exactly like browser-use example.com output', () => {
      // Create a DOM structure similar to example.com from the article
      const mockDomTree: SerializableDOMNode = {
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

      const divElement: SerializableDOMNode = {
        tag: 'div',
        xpath: '/body/div',
        attributes: {},
        children: [],
        parent: mockDomTree,
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const h1Text: SerializableDOMNode = {
        tag: '#text',
        xpath: '',
        attributes: {},
        children: [],
        text: 'Example Domain',
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const h1Element: SerializableDOMNode = {
        tag: 'h1',
        xpath: '/body/div/h1',
        attributes: {},
        children: [h1Text],
        parent: divElement,
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };
      h1Text.parent = h1Element;

      const p1Text: SerializableDOMNode = {
        tag: '#text',
        xpath: '',
        attributes: {},
        children: [],
        text: 'This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.',
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const p1Element: SerializableDOMNode = {
        tag: 'p',
        xpath: '/body/div/p[1]',
        attributes: {},
        children: [p1Text],
        parent: divElement,
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };
      p1Text.parent = p1Element;

      const linkText: SerializableDOMNode = {
        tag: '#text',
        xpath: '',
        attributes: {},
        children: [],
        text: 'More information...',
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const linkElement: SerializableDOMNode = {
        tag: 'a',
        xpath: '/body/div/p[2]/a',
        attributes: {
          href: 'https://www.iana.org/domains/example',
        },
        children: [linkText],
        isVisible: true,
        isInteractive: true,
        isTopElement: true,
        isInViewport: true,
        highlightIndex: 0,
        shadowRoot: false,
      };
      linkText.parent = linkElement;

      const p2Element: SerializableDOMNode = {
        tag: 'p',
        xpath: '/body/div/p[2]',
        attributes: {},
        children: [linkElement],
        parent: divElement,
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };
      linkElement.parent = p2Element;

      // Set up the complete tree structure
      divElement.children = [h1Element, p1Element, p2Element];
      mockDomTree.children = [divElement];

      const mockBrowserState: BrowserState = {
        url: 'https://example.com/',
        title: 'Example Domain',
        domTree: mockDomTree,
        selectorMap: {
          0: linkElement,
        },
        tabs: [
          {
            url: 'https://example.com/',
            title: 'Example Domain',
            pageIndex: 0,
          },
        ],
      };

      const result = service.formatDomForLLM(mockDomTree, mockBrowserState);

      // Show the complete browser-use formatted output
      console.log('\n=== BROWSER-USE FORMAT OUTPUT ===');
      console.log(result);
      console.log('=== END BROWSER-USE OUTPUT ===\n');

      const expectedOutput =
        `Current url: https://example.com/
Available tabs:
[{'url': 'https://example.com/', 'title': 'Example Domain'}]
Interactive elements from top layer of the current page inside the viewport:
[Start of page]
Example Domain
This domain is for use in illustrative examples in documents. ` +
        `You may use this domain in literature without prior coordination or asking for permission.
[0]<a href='https://www.iana.org/domains/example'>More information... />
[End of page]`;

      expect(result).toBe(expectedOutput);
    });

    it('should handle text node inclusion rules correctly', () => {
      // Test text nodes without highlighted parents are included
      const mockDomTree: SerializableDOMNode = {
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

      const h1Text: SerializableDOMNode = {
        tag: '#text',
        xpath: '',
        attributes: {},
        children: [],
        text: 'Standalone Heading',
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const h1Element: SerializableDOMNode = {
        tag: 'h1',
        xpath: '/body/h1',
        attributes: {},
        children: [h1Text],
        parent: mockDomTree,
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };
      h1Text.parent = h1Element;

      const buttonText: SerializableDOMNode = {
        tag: '#text',
        xpath: '',
        attributes: {},
        children: [],
        text: 'Click Me',
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const buttonElement: SerializableDOMNode = {
        tag: 'button',
        xpath: '/body/button',
        attributes: {},
        children: [buttonText],
        parent: mockDomTree,
        isVisible: true,
        isInteractive: true,
        isTopElement: true,
        isInViewport: true,
        highlightIndex: 0,
        shadowRoot: false,
      };
      buttonText.parent = buttonElement;

      // Set up the complete tree structure
      mockDomTree.children = [h1Element, buttonElement];

      const result = service.formatDomForLLM(mockDomTree);

      // Standalone text should be included
      expect(result).toContain('Standalone Heading');

      // Interactive element should be formatted with index
      expect(result).toContain('[0]<button>Click Me />');

      // Text within interactive element should NOT appear separately
      const lines = result.split('\n');
      const clickMeStandalone = lines.find((line) => line.trim() === 'Click Me' && !line.includes('[0]'));
      expect(clickMeStandalone).toBeUndefined();
    });
  });

  describe('createLlmPromptPayload - Browser-Use Format', () => {
    it('should create prompt payload in browser-use format', () => {
      const mockDomTree: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [
          {
            tag: 'a',
            xpath: '/body/a',
            attributes: { href: 'https://example.com' },
            children: [],
            isVisible: true,
            isInteractive: true,
            isTopElement: true,
            isInViewport: true,
            highlightIndex: 0,
            shadowRoot: false,
          },
        ],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const linkElement = mockDomTree.children[0];
      const mockBrowserState: BrowserState = {
        url: 'https://example.com/',
        title: 'Example',
        domTree: mockDomTree,
        selectorMap: {
          0: linkElement,
        },
      };

      const result = service.createLlmPromptPayload(mockDomTree, 'click the link', mockBrowserState);

      // Verify browser-use prompt structure
      expect(result.userPrompt).toContain('INSTRUCTION: click the link');
      expect(result.userPrompt).toContain('[Task history memory ends]');
      expect(result.userPrompt).toContain('[Current state starts here]');
      expect(result.userPrompt).toContain('The following is one-time information');
      expect(result.userPrompt).toContain('Current step: 1/10');
      expect(result.userPrompt).toContain('Current date and time:');
      expect(result.userPrompt).toContain(
        'Please analyze the page and determine what action to take to: click the link',
      );

      // Verify system prompt mentions browser-use concepts
      expect(result.systemPrompt).toContain('Interactive elements are marked with [N]');
      expect(result.systemPrompt).toContain('highlightIndex=N');

      // Verify function definition
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].name).toBe('perform_browser_action');
      expect(result.functions[0].parameters.required).toContain('actionType');
      expect(result.functions[0].parameters.required).toContain('isAmbiguous');
      expect(result.functions[0].parameters.required).toContain('confidence');
    });
  });

  describe('Interactive Element Formatting', () => {
    it('should format interactive elements exactly like browser-use', () => {
      const mockButton: SerializableDOMNode = {
        tag: 'button',
        xpath: '/body/button',
        attributes: {
          id: 'submit-btn',
          class: 'btn primary',
          type: 'submit',
        },
        children: [
          {
            tag: '#text',
            xpath: '',
            attributes: {},
            children: [],
            text: 'Submit Form',
            isVisible: true,
            isInteractive: false,
            isTopElement: true,
            isInViewport: true,
            shadowRoot: false,
          },
        ],
        isVisible: true,
        isInteractive: true,
        isTopElement: true,
        isInViewport: true,
        highlightIndex: 5,
        shadowRoot: false,
      };

      const mockDomTree: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [mockButton],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const result = service.formatDomForLLM(mockDomTree);

      // Should format with browser-use style: [N]<tag attr='value'>text />
      expect(result).toContain("[5]<button type='submit' id='submit-btn' class='btn primary'>Submit Form />");
    });

    it('should handle elements with new indicator', () => {
      const mockNewElement: SerializableDOMNode = {
        tag: 'div',
        xpath: '/body/div',
        attributes: {},
        children: [
          {
            tag: 'button',
            xpath: '/body/div/button',
            attributes: {},
            children: [],
            isVisible: true,
            isInteractive: true,
            isTopElement: true,
            isInViewport: true,
            highlightIndex: 0,
            shadowRoot: false,
            isNew: true, // New element indicator
          },
        ],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const result = service.formatDomForLLM(mockNewElement);

      // Should include new element in the output
      expect(result).toContain('[0]<button> />');
    });
  });
});
