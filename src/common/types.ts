/**
 * Common interfaces shared across all modules in the AI-powered test generation system.
 * Based on the PRD specifications.
 */

/**
 * Common options that can be applied to various operations across the system.
 */
export interface CommonOptions {
  /** Timeout in milliseconds for operations */
  timeoutMs?: number;
  /** Number of retry attempts for operations */
  retryCount?: number;
}

/**
 * Error information structure for reporting detailed error context.
 */
export interface ErrorInfo {
  /** Step number where the error occurred */
  step?: number;
  /** Error message */
  message: string;
  /** Action being performed when the error occurred */
  action?: string;
  /** Selector that was being used */
  selector?: string;
  /** Base64 encoded screenshot at time of error */
  screenshot?: string;
  /** DOM snapshot at time of error */
  domSnapshot?: any;
  /** Error stack trace */
  stack?: string;
  /** Additional context information */
  context?: any;
}

/**
 * Result of an operation with success status and timing information.
 */
export interface OperationResult {
  /** Whether the operation was successful */
  success: boolean;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error information if operation failed */
  error?: ErrorInfo;
}

export type TestStepAction =
  | 'navigate'
  | 'input'
  | 'click'
  | 'assert'
  | 'wait'
  | 'select'
  | 'hover'
  | 'keypress';

/**
 * Unified TestStep representing an atomic test action.
 * Framework-agnostic representation that can be mapped to various test runners.
 */
export interface TestStep {
  /** Unique identifier for the step */
  id: string;
  /** Human-readable description */
  description: string;

  /** Action type to perform */
  action: TestStepAction;

  /** CSS selector or other locator strategy */
  selector?: string;

  /** Action value (text to type, expected assertion value, etc.) */
  value?: string | number | boolean | null;
  /** Step-specific timeout */
  timeout?: number;

  /** What condition to wait for before proceeding */
  waitFor?: 'visible' | 'networkidle' | 'domcontentloaded' | 'load';

  /** Whether this is the last step in the sequence */
  isLastStep: boolean;

  /** Context for debugging and self-healing */
  context?: {
    /** Page snapshot from MCP Playwright */
    mcpSnapshot?: any;
    /** DOM state at the time of execution */
    domState?: any;
    /** Number of attempts made */
    attemptCount?: number;
    /** Error history */
    errors?: Array<{
      message: string;
      timestamp: string;
    }>;
  };

  /** Maximum number of retry attempts for this step */
  maxRetries?: number;
}

/**
 * Input scenario structure for the parser.
 */
export interface TestScenario {
  /** Target URL for the test */
  url: string;
  /** Array of human-readable action descriptions */
  actions: string[];
  /** Optional configuration parameters */
  options?: CommonOptions & {
    /** Maximum number of steps to process */
    maxSteps?: number;
  };
}

/**
 * Result from the scenario parser.
 */
export interface ParserResult extends OperationResult {
  /** Generated test steps */
  testSteps: TestStep[];
  /** Overall status of the parsing operation */
  status: 'success' | 'partial' | 'failed';
  /** Array of errors if any occurred */
  errors?: ErrorInfo[];
}

/**
 * Request structure for the execution engine.
 */
export interface ExecutionRequest {
  /** Test steps to execute */
  testSteps: TestStep[];
  /** Optional configuration */
  options?: CommonOptions & {
    /** Security configuration */
    securityOptions?: {
      /** List of allowed actions */
      allowedActions?: string[];
    };
  };
}
