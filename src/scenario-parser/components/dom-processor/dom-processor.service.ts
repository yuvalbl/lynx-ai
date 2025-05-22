import { createLogger } from '@common/logger'; // Try path alias
import { PlaywrightBridgeService } from '../playwright-bridge/playwright-bridge.service';
import { SerializableDOMNode, SelectorMap } from '@scenario-parser/interfaces';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const buildDomTreeScript = require('./buildDomTree.js');

// Import the Page type from playwright
type Page = {
  url(): string;
};

// Enhanced type definitions
type NodeId = string;
type RawNodeMap = Record<NodeId, RawNodeData>;

// Expected structure of the raw node data from buildDomTree.js
interface RawNodeData {
  type?: 'TEXT_NODE';
  text?: string;
  tagName?: string;
  xpath?: string;
  attributes?: Record<string, string>;
  children?: string[]; // IDs of children
  isVisible?: boolean;
  isInteractive?: boolean;
  isTopElement?: boolean;
  isInViewport?: boolean;
  highlightIndex?: number;
  shadowRoot?: boolean;
}

// Define the expected structure of the result from buildDomTree.js evaluate call
interface BuildDomTreeResult {
  rootId: string;
  map: RawNodeMap;
  perfMetrics?: unknown; // Optional performance metrics
}

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
  // The complete DOM structure
  domTree: SerializableDOMNode;

  // Maps highlightIndex values to ONLY interactive elements
  selectorMap: SelectorMap;
}

// Default options for getDomState method
const DEFAULT_GET_DOM_STATE_OPTIONS: GetDomStateOptions = {
  doHighlightElements: false,
  focusHighlightIndex: -1,
  viewportExpansion: 0,
};

export class DomProcessorService {
  private readonly logger = createLogger(DomProcessorService.name);

  constructor(private playwrightBridge: PlaywrightBridgeService) {
    this.logger.info('DomProcessorService initialized with buildDomTree.js loaded.');
  }

  // Executes the buildDomTree.js script in the current page context
  // and processes the result into a SerializableDOMNode tree and SelectorMap.
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

  private normalizeOptions(options: GetDomStateOptions): NormalizedOptions {
    return {
      doHighlightElements:
        options.doHighlightElements !== undefined
          ? options.doHighlightElements
          : DEFAULT_GET_DOM_STATE_OPTIONS.doHighlightElements!,
      focusHighlightIndex:
        options.focusHighlightIndex !== undefined
          ? options.focusHighlightIndex
          : DEFAULT_GET_DOM_STATE_OPTIONS.focusHighlightIndex!,
      viewportExpansion:
        options.viewportExpansion !== undefined
          ? options.viewportExpansion
          : DEFAULT_GET_DOM_STATE_OPTIONS.viewportExpansion!,
      debugMode: process.env.NODE_ENV !== 'production',
    };
  }

  private isEmptyOrBlankPage(page: Page | null): boolean {
    return !page || page.url() === 'about:blank';
  }

  private getEmptyDomState(): GetDomStateResult {
    this.logger.warn('Page is blank or undefined, returning empty DOM state.');
    return { domTree: this.createEmptyBodyNode(), selectorMap: {} };
  }

  private async executeBuildDomTreeScript(page: Page, options: NormalizedOptions): Promise<BuildDomTreeResult> {
    this.logger.info(`Executing buildDomTree.js on ${page.url()}`);

    // Configuration arguments for the buildDomTree.js script
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

  private async logPerformanceMetricsIfDebug(result: BuildDomTreeResult, isDebug: boolean): Promise<void> {
    if (isDebug && result.perfMetrics) {
      const page = await this.playwrightBridge.getPage();
      const url = page ? page.url() : 'unknown';
      this.logger.debug(
        `DOM Tree Building Performance Metrics for: ${url}\n` + `${JSON.stringify(result.perfMetrics, null, 2)}`,
      );
    }
  }

  // Constructs the SerializableDOMNode tree and SelectorMap from the raw map data.
  private constructDomTree(evalResult: BuildDomTreeResult): GetDomStateResult {
    const { jsNodeMap, jsRootId } = this.extractNodeMapAndRootId(evalResult);
    const { parsedNodeMap, selectorMap } = this.parseAllNodes(jsNodeMap);
    this.linkChildrenToParents(parsedNodeMap, jsNodeMap);

    const rootNode = this.getRootNode(parsedNodeMap, jsRootId);
    return { domTree: rootNode, selectorMap };
  }

  private extractNodeMapAndRootId(evalResult: BuildDomTreeResult): { jsNodeMap: RawNodeMap; jsRootId: string } {
    return {
      jsNodeMap: evalResult.map,
      jsRootId: evalResult.rootId,
    };
  }

  private parseAllNodes(jsNodeMap: RawNodeMap): {
    parsedNodeMap: Record<string, SerializableDOMNode>;
    selectorMap: SelectorMap;
  } {
    const selectorMap: SelectorMap = {};
    const parsedNodeMap: Record<string, SerializableDOMNode> = {};

    // First pass: Parse all nodes from the map
    for (const id in jsNodeMap) {
      const nodeData = jsNodeMap[id];
      const parsedNode = this.parseNode(nodeData);
      if (parsedNode) {
        parsedNodeMap[id] = parsedNode;

        // Populate selectorMap if it's an element node with a highlightIndex
        if (parsedNode.highlightIndex !== undefined) {
          selectorMap[parsedNode.highlightIndex] = parsedNode;
        }
      }
    }

    return { parsedNodeMap, selectorMap };
  }

  private linkChildrenToParents(parsedNodeMap: Record<string, SerializableDOMNode>, jsNodeMap: RawNodeMap): void {
    // Second pass: Link children to parents
    for (const id in parsedNodeMap) {
      const parentParsedNode = parsedNodeMap[id];
      const rawParentData = jsNodeMap[id];
      const childrenIds = rawParentData?.children || [];

      for (const childId of childrenIds) {
        const childParsedNode = parsedNodeMap[childId];
        if (childParsedNode) {
          childParsedNode.parent = parentParsedNode;
          parentParsedNode.children.push(childParsedNode);
        } else {
          this.logger.warn(`Child node with id ${childId} not found in parsedNodeMap for parent ${id}`);
        }
      }
    }
  }

  private getRootNode(parsedNodeMap: Record<string, SerializableDOMNode>, rootId: string): SerializableDOMNode {
    const rootNode = parsedNodeMap[rootId];

    if (!rootNode) {
      this.logger.error('Root node not found in parsed map.');
      // Return a default empty body structure in case of failure
      return this.createEmptyBodyNode();
    }

    // Clean up parent references on the root node if necessary (shouldn't have one)
    delete rootNode.parent;

    return rootNode;
  }

  // Parses a single raw node data object into a SerializableDOMNode.
  // Replicates Python's _parse_node logic.
  private parseNode(nodeData: RawNodeData): SerializableDOMNode | null {
    if (!nodeData) {
      return null;
    }

    if (this.isTextNode(nodeData)) {
      return this.createTextNode(nodeData);
    }

    if (this.isElementNode(nodeData)) {
      return this.createElementNode(nodeData);
    }

    // Ignore other node types or invalid data
    this.logger.warn(`Invalid or unhandled node data structure encountered: ` + `${JSON.stringify(nodeData)}`);
    return null;
  }

  private isTextNode(nodeData: RawNodeData): boolean {
    return nodeData.type === 'TEXT_NODE';
  }

  private isElementNode(nodeData: RawNodeData): boolean {
    return Boolean(nodeData.tagName);
  }

  private createTextNode(nodeData: RawNodeData): SerializableDOMNode {
    return {
      tag: '#text', // Use a special tag name for text nodes
      text: nodeData.text || '',
      xpath: '', // Text nodes don't have XPath
      attributes: {}, // No attributes for text nodes
      children: [], // Text nodes don't have children
      isVisible: nodeData.isVisible ?? false,
      isInteractive: false, // Text nodes are not interactive
      isTopElement: false, // Text nodes are not top elements
      isInViewport: true, // Assume text nodes inherit visibility from parent
      shadowRoot: false, // Text nodes don't have shadow roots
    };
  }

  private createElementNode(nodeData: RawNodeData): SerializableDOMNode {
    return {
      tag: nodeData.tagName!,
      xpath: nodeData.xpath || '', // Ensure xpath is always a string
      attributes: nodeData.attributes || {},
      children: [], // Children are linked in the second pass
      // parent is set during linking
      isVisible: nodeData.isVisible ?? false, // Default to false if undefined
      isInteractive: nodeData.isInteractive ?? false,
      isTopElement: nodeData.isTopElement ?? false,
      isInViewport: nodeData.isInViewport ?? true, // Default to true based on JS script logic
      highlightIndex: nodeData.highlightIndex, // Keep undefined if not present
      shadowRoot: nodeData.shadowRoot ?? false,
    };
  }

  // Creates a default empty body node for blank pages or error cases.
  private createEmptyBodyNode(): SerializableDOMNode {
    return {
      tag: 'body',
      xpath: '/body',
      attributes: {},
      children: [],
      isVisible: true,
      isInteractive: false,
      isTopElement: true,
      isInViewport: true,
      highlightIndex: undefined,
      shadowRoot: false,
    };
  }
}
