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
}

// Maps the `highlightIndex` to its corresponding processed DOM node object.
export type SelectorMap = Record<number, SerializableDOMNode>;

// Contextual information passed between services during the processing of a single step.
export interface BrowserStepContext {
  domTree: SerializableDOMNode; // The structured DOM tree for the current state
  selectorMap: SelectorMap; // Map from highlight index to node for the current state
  currentURL: string; // The URL of the browser page for the current state
  previousStepResult?: OperationResult; // Result of the immediately preceding step (if any)
}

// Represents basic information about an open browser tab.
export interface TabInfo {
  pageIndex: number; // Zero-based index of the tab
  url: string; // Current URL of the tab
  title: string; // Current title of the tab
}
