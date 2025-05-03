export type TestStepAction = 'navigate' | 'input' | 'click' | 'assert' /* | ... MVP focus */;

export interface TestStepContext {
  // Replacing mcpSnapshot with more relevant context
  domStructureSnapshot: string; // The formatted DOM string provided to the LLM for this step
  fullDomSnapshot?: unknown; // Optional: Raw JSON/object from buildDomTree.js for debugging
  // TBD: Other context? Playwright logs? Error details?
}

export interface TestStep {
  id: string; // Unique identifier (e.g., uuid)
  description: string; // Original user natural language action string
  action: TestStepAction;
  selector?: string; // The specific selector (e.g., XPath) used by Playwright
  value?: string | number | boolean; // Value for 'input' or 'assert' actions
  url?: string; // URL for 'navigate' action
  context: TestStepContext; // Context specific to this step's execution
  // Optional fields for post-MVP:
  // timeout?: number; // Step-specific timeout
  // waitFor?: 'visible' | 'networkidle' | 'domcontentloaded' | 'load';
  // isLastStep?: boolean; // Might be handled by Orchestrator logic
  // maxRetries?: number; // Step-level retries (distinct from MCPClient retries)
}
