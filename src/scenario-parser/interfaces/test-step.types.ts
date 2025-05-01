export type TestStepAction = 'navigate' | 'input' | 'click' | 'assert'; // MVP focuses on first 4 // | 'wait' | 'select' | 'hover' | 'keypress'

export interface TestStepContext {
  domSnapshot: string; // The raw snapshot data returned by MCP for this step // TBD: Define based on MCP API
  // TBD: Other potential context fields? Attempt count, errors during MCP step?
}

export interface TestStep {
  id: string; // Unique identifier (e.g., uuid)
  description: string; // Original user natural language action string
  action: TestStepAction;
  selector?: string; // The specific selector validated and used by MCP
  value?: string | number | boolean; // Value for 'input' or 'assert' actions
  url?: string; // URL for 'navigate' action
  context: TestStepContext; // Snapshot and potentially other data from MCP execution
  // Optional fields for post-MVP:
  // timeout?: number; // Step-specific timeout
  // waitFor?: 'visible' | 'networkidle' | 'domcontentloaded' | 'load';
  // isLastStep?: boolean; // Might be handled by Orchestrator logic
  // maxRetries?: number; // Step-level retries (distinct from MCPClient retries)
}
