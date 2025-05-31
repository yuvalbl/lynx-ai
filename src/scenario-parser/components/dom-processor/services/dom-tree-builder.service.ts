import { createLogger } from '@common/logger';
import { SerializableDOMNode, SelectorMap } from '@scenario-parser/interfaces';

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
export interface BuildDomTreeResult {
  rootId: string;
  map: RawNodeMap;
  perfMetrics?: unknown; // Optional performance metrics
}

export interface DomTreeBuildResult {
  domTree: SerializableDOMNode;
  selectorMap: SelectorMap;
}

export class DomTreeBuilderService {
  private static readonly logger = createLogger(DomTreeBuilderService.name);

  // Build DOM tree and selector map from raw evaluation result
  static buildFromRawData(evalResult: BuildDomTreeResult): DomTreeBuildResult {
    const { jsNodeMap, jsRootId } = this.extractNodeMapAndRootId(evalResult);
    const { parsedNodeMap, selectorMap } = this.parseAllNodes(jsNodeMap);
    this.linkChildrenToParents(parsedNodeMap, jsNodeMap);

    const rootNode = this.getRootNode(parsedNodeMap, jsRootId);
    return { domTree: rootNode, selectorMap };
  }

  // Extract node map and root ID from evaluation result
  private static extractNodeMapAndRootId(evalResult: BuildDomTreeResult): {
    jsNodeMap: RawNodeMap;
    jsRootId: string;
  } {
    return {
      jsNodeMap: evalResult.map,
      jsRootId: evalResult.rootId,
    };
  }

  // Parse all nodes and create selector map
  private static parseAllNodes(jsNodeMap: RawNodeMap): {
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

  // Link children to their parents
  private static linkChildrenToParents(
    parsedNodeMap: Record<string, SerializableDOMNode>,
    jsNodeMap: RawNodeMap,
  ): void {
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

  // Get root node from parsed map
  private static getRootNode(parsedNodeMap: Record<string, SerializableDOMNode>, rootId: string): SerializableDOMNode {
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

  // Parse a single raw node data object into a SerializableDOMNode
  private static parseNode(nodeData: RawNodeData): SerializableDOMNode | null {
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
    this.logger.warn(`Invalid or unhandled node data structure encountered: ${JSON.stringify(nodeData)}`);
    return null;
  }

  // Check if node is a text node
  private static isTextNode(nodeData: RawNodeData): boolean {
    return nodeData.type === 'TEXT_NODE';
  }

  // Check if node is an element node
  private static isElementNode(nodeData: RawNodeData): boolean {
    return Boolean(nodeData.tagName);
  }

  // Create text node
  private static createTextNode(nodeData: RawNodeData): SerializableDOMNode {
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

  // Create element node
  private static createElementNode(nodeData: RawNodeData): SerializableDOMNode {
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

  // Create default empty body node for blank pages or error cases
  static createEmptyBodyNode(): SerializableDOMNode {
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
