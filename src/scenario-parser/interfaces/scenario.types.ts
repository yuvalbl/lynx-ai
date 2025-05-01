import { TestStep, ErrorInfo, OperationResult } from './';

// Represents the input user scenario containing the target URL and natural language actions.
export interface TestScenario {
  url: string; // Initial URL to navigate to
  actions: string[]; // List of user's natural language actions
  options?: {
    timeoutMs?: number; // Overall timeout for parsing
    // TBD: Other potential options?
  };
}

// Represents the final output of the parser, including generated steps, status, and any errors.
export interface ParserResult extends OperationResult {
  testSteps: TestStep[]; // The successfully generated steps
  status: 'success' | 'partial' | 'failed'; // Overall outcome
  errors?: ErrorInfo[]; // Accumulated errors if status is not 'success'
}
