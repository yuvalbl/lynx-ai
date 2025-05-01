export interface ErrorInfo {
  stepId?: string; // ID of the TestStep where error occurred (if applicable)
  message: string;
  action?: string; // User's NL action string
  mcpCommand?: string; // MCP command that failed (if applicable)
  llmError?: string; // Error during LLM interaction
  selector?: string; // Selector involved (if known)
  screenshot?: string; // Base64 encoded PNG (from MCP diagnostics)
  domSnapshot?: string; // Final DOM state string (from MCP diagnostics) // TBD: Format
  stack?: string;
}

export interface OperationResult {
  success: boolean;
  executionTimeMs?: number;
  error?: ErrorInfo;
}
