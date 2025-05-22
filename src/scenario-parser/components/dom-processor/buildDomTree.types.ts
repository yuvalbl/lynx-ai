// Types for the return value of the buildDomTree.js script

// Represents the overall result returned by the buildDomTree function.
export interface BuildDomTreeResult {
  // The unique ID assigned to the document.body element, serving as the root of the processed DOM tree.
  rootId: number;

  // A map where keys are unique string IDs generated for each processed DOM node,
  // and values are objects containing the extracted data for that node.
  map: DomNodeMap;

  // Optional performance metrics collected if 'debugMode' was enabled.
  // Undefined if 'debugMode' was false.
  perfMetrics?: PerfMetrics;
}

// A map from a node's unique ID (number) to its corresponding DomNodeData.
export interface DomNodeMap {
  [nodeId: number]: DomNodeData;
}

// A discriminated union representing the data extracted for a DOM node.
// It can be either an ElementNodeData or a TextNodeData.
export type DomNodeData = ElementNodeData | TextNodeData;

// Data extracted for an HTML Element node.
export interface ElementNodeData {
  // Lowercased tag name of the element (e.g., "div", "button").
  tagName: string;

  // A key-value map of the element's attributes.
  attributes: { [key: string]: string };

  // A simplified XPath-like string representing the path to the element.
  xpath: string;

  // An array of unique string IDs of the element's processed child nodes.
  children: number[];

  // Indicates if the element is considered visible (e.g., has dimensions, not display:none).
  isVisible?: boolean;

  // Indicates if the element is the topmost element at its center point.
  isTopElement?: boolean;

  // Indicates if the element is considered interactive.
  isInteractive?: boolean;

  // Indicates if the element is within the (potentially expanded) viewport. Set during highlighting logic.
  isInViewport?: boolean;

  // A unique index assigned if the element is interactive and highlighted.
  highlightIndex?: number;

  // True if this element has a shadowRoot that was processed.
  shadowRoot?: boolean;
  // Note: 'type' property is absent for element nodes, distinguishing them from TextNodeData.
}

// Data extracted for a Text node.
export interface TextNodeData {
  // Discriminator property to identify this as a TextNode.
  type: 'TEXT_NODE';

  // The trimmed text content of the node.
  text: string;

  // Indicates if the text node is considered visible.
  isVisible: boolean;
}

// Optional performance metrics collected when 'debugMode' is true.
export interface PerfMetrics {
  // Total calls to the top-level exported buildDomTree function.
  // (Initialized in JS but not explicitly shown to be incremented in the main script body for the outer function).
  buildDomTreeCalls: number;

  // Aggregated timings (in seconds) for various helper functions.
  // These were intended to be populated by the 'measureTime' utility.
  // The explanation document notes that 'measureTime' accumulation might be inactive in the script,
  // with 'measureDomOperation' being more reliably used for timing specific DOM operations.
  timings: {
    buildDomTree: number;
    highlightElement: number;
    isInteractiveElement: number;
    isElementVisible: number;
    isTopElement: number;
    isInExpandedViewport: number;
    isTextNodeVisible: number;
    getEffectiveScroll: number; // Present in JS init, not detailed in MD processing steps.
    [key: string]: number; // Allows for other keys if any are dynamically added.
  };

  // Metrics related to the caching of DOM properties like bounding rectangles and computed styles.
  cacheMetrics: CacheMetrics;

  // Metrics related to the number of nodes encountered, processed, and skipped.
  nodeMetrics: NodeMetrics;

  // Detailed breakdown of performance within the buildDomTree execution, including DOM operation timings.
  buildDomTreeBreakdown: BuildDomTreeBreakdown;
}

// Metrics related to the caching of DOM properties.
export interface CacheMetrics {
  boundingRectCacheHits: number;
  boundingRectCacheMisses: number;
  computedStyleCacheHits: number;
  computedStyleCacheMisses: number;
  // Note: getBoundingClientRectTime and getComputedStyleTime were present in the JS initialization
  // of PERF_METRICS.cacheMetrics. However, the script's 'measureDomOperation' function
  // aggregates these timings into buildDomTreeBreakdown.domOperations.
  // They are omitted here to avoid redundancy if buildDomTreeBreakdown is the primary source.
  boundingRectHitRate: number;
  computedStyleHitRate: number;
  overallHitRate: number;
}

// Metrics about the nodes processed during the DOM traversal.
export interface NodeMetrics {
  // Total number of DOM nodes encountered during the traversal.
  totalNodes: number;
  // Number of DOM nodes that were actually processed and added to the output map.
  processedNodes: number;
  // Number of DOM nodes that were skipped based on various filtering criteria.
  skippedNodes: number;
}

// Detailed performance breakdown for the buildDomTree execution.
export interface BuildDomTreeBreakdown {
  // Total time for the entire buildDomTree process (potentially from an outer timer).
  // Not in the JS init block for this sub-object but used in MD for derived metrics.
  totalTime?: number;
  // Total time spent within the buildDomTree function itself, excluding child calls (potentially from an outer timer).
  // Not in the JS init block for this sub-object but used in MD for derived metrics.
  totalSelfTime?: number;

  // Number of recursive calls made to the inner buildDomTree function.
  buildDomTreeCalls: number;

  // Aggregated time (converted to seconds) for specific DOM operations, measured by 'measureDomOperation'.
  // Keys are operation names (e.g., 'getBoundingClientRect', 'getComputedStyle').
  // May also include derived averages like 'getBoundingClientRectAverage'.
  domOperations: {
    getBoundingClientRect: number;
    getComputedStyle: number;
    elementFromPoint?: number; // elementFromPoint is measured, so its timing would be here.
    [key: string]: number | undefined; // For other dynamically added operations and their averages (e.g., getBoundingClientRectAverage).
  };

  // Counts for how many times specific DOM operations were performed.
  // Keys are operation names, matching those in 'domOperations'.
  domOperationCounts: {
    getBoundingClientRect: number;
    getComputedStyle: number;
    elementFromPoint?: number; // Count for elementFromPoint calls.
    [key: string]: number | undefined; // For other dynamically added operations.
  };

  // Average time spent per processed node, derived if buildDomTreeCalls > 0.
  averageTimePerNode?: number;
  // Calculated as totalTime - totalSelfTime, representing time spent in child calls or deeper operations.
  timeInChildCalls?: number;
}
