import { createLogger } from '@common/logger';
import { SerializableDOMNode, DOMHistoryElement, BrowserState, HashedDomElement } from '@scenario-parser/interfaces';
import { ClickableElementProcessor } from './clickable-element-processor.service';

// Manages DOM history tracking and formats element changes for LLM context
export class HistoryTreeProcessor {
  private static readonly logger = createLogger(HistoryTreeProcessor.name);
  private static readonly MAX_HISTORY_SIZE = 10; // Keep last 10 states

  private static domHistory: DOMHistoryElement[] = [];
  private static stateHistory: BrowserState[] = [];

  // Add current DOM state to history
  static addToHistory(browserState: BrowserState): void {
    // Convert current DOM tree to history elements
    const currentHistoryElements = this.convertDomTreeToHistory(browserState.domTree);

    // Add to history
    this.domHistory.push(...currentHistoryElements);
    this.stateHistory.push(browserState);

    // Maintain history size limit
    if (this.stateHistory.length > this.MAX_HISTORY_SIZE) {
      this.stateHistory.shift();
      // Remove old history elements (approximate cleanup)
      const elementsToRemove = currentHistoryElements.length;
      this.domHistory.splice(0, elementsToRemove);
    }

    this.logger.debug('Added state to history', {
      currentElements: currentHistoryElements.length,
      totalHistoryElements: this.domHistory.length,
      totalStates: this.stateHistory.length,
    });
  }

  // Convert DOM tree to history elements
  private static convertDomTreeToHistory(domTree: SerializableDOMNode): DOMHistoryElement[] {
    const historyElements: DOMHistoryElement[] = [];

    const traverse = (node: SerializableDOMNode, parentPath: string[] = []) => {
      const currentPath = [...parentPath, node.tag];

      // Only track interactive elements with highlight indices
      if (node.highlightIndex !== undefined && node.isInteractive && node.isTopElement) {
        const historyElement: DOMHistoryElement = {
          tagName: node.tag,
          xpath: node.xpath,
          highlightIndex: node.highlightIndex,
          entireParentBranchPath: currentPath,
          attributes: { ...node.attributes },
          shadowRoot: node.shadowRoot || false,
          cssSelector: node.cssSelector,
          pageCoordinates: node.pageCoordinates,
          viewportCoordinates: node.viewportCoordinates,
          viewportInfo: node.viewportInfo,
          hash: node.hash || ClickableElementProcessor.createHashedDomElement(node),
        };

        historyElements.push(historyElement);
      }

      // Traverse children
      for (const child of node.children) {
        traverse(child, currentPath);
      }
    };

    traverse(domTree);
    return historyElements;
  }

  // Get elements that appeared in recent history
  static getRecentlyAppearedElements(currentElements: DOMHistoryElement[]): DOMHistoryElement[] {
    if (this.domHistory.length === 0) {
      return currentElements; // All elements are new if no history
    }

    const recentHashes = new Set(this.domHistory.slice(-50).map((element) => this.getElementHashString(element.hash)));

    return currentElements.filter((element) => !recentHashes.has(this.getElementHashString(element.hash)));
  }

  // Get elements that disappeared from recent history
  static getRecentlyDisappearedElements(currentElements: DOMHistoryElement[]): DOMHistoryElement[] {
    if (this.domHistory.length === 0) {
      return [];
    }

    const currentHashes = new Set(currentElements.map((element) => this.getElementHashString(element.hash)));

    return this.domHistory.slice(-50).filter((element) => !currentHashes.has(this.getElementHashString(element.hash)));
  }

  // Format history for LLM context
  static formatHistoryForLLM(currentElements: DOMHistoryElement[], includeRecent = true, maxElements = 20): string {
    const sections: string[] = [];

    if (includeRecent && this.domHistory.length > 0) {
      const recentlyAppeared = this.getRecentlyAppearedElements(currentElements);
      const recentlyDisappeared = this.getRecentlyDisappearedElements(currentElements);

      if (recentlyAppeared.length > 0) {
        sections.push('=== Recently Appeared Elements ===');
        sections.push(
          recentlyAppeared
            .slice(0, maxElements)
            .map((element) => this.formatHistoryElement(element, 'NEW'))
            .join('\n'),
        );
      }

      if (recentlyDisappeared.length > 0) {
        sections.push('=== Recently Disappeared Elements ===');
        sections.push(
          recentlyDisappeared
            .slice(0, maxElements)
            .map((element) => this.formatHistoryElement(element, 'REMOVED'))
            .join('\n'),
        );
      }
    }

    // Add summary of page changes
    if (this.stateHistory.length > 1) {
      const previousState = this.stateHistory[this.stateHistory.length - 2];
      const currentState = this.stateHistory[this.stateHistory.length - 1];

      if (previousState.url !== currentState.url) {
        sections.push(`=== Page Navigation ===`);
        sections.push(`Previous: ${previousState.url}`);
        sections.push(`Current: ${currentState.url}`);
      }
    }

    return sections.length > 0 ? sections.join('\n\n') : '';
  }

  // Format a single history element
  private static formatHistoryElement(element: DOMHistoryElement, status: 'NEW' | 'REMOVED'): string {
    const statusIcon = status === 'NEW' ? '🆕' : '❌';
    const coordinates = element.viewportCoordinates
      ? ` (${Math.round(element.viewportCoordinates.center.x)}, ${Math.round(element.viewportCoordinates.center.y)})`
      : '';

    let description = `${statusIcon} [${element.highlightIndex}] ${element.tagName}${coordinates}`;

    // Add relevant attributes
    const relevantAttrs = ['id', 'class', 'type', 'name', 'placeholder', 'aria-label'];
    const attrs = relevantAttrs
      .filter((attr) => element.attributes[attr])
      .map((attr) => `${attr}="${element.attributes[attr]}"`)
      .join(' ');

    if (attrs) {
      description += ` {${attrs}}`;
    }

    return description;
  }

  // Get element hash as string for comparison
  private static getElementHashString(hash: HashedDomElement): string {
    return `${hash.branchPathHash}-${hash.attributesHash}-${hash.xpathHash}`;
  }

  // Clear history (useful for testing or reset)
  static clearHistory(): void {
    this.domHistory = [];
    this.stateHistory = [];
    this.logger.debug('History cleared');
  }

  // Get current history size
  static getHistorySize(): { elements: number; states: number } {
    return {
      elements: this.domHistory.length,
      states: this.stateHistory.length,
    };
  }

  // Get elements by highlight index from history
  static getElementByHighlightIndex(highlightIndex: number): DOMHistoryElement | undefined {
    return this.domHistory
      .slice()
      .reverse()
      .find((element) => element.highlightIndex === highlightIndex);
  }

  // Check if element exists in recent history
  static elementExistsInRecentHistory(hash: HashedDomElement, lookbackSteps = 3): boolean {
    const hashString = this.getElementHashString(hash);
    const recentElements = this.domHistory.slice(-lookbackSteps * 20); // Approximate recent elements

    return recentElements.some((element) => this.getElementHashString(element.hash) === hashString);
  }
}
