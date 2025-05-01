import { TestStepAction, OperationResult } from './'; // Now imports from the barrel file

// Represents the LLM's interpretation of a natural language action into a structured format.
export interface IntermediateStep {
  actionType: TestStepAction | 'unknown'; // Inferred action type
  targetSelector?: string; // Primary candidate selector identified by LLM
  inputValue?: string | number | boolean; // Value for input/assert
  description: string; // Original NL action description
  isAmbiguous?: boolean; // Flag if LLM detected ambiguity (e.g., multiple targets)
  confidenceScore?: number; // Optional: LLM confidence (0-1)
  // TBD: Optional alternativeSelectors?: string[];
  error?: string; // Error during translation (e.g., unknown action)
}

// TBD: Review if this interface is necessary or if raw snapshot data + filtering logic suffices.
// Represents a node in the simplified, serializable DOM tree used for LLM context.
export interface SerializableDOMNode {
  tag: string; // e.g., 'button', 'input', 'a', 'div'
  attributes: Record<string, string>; // Key-value map of *relevant* attributes (id, class, data-*, aria-*, role, type, placeholder, value, etc.)
  text: string; // Direct text content, potentially truncated or concatenated from children text nodes
  children: SerializableDOMNode[]; // Child nodes that are also visible/interactive
  isVisible: boolean; // Based on MCP hint
  isInteractive: boolean; // Based on MCP hint (e.g., clickable, focusable, inputtable)

  // Converts this node and its relevant children into a concise string
  // representation suitable for providing context to an LLM.
  // The LLM uses this context to determine the appropriate action and selector.
  // Example: `<button id='login' class='btn primary'>Login</button>`
  // Example: `<input type='text' placeholder='Username' aria-label='User Name'>`
  // String representation of the node context.
  toString(): string;
}

// Represents the contextual information (DOM, URL, previous result) provided to the prompt formatter.
export interface BrowserStepContext {
  minimizedDOM: SerializableDOMNode; // The filtered DOM tree
  currentURL?: string; // Only included for navigation or first step
  previousStepResult?: OperationResult; // Result of the immediately preceding step
}
