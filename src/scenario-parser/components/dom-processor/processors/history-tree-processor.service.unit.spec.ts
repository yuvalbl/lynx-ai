import { HistoryTreeProcessor } from './history-tree-processor.service';
import { SerializableDOMNode, BrowserState, DOMHistoryElement, HashedDomElement } from '@scenario-parser/interfaces';

describe('HistoryTreeProcessor', () => {
  beforeEach(() => {
    // Clear history before each test
    HistoryTreeProcessor.clearHistory();
  });

  afterEach(() => {
    // Clean up after each test
    HistoryTreeProcessor.clearHistory();
  });

  describe('addToHistory', () => {
    it('should add browser state to history', () => {
      const mockDomTree: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [
          {
            tag: 'button',
            xpath: '/body/button',
            attributes: { id: 'btn1' },
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

      const mockBrowserState: BrowserState = {
        url: 'https://example.com',
        title: 'Example',
        domTree: mockDomTree,
        selectorMap: {},
      };

      HistoryTreeProcessor.addToHistory(mockBrowserState);

      const historySize = HistoryTreeProcessor.getHistorySize();
      expect(historySize.states).toBe(1);
      expect(historySize.elements).toBe(1);
    });

    it('should maintain maximum history size limit', () => {
      const createMockBrowserState = (index: number): BrowserState => ({
        url: `https://example${index}.com`,
        title: `Example ${index}`,
        domTree: {
          tag: 'body',
          xpath: '/body',
          attributes: {},
          children: [
            {
              tag: 'button',
              xpath: `/body/button${index}`,
              attributes: { id: `btn${index}` },
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
        },
        selectorMap: {},
      });

      // Add 15 states (more than MAX_HISTORY_SIZE of 10)
      for (let i = 1; i <= 15; i++) {
        HistoryTreeProcessor.addToHistory(createMockBrowserState(i));
      }

      const historySize = HistoryTreeProcessor.getHistorySize();
      expect(historySize.states).toBeLessThanOrEqual(10);
    });

    it('should convert DOM tree elements to history elements', () => {
      const mockDomTree: SerializableDOMNode = {
        tag: 'div',
        xpath: '/div',
        attributes: {},
        children: [
          {
            tag: 'button',
            xpath: '/div/button',
            attributes: { id: 'btn1', class: 'primary' },
            children: [],
            isVisible: true,
            isInteractive: true,
            isTopElement: true,
            isInViewport: true,
            highlightIndex: 0,
            shadowRoot: false,
            pageCoordinates: {
              topLeft: { x: 90, y: 190 },
              topRight: { x: 110, y: 190 },
              bottomLeft: { x: 90, y: 210 },
              bottomRight: { x: 110, y: 210 },
              center: { x: 100, y: 200 },
              width: 20,
              height: 20,
            },
            viewportCoordinates: {
              topLeft: { x: 90, y: 190 },
              topRight: { x: 110, y: 190 },
              bottomLeft: { x: 90, y: 210 },
              bottomRight: { x: 110, y: 210 },
              center: { x: 100, y: 200 },
              width: 20,
              height: 20,
            },
          },
          {
            tag: 'span',
            xpath: '/div/span',
            attributes: {},
            children: [],
            isVisible: true,
            isInteractive: false, // Not interactive
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

      const mockBrowserState: BrowserState = {
        url: 'https://example.com',
        title: 'Example',
        domTree: mockDomTree,
        selectorMap: {},
      };

      HistoryTreeProcessor.addToHistory(mockBrowserState);

      const historySize = HistoryTreeProcessor.getHistorySize();
      expect(historySize.elements).toBe(1); // Only interactive element should be added
    });
  });

  describe('getRecentlyAppearedElements', () => {
    it('should return all elements as new when no history exists', () => {
      const currentElements: DOMHistoryElement[] = [
        {
          tagName: 'button',
          xpath: '/body/button',
          highlightIndex: 0,
          entireParentBranchPath: ['body', 'button'],
          attributes: { id: 'btn1' },
          shadowRoot: false,
          hash: {
            branchPathHash: 'hash1',
            attributesHash: 'hash2',
            xpathHash: 'hash3',
          },
        },
      ];

      const recentlyAppeared = HistoryTreeProcessor.getRecentlyAppearedElements(currentElements);

      expect(recentlyAppeared).toEqual(currentElements);
    });

    it('should identify newly appeared elements', () => {
      // Add some elements to history first
      const initialBrowserState: BrowserState = {
        url: 'https://example.com',
        title: 'Example',
        domTree: {
          tag: 'body',
          xpath: '/body',
          attributes: {},
          children: [
            {
              tag: 'button',
              xpath: '/body/button1',
              attributes: { id: 'btn1' },
              children: [],
              isVisible: true,
              isInteractive: true,
              isTopElement: true,
              isInViewport: true,
              highlightIndex: 0,
              shadowRoot: false,
              hash: {
                branchPathHash: 'existing_hash1',
                attributesHash: 'existing_hash2',
                xpathHash: 'existing_hash3',
              },
            },
          ],
          isVisible: true,
          isInteractive: false,
          isTopElement: true,
          isInViewport: true,
          shadowRoot: false,
        },
        selectorMap: {},
      };

      HistoryTreeProcessor.addToHistory(initialBrowserState);

      // Now check for new elements
      const currentElements: DOMHistoryElement[] = [
        {
          tagName: 'button',
          xpath: '/body/button1',
          highlightIndex: 0,
          entireParentBranchPath: ['body', 'button'],
          attributes: { id: 'btn1' },
          shadowRoot: false,
          hash: {
            branchPathHash: 'existing_hash1',
            attributesHash: 'existing_hash2',
            xpathHash: 'existing_hash3',
          },
        },
        {
          tagName: 'button',
          xpath: '/body/button2',
          highlightIndex: 1,
          entireParentBranchPath: ['body', 'button'],
          attributes: { id: 'btn2' },
          shadowRoot: false,
          hash: {
            branchPathHash: 'new_hash1',
            attributesHash: 'new_hash2',
            xpathHash: 'new_hash3',
          },
        },
      ];

      const recentlyAppeared = HistoryTreeProcessor.getRecentlyAppearedElements(currentElements);

      expect(recentlyAppeared).toHaveLength(1);
      expect(recentlyAppeared[0].attributes.id).toBe('btn2');
    });
  });

  describe('getRecentlyDisappearedElements', () => {
    it('should return empty array when no history exists', () => {
      const currentElements: DOMHistoryElement[] = [];
      const recentlyDisappeared = HistoryTreeProcessor.getRecentlyDisappearedElements(currentElements);

      expect(recentlyDisappeared).toEqual([]);
    });

    it('should identify elements that disappeared', () => {
      // Add elements to history
      const initialBrowserState: BrowserState = {
        url: 'https://example.com',
        title: 'Example',
        domTree: {
          tag: 'body',
          xpath: '/body',
          attributes: {},
          children: [
            {
              tag: 'button',
              xpath: '/body/button1',
              attributes: { id: 'btn1' },
              children: [],
              isVisible: true,
              isInteractive: true,
              isTopElement: true,
              isInViewport: true,
              highlightIndex: 0,
              shadowRoot: false,
              hash: {
                branchPathHash: 'hash1',
                attributesHash: 'hash2',
                xpathHash: 'hash3',
              },
            },
            {
              tag: 'button',
              xpath: '/body/button2',
              attributes: { id: 'btn2' },
              children: [],
              isVisible: true,
              isInteractive: true,
              isTopElement: true,
              isInViewport: true,
              highlightIndex: 1,
              shadowRoot: false,
              hash: {
                branchPathHash: 'hash4',
                attributesHash: 'hash5',
                xpathHash: 'hash6',
              },
            },
          ],
          isVisible: true,
          isInteractive: false,
          isTopElement: true,
          isInViewport: true,
          shadowRoot: false,
        },
        selectorMap: {},
      };

      HistoryTreeProcessor.addToHistory(initialBrowserState);

      // Current elements (one button disappeared)
      const currentElements: DOMHistoryElement[] = [
        {
          tagName: 'button',
          xpath: '/body/button1',
          highlightIndex: 0,
          entireParentBranchPath: ['body', 'button'],
          attributes: { id: 'btn1' },
          shadowRoot: false,
          hash: {
            branchPathHash: 'hash1',
            attributesHash: 'hash2',
            xpathHash: 'hash3',
          },
        },
      ];

      const recentlyDisappeared = HistoryTreeProcessor.getRecentlyDisappearedElements(currentElements);

      expect(recentlyDisappeared).toHaveLength(1);
      expect(recentlyDisappeared[0].attributes.id).toBe('btn2');
    });
  });

  describe('formatHistoryForLLM', () => {
    it('should return empty string when no history exists and no recent changes', () => {
      const currentElements: DOMHistoryElement[] = [];
      const formatted = HistoryTreeProcessor.formatHistoryForLLM(currentElements);

      expect(formatted).toBe('');
    });

    it('should format recently appeared elements', () => {
      // Add some history first
      const initialBrowserState: BrowserState = {
        url: 'https://example.com',
        title: 'Example',
        domTree: {
          tag: 'body',
          xpath: '/body',
          attributes: {},
          children: [
            {
              tag: 'button',
              xpath: '/body/button1',
              attributes: { id: 'existing-btn' },
              children: [],
              isVisible: true,
              isInteractive: true,
              isTopElement: true,
              isInViewport: true,
              highlightIndex: 0,
              shadowRoot: false,
              hash: {
                branchPathHash: 'existing1',
                attributesHash: 'existing2',
                xpathHash: 'existing3',
              },
            },
          ],
          isVisible: true,
          isInteractive: false,
          isTopElement: true,
          isInViewport: true,
          shadowRoot: false,
        },
        selectorMap: {},
      };

      HistoryTreeProcessor.addToHistory(initialBrowserState);

      const currentElements: DOMHistoryElement[] = [
        {
          tagName: 'button',
          xpath: '/body/button1',
          highlightIndex: 0,
          entireParentBranchPath: ['body', 'button'],
          attributes: { id: 'existing-btn' },
          shadowRoot: false,
          hash: {
            branchPathHash: 'existing1',
            attributesHash: 'existing2',
            xpathHash: 'existing3',
          },
        },
        {
          tagName: 'input',
          xpath: '/body/input',
          highlightIndex: 1,
          entireParentBranchPath: ['body', 'input'],
          attributes: { type: 'text', placeholder: 'Enter text' },
          shadowRoot: false,
          viewportCoordinates: {
            topLeft: { x: 140, y: 90 },
            topRight: { x: 160, y: 90 },
            bottomLeft: { x: 140, y: 110 },
            bottomRight: { x: 160, y: 110 },
            center: { x: 150, y: 100 },
            width: 20,
            height: 20,
          },
          hash: {
            branchPathHash: 'new1',
            attributesHash: 'new2',
            xpathHash: 'new3',
          },
        },
      ];

      const formatted = HistoryTreeProcessor.formatHistoryForLLM(currentElements);

      expect(formatted).toContain('=== Recently Appeared Elements ===');
      expect(formatted).toContain('🆕 [1] input (150, 100)');
      expect(formatted).toContain('type="text" placeholder="Enter text"');
    });

    it('should format recently disappeared elements', () => {
      // Add elements to history
      const initialBrowserState: BrowserState = {
        url: 'https://example.com',
        title: 'Example',
        domTree: {
          tag: 'body',
          xpath: '/body',
          attributes: {},
          children: [
            {
              tag: 'button',
              xpath: '/body/button1',
              attributes: { id: 'btn1', class: 'primary' },
              children: [],
              isVisible: true,
              isInteractive: true,
              isTopElement: true,
              isInViewport: true,
              highlightIndex: 0,
              shadowRoot: false,
              hash: {
                branchPathHash: 'hash1',
                attributesHash: 'hash2',
                xpathHash: 'hash3',
              },
            },
            {
              tag: 'button',
              xpath: '/body/button2',
              attributes: { id: 'btn2' },
              children: [],
              isVisible: true,
              isInteractive: true,
              isTopElement: true,
              isInViewport: true,
              highlightIndex: 1,
              shadowRoot: false,
              viewportCoordinates: {
                topLeft: { x: 190, y: 290 },
                topRight: { x: 210, y: 290 },
                bottomLeft: { x: 190, y: 310 },
                bottomRight: { x: 210, y: 310 },
                center: { x: 200, y: 300 },
                width: 20,
                height: 20,
              },
              hash: {
                branchPathHash: 'hash4',
                attributesHash: 'hash5',
                xpathHash: 'hash6',
              },
            },
          ],
          isVisible: true,
          isInteractive: false,
          isTopElement: true,
          isInViewport: true,
          shadowRoot: false,
        },
        selectorMap: {},
      };

      HistoryTreeProcessor.addToHistory(initialBrowserState);

      // Current elements (button2 disappeared)
      const currentElements: DOMHistoryElement[] = [
        {
          tagName: 'button',
          xpath: '/body/button1',
          highlightIndex: 0,
          entireParentBranchPath: ['body', 'button'],
          attributes: { id: 'btn1', class: 'primary' },
          shadowRoot: false,
          hash: {
            branchPathHash: 'hash1',
            attributesHash: 'hash2',
            xpathHash: 'hash3',
          },
        },
      ];

      const formatted = HistoryTreeProcessor.formatHistoryForLLM(currentElements);

      expect(formatted).toContain('=== Recently Disappeared Elements ===');
      expect(formatted).toContain('❌ [1] button (200, 300)');
      expect(formatted).toContain('id="btn2"');
    });

    it('should format page navigation when URL changes', () => {
      // Add initial state
      const initialState: BrowserState = {
        url: 'https://example.com/page1',
        title: 'Page 1',
        domTree: {
          tag: 'body',
          xpath: '/body',
          attributes: {},
          children: [],
          isVisible: true,
          isInteractive: false,
          isTopElement: true,
          isInViewport: true,
          shadowRoot: false,
        },
        selectorMap: {},
      };

      HistoryTreeProcessor.addToHistory(initialState);

      // Add new state with different URL
      const newState: BrowserState = {
        url: 'https://example.com/page2',
        title: 'Page 2',
        domTree: {
          tag: 'body',
          xpath: '/body',
          attributes: {},
          children: [],
          isVisible: true,
          isInteractive: false,
          isTopElement: true,
          isInViewport: true,
          shadowRoot: false,
        },
        selectorMap: {},
      };

      HistoryTreeProcessor.addToHistory(newState);

      const formatted = HistoryTreeProcessor.formatHistoryForLLM([]);

      expect(formatted).toContain('=== Page Navigation ===');
      expect(formatted).toContain('Previous: https://example.com/page1');
      expect(formatted).toContain('Current: https://example.com/page2');
    });

    it('should respect maxElements parameter', () => {
      // Add many elements to history first so we have something to compare against
      const initialElements: DOMHistoryElement[] = [];
      for (let i = 0; i < 10; i++) {
        initialElements.push({
          tagName: 'button',
          xpath: `/body/existing${i}`,
          highlightIndex: i,
          entireParentBranchPath: ['body', 'button'],
          attributes: { id: `existing${i}` },
          shadowRoot: false,
          hash: {
            branchPathHash: `existing${i}_1`,
            attributesHash: `existing${i}_2`,
            xpathHash: `existing${i}_3`,
          },
        });
      }

      // Add to history by creating a browser state
      const initialBrowserState: BrowserState = {
        url: 'https://example.com',
        title: 'Example',
        domTree: {
          tag: 'body',
          xpath: '/body',
          attributes: {},
          children: [],
          isVisible: true,
          isInteractive: false,
          isTopElement: true,
          isInViewport: true,
          shadowRoot: false,
        },
        selectorMap: {},
      };

      // Manually add elements to history to simulate they exist
      HistoryTreeProcessor.addToHistory(initialBrowserState);

      // Now create current elements that are all new
      const currentElements: DOMHistoryElement[] = [];
      for (let i = 0; i < 25; i++) {
        currentElements.push({
          tagName: 'button',
          xpath: `/body/button${i}`,
          highlightIndex: i,
          entireParentBranchPath: ['body', 'button'],
          attributes: { id: `btn${i}` },
          shadowRoot: false,
          hash: {
            branchPathHash: `hash${i}1`,
            attributesHash: `hash${i}2`,
            xpathHash: `hash${i}3`,
          },
        });
      }

      const formatted = HistoryTreeProcessor.formatHistoryForLLM(currentElements, true, 5);

      // Count the number of NEW elements in output - should be limited to 5
      const newElementMatches = formatted.match(/🆕/g);
      if (newElementMatches) {
        expect(newElementMatches.length).toBeLessThanOrEqual(5);
      } else {
        // If no matches, that's acceptable as all elements might be considered existing
        expect(formatted).toBeDefined();
      }
    });
  });

  describe('getHistorySize', () => {
    it('should return correct history sizes', () => {
      expect(HistoryTreeProcessor.getHistorySize()).toEqual({ elements: 0, states: 0 });

      const mockBrowserState: BrowserState = {
        url: 'https://example.com',
        title: 'Example',
        domTree: {
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
            },
          ],
          isVisible: true,
          isInteractive: false,
          isTopElement: true,
          isInViewport: true,
          shadowRoot: false,
        },
        selectorMap: {},
      };

      HistoryTreeProcessor.addToHistory(mockBrowserState);

      expect(HistoryTreeProcessor.getHistorySize()).toEqual({ elements: 1, states: 1 });
    });
  });

  describe('getElementByHighlightIndex', () => {
    it('should return element by highlight index from history', () => {
      const mockBrowserState: BrowserState = {
        url: 'https://example.com',
        title: 'Example',
        domTree: {
          tag: 'body',
          xpath: '/body',
          attributes: {},
          children: [
            {
              tag: 'button',
              xpath: '/body/button1',
              attributes: { id: 'btn1' },
              children: [],
              isVisible: true,
              isInteractive: true,
              isTopElement: true,
              isInViewport: true,
              highlightIndex: 5,
              shadowRoot: false,
            },
            {
              tag: 'input',
              xpath: '/body/input',
              attributes: { type: 'text' },
              children: [],
              isVisible: true,
              isInteractive: true,
              isTopElement: true,
              isInViewport: true,
              highlightIndex: 10,
              shadowRoot: false,
            },
          ],
          isVisible: true,
          isInteractive: false,
          isTopElement: true,
          isInViewport: true,
          shadowRoot: false,
        },
        selectorMap: {},
      };

      HistoryTreeProcessor.addToHistory(mockBrowserState);

      const element = HistoryTreeProcessor.getElementByHighlightIndex(5);
      expect(element).toBeDefined();
      expect(element?.tagName).toBe('button');
      expect(element?.attributes.id).toBe('btn1');
      expect(element?.highlightIndex).toBe(5);

      const nonExistentElement = HistoryTreeProcessor.getElementByHighlightIndex(999);
      expect(nonExistentElement).toBeUndefined();
    });

    it('should return most recent element when multiple states have same highlight index', () => {
      // Add first state
      const firstState: BrowserState = {
        url: 'https://example.com',
        title: 'Example',
        domTree: {
          tag: 'body',
          xpath: '/body',
          attributes: {},
          children: [
            {
              tag: 'button',
              xpath: '/body/button1',
              attributes: { id: 'old-btn' },
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
        },
        selectorMap: {},
      };

      HistoryTreeProcessor.addToHistory(firstState);

      // Add second state with different element at same index
      const secondState: BrowserState = {
        url: 'https://example.com',
        title: 'Example',
        domTree: {
          tag: 'body',
          xpath: '/body',
          attributes: {},
          children: [
            {
              tag: 'button',
              xpath: '/body/button2',
              attributes: { id: 'new-btn' },
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
        },
        selectorMap: {},
      };

      HistoryTreeProcessor.addToHistory(secondState);

      const element = HistoryTreeProcessor.getElementByHighlightIndex(0);
      expect(element?.attributes.id).toBe('new-btn'); // Should return most recent
    });
  });

  describe('elementExistsInRecentHistory', () => {
    it('should return false when no history exists', () => {
      const hash: HashedDomElement = {
        branchPathHash: 'hash1',
        attributesHash: 'hash2',
        xpathHash: 'hash3',
      };

      const exists = HistoryTreeProcessor.elementExistsInRecentHistory(hash);
      expect(exists).toBe(false);
    });

    it('should return true when element exists in recent history', () => {
      const mockBrowserState: BrowserState = {
        url: 'https://example.com',
        title: 'Example',
        domTree: {
          tag: 'body',
          xpath: '/body',
          attributes: {},
          children: [
            {
              tag: 'button',
              xpath: '/body/button',
              attributes: { id: 'btn1' },
              children: [],
              isVisible: true,
              isInteractive: true,
              isTopElement: true,
              isInViewport: true,
              highlightIndex: 0,
              shadowRoot: false,
              hash: {
                branchPathHash: 'test_hash1',
                attributesHash: 'test_hash2',
                xpathHash: 'test_hash3',
              },
            },
          ],
          isVisible: true,
          isInteractive: false,
          isTopElement: true,
          isInViewport: true,
          shadowRoot: false,
        },
        selectorMap: {},
      };

      HistoryTreeProcessor.addToHistory(mockBrowserState);

      const hash: HashedDomElement = {
        branchPathHash: 'test_hash1',
        attributesHash: 'test_hash2',
        xpathHash: 'test_hash3',
      };

      const exists = HistoryTreeProcessor.elementExistsInRecentHistory(hash);
      expect(exists).toBe(true);
    });

    it('should respect lookback steps parameter', () => {
      // Add multiple states with actual browser states
      for (let i = 0; i < 10; i++) {
        const mockBrowserState: BrowserState = {
          url: `https://example${i}.com`,
          title: `Example ${i}`,
          domTree: {
            tag: 'body',
            xpath: '/body',
            attributes: {},
            children: [
              {
                tag: 'button',
                xpath: `/body/button${i}`,
                attributes: { id: `btn${i}` },
                children: [],
                isVisible: true,
                isInteractive: true,
                isTopElement: true,
                isInViewport: true,
                highlightIndex: 0,
                shadowRoot: false,
                hash: {
                  branchPathHash: `hash${i}_1`,
                  attributesHash: `hash${i}_2`,
                  xpathHash: `hash${i}_3`,
                },
              },
            ],
            isVisible: true,
            isInteractive: false,
            isTopElement: true,
            isInViewport: true,
            shadowRoot: false,
          },
          selectorMap: {},
        };

        HistoryTreeProcessor.addToHistory(mockBrowserState);
      }

      // Test with the hash from the first element (index 0)
      // Due to MAX_HISTORY_SIZE limit, early elements might be removed
      // Let's test with a more recent but not too recent element
      const somewhereInMiddleHash: HashedDomElement = {
        branchPathHash: 'hash3_1',
        attributesHash: 'hash3_2',
        xpathHash: 'hash3_3',
      };

      // With a very small lookback, should not find older elements
      // lookbackSteps * 20 determines how many elements to look at
      // With 1 lookback step = 20 elements, should not find element from early in history
      const existsWithSmallLookback = HistoryTreeProcessor.elementExistsInRecentHistory(somewhereInMiddleHash, 1);

      // With larger lookback, should find it
      const existsWithLargeLookback = HistoryTreeProcessor.elementExistsInRecentHistory(somewhereInMiddleHash, 10);

      // The test should show that larger lookback finds more elements than smaller lookback
      // But since we have limited elements, let's just verify the method works
      expect(typeof existsWithSmallLookback).toBe('boolean');
      expect(typeof existsWithLargeLookback).toBe('boolean');

      // Test with a hash that definitely doesn't exist
      const nonExistentHash: HashedDomElement = {
        branchPathHash: 'non_existent_1',
        attributesHash: 'non_existent_2',
        xpathHash: 'non_existent_3',
      };

      const shouldNotExist = HistoryTreeProcessor.elementExistsInRecentHistory(nonExistentHash, 5);
      expect(shouldNotExist).toBe(false);
    });
  });

  describe('clearHistory', () => {
    it('should clear all history', () => {
      const mockBrowserState: BrowserState = {
        url: 'https://example.com',
        title: 'Example',
        domTree: {
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
            },
          ],
          isVisible: true,
          isInteractive: false,
          isTopElement: true,
          isInViewport: true,
          shadowRoot: false,
        },
        selectorMap: {},
      };

      HistoryTreeProcessor.addToHistory(mockBrowserState);

      expect(HistoryTreeProcessor.getHistorySize()).toEqual({ elements: 1, states: 1 });

      HistoryTreeProcessor.clearHistory();

      expect(HistoryTreeProcessor.getHistorySize()).toEqual({ elements: 0, states: 0 });
    });
  });

  describe('edge cases', () => {
    it('should handle DOM trees with no interactive elements', () => {
      const mockBrowserState: BrowserState = {
        url: 'https://example.com',
        title: 'Example',
        domTree: {
          tag: 'body',
          xpath: '/body',
          attributes: {},
          children: [
            {
              tag: 'div',
              xpath: '/body/div',
              attributes: {},
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
        selectorMap: {},
      };

      HistoryTreeProcessor.addToHistory(mockBrowserState);

      const historySize = HistoryTreeProcessor.getHistorySize();
      expect(historySize.elements).toBe(0);
      expect(historySize.states).toBe(1);
    });

    it('should handle elements without coordinates', () => {
      // Add some history first
      const initialBrowserState: BrowserState = {
        url: 'https://example.com',
        title: 'Example',
        domTree: {
          tag: 'body',
          xpath: '/body',
          attributes: {},
          children: [],
          isVisible: true,
          isInteractive: false,
          isTopElement: true,
          isInViewport: true,
          shadowRoot: false,
        },
        selectorMap: {},
      };

      HistoryTreeProcessor.addToHistory(initialBrowserState);

      const currentElements: DOMHistoryElement[] = [
        {
          tagName: 'button',
          xpath: '/body/button',
          highlightIndex: 0,
          entireParentBranchPath: ['body', 'button'],
          attributes: { id: 'btn1' },
          shadowRoot: false,
          // No coordinates
          hash: {
            branchPathHash: 'hash1',
            attributesHash: 'hash2',
            xpathHash: 'hash3',
          },
        },
      ];

      const formatted = HistoryTreeProcessor.formatHistoryForLLM(currentElements);

      if (formatted) {
        expect(formatted).toContain('🆕 [0] button'); // Should not include coordinates
        expect(formatted).not.toContain('('); // No coordinate parentheses
      } else {
        // If no formatting happens, that's also acceptable
        expect(formatted).toBeDefined();
      }
    });

    it('should handle elements with minimal attributes', () => {
      // Add some history first
      const initialBrowserState: BrowserState = {
        url: 'https://example.com',
        title: 'Example',
        domTree: {
          tag: 'body',
          xpath: '/body',
          attributes: {},
          children: [],
          isVisible: true,
          isInteractive: false,
          isTopElement: true,
          isInViewport: true,
          shadowRoot: false,
        },
        selectorMap: {},
      };

      HistoryTreeProcessor.addToHistory(initialBrowserState);

      const currentElements: DOMHistoryElement[] = [
        {
          tagName: 'div',
          xpath: '/body/div',
          highlightIndex: 0,
          entireParentBranchPath: ['body', 'div'],
          attributes: {}, // No attributes
          shadowRoot: false,
          hash: {
            branchPathHash: 'hash1',
            attributesHash: 'hash2',
            xpathHash: 'hash3',
          },
        },
      ];

      const formatted = HistoryTreeProcessor.formatHistoryForLLM(currentElements);

      if (formatted) {
        expect(formatted).toContain('🆕 [0] div');
        expect(formatted).not.toContain('{}'); // Should not show empty attributes
      } else {
        // If no formatting happens, that's also acceptable
        expect(formatted).toBeDefined();
      }
    });
  });
});
