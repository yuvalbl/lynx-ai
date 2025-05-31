import { createLogger } from '@common/logger';
import { PlaywrightBridgeService } from '../playwright-bridge/playwright-bridge.service';
import { SerializableDOMNode, SelectorMap, BrowserState } from '@scenario-parser/interfaces';
import { DomTreeBuilderService, DomEnhancementService, BrowserStateService, BuildDomTreeResult } from './services';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const buildDomTreeScript = require('./buildDomTree.js');

// Import the Page type from playwright
type Page = {
  url(): string;
  title(): Promise<string>;
};

interface GetDomStateOptions {
  doHighlightElements?: boolean;
  focusHighlightIndex?: number;
  viewportExpansion?: number;
}

interface NormalizedOptions {
  doHighlightElements: boolean;
  focusHighlightIndex: number;
  viewportExpansion: number;
  debugMode: boolean;
}

interface GetDomStateResult {
  domTree: SerializableDOMNode;
  selectorMap: SelectorMap;
  browserState: BrowserState;
}

// Default options for getDomState method
const DEFAULT_GET_DOM_STATE_OPTIONS: GetDomStateOptions = {
  doHighlightElements: false,
  focusHighlightIndex: -1,
  viewportExpansion: 0,
};

export class DomProcessorService {
  private readonly logger = createLogger(DomProcessorService.name);
  private previousClickableHashes: Set<string> = new Set();

  constructor(private playwrightBridge: PlaywrightBridgeService) {
    this.logger.info('DomProcessorService initialized with buildDomTree.js loaded.');
  }

  // Main method to get DOM state with all enhancements
  async getDomState(options: GetDomStateOptions = DEFAULT_GET_DOM_STATE_OPTIONS): Promise<GetDomStateResult> {
    const normalizedOptions = this.normalizeOptions(options);
    const page = await this.playwrightBridge.getPage();

    if (this.isEmptyOrBlankPage(page)) {
      return this.getEmptyDomState();
    }

    const evalResult = await this.executeBuildDomTreeScript(page, normalizedOptions);
    await this.logPerformanceMetricsIfDebug(evalResult, normalizedOptions.debugMode);

    return this.constructDomTree(evalResult);
  }

  // Get formatted history for LLM context
  getFormattedHistoryForLLM(): string {
    return BrowserStateService.getFormattedHistoryForLLM();
  }

  // Clear history (useful for testing)
  clearHistory(): void {
    BrowserStateService.clearHistory();
    this.previousClickableHashes.clear();
  }

  // Normalize options with defaults
  private normalizeOptions(options: GetDomStateOptions): NormalizedOptions {
    return {
      doHighlightElements: options.doHighlightElements ?? DEFAULT_GET_DOM_STATE_OPTIONS.doHighlightElements!,
      focusHighlightIndex: options.focusHighlightIndex ?? DEFAULT_GET_DOM_STATE_OPTIONS.focusHighlightIndex!,
      viewportExpansion: options.viewportExpansion ?? DEFAULT_GET_DOM_STATE_OPTIONS.viewportExpansion!,
      debugMode: process.env.NODE_ENV !== 'production',
    };
  }

  // Check if page is empty or blank
  private isEmptyOrBlankPage(page: Page | null): boolean {
    return !page || page.url() === 'about:blank';
  }

  // Get empty DOM state for blank pages
  private getEmptyDomState(): GetDomStateResult {
    this.logger.warn('Page is blank or undefined, returning empty DOM state.');
    const emptyDomTree = DomTreeBuilderService.createEmptyBodyNode();
    const emptyBrowserState = BrowserStateService.createEmptyBrowserState(emptyDomTree);
    return { domTree: emptyDomTree, selectorMap: {}, browserState: emptyBrowserState };
  }

  // Execute buildDomTree.js script
  private async executeBuildDomTreeScript(page: Page, options: NormalizedOptions): Promise<BuildDomTreeResult> {
    this.logger.info(`Executing buildDomTree.js on ${page.url()}`);

    const args = {
      doHighlightElements: options.doHighlightElements,
      focusHighlightIndex: options.focusHighlightIndex,
      viewportExpansion: options.viewportExpansion,
      debugMode: options.debugMode,
    };

    try {
      const evalResult = await this.playwrightBridge.evaluate<BuildDomTreeResult>(buildDomTreeScript, args);

      if (!evalResult || typeof evalResult !== 'object' || !evalResult.map || !evalResult.rootId) {
        this.logger.error(`Invalid result structure received from buildDomTree.js on ${page.url()}`);
        throw new Error('Invalid result structure from buildDomTree script.');
      }

      return evalResult;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const originalError = error instanceof Error ? error : undefined;
      this.logger.error(`Error evaluating buildDomTree.js on ${page.url()}: ${message}`, { error: originalError });
      throw new Error(`Failed to evaluate buildDomTree script: ${message}`);
    }
  }

  // Log performance metrics if in debug mode
  private async logPerformanceMetricsIfDebug(result: BuildDomTreeResult, isDebug: boolean): Promise<void> {
    if (isDebug && result.perfMetrics) {
      const page = await this.playwrightBridge.getPage();
      const url = page ? page.url() : 'unknown';
      this.logger.debug(
        `DOM Tree Building Performance Metrics for: ${url}\n${JSON.stringify(result.perfMetrics, null, 2)}`,
      );
    }
  }

  // Construct enhanced DOM tree with all features
  private async constructDomTree(evalResult: BuildDomTreeResult): Promise<GetDomStateResult> {
    // Build basic DOM tree
    const { domTree, selectorMap } = DomTreeBuilderService.buildFromRawData(evalResult);

    // Enhance DOM tree with browser-use features
    const { enhancedDomTree, currentHashes } = await DomEnhancementService.enhanceDomTree(
      domTree,
      this.playwrightBridge,
      this.previousClickableHashes,
    );

    // Update previous hashes for next comparison
    this.previousClickableHashes = currentHashes;

    // Create browser state
    const browserState = await BrowserStateService.createBrowserState(
      enhancedDomTree,
      selectorMap,
      this.playwrightBridge,
    );

    // Process history and changes
    BrowserStateService.processHistoryAndChanges(browserState);

    return { domTree: enhancedDomTree, selectorMap, browserState };
  }
}
