import { TestStepAction, OperationResult } from './'; // Now imports from the barrel file

// Represents the LLM's interpretation of a natural language action into a structured format.
export interface IntermediateStep {
  actionType: TestStepAction | 'unknown' | 'navigate'; // Action type inferred by the LLM
  targetSelector?: string; // Selector hint provided by LLM (often based on `highlightIndex` from the prompt)
  inputValue?: string | number | boolean; // Value for 'input' or 'assert' actions
  url?: string; // Target URL for 'navigate' action
  description: string; // Original NL action description provided by the user
  isAmbiguous?: boolean; // Flag if LLM detected ambiguity (e.g., multiple possible targets)
  confidenceScore?: number; // Optional: LLM confidence score (0-1) for its interpretation
  // TBD: Optional alternativeSelectors?: string[]; // Potential future enhancement
  error?: string; // Error message if translation itself failed
}

// Coordinate system for element positioning
export interface Coordinates {
  x: number;
  y: number;
}

export interface CoordinateSet {
  topLeft: Coordinates;
  topRight: Coordinates;
  bottomLeft: Coordinates;
  bottomRight: Coordinates;
  center: Coordinates;
  width: number;
  height: number;
}

export interface ViewportInfo {
  scrollX: number;
  scrollY: number;
  width: number;
  height: number;
}

// Hash structure for element identification across page states
export interface HashedDomElement {
  branchPathHash: string;
  attributesHash: string;
  xpathHash: string;
}

// Represents a processed node in the DOM tree, enhanced with interaction details.
// This structure, derived from browser-use patterns, is used internally and formatted for LLM context.
export interface SerializableDOMNode {
  tag: string; // HTML tag name (e.g., 'button', 'input')
  attributes: Record<string, string>; // Key-value map of relevant HTML attributes
  text?: string; // Aggregated text content from direct child text nodes
  xpath: string; // XPath selector relative to document or nearest frame/shadow root boundary
  children: SerializableDOMNode[]; // Child nodes
  parent?: SerializableDOMNode; // Reference to the parent node in the processed tree

  // Properties determined by buildDomTree.js & DomProcessorService
  isVisible: boolean; // Whether the element is considered visible (size, display, visibility CSS)
  isInteractive: boolean; // Whether the element is considered interactive (clickable, focusable, inputtable, etc.)
  highlightIndex?: number; // Unique index assigned to visible, interactive, top-most elements for LLM reference
  isTopElement?: boolean; // Indicates if this element is the effective top-most element at its coordinates, considering potential overlaps (z-index). True if it would receive pointer events (like clicks) at its location, determined using browser checks like `elementFromPoint`. Crucial for identifying truly interactable elements.
  isInViewport?: boolean; // Whether the element is within the (potentially expanded) viewport
  shadowRoot?: boolean; // Whether the element hosts a shadow DOM root
  isNew?: boolean; // Optional: Flag indicating if the element was newly detected compared to the previous state

  // Enhanced features from browser-use
  pageCoordinates?: CoordinateSet; // Element coordinates relative to the full page
  viewportCoordinates?: CoordinateSet; // Element coordinates relative to the viewport
  viewportInfo?: ViewportInfo; // Viewport information when element was captured
  cssSelector?: string; // Enhanced CSS selector for the element
  hash?: HashedDomElement; // Hash for tracking element across page states
}

// History element for tracking DOM changes across page states
export interface DOMHistoryElement {
  tagName: string;
  xpath: string;
  highlightIndex?: number;
  entireParentBranchPath: string[]; // Complete path from root to element
  attributes: Record<string, string>;
  shadowRoot: boolean;
  cssSelector?: string;
  pageCoordinates?: CoordinateSet;
  viewportCoordinates?: CoordinateSet;
  viewportInfo?: ViewportInfo;
  hash: HashedDomElement;
}

// Maps the `highlightIndex` to its corresponding processed DOM node object.
export type SelectorMap = Record<number, SerializableDOMNode>;

// Enhanced browser state with history tracking
export interface BrowserState {
  url: string;
  title: string;
  domTree: SerializableDOMNode;
  selectorMap: SelectorMap;
  screenshot?: string; // Base64 encoded screenshot
  tabs?: TabInfo[];
  viewportInfo?: ViewportInfo;
  // History tracking
  clickableElementsHashes?: Set<string>; // Hashes of clickable elements for change detection
}

// Contextual information passed between services during the processing of a single step.
export interface BrowserStepContext {
  domTree: SerializableDOMNode; // The structured DOM tree
  selectorMap: SelectorMap; // Map from highlight index to node for the current state
  currentURL: string; // The URL of the browser page for the current state
  previousStepResult?: OperationResult; // Result of the immediately preceding step (if any)
  browserState?: BrowserState; // Full browser state including history
}

// Represents basic information about an open browser tab.
export interface TabInfo {
  pageIndex: number; // Zero-based index of the tab
  url: string; // Current URL of the tab
  title: string; // Current title of the tab
}

// Element processor configuration
export interface ElementProcessorConfig {
  includeAttributes: string[];
  maxDepth: number;
  maxTextLength: number;
  viewportExpansion: number;
  highlightElements: boolean;
}

// Action execution result with enhanced features
export interface EnhancedActionResult extends OperationResult {
  isNew?: boolean; // Whether this is a newly appeared element
  downloadPath?: string; // Path to downloaded file if action triggered download
  newTabOpened?: boolean; // Whether action opened a new tab
  extractedContent?: string; // Content extracted from the action
  includeInMemory?: boolean; // Whether to include this result in conversation memory
}
