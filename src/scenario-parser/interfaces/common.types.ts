// Define a custom error class for validation failures
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface ErrorInfo {
  stepId?: string; // ID of the TestStep where error occurred (if applicable)
  message: string; // Primary error message
  action?: string; // User's original NL action string for context
  playwrightAction?: string; // Low-level Playwright action that failed (e.g., 'click', 'type')
  llmError?: string; // Specific error during LLM interaction/parsing
  selector?: string; // Selector used by Playwright when the error occurred
  // Note: MCP-specific diagnostic fields removed.
  // Playwright errors might be captured in message/stack.
  stack?: string; // Error stack trace, if available
}

export interface OperationResult {
  success: boolean; // Indicates if the overall operation succeeded
  executionTimeMs?: number; // Optional duration of the operation
  error?: ErrorInfo; // Details of the error if success is false
  // Optional: Content extracted by specific actions (e.g., using an 'extract_content' action)
  extractedContent?: string;
}
