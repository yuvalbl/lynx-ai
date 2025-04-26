# Scenario Parser Module

## Overview

The Scenario Parser module is responsible for transforming human-readable test scenarios into structured `TestStep` objects using the MCP Playwright Server. It's the entry point for the AI test generation system.

## Responsibilities

- Accept and validate human-readable test scenarios in JSON format
- Interact with the MCP Playwright Server to execute the scenarios 
- Generate structured `TestStep` objects based on the MCP Playwright Server operations
- Implement a self-correction loop to handle errors and improve the generated test steps
- Provide detailed error information for debugging

## API

The Scenario Parser exposes the following API:

```typescript
interface ScenarioParser {
  parse(scenario: TestScenario): Promise<ParserResult>;
  validateScenario(scenario: TestScenario): boolean;
  getLastExecutionSnapshot(): any | null;
}
```

## Flow

1. Receive a test scenario as input
2. Validate the scenario structure
3. Convert the scenario to MCP Playwright Server commands
4. Execute the commands on the MCP Playwright Server
5. Capture DOM snapshots and page state
6. Generate `TestStep` objects based on the execution
7. If any errors occur, attempt self-correction
8. Return the final set of `TestStep` objects

## Example Usage

```typescript
const parser = new ScenarioParser();
const scenario = {
  url: 'https://example.com',
  actions: [
    'Navigate to the login page',
    'Enter "testuser" in the username field',
    'Click the login button'
  ]
};

const result = await parser.parse(scenario);
```

## Error Handling

The module handles various error types:
- MCP Playwright server errors
- Network errors
- Invalid selectors
- Timeouts
- Missing elements

Each error is captured with detailed context for debugging and self-correction. 