import { createLogger } from '@common/logger';
import { SerializableDOMNode, SelectorMap, BrowserState, ViewportInfo } from '@scenario-parser/interfaces';
import { PlaywrightBridgeService } from '../../playwright-bridge/playwright-bridge.service';
import { ClickableElementProcessor, HistoryTreeProcessor } from '../processors';

// Creates and manages comprehensive browser state objects with viewport and history integration
export class BrowserStateService {
  private static readonly logger = createLogger(BrowserStateService.name);

  // Create browser state from DOM tree and selector map
  static async createBrowserState(
    domTree: SerializableDOMNode,
    selectorMap: SelectorMap,
    playwrightBridge: PlaywrightBridgeService,
  ): Promise<BrowserState> {
    const page = await playwrightBridge.getPage();
    const url = page ? page.url() : 'about:blank';
    const title = page ? await page.title() : '';
    const viewportInfo = await this.getViewportInfo(playwrightBridge);

    // Get clickable elements hashes for change detection
    const clickableElementsHashes = ClickableElementProcessor.getClickableElementsHashes(domTree);

    return {
      url,
      title,
      domTree,
      selectorMap,
      viewportInfo,
      clickableElementsHashes,
    };
  }

  // Create empty browser state for blank pages
  static createEmptyBrowserState(emptyDomTree: SerializableDOMNode): BrowserState {
    return {
      url: 'about:blank',
      title: '',
      domTree: emptyDomTree,
      selectorMap: {},
      viewportInfo: { scrollX: 0, scrollY: 0, width: 1920, height: 1080 },
      clickableElementsHashes: new Set(),
    };
  }

  // Process history and detect changes
  static processHistoryAndChanges(browserState: BrowserState): void {
    // Add current state to history
    HistoryTreeProcessor.addToHistory(browserState);

    this.logger.debug('Browser state processed and added to history', {
      url: browserState.url,
      clickableElements: browserState.clickableElementsHashes?.size || 0,
      historySize: HistoryTreeProcessor.getHistorySize(),
    });
  }

  // Get formatted history for LLM context
  static getFormattedHistoryForLLM(): string {
    const currentElements = HistoryTreeProcessor.getHistorySize().elements > 0 ? [] : [];

    return HistoryTreeProcessor.formatHistoryForLLM(currentElements);
  }

  // Clear history (useful for testing)
  static clearHistory(): void {
    HistoryTreeProcessor.clearHistory();
  }

  // Get viewport information
  private static async getViewportInfo(playwrightBridge: PlaywrightBridgeService): Promise<ViewportInfo> {
    const page = await playwrightBridge.getPage();
    if (!page) {
      return { scrollX: 0, scrollY: 0, width: 1920, height: 1080 };
    }

    return await playwrightBridge.evaluate(() => {
      return {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
      };
    });
  }
}
