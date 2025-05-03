# Task Breakdown for Scenario Parser Implementation (Direct Playwright)

**Task 1: Setup Scenario Parser Module Structure and Core Interfaces**
*   **ID:** 1
*   **Title:** Setup Scenario Parser Module Structure and Core Interfaces
*   **Description:** Create the necessary directories and files for the scenario-parser module, and define the core shared TypeScript interfaces based on the revised tech spec (Direct Playwright).
*   **Details:** Refer to Section 4 and Section 6 of `src/scenario-parser/scenario-parser-tech-spec.md`. Create/update the main directories (`components`, `interfaces`, `utils`, `tests`) inside `src/scenario-parser/`. Create/update the interface files (`common.types.ts`, `scenario.types.ts`, `test-step.types.ts`, `internal.types.ts`) inside `src/scenario-parser/interfaces/`. Implement the type definitions as specified (e.g., enhance `SerializableDOMNode`, add `SelectorMap`, `TabInfo`). Create placeholder `index.ts` files in new component subdirectories (`playwright-bridge`, `dom-processor`, `prompt-builder`, `action-translator`) and utils. Remove `mcp.types.ts`.
*   **Dependencies:** []
*   **Priority:** high
*   **Status:** done (needs update)
*   **Test Strategy:** Verify directory structure. Verify interface files contain updated type definitions. Code review.
*   **Subtasks:**
    *   **1.1:** Create/Update directory structure (add new component dirs, remove old ones if applicable).
    *   **1.2:** Update/Verify `common.types.ts`.
    *   **1.3:** Update/Verify `scenario.types.ts`.
    *   **1.4:** Update/Verify `test-step.types.ts` (especially `TestStepContext`).
    *   **1.5:** REMOVE `mcp.types.ts`.
    *   **1.6:** Update `internal.types.ts` (Enhance `SerializableDOMNode`, add `SelectorMap`, `TabInfo`, update `BrowserStepContext`).
    *   **1.7:** Create placeholder `index.ts` files in new component directories.

**Task 2: Implement Scenario Input Validation**
*   **ID:** 2
*   **Title:** Implement Scenario Input Validation
*   **Description:** Implement the logic to validate the incoming `TestScenario` object.
*   **Details:** (Largely unchanged) Implement the `validateScenarioLogic` function within `src/scenario-parser/components/validator/validator.logic.ts`. Ensure it checks required fields (`url`, `actions`) and types. Throw a `ValidationError` on failure.
*   **Dependencies:** [1]
*   **Priority:** high
*   **Status:** done
*   **Test Strategy:** Unit tests for `validateScenarioLogic`.
*   **Subtasks:** (Assumed complete or minor adjustments)

**Task 3: Implement Playwright Bridge Service**
*   **ID:** 3
*   **Title:** Implement Playwright Bridge Service
*   **Description:** Implement the service responsible for managing the Playwright Browser/Context/Page and executing low-level commands.
*   **Details:** Implement the `PlaywrightBridgeService` class in `src/scenario-parser/components/playwright-bridge/playwright-bridge.service.ts`. Implement methods to connect/launch Playwright, get the active page, navigate, click/type elements (using selectors), evaluate JS, wait for load states, manage tabs, etc., as outlined in the tech spec and plan. Handle Playwright setup and teardown. Requires Playwright configuration.
*   **Dependencies:** [1] (uses interfaces), `playwright` library.
*   **Priority:** high
*   **Status:** pending
*   **Test Strategy:** Unit tests mocking Playwright interactions where possible. Integration tests involving launching a real browser instance for key methods (navigate, click, evaluate).
*   **Subtasks:**
    *   **3.1:** Implement `PlaywrightBridgeService` class structure and constructor (handling config, Playwright setup).
    *   **3.2:** Implement core methods: `getPage`, `navigateTo`, `goBack`, `evaluate`.
    *   **3.3:** Implement interaction methods: `click`, `type`, `hover`, `pressKey`, `selectOption` (using selectors).
    *   **3.4:** Implement state/wait methods: `waitForLoadState`, `getCurrentUrl`, `getPageContent`.
    *   **3.5:** Implement tab management methods: `getTabsInfo`, `switchToTab`.
    *   **3.6:** Implement cleanup logic (`close`).
    *   **3.7:** Implement unit and integration tests.

**Task 4: Implement DOM Processor Service**
*   **ID:** 4
*   **Title:** Implement DOM Processor Service
*   **Description:** Implement the logic to capture and process the DOM state using the `buildDomTree.js` script via Playwright.
*   **Details:** Implement the `DomProcessorService` class in `src/scenario-parser/components/dom-processor/dom-processor.service.ts`. Implement the `getDomState` method which loads `buildDomTree.js` (from the same directory), calls `PlaywrightBridgeService.evaluate`, parses the resulting JSON, and constructs the `SerializableDOMNode` tree and `SelectorMap`. Requires implementing the parsing/tree-building logic adapted from `browser-use` (`_construct_dom_tree`, `_parse_node`).
*   **Dependencies:** [1, 3] (uses interfaces, `PlaywrightBridgeService`).
*   **Priority:** high
*   **Status:** pending
*   **Test Strategy:** Unit tests for the JSON parsing and tree/map construction logic using mock JSON data. Integration tests calling `getDomState` against a live page via `PlaywrightBridgeService`.
*   **Subtasks:**
    *   **4.1:** Add `buildDomTree.js` to the component directory.
    *   **4.2:** Implement `DomProcessorService` structure and `getDomState` method.
    *   **4.3:** Implement the core logic to parse the JS map and build the `SerializableDOMNode` tree (populating fields like `xpath`, `isInteractive`, `highlightIndex`).
    *   **4.4:** Implement the logic to create the `SelectorMap`.
    *   **4.5:** Implement unit and integration tests.

**Task 5: Implement LLM Interaction (Prompt Builder & Translator)**
*   **ID:** 5
*   **Title:** Implement LLM Interaction (Prompt Builder & Translator)
*   **Description:** Implement prompt building logic and the LLM API call for action translation using function calling.
*   **Details:** Implement `PromptBuilderService` in `prompt-builder.service.ts`. Implement `formatDomForLLM` to serialize the `SerializableDOMNode` tree (from `DomProcessorService`) into the LLM prompt string, prioritizing top-most interactive elements. Implement `createLlmPromptPayload` to assemble the full payload. Implement `NLToActionTranslatorLogic` (largely unchanged logic but uses new payload structure) in `nl-translator.logic.ts` to call the LLM and parse the `IntermediateStep` function call.
*   **Dependencies:** [1, 4] (uses interfaces, needs DOM state from `DomProcessorService`).
*   **Priority:** high
*   **Status:** pending
*   **Test Strategy:** Unit tests for `PromptBuilderService` checking prompt string formatting and payload creation. Unit tests for `NLToActionTranslatorLogic` mocking the LLM API response.
*   **Subtasks:**
    *   **5.1:** Implement `PromptBuilderService.formatDomForLLM` (recursive traversal and formatting logic).
    *   **5.2:** Implement `PromptBuilderService.createLlmPromptPayload`.
    *   **5.3:** (If not already done) Implement LLM function definition for `IntermediateStep` (likely within `NLToActionTranslatorLogic` or shared config).
    *   **5.4:** Update/Implement `NLToActionTranslatorLogic.translateLogic` (LLM API call, function call parsing using new payload).
    *   **5.5:** Implement unit tests for prompt building and translation.

**Task 6: Implement Action Translator Service**
*   **ID:** 6
*   **Title:** Implement Action Translator Service
*   **Description:** Implement the logic to convert the LLM's `IntermediateStep` hypothesis into executable Playwright commands via the Bridge service.
*   **Details:** Implement `ActionTranslatorService` in `action-translator.service.ts`. Implement `executeAction` method. Use a switch/map based on `IntermediateStep.actionType`. For element interactions, use the `highlightIndex` (from `targetSelector`) to look up the node in the provided `SelectorMap`, extract the selector (XPath), and call the corresponding `PlaywrightBridgeService` method (e.g., `click`, `type`). Handle navigation actions by calling `PlaywrightBridgeService.navigateTo`.
*   **Dependencies:** [1, 3, 5] (uses interfaces, `PlaywrightBridgeService`, `IntermediateStep`).
*   **Priority:** high
*   **Status:** pending
*   **Test Strategy:** Unit tests for `executeAction` covering different action types, mocking `PlaywrightBridgeService` and `SelectorMap` inputs.
*   **Subtasks:**
    *   **6.1:** Implement `ActionTranslatorService.executeAction` logic (switch statement, map lookup, bridge calls).
    *   **6.2:** Implement helper for extracting/validating selector from node.
    *   **6.3:** Implement unit tests.

**Task 7: Implement Test Step Creation**
*   **ID:** 7
*   **Title:** Implement Test Step Creation
*   **Description:** Implement the logic within the Orchestrator (or a helper) to create the final `TestStep` objects after successful actions.
*   **Details:** Adapt the logic previously planned for `ResultProcessorLogic`. This function/method (likely called by the `Orchestrator`) takes the successful `OperationResult`, the `IntermediateStep` that led to it, and potentially context like the formatted DOM string used for the LLM. It generates a unique ID (e.g., UUID) and constructs the `TestStep` object, mapping fields correctly (`action`, `description`, `selector`, `value`, `context.domStructureSnapshot`).
*   **Dependencies:** [1, 5] (uses interfaces, `IntermediateStep`).
*   **Priority:** medium
*   **Status:** pending
*   **Test Strategy:** Unit tests for the `TestStep` creation logic.
*   **Subtasks:**
    *   **7.1:** Implement the `TestStep` creation logic (as a function or Orchestrator method).
    *   **7.2:** Add UUID generation utility if needed.
    *   **7.3:** Implement unit tests.

**Task 8: Implement Orchestrator Service**
*   **ID:** 8
*   **Title:** Implement Orchestrator Service
*   **Description:** Implement the main `ScenarioParserOrchestrator` service to manage state and orchestrate calls to the new direct Playwright components.
*   **Details:** Implement the `ScenarioParserOrchestrator` class in `scenario-parser.service.ts`. Implement the `parse` method. Manage internal state (current DOM state `{ domTree, selectorMap }`, list of generated TestSteps). Handle initial navigation (calling `ActionTranslatorService`). Loop through user actions, calling validator, `DomProcessorService` (get state), `PromptBuilderService`, `NLToActionTranslator`, `ActionTranslatorService` (execute action). Update state after successful actions. Handle errors. Create `TestStep` objects upon success (using logic from Task 7). Compile the final `ParserResult`. Inject dependencies.
*   **Dependencies:** [1, 2, 3, 4, 5, 6, 7] (uses all other components).
*   **Priority:** high
*   **Status:** pending
*   **Test Strategy:** Integration tests for the `parse` method using mocked components to verify the overall flow, state management, and result construction.
*   **Subtasks:**
    *   **8.1:** Implement `ScenarioParserOrchestrator` class structure and constructor (dependency injection).
    *   **8.2:** Implement initial navigation logic within `parse`.
    *   **8.3:** Implement the main action processing loop (calling services in sequence: get state -> build prompt -> translate NL -> execute action -> process result).
    *   **8.4:** Implement state management logic (storing/updating `{ domTree, selectorMap }`).
    *   **8.5:** Implement `TestStep` creation call upon action success.
    *   **8.6:** Implement error handling and final `ParserResult` compilation.
    *   **8.7:** Implement integration tests.

**Task 9: Comprehensive Integration and Testing**
*   **ID:** 9
*   **Title:** Comprehensive Integration and Testing
*   **Description:** Ensure all components work together correctly and add end-to-end style tests with a real browser.
*   **Details:** Refine component interactions. Add robust error handling. Add integration tests that run sample scenarios against actual websites using the full stack (including Playwright browser instance). Ensure code quality, add documentation (JSDoc).
*   **Dependencies:** [8]
*   **Priority:** medium
*   **Status:** pending
*   **Test Strategy:** Successful execution of all unit and integration tests. Manual testing with sample scenarios against live websites. Code review.
*   **Subtasks:**
    *   **9.1:** Review and refine component integrations.
    *   **9.2:** Enhance error handling paths.
    *   **9.3:** Write integration tests running full scenarios against live sites.
    *   **9.4:** Add code documentation (JSDoc). 