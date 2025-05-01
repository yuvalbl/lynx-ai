# Task Breakdown for Scenario Parser Implementation

**Task 1: Setup Scenario Parser Module Structure and Core Interfaces**
*   **ID:** 1
*   **Title:** Setup Scenario Parser Module Structure and Core Interfaces
*   **Description:** Create the necessary directories and files for the scenario-parser module, and define the core shared TypeScript interfaces based on the tech spec.
*   **Details:** Refer to Section 4 and Section 6 of `src/scenario-parser/scenario-parser-tech-spec.md`. Create the main directories (`components`, `interfaces`, `utils`, `prompts`) inside `src/scenario-parser/`. Create the initial interface files (`common.types.ts`, `scenario.types.ts`, `test-step.types.ts`, `mcp.types.ts`, `internal.types.ts`) inside `src/scenario-parser/interfaces/`. Implement the type definitions as specified, leaving TBD comments where necessary. Create placeholder `index.ts` files in components subdirectories and utils.
*   **Dependencies:** []
*   **Priority:** high
*   **Status:** done
*   **Test Strategy:** Verify directory structure exists within `src/scenario-parser/`. Verify interfaces files contain the specified type definitions. Code review for correctness and completeness of interfaces.
*   **Subtasks:**
    *   **1.1:** Create directory structure (`components`, `interfaces`, `utils`, `prompts`, `tests`, component subdirs).
    *   **1.2:** Implement `common.types.ts`.
    *   **1.3:** Implement `scenario.types.ts`.
    *   **1.4:** Implement `test-step.types.ts`.
    *   **1.5:** Implement `mcp.types.ts` (with TBDs).
    *   **1.6:** Implement `internal.types.ts` (including `IntermediateStep`, `SerializableDOMNode`, `BrowserStepContext`).
    *   **1.7:** Create placeholder `index.ts` files in component and util directories.

**Task 2: Implement Scenario Input Validation**
*   **ID:** 2
*   **Title:** Implement Scenario Input Validation
*   **Description:** Implement the logic to validate the incoming `TestScenario` object.
*   **Details:** Implement the `validateScenarioLogic` function within `src/scenario-parser/components/validator/validator.logic.ts`. It should check for the presence and type of `url` (string) and `actions` (non-empty array of strings). It should throw a `ValidationError` (custom error class recommended) if validation fails, according to the tech spec (Section 7). Export the function via `index.ts`.
*   **Dependencies:** [1]
*   **Priority:** high
*   **Status:** pending
*   **Test Strategy:** Unit tests for `validateScenarioLogic` covering valid scenarios, missing URL, missing actions, empty actions array, incorrect types.
*   **Subtasks:**
    *   **2.1:** Define `ValidationError` custom error class (e.g., in `interfaces/common.types.ts` or a new `errors.ts`).
    *   **2.2:** Implement `validateScenarioLogic` function.
    *   **2.3:** Implement unit tests for `validateScenarioLogic`.

**Task 3: Implement MCP Client (Core)**
*   **ID:** 3
*   **Title:** Implement MCP Client (Core)
*   **Description:** Implement the core logic for communicating with the MCP Playwright Server.
*   **Details:** Implement the `MCPClientLogic` class in `src/scenario-parser/components/mcp-client/mcp-client.logic.ts`. Focus on the `executeCommandLogic` method. This method should handle sending a command (`McpCommandBase`) to the MCP server (URL/connection details likely needed in constructor or config) and receiving the raw `McpResult`. Basic error handling for network/connection issues. Implement the retry logic in `mcp-retry.logic.ts` and error diagnostics in `mcp-error-handler.ts`, called by `executeCommandLogic`. Export the class via `index.ts`. Mock the MCP server interaction for tests.
*   **Dependencies:** [1] (uses `McpCommandBase`, `McpResult`)
*   **Priority:** high
*   **Status:** pending
*   **Test Strategy:** Unit tests for `MCPClientLogic` mocking MCP server responses (success, specific errors). Test retry logic behaviour. Test error diagnostic requests.
*   **Subtasks:**
    *   **3.1:** Implement `MCPClientLogic` class structure and constructor.
    *   **3.2:** Implement core HTTP/WebSocket communication logic in `executeCommandLogic`.
    *   **3.3:** Implement retry logic in `mcp-retry.logic.ts` (or within `MCPClientLogic`).
    *   **3.4:** Implement error handling/diagnostics logic in `mcp-error-handler.ts` (or within `MCPClientLogic`).
    *   **3.5:** Implement unit tests for `MCPClientLogic`, including retries and error handling.

**Task 4: Implement DOM Processing (Parsing & Filtering)**
*   **ID:** 4
*   **Title:** Implement DOM Processing (Parsing & Filtering)
*   **Description:** Implement the logic to parse raw MCP snapshots and filter them into the minimized `SerializableDOMNode` tree.
*   **Details:** Implement `parseSnapshotToDOMTree` in `dom-parser.ts` (requires defining the expected structure of `McpSnapshotResult.snapshotData` based on TBD MCP API). Implement `filterDOMTree` in `dom-filter.ts` to traverse the parsed tree and keep only nodes marked as visible and interactive by MCP hints (requires TBD MCP API definition for these hints). Define and implement the `toString()` method on the `SerializableDOMNode` interface/class used by the parser.
*   **Dependencies:** [1] (uses `McpSnapshotResult`, `SerializableDOMNode`)
*   **Priority:** medium
*   **Status:** pending
*   **Test Strategy:** Unit tests for `parseSnapshotToDOMTree` with mock snapshot data. Unit tests for `filterDOMTree` with sample `SerializableDOMNode` trees. Unit tests for `SerializableDOMNode.toString()`.
*   **Subtasks:**
    *   **4.1:** Implement `parseSnapshotToDOMTree` function (needs mock MCP data).
    *   **4.2:** Implement `filterDOMTree` function (needs mock MCP hints).
    *   **4.3:** Implement `SerializableDOMNode.toString()` method.
    *   **4.4:** Implement unit tests for parsing, filtering, and serialization.

**Task 5: Implement LLM Interaction (Formatter & Translator)**
*   **ID:** 5
*   **Title:** Implement LLM Interaction (Formatter & Translator)
*   **Description:** Implement prompt formatting logic and the LLM API call for action translation using function calling.
*   **Details:** Implement `PromptFormatterLogic` in `prompt-formatter.logic.ts`. Load the template from `prompts/`. Implement `getFunctionDefinitionLogic` defining the `IntermediateStep` structure for the LLM. Implement `formatPromptLogic` to inject context (serialized DOM from `toString()`, action, URL) into the template and create the LLM payload. Implement `NLToActionTranslatorLogic` in `nl-translator.logic.ts`. Use LangChain SDK to call the LLM with the payload from the formatter, requesting the `IntermediateStep` function call. Parse the LLM response to extract the `IntermediateStep` object or handle errors.
*   **Dependencies:** [1, 4] (uses interfaces, needs DOM serialization)
*   **Priority:** high
*   **Status:** pending
*   **Test Strategy:** Unit tests for `PromptFormatterLogic` checking prompt output. Unit tests for `NLToActionTranslatorLogic` mocking the LLM API response (successful function call, errors).
*   **Subtasks:**
    *   **5.1:** Create prompt template file (`intermediate-step-generation.prompt.md`).
    *   **5.2:** Implement `PromptFormatterLogic.getFunctionDefinitionLogic`.
    *   **5.3:** Implement `PromptFormatterLogic.formatPromptLogic` (including template loading, DOM serialization call).
    *   **5.4:** Implement `NLToActionTranslatorLogic.translateLogic` (LLM API call, function call parsing).
    *   **5.5:** Implement unit tests for formatting and translation.

**Task 6: Implement MCP Command Generation**
*   **ID:** 6
*   **Title:** Implement MCP Command Generation
*   **Description:** Implement the logic to convert the LLM's `IntermediateStep` hypothesis into executable MCP commands.
*   **Details:** Implement `MCPCommandGeneratorLogic.generateCommandsLogic` in `command-generator.logic.ts`. Use a switch statement or mapping based on `IntermediateStep.actionType`. Construct the appropriate `McpCommandBase` objects with parameters derived from `IntermediateStep` (selector, value). Handle the 'navigate' action specifically (likely called only once by orchestrator). For MVP, fail if `actionType` is 'unknown' or `isAmbiguous` is true.
*   **Dependencies:** [1, 5] (uses `IntermediateStep`, `McpCommandBase`)
*   **Priority:** medium
*   **Status:** pending
*   **Test Strategy:** Unit tests for `generateCommandsLogic` covering each MVP action type and edge cases (unknown/ambiguous).
*   **Subtasks:**
    *   **6.1:** Implement `MCPCommandGeneratorLogic.generateCommandsLogic`.
    *   **6.2:** Implement unit tests for command generation.

**Task 7: Implement Test Step Creation**
*   **ID:** 7
*   **Title:** Implement Test Step Creation
*   **Description:** Implement the logic within the Result Processor to create the final `TestStep` objects.
*   **Details:** Implement `ResultProcessorLogic.createTestStepLogic` in `result-processor.logic.ts`. This function takes the successful `McpResult` (which should contain the snapshot used for the *next* step's context), the `IntermediateStep` that led to this success, and the *new* `SerializableDOMNode` state. It generates a unique ID (e.g., UUID) and constructs the `TestStep` object, mapping fields correctly (action, description, confirmed selector, value, context.mcpSnapshot).
*   **Dependencies:** [1, 4, 5] (uses interfaces, DOM state, IntermediateStep)
*   **Priority:** medium
*   **Status:** pending
*   **Test Strategy:** Unit tests for `createTestStepLogic` ensuring correct mapping and ID generation.
*   **Subtasks:**
    *   **7.1:** Implement `ResultProcessorLogic.createTestStepLogic`.
    *   **7.2:** Add UUID generation utility if needed.
    *   **7.3:** Implement unit tests for TestStep creation.

**Task 8: Implement Orchestrator Service**
*   **ID:** 8
*   **Title:** Implement Orchestrator Service
*   **Description:** Implement the main `ScenarioParserOrchestrator` service to manage state and orchestrate the component calls.
*   **Details:** Implement the `ScenarioParserOrchestrator` class in `scenario-parser.service.ts`. Implement the `parse` method. Manage internal state (current minimized DOM, list of generated TestSteps, remaining actions). Handle the initial navigation step. Loop through user actions, calling validator, formatter, translator, command generator, MCP client, and result processor in sequence. Update state based on results. Handle errors returned by components. Compile the final `ParserResult`. Inject dependencies (component instances/functions) via constructor.
*   **Dependencies:** [1, 2, 3, 4, 5, 6, 7] (uses all other components)
*   **Priority:** high
*   **Status:** pending
*   **Test Strategy:** Integration tests for the `parse` method using mocked components to verify the overall flow, state management, and final result construction for both success and error scenarios.
*   **Subtasks:**
    *   **8.1:** Implement `ScenarioParserOrchestrator` class structure and constructor (dependency injection).
    *   **8.2:** Implement initial navigation logic within `parse`.
    *   **8.3:** Implement the main action processing loop within `parse`.
    *   **8.4:** Implement state management logic (updating DOM state).
    *   **8.5:** Implement error handling and final `ParserResult` compilation.
    *   **8.6:** Implement integration tests.

**Task 9: Comprehensive Integration and Testing**
*   **ID:** 9
*   **Title:** Comprehensive Integration and Testing
*   **Description:** Ensure all components work together correctly and add end-to-end style tests.
*   **Details:** Refine component interactions. Add more robust error handling across the module. Potentially add integration tests that use a mocked MCP server to test the full flow with more realistic data. Ensure code quality, add documentation (JSDoc).
*   **Dependencies:** [8]
*   **Priority:** medium
*   **Status:** pending
*   **Test Strategy:** Successful execution of all unit and integration tests. Manual testing with sample scenarios against a mock MCP server. Code review.
*   **Subtasks:**
    *   **9.1:** Review and refine component integrations.
    *   **9.2:** Enhance error handling paths.
    *   **9.3:** Develop mock MCP server for integration testing (if feasible).
    *   **9.4:** Write integration tests covering common scenarios.
    *   **9.5:** Add code documentation (JSDoc). 