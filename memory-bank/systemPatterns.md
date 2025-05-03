# System Patterns

System architecture, key technical decisions, design patterns, component relationships.

## Core Architecture (Scenario Parser)

The `ScenarioParser` module uses an orchestrator pattern (`ScenarioParserOrchestrator`). It follows a sequential, stateful process:
1.  **Capture State:** Get the current DOM state from the browser.
2.  **Interpret Action:** Use an LLM to translate the user's natural language action based on the captured state.
3.  **Execute Action:** Perform the interpreted action in the browser.
4.  **Repeat:** Loop back to step 1 for the next action.

## Key Components & Patterns

*   **`PlaywrightBridgeService`:**
    *   **Pattern:** Bridge / Facade
    *   **Role:** Abstracts direct Playwright API calls (navigation, clicks, typing, JS evaluation) for browser interaction. Manages the Playwright `Page` lifecycle.
    *   **Decision:** Replaced the initial plan of using MCP with direct Playwright control for more flexibility.
*   **`DomProcessorService`:**
    *   **Pattern:** Service / Processor
    *   **Role:** Responsible for executing a specific JavaScript (`buildDomTree.js`, inspired by `browser-use`) within the browser context via the `PlaywrightBridgeService` to capture a structured, serializable representation of the DOM.
    *   **Output:** Produces a `SerializableDOMNode` tree and a `SelectorMap` (mapping interaction indices to nodes).
*   **`PromptBuilderService`:**
    *   **Pattern:** Builder / Formatter
    *   **Role:** Formats the complex `SerializableDOMNode` tree into a concise string suitable for LLM prompts, highlighting interactive elements.
*   **`NLToActionTranslator`:**
    *   **Pattern:** Service / Adapter (to LLM)
    *   **Role:** Interfaces with the LLM to translate the user's action and formatted DOM state into an `IntermediateStep` (a structured action representation).
*   **`ActionTranslatorService`:**
    *   **Pattern:** Service / Translator
    *   **Role:** Translates the `IntermediateStep` into specific commands for the `PlaywrightBridgeService`, using the `SelectorMap` to find target elements.

*(Refer to `scenario-parser-tech-spec.md` for diagrams and more detailed component descriptions)* 