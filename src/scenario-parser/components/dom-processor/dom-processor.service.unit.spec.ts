// Mock the logger to prevent console clutter during tests
jest.mock('@common/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Mock the service dependencies with minimal return values
jest.mock('./services/dom-tree-builder.service', () => ({
  DomTreeBuilderService: {
    buildFromRawData: jest.fn().mockReturnValue({
      domTree: { tag: 'body', children: [], attributes: {}, xpath: '/body' },
      selectorMap: {},
    }),
    createEmptyBodyNode: jest.fn().mockReturnValue({
      tag: 'body',
      xpath: '/body',
      attributes: {},
      children: [],
    }),
  },
}));

jest.mock('./services/dom-enhancement.service', () => ({
  DomEnhancementService: {
    enhanceDomTree: jest.fn().mockResolvedValue({
      enhancedDomTree: { tag: 'body', children: [], attributes: {}, xpath: '/body' },
      currentHashes: new Set(),
    }),
  },
}));

jest.mock('./services/browser-state.service', () => ({
  BrowserStateService: {
    createBrowserState: jest.fn().mockResolvedValue({
      url: 'https://example.com',
      title: 'Test',
      domTree: {},
      selectorMap: {},
      viewportInfo: { scrollX: 0, scrollY: 0, width: 1920, height: 1080 },
      clickableElementsHashes: new Set(),
    }),
    processHistoryAndChanges: jest.fn(),
    createEmptyBrowserState: jest.fn().mockReturnValue({
      url: 'about:blank',
      title: '',
      domTree: {},
      selectorMap: {},
      viewportInfo: { scrollX: 0, scrollY: 0, width: 1920, height: 1080 },
      clickableElementsHashes: new Set(),
    }),
  },
}));

import { PlaywrightBridgeService } from '../playwright-bridge/playwright-bridge.service';
import { DomProcessorService } from './dom-processor.service';

describe('DomProcessorService (Unit) - Business Logic Only', () => {
  let service: DomProcessorService;
  let mockPlaywrightBridge: jest.Mocked<PlaywrightBridgeService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPlaywrightBridge = {
      getPage: jest.fn(),
      evaluate: jest.fn(),
      initialize: jest.fn(),
      close: jest.fn(),
    } as any;

    service = new DomProcessorService(mockPlaywrightBridge);
  });

  describe('blank page detection logic', () => {
    it('should detect about:blank pages', async () => {
      const mockPage = { url: () => 'about:blank', title: async () => '' };
      mockPlaywrightBridge.getPage.mockResolvedValue(mockPage as any);

      const result = await service.getDomState();

      expect(result.domTree.tag).toBe('body');
      expect(result.selectorMap).toEqual({});
      expect(result.browserState.url).toBe('about:blank');
    });

    it('should detect null pages', async () => {
      mockPlaywrightBridge.getPage.mockResolvedValue(null as any);

      const result = await service.getDomState();

      expect(result.domTree.tag).toBe('body');
      expect(result.selectorMap).toEqual({});
      expect(result.browserState.url).toBe('about:blank');
    });
  });

  describe('options normalization logic', () => {
    it('should normalize options with defaults', async () => {
      const mockPage = { url: () => 'https://example.com', title: async () => 'Test' };
      mockPlaywrightBridge.getPage.mockResolvedValue(mockPage as any);
      mockPlaywrightBridge.evaluate.mockResolvedValue({
        rootId: '1',
        map: { '1': { tagName: 'body', children: [] } },
      });

      // Test default options
      await service.getDomState();

      expect(mockPlaywrightBridge.evaluate).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          doHighlightElements: false,
          focusHighlightIndex: -1,
          viewportExpansion: 0,
          debugMode: process.env.NODE_ENV !== 'production',
        }),
      );
    });

    it('should merge custom options with defaults', async () => {
      const mockPage = { url: () => 'https://example.com', title: async () => 'Test' };
      mockPlaywrightBridge.getPage.mockResolvedValue(mockPage as any);
      mockPlaywrightBridge.evaluate.mockResolvedValue({
        rootId: '1',
        map: { '1': { tagName: 'body', children: [] } },
      });

      // Test custom options
      await service.getDomState({
        doHighlightElements: true,
        viewportExpansion: 100,
        // focusHighlightIndex not provided, should get default
      });

      expect(mockPlaywrightBridge.evaluate).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          doHighlightElements: true,
          focusHighlightIndex: -1, // default
          viewportExpansion: 100,
          debugMode: process.env.NODE_ENV !== 'production',
        }),
      );
    });
  });

  describe('error handling logic', () => {
    it('should validate result structure and throw meaningful errors', async () => {
      const mockPage = { url: () => 'https://example.com', title: async () => 'Test' };
      mockPlaywrightBridge.getPage.mockResolvedValue(mockPage as any);

      // Test invalid structure
      mockPlaywrightBridge.evaluate.mockResolvedValue({ invalid: 'data' });
      await expect(service.getDomState()).rejects.toThrow('Invalid result structure from buildDomTree script.');

      // Test missing map
      mockPlaywrightBridge.evaluate.mockResolvedValue({ rootId: '1' });
      await expect(service.getDomState()).rejects.toThrow('Invalid result structure from buildDomTree script.');

      // Test missing rootId
      mockPlaywrightBridge.evaluate.mockResolvedValue({ map: {} });
      await expect(service.getDomState()).rejects.toThrow('Invalid result structure from buildDomTree script.');
    });

    it('should wrap and rethrow evaluation errors with context', async () => {
      const mockPage = { url: () => 'https://example.com', title: async () => 'Test' };
      mockPlaywrightBridge.getPage.mockResolvedValue(mockPage as any);

      const originalError = new Error('Script failed');
      mockPlaywrightBridge.evaluate.mockRejectedValue(originalError);

      await expect(service.getDomState()).rejects.toThrow('Failed to evaluate buildDomTree script: Script failed');
    });
  });
});
