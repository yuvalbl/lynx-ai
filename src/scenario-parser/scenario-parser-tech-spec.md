# Scenario Parser Module - Technical Specification

**Version:** 1.0 (MVP)
**Date:** [Current Date]

## 1. Overview

The `scenario-parser` module is responsible for translating a human-readable test scenario (URL + sequence of natural language actions) into a structured sequence of validated `TestStep` objects. It interacts with the `MCP Playwright Server` to execute actions against a live browser environment, uses an LLM to interpret natural language actions within the browser context, and constructs the final steps based on successful execution via MCP.

## 2. Goals (MVP)

*   Accept a `TestScenario` object as input.
*   Interact sequentially with the MCP Playwright Server to perform actions.
*   Utilize an LLM (via function calling) to interpret natural language actions based on DOM context provided by MCP.
*   Filter and serialize the DOM context effectively for the LLM.
*   Generate a list of validated `TestStep` objects for successfully executed actions.
*   Handle errors gracefully during the process.
*   Focus on core actions: `navigate`, `click`, `input`, `assert`.

## 3. Architecture

The module follows a sequential, stateful processing model orchestrated by `ScenarioParserOrchestrator`. Each user action is processed individually, relying on the browser state resulting from the previous action.

```mermaid
graph TD
    A[TestScenario] --> B(ScenarioInputValidator);
    B -- Valid Scenario --> Orch(ScenarioParserOrchestrator);

    subgraph Step Loop (Managed by Orchestrator)
        direction LR
        State[Current DOM State] --> PF(PromptFormatter);
        Action[NL Action String] --> PF;
        PF -- Formatted Prompt --> NLA(NLToActionTranslator);
        NLA -- IntermediateStep --> MCG(MCPCommandGenerator);
        MCG -- MCP Commands --> MCC(MCPClient);
        MCC -- Execute --> ExtMCP[(MCP Server)];
        ExtMCP -- Raw Result + Snapshot --> MCC;
        MCC -- Raw Result --> MRP(MCPResultProcessor);
        MRP -- Processed Result --> Orch;
        MRP -- Minimized DOM State --> State;
        Orch -- Accumulates --> TSList(Validated TestStep List);
    end

    Orch -- Final ParserResult --> Z[Output];

    style State fill:#f9f,stroke:#333,stroke-width:2px
```

## 4. File Structure

```
src/
├── scenario-parser/                 # <-- Module located inside src/
│   ├── scenario-parser.service.ts       # Main entry point & Orchestrator
│   ├── validator.ts                     # ScenarioInputValidator logic
│   ├── mcp-client.ts                    # MCPClient logic
│   ├── result-processor.ts              # MCPResultProcessor logic
│   ├── prompt-formatter.ts              # PromptFormatter logic
│   ├── nl-translator.ts                 # NLToActionTranslator logic (LLM Interaction)
│   ├── command-generator.ts             # MCPCommandGenerator logic
│   ├── interfaces/
│   │   ├── index.ts                     # Barrel file for interfaces
│   │   ├── common.types.ts              # Common types (ErrorInfo, OperationResult, etc.)
│   │   ├── scenario.types.ts            # TestScenario, ParserResult
│   │   ├── test-step.types.ts           # TestStep definition
│   │   ├── mcp.types.ts                 # Types related to MCP interaction (TBD based on API)
│   │   └── internal.types.ts            # IntermediateStep, SerializableDOMNode, BrowserStepContext
│   └── utils/
│       └── index.ts                     # Utility functions (e.g., DOM serialization)
│   ├── tests/
│   │   └── ... (Unit tests for each component)
│   ├── README.md
│   └── scenario-parser-tech-spec.md # This file
├── ... (Other top-level src modules like Marathon Engine, Code Converter)
```

## 5. Component Descriptions

*   **`ScenarioInputValidator` (`validator.ts`):** Validates the structure and basic constraints of the input `TestScenario` object.
*   **`MCPClient` (`mcp-client.ts`):** Handles all HTTP/WebSocket communication with the MCP Playwright Server. Sends commands, receives raw responses/snapshots/errors. Implements retry logic for transient network issues. Requests diagnostics (screenshot, DOM) on error.
*   **`MCPResultProcessor` (`result-processor.ts`):** Parses raw data from `MCPClient`. Builds the initial DOM tree representation. Filters the DOM tree to keep only visible/interactive elements. Constructs validated `TestStep` objects from successful results.
*   **`PromptFormatter` (`prompt-formatter.ts`):** Constructs the precise prompt payload for the LLM, including system instructions, action-specific guidance, serialized minimized DOM, URL (if needed), and the function definition for `IntermediateStep`.
*   **`NLToActionTranslator` (`nl-translator.ts`):** Manages the LLM API call using the formatted prompt. Expects and parses the structured `IntermediateStep` output via function calling. Handles LLM API errors.
*   **`MCPCommandGenerator` (`command-generator.ts`):** Translates the `IntermediateStep` from the LLM into specific MCP Server command JSON objects.
*   **`ScenarioParserOrchestrator` (`scenario-parser.service.ts`):** The main service class. Manages the overall step-by-step flow, maintains the current browser state (DOM representation), coordinates calls to other components, handles errors, and aggregates the final `ParserResult`.

## 6. Key Interfaces

*(Located in `src/interfaces/`)*

**`common.types.ts`**

```typescript
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
```

**`scenario.types.ts`**

```typescript
import { TestStep } from './test-step.types';
import { ErrorInfo, OperationResult } from './common.types';

export interface TestScenario {
  url: string; // Initial URL to navigate to
  actions: string[]; // List of user's natural language actions
  options?: {
    timeoutMs?: number; // Overall timeout for parsing
    // TBD: Other potential options?
  };
}

export interface ParserResult extends OperationResult {
  testSteps: TestStep[]; // The successfully generated steps
  status: 'success' | 'partial' | 'failed'; // Overall outcome
  errors?: ErrorInfo[]; // Accumulated errors if status is not 'success'
}
```

**`test-step.types.ts`**

```typescript
export type TestStepAction = 'navigate' | 'input' | 'click' | 'assert' /* | 'wait' | 'select' | 'hover' | 'keypress' */; // MVP focuses on first 4

export interface TestStepContext {
  mcpSnapshot: any; // The raw snapshot data returned by MCP for this step // TBD: Define based on MCP API
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

```

**`mcp.types.ts`**

```typescript
// TBD: Define based on actual MCP Playwright Server API Spec

// Example placeholder for a command
export interface McpCommandBase {
  command: string; // e.g., 'mcp_playwright_browser_click'
  params: Record<string, any>;
}

// Example placeholder for a snapshot result
export interface McpSnapshotResult {
  snapshotData: any; // The raw DOM/Accessibility tree data // TBD
  url: string;
  // TBD: Other metadata? Visibility hints? Interactivity hints? Stable node IDs/selectors?
}

// Example placeholder for a generic success result
export interface McpSuccessResult {
  message: string;
  // TBD: Other data?
}

// Example placeholder for an error result
export interface McpErrorResult {
  errorMessage: string;
  errorCode?: string; // TBD
  diagnostics?: {
      screenshot?: string; // Base64 PNG
      domSnapshot?: string; // TBD: Format
  }
}

export type McpResult = (McpSnapshotResult | McpSuccessResult) & { success: true } | McpErrorResult & { success: false };

```

**`internal.types.ts`**

```typescript
import { TestStepAction, OperationResult } from "."; // Assuming barrel file exports these

// Represents the structured hypothesis from the LLM via function calling
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

// Represents a node in the filtered, serializable DOM tree passed to the LLM
export interface SerializableDOMNode {
  tag: string;
  attributes: Record<string, string>; // Filtered attributes (id, class, data-*, aria-*, role)
  text: string; // Direct text content, potentially truncated
  mcpSelector: string; // The stable selector/identifier provided by MCP for this node // TBD: Needs confirmation from MCP Spec
  children: SerializableDOMNode[];
  isVisible: boolean; // Based on MCP hint
  isInteractive: boolean; // Based on MCP hint

  // Method to convert node and children to string for LLM prompt
  toString(): string;
}

// Context passed to the PromptFormatter for generating the LLM prompt
export interface BrowserStepContext {
  minimizedDOM: SerializableDOMNode; // The filtered DOM tree
  currentURL?: string; // Only included for navigation or first step
  previousStepResult?: OperationResult; // Result of the immediately preceding step
}
```

## 7. Core Function Signatures

*(Illustrative examples, not exhaustive)*

**`scenario-parser.service.ts`**

```typescript
import { TestScenario, ParserResult } from './interfaces';

export class ScenarioParserOrchestrator {
  // Dependencies injected via constructor (Validator, Client, Processor, Formatter, Translator, Generator)

  async parse(scenario: TestScenario): Promise<ParserResult>;
}
```

**`validator.ts`**

```typescript
import { TestScenario } from './interfaces';

export function validateScenario(scenario: TestScenario): { isValid: boolean; error?: string };
```

**`mcp-client.ts`**

```typescript
import { McpCommandBase, McpResult } from './interfaces';

export class MCPClient {
  // Constructor to setup connection details, retry policy

  async executeCommand(command: McpCommandBase): Promise<McpResult>;
}
```

**`result-processor.ts`**

```typescript
import { McpResult, McpSnapshotResult, SerializableDOMNode, IntermediateStep, TestStep } from './interfaces';

export class MCPResultProcessor {
  parseAndFilterSnapshot(snapshotResult: McpSnapshotResult): SerializableDOMNode; // TBD: Needs exact MCP snapshot format
  createTestStep(mcpResult: McpResult, intermediateStep: IntermediateStep, newDomState: SerializableDOMNode): TestStep;
}
```

**`prompt-formatter.ts`**

```typescript
import { BrowserStepContext, IntermediateStep } from './interfaces';
// Assume LLM provider SDK types exist, e.g., LLMPromptPayload, LLMFunctionDefinition
import { LLMPromptPayload, LLMFunctionDefinition } from 'some-llm-sdk'; // Placeholder

export class PromptFormatter {
  getFunctionDefinition(): LLMFunctionDefinition; // Defines the IntermediateStep structure for function calling
  formatPrompt(context: BrowserStepContext, userAction: string): LLMPromptPayload;
}
```

**`nl-translator.ts`**

```typescript
import { IntermediateStep } from './interfaces';
// Assume LLM provider SDK types exist
import { LLMPromptPayload } from 'some-llm-sdk'; // Placeholder

export class NLToActionTranslator {
  // Constructor takes LLM client instance

  async translate(promptPayload: LLMPromptPayload): Promise<{ step?: IntermediateStep; error?: string }>;
}
```

**`command-generator.ts`**

```typescript
import { IntermediateStep, McpCommandBase } from './interfaces';

export class MCPCommandGenerator {
  generateCommands(intermediateStep: IntermediateStep): McpCommandBase[];
}
```

**`utils/index.ts`**

```typescript
import { SerializableDOMNode } from '../interfaces';

export function serializeDOMTree(node: SerializableDOMNode): string; // Implements the string conversion logic
// Other utility functions...
```

## 8. High-Level Flow Recap

1.  **Validate:** `ScenarioParserOrchestrator` uses `ScenarioInputValidator`.
2.  **Navigate:** `Orchestrator` -> `MCPCommandGenerator` (for navigate) -> `MCPClient` -> MCP Server.
3.  **Get Initial State:** `MCPClient` returns snapshot -> `MCPResultProcessor` parses/filters -> `Orchestrator` stores initial DOM state.
4.  **Loop through `actions`:**
    a.  **Format Prompt:** `Orchestrator` gives current DOM, action string -> `PromptFormatter` creates LLM payload with function def.
    b.  **Translate:** `Orchestrator` -> `NLToActionTranslator` -> LLM API. Receives `IntermediateStep`.
    c.  **Generate MCP Command:** `Orchestrator` -> `MCPCommandGenerator` -> MCP Command(s).
    d.  **Execute MCP Command:** `Orchestrator` -> `MCPClient` -> MCP Server. Receives raw result (success+snapshot or error+diagnostics).
    e.  **Process Result:** `Orchestrator` -> `MCPResultProcessor`.
        *   On Success: Generate `TestStep`, parse/filter *new* DOM state. Update Orchestrator's state. Add `TestStep` to list.
        *   On Failure: Record `ErrorInfo`. Terminate loop.
5.  **Finalize:** `Orchestrator` compiles `ParserResult` with accumulated `TestStep` list and status/errors.

## 9. Post-MVP Considerations

*   Handling ambiguous selectors (trying alternatives).
*   Support for actions beyond navigate, click, input, assert.
*   Vision model integration for state analysis.
*   Advanced prompt engineering and token management.
*   Full self-correction loop integration based on Marathon Engine feedback.

## 10. Assumptions

*   **MCP Playwright Server API:**
    *   Provides snapshots containing sufficient detail to reconstruct a meaningful DOM representation (tags, key attributes, text).
    *   Includes reliable hints for element visibility and interactivity (including non-standard interactive elements like divs with listeners).
    *   Provides stable selectors or identifiers for nodes within the snapshot that can be used reliably in subsequent MCP commands.
    *   Can return diagnostic information (screenshot, final DOM state) upon command failure when requested.
    *   API contract (request/response formats) is stable or versioned. (Specific formats marked as **TBD** in interfaces).
*   **LLM Provider:** Supports robust function calling capabilities for generating structured output (`IntermediateStep`).
*   **Environment:** TypeScript environment with necessary build tools and dependencies. 