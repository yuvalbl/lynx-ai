jest.mock('@common/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

import { createLogger } from '@common/logger';
import { PlaywrightBridgeService } from '../playwright-bridge/playwright-bridge.service';
import { DomProcessorService } from './dom-processor.service';
import { SerializableDOMNode } from '@scenario-parser/interfaces';
import { BuildDomTreeResult } from './buildDomTree.types';

// Define a type for accessing private methods in tests
type PrivateServiceMethods = {
  parseNode(data: unknown): SerializableDOMNode | null;
  constructDomTree(evalResult: unknown): {
    domTree: SerializableDOMNode;
    selectorMap: Record<number, SerializableDOMNode>;
  };
  createEmptyBodyNode(): SerializableDOMNode;
  extractNodeMapAndRootId(evalResult: unknown): { jsNodeMap: Record<string, unknown>; jsRootId: string };
  parseAllNodes(jsNodeMap: Record<string, unknown>): {
    parsedNodeMap: Record<string, SerializableDOMNode>;
    selectorMap: Record<number, SerializableDOMNode>;
  };
  linkChildrenToParents(parsedNodeMap: Record<string, SerializableDOMNode>, jsNodeMap: Record<string, unknown>): void;
  getRootNode(parsedNodeMap: Record<string, SerializableDOMNode>, rootId: string): SerializableDOMNode;
};

// Mock PlaywrightBridgeService
const mockPlaywrightBridge = {
  getPage: jest.fn(),
  evaluate: jest.fn(),
} as unknown as PlaywrightBridgeService;

// Mock for sample raw node data
const sampleRawTextNode = {
  type: 'TEXT_NODE',
  text: 'Sample text',
  isVisible: true,
};

const sampleRawElementNode = {
  tagName: 'div',
  xpath: '/html/body/div',
  attributes: { id: 'main', class: 'container' },
  children: ['child1', 'child2'],
  isVisible: true,
  isInteractive: true,
  isTopElement: true,
  isInViewport: true,
  highlightIndex: 1,
  shadowRoot: false,
};

const sampleDomTreeResult: BuildDomTreeResult = {
  rootId: 1,
  map: {
    1: {
      tagName: 'body',
      xpath: '/html/body',
      attributes: {},
      children: [2, 3],
      isVisible: true,
    },
    2: {
      tagName: 'div',
      xpath: '/html/body/div[1]',
      attributes: { id: 'div1' },
      children: [4],
      isVisible: true,
      highlightIndex: 1,
    },
    3: {
      tagName: 'div',
      xpath: '/html/body/div[2]',
      attributes: { id: 'div2' },
      children: [],
      isVisible: true,
      highlightIndex: 2,
    },
    4: {
      type: 'TEXT_NODE',
      text: 'Hello World',
      isVisible: true,
    },
  },
  perfMetrics: {
    buildDomTreeCalls: 1,
    timings: {
      buildDomTree: 0.1,
      highlightElement: 0,
      isInteractiveElement: 0,
      isElementVisible: 0,
      isTopElement: 0,
      isInExpandedViewport: 0,
      isTextNodeVisible: 0,
      getEffectiveScroll: 0,
    },
    cacheMetrics: {
      boundingRectCacheHits: 0,
      boundingRectCacheMisses: 0,
      computedStyleCacheHits: 0,
      computedStyleCacheMisses: 0,
      boundingRectHitRate: 0,
      computedStyleHitRate: 0,
      overallHitRate: 0,
    },
    nodeMetrics: {
      totalNodes: 4,
      processedNodes: 4,
      skippedNodes: 0,
    },
    buildDomTreeBreakdown: {
      buildDomTreeCalls: 1,
      domOperations: {
        getBoundingClientRect: 0,
        getComputedStyle: 0,
      },
      domOperationCounts: {
        getBoundingClientRect: 0,
        getComputedStyle: 0,
      },
    },
  },
};

describe('DomProcessorService (Unit)', () => {
  let service: DomProcessorService;
  const mockLogger = createLogger('test');

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DomProcessorService(mockPlaywrightBridge);
  });

  describe('constructor', () => {
    it('should initialize service with buildDomTree.js', () => {
      expect(mockLogger.info).toHaveBeenCalledWith('DomProcessorService initialized with buildDomTree.js loaded.');
    });
  });

  describe('getDomState', () => {
    it('should return empty body node for blank page', async () => {
      const mockPage = { url: () => 'about:blank' };
      (mockPlaywrightBridge.getPage as jest.Mock).mockResolvedValueOnce(mockPage);

      const result = await service.getDomState();

      expect(result.domTree.tag).toBe('body');
      expect(result.selectorMap).toEqual({});
      expect(mockLogger.warn).toHaveBeenCalledWith('Page is blank or undefined, returning empty DOM state.');
    });

    it('should return empty body node for null page', async () => {
      (mockPlaywrightBridge.getPage as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getDomState();

      expect(result.domTree.tag).toBe('body');
      expect(result.selectorMap).toEqual({});
    });

    it('should process valid DOM tree result', async () => {
      const mockPage = { url: () => 'https://example.com' };
      (mockPlaywrightBridge.getPage as jest.Mock).mockResolvedValue(mockPage);
      (mockPlaywrightBridge.evaluate as jest.Mock).mockResolvedValueOnce(sampleDomTreeResult);

      const result = await service.getDomState();

      expect(result.domTree.tag).toBe('body');
      expect(result.domTree.children).toHaveLength(2);
      expect(result.selectorMap[1]).toBeDefined();
      expect(result.selectorMap[2]).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith('Executing buildDomTree.js on https://example.com');
    });

    it('should log performance metrics in debug mode', async () => {
      const mockPage = { url: () => 'https://example.com' };
      (mockPlaywrightBridge.getPage as jest.Mock).mockResolvedValue(mockPage);
      (mockPlaywrightBridge.evaluate as jest.Mock).mockResolvedValueOnce(sampleDomTreeResult);

      // Force debug mode by setting NODE_ENV to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      await service.getDomState();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('DOM Tree Building Performance Metrics for: https://example.com'),
      );

      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle error when evaluate fails', async () => {
      const mockPage = { url: () => 'https://example.com' };
      (mockPlaywrightBridge.getPage as jest.Mock).mockResolvedValue(mockPage);
      const error = new Error('Evaluation failed');
      (mockPlaywrightBridge.evaluate as jest.Mock).mockRejectedValueOnce(error);

      await expect(service.getDomState()).rejects.toThrow('Failed to evaluate buildDomTree script: Evaluation failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error evaluating buildDomTree.js on https://example.com:'),
        expect.any(Object),
      );
    });

    it('should handle invalid result structure', async () => {
      const mockPage = { url: () => 'https://example.com' };
      (mockPlaywrightBridge.getPage as jest.Mock).mockResolvedValue(mockPage);
      (mockPlaywrightBridge.evaluate as jest.Mock).mockResolvedValueOnce({ invalid: 'structure' });

      await expect(service.getDomState()).rejects.toThrow('Invalid result structure from buildDomTree script.');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Invalid result structure received from buildDomTree.js on https://example.com',
      );
    });
  });

  describe('node parsing', () => {
    // Using private method access for testing parseNode directly
    // Note: In TypeScript private methods are accessible via this approach in tests

    it('should handle null node data', () => {
      // Type assertion for accessing private methods in tests
      const result = (service as unknown as PrivateServiceMethods).parseNode(null);
      expect(result).toBeNull();
    });

    it('should parse text nodes correctly', () => {
      // Type assertion for accessing private methods in tests
      const result = (service as unknown as PrivateServiceMethods).parseNode(sampleRawTextNode);

      // Add null check to prevent TypeScript errors
      expect(result).not.toBeNull();
      if (result) {
        expect(result.tag).toBe('#text');
        expect(result.text).toBe('Sample text');
        expect(result.isVisible).toBe(true);
        expect(result.isInteractive).toBe(false);
        expect(result.children).toEqual([]);
      }
    });

    it('should parse element nodes correctly', () => {
      const result = (service as unknown as PrivateServiceMethods).parseNode(sampleRawElementNode);

      // Add null check to prevent TypeScript errors
      expect(result).not.toBeNull();
      if (result) {
        expect(result.tag).toBe('div');
        expect(result.xpath).toBe('/html/body/div');
        expect(result.attributes).toEqual({ id: 'main', class: 'container' });
        expect(result.isVisible).toBe(true);
        expect(result.isInteractive).toBe(true);
        expect(result.isTopElement).toBe(true);
        expect(result.highlightIndex).toBe(1);
        expect(result.children).toEqual([]);
      }
    });

    it('should handle unrecognized node types', () => {
      const invalidNode = { someProperty: 'value' };
      const result = (service as unknown as PrivateServiceMethods).parseNode(invalidNode);

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid or unhandled node data structure encountered:'),
      );
    });
  });

  describe('DOM tree construction', () => {
    it('should correctly link parent-child relationships', () => {
      // Setup a simple DOM tree structure for testing
      const evalResult: BuildDomTreeResult = {
        rootId: 1,
        map: {
          1: {
            tagName: 'div',
            xpath: '/html/body/div',
            attributes: {},
            children: [2],
            isVisible: true,
          },
          2: {
            tagName: 'span',
            xpath: '/html/body/div/span',
            attributes: {},
            children: [],
            isVisible: true,
          },
        },
      };

      const result = (service as unknown as PrivateServiceMethods).constructDomTree(evalResult);

      // Check parent-child linking
      expect(result.domTree.tag).toBe('div');
      expect(result.domTree.children).toHaveLength(1);
      expect(result.domTree.children[0].tag).toBe('span');
      expect(result.domTree.children[0].parent).toBe(result.domTree);
    });

    it('should handle missing child nodes', () => {
      // Setup a tree with a missing child reference
      const evalResult: BuildDomTreeResult = {
        rootId: 1,
        map: {
          1: {
            tagName: 'div',
            xpath: '/html/body/div',
            attributes: {},
            children: [2, 999],
            isVisible: true,
          },
          2: {
            tagName: 'span',
            xpath: '/html/body/div/span',
            attributes: {},
            children: [],
            isVisible: true,
          },
        },
      };

      const result = (service as unknown as PrivateServiceMethods).constructDomTree(evalResult);

      expect(result.domTree.children).toHaveLength(1);
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Child node with id 999 not found'));
    });

    it('should handle missing root node', () => {
      // Setup a tree with a missing root
      const evalResult: BuildDomTreeResult = {
        rootId: 999,
        map: {
          1: {
            tagName: 'div',
            xpath: '/html/body/div',
            attributes: {},
            children: [],
            isVisible: true,
          },
        },
      };

      const result = (service as unknown as PrivateServiceMethods).constructDomTree(evalResult);

      // Should return a default empty body
      expect(result.domTree.tag).toBe('body');
      expect(mockLogger.error).toHaveBeenCalledWith('Root node not found in parsed map.');
    });

    it('should correctly construct a tree when the root node from buildDomTree.js has no children listed', () => {
      const evalResultWithEmptyBodyChildren: BuildDomTreeResult = {
        rootId: 1,
        map: {
          1: {
            tagName: 'body',
            xpath: '/body',
            attributes: {},
            children: [], // Body explicitly has no children listed from buildDomTree.js
            isVisible: true,
          },
          // This div exists in the map but is not listed as a child of the body
          2: {
            tagName: 'div',
            xpath: '/body/div[1]',
            attributes: { id: 'orphaned_div' },
            children: [],
            isVisible: true,
          },
        },
      };

      const result = (service as unknown as PrivateServiceMethods).constructDomTree(
        evalResultWithEmptyBodyChildren as any, // Cast to any to satisfy BuildDomTreeResult type for mock
      );

      expect(result.domTree.tag).toBe('body');
      expect(result.domTree.children).toHaveLength(0); // Key assertion for the issue
      // Optionally, verify selectorMap is empty if div_id has no highlightIndex
      expect(Object.keys(result.selectorMap)).toHaveLength(0);
    });

    describe('extractNodeMapAndRootId', () => {
      it('should correctly extract node map and root ID', () => {
        const evalResult: BuildDomTreeResult = {
          rootId: 1,
          map: {
            1: {
              tagName: 'body',
              attributes: {},
              xpath: '/body',
              children: [],
            },
            2: {
              tagName: 'div',
              attributes: {},
              xpath: '/div',
              children: [],
            },
          },
        };

        const result = (service as unknown as PrivateServiceMethods).extractNodeMapAndRootId(evalResult);

        expect(result.jsRootId).toBe(1);
        expect(result.jsNodeMap).toBe(evalResult.map);
      });
    });

    describe('parseAllNodes', () => {
      it('should create parsed nodes and selector map', () => {
        const jsNodeMap = {
          1: {
            tagName: 'body',
            xpath: '/body',
            children: [2],
          },
          2: {
            tagName: 'div',
            xpath: '/body/div',
            highlightIndex: 1,
            isVisible: true,
            isInteractive: true,
          },
        };

        const result = (service as unknown as PrivateServiceMethods).parseAllNodes(jsNodeMap);

        // Check parsedNodeMap
        expect(Object.keys(result.parsedNodeMap)).toHaveLength(2);
        expect(result.parsedNodeMap['1'].tag).toBe('body');
        expect(result.parsedNodeMap['2'].tag).toBe('div');

        // Check selectorMap
        expect(Object.keys(result.selectorMap)).toHaveLength(1);
        expect(result.selectorMap[1]).toBe(result.parsedNodeMap['2']);
      });

      it('should handle nodes that fail to parse', () => {
        const jsNodeMap = {
          1: {
            tagName: 'body',
            xpath: '/body',
            children: [2],
          },
          2: {
            // Invalid node without required attributes
          },
        };

        const result = (service as unknown as PrivateServiceMethods).parseAllNodes(jsNodeMap);

        // Should only have the valid node
        expect(Object.keys(result.parsedNodeMap)).toHaveLength(1);
        expect(result.parsedNodeMap['1']).toBeDefined();
        expect(result.parsedNodeMap['2']).toBeUndefined();
      });
    });

    describe('linkChildrenToParents', () => {
      it('should correctly link children to parents', () => {
        // Create pre-parsed nodes without children relationships
        const parsedNodeMap: Record<string, SerializableDOMNode> = {
          '1': {
            tag: 'body',
            xpath: '/body',
            attributes: {},
            children: [], // Empty children array initially
            isVisible: true,
            isInteractive: false,
            isTopElement: true,
            isInViewport: true,
          },
          '2': {
            tag: 'div',
            xpath: '/body/div',
            attributes: {},
            children: [], // Empty children array initially
            isVisible: true,
            isInteractive: true,
            isTopElement: true,
            isInViewport: true,
            highlightIndex: 1,
          },
          '3': {
            tag: '#text',
            text: 'Hello',
            xpath: '',
            attributes: {},
            children: [], // Empty children array initially
            isVisible: true,
            isInteractive: false,
            isTopElement: false,
            isInViewport: true,
          },
        };

        const jsNodeMap = {
          1: {
            tagName: 'body',
            children: ['2'],
          },
          2: {
            tagName: 'div',
            children: ['3'],
          },
          3: {
            type: 'TEXT_NODE',
            text: 'Hello',
          },
        };

        // Call the method to test
        (service as unknown as PrivateServiceMethods).linkChildrenToParents(parsedNodeMap, jsNodeMap);

        // Verify parent-child relationships
        expect(parsedNodeMap['1'].children).toHaveLength(1);
        expect(parsedNodeMap['1'].children[0]).toBe(parsedNodeMap['2']);
        expect(parsedNodeMap['2'].parent).toBe(parsedNodeMap['1']);

        expect(parsedNodeMap['2'].children).toHaveLength(1);
        expect(parsedNodeMap['2'].children[0]).toBe(parsedNodeMap['3']);
        expect(parsedNodeMap['3'].parent).toBe(parsedNodeMap['2']);
      });

      it('should handle missing children IDs gracefully', () => {
        const parsedNodeMap: Record<string, SerializableDOMNode> = {
          '1': {
            tag: 'body',
            xpath: '/body',
            attributes: {},
            children: [],
            isVisible: true,
            isInteractive: false,
            isTopElement: true,
            isInViewport: true,
          },
        };

        const jsNodeMap = {
          1: {
            tagName: 'body',
            children: [999], // Child that doesn't exist
          },
        };

        // Call the method to test
        (service as unknown as PrivateServiceMethods).linkChildrenToParents(parsedNodeMap, jsNodeMap);

        // Should not throw, should log warning
        expect(parsedNodeMap['1'].children).toHaveLength(0);
        expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Child node with id 999 not found'));
      });
    });

    describe('getRootNode', () => {
      it('should return the root node from parsed map', () => {
        const parsedNodeMap: Record<string, SerializableDOMNode> = {
          '123': {
            tag: 'body',
            xpath: '/body',
            attributes: {},
            children: [],
            isVisible: true,
            isInteractive: false,
            isTopElement: true,
            isInViewport: true,
            parent: {} as SerializableDOMNode, // Should be removed
          },
        };

        const result = (service as unknown as PrivateServiceMethods).getRootNode(parsedNodeMap, '123');

        expect(result).toBe(parsedNodeMap['123']);
        expect(result.parent).toBeUndefined(); // Parent reference should be removed
      });

      it('should handle missing root ID', () => {
        const parsedNodeMap: Record<string, SerializableDOMNode> = {
          '1': {
            tag: 'div',
            xpath: '/div',
            attributes: {},
            children: [],
            isVisible: true,
            isInteractive: false,
            isTopElement: false,
            isInViewport: true,
          },
        };

        const result = (service as unknown as PrivateServiceMethods).getRootNode(parsedNodeMap, '999');

        // Should return empty body node
        expect(result.tag).toBe('body');
        expect(mockLogger.error).toHaveBeenCalledWith('Root node not found in parsed map.');
      });
    });

    describe('constructDomTree - end to end', () => {
      it('should build a complex DOM tree with multiple levels and text nodes', () => {
        const complexDomTreeResult: BuildDomTreeResult = {
          rootId: 1,
          map: {
            1: {
              tagName: 'body',
              xpath: '/html/body',
              attributes: {},
              children: [2, 3],
              isVisible: true,
            },
            2: {
              tagName: 'div',
              xpath: '/html/body/div[1]',
              attributes: { id: 'first-div' },
              children: [4, 5],
              isVisible: true,
              isInteractive: true,
              isTopElement: true,
              highlightIndex: 1,
            },
            3: {
              tagName: 'div',
              xpath: '/html/body/div[2]',
              attributes: { id: 'second-div' },
              children: [7],
              isVisible: true,
            },
            4: {
              tagName: 'span',
              xpath: '/html/body/div[1]/span',
              attributes: { class: 'highlight' },
              children: [6],
              isVisible: true,
            },
            5: {
              type: 'TEXT_NODE',
              text: 'Text outside span',
              isVisible: true,
            },
            6: {
              type: 'TEXT_NODE',
              text: 'Text inside span',
              isVisible: true,
            },
            7: {
              tagName: 'button',
              xpath: '/html/body/div[2]/button',
              attributes: { type: 'button' },
              children: [8],
              isVisible: true,
              isInteractive: true,
              isTopElement: true,
              highlightIndex: 2,
            },
            8: {
              type: 'TEXT_NODE',
              text: 'Click me',
              isVisible: true,
            },
          },
        };

        const result = (service as unknown as PrivateServiceMethods).constructDomTree(complexDomTreeResult);

        // Verify overall structure
        expect(result.domTree.tag).toBe('body');
        expect(result.domTree.children).toHaveLength(2);

        // Verify first div and its contents
        const div1 = result.domTree.children[0];
        expect(div1.tag).toBe('div');
        expect(div1.attributes.id).toBe('first-div');
        expect(div1.children).toHaveLength(2);

        // Check span and text nodes
        const span = div1.children.find((child) => child.tag === 'span');
        expect(span).toBeDefined();
        expect(span!.children).toHaveLength(1);
        expect(span!.children[0].tag).toBe('#text');
        expect(span!.children[0].text).toBe('Text inside span');

        // Check direct text node in div1
        const textInDiv = div1.children.find((child) => child.tag === '#text');
        expect(textInDiv).toBeDefined();
        expect(textInDiv!.text).toBe('Text outside span');

        // Verify second div and button
        const div2 = result.domTree.children[1];
        expect(div2.tag).toBe('div');
        expect(div2.attributes.id).toBe('second-div');
        expect(div2.children).toHaveLength(1);

        const button = div2.children[0];
        expect(button.tag).toBe('button');
        expect(button.children).toHaveLength(1);
        expect(button.children[0].tag).toBe('#text');
        expect(button.children[0].text).toBe('Click me');

        // Verify selector map
        expect(Object.keys(result.selectorMap)).toHaveLength(2);
        expect(result.selectorMap[1].tag).toBe('div');
        expect(result.selectorMap[2].tag).toBe('button');
      });

      // This test specifically focuses on the test case failing in integration tests
      it('should correctly process a simple DOM with a div and text', () => {
        const simpleDomResult: BuildDomTreeResult = {
          rootId: 1,
          map: {
            1: {
              tagName: 'body',
              xpath: '/html/body',
              attributes: {},
              children: [2],
              isVisible: true,
            },
            2: {
              tagName: 'div',
              xpath: '/html/body/div',
              attributes: {},
              children: [3],
              isVisible: true,
            },
            3: {
              type: 'TEXT_NODE',
              text: 'Test',
              isVisible: true,
            },
          },
        };

        const result = (service as unknown as PrivateServiceMethods).constructDomTree(simpleDomResult);

        // Check the structure matches what's expected in the integration test
        expect(result.domTree.tag).toBe('body');
        expect(result.domTree.children).toHaveLength(1);

        const divElement = result.domTree.children[0];
        expect(divElement.tag).toBe('div');
        expect(divElement.children).toHaveLength(1);

        const textNode = divElement.children[0];
        expect(textNode.tag).toBe('#text');
        expect(textNode.text).toBe('Test');
      });

      it('should correctly process a simple DOM with a button and text', () => {
        const simpleDomResult: BuildDomTreeResult = {
          rootId: 1,
          map: {
            1: {
              tagName: 'body',
              xpath: '/html/body',
              attributes: {},
              children: [2],
              isVisible: true,
            },
            2: {
              tagName: 'button',
              xpath: '/html/body/button',
              attributes: {},
              children: [3],
              isVisible: true,
              isInteractive: true,
              isTopElement: true,
              highlightIndex: 1,
            },
            3: {
              type: 'TEXT_NODE',
              text: 'Click me',
              isVisible: true,
            },
          },
        };

        const result = (service as unknown as PrivateServiceMethods).constructDomTree(simpleDomResult);

        // Check the structure matches what's expected in the integration test
        expect(result.domTree.tag).toBe('body');
        expect(result.domTree.children).toHaveLength(1);

        const buttonElement = result.domTree.children[0];
        expect(buttonElement.tag).toBe('button');
        expect(buttonElement.isInteractive).toBe(true);
        expect(buttonElement.children).toHaveLength(1);

        const textNode = buttonElement.children[0];
        expect(textNode.tag).toBe('#text');
        expect(textNode.text).toBe('Click me');

        // Check selector map
        expect(Object.keys(result.selectorMap)).toHaveLength(1);
        const buttonInMap = result.selectorMap[1];
        expect(buttonInMap.tag).toBe('button');
      });
    });
  });

  describe('createEmptyBodyNode', () => {
    it('should create an empty body node with expected properties', () => {
      const emptyNode = (service as unknown as PrivateServiceMethods).createEmptyBodyNode();

      expect(emptyNode.tag).toBe('body');
      expect(emptyNode.xpath).toBe('/body');
      expect(emptyNode.attributes).toEqual({});
      expect(emptyNode.children).toEqual([]);
      expect(emptyNode.isVisible).toBe(true);
      expect(emptyNode.isInteractive).toBe(false);
      expect(emptyNode.isTopElement).toBe(true);
      expect(emptyNode.isInViewport).toBe(true);
      expect(emptyNode.shadowRoot).toBe(false);
    });
  });
});
