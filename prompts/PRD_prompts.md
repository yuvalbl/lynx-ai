# PRD Implementation Prompts

This document contains prompts for implementing the AI-Powered End-to-End Test Generation system as described in the PRD. Each prompt is designed to create a specific module or its associated tests while ensuring all requirements are met.

## Infrastructure Setup

### Infrastructure Setup Prompt

```
Create the infrastructure for an AI-powered end-to-end test generation system with TypeScript, Playwright, and MCP Playwright Server. Set up the following:

1. Create a package.json file with:
   - TypeScript 4.x+ and ts-node-dev
   - Playwright dependencies
   - Jest for unit testing
   - ESLint with TypeScript support
   - Prettier for code formatting
   - Appropriate scripts for building, testing, and linting
  Make use TypeScript in dev mode (using ts-node-dev)

2. Create a basic project structure with:
   - src/ directory for source code
   - tests/ directory for tests
   - Configuration files (.eslintrc.js, jest.config.js, tsconfig.json)
   - Sample .env file for environment variables

3. Set up directory structure for the four main modules:
   - src/scenario-parser/
   - src/marathon-engine/
   - src/test-converter/
   - src/playwright-runner/
   - src/common/ (for shared types and utilities)

4. Implement shared interfaces in src/common/types.ts as defined in the PRD:
   - CommonOptions
   - ErrorInfo
   - OperationResult
   - TestStep

5. Create a simple logging mechanism in src/common/logger.ts

Ensure code follows these practices:
- Clean architecture with separation of concerns
- KISS principle (Keep It Simple, Stupid)
- Functions should be small and focused
- TypeScript interfaces should be well-defined with JSDoc comments
- Add README.md files to each module directory explaining purpose
- Max function length of 25 lines
- Meaningful variable and function names

Include a README.md in the root directory with:
- Project overview
- Setup instructions
- How to run tests
- How to use the system

Add a simple script to validate TS files can be run in dev mode - run 'npm run dev' to test it
```

### Infrastructure Tests Prompt

```
Create comprehensive tests for the infrastructure setup of our AI-powered end-to-end test generation system. Implement the following:

1. Integration test to validate the entire infrastructure:
   - Verify directory structure
   - Validate configuration files
   - Ensure script
   - Ensure imports work correctly between modules
   - Verify build process completes successfully

4. Create a setup validation script:
   - Check all required dependencies are installed
   - Verify environment variables are set correctly
   - Confirm TypeScript compilation works
   - Ensure tests can run successfully

Make tests simple and focused following these practices:
- Each test should test one thing only
- Use descriptive test names
- Use arrange-act-assert pattern
- Keep test code simple and readable
- Use mocks and stubs where appropriate

Add a 'test:infra' script to package.json that runs just the infrastructure tests.
Ensure the tests can be run with a single command: npm run test:infra

Document any manual steps needed to verify the infrastructure in a TESTING.md file.
```

## Scenario Parser Module

### Scenario Parser Implementation Prompt

```
Implement the Scenario Parser module for the AI-powered E2E test generation system according to the PRD. This module transforms human-readable test scenarios into structured TestStep objects using MCP Playwright Server.

Create the following files:
1. src/scenario-parser/index.ts - Main entry point exporting the ScenarioParser class
2. src/scenario-parser/types.ts - Module-specific types
3. src/scenario-parser/mcp-client.ts - Client for interacting with MCP Playwright Server
4. src/scenario-parser/test-step-generator.ts - Logic to convert MCP actions to TestStep objects
5. src/scenario-parser/README.md - Documentation for the module

Implement the ScenarioParser class with these methods:
- parse(scenario: TestScenario): Promise<ParserResult>
- validateScenario(scenario: TestScenario): boolean
- getLastExecutionSnapshot(): any | null

The mcp-client.ts should implement these core functions:
- navigateToUrl(url: string): Promise<any>
- executeAction(action: string): Promise<any>
- getSnapshot(): Promise<any>

The TestStepGenerator should:
- Convert MCP Playwright server operations to framework-agnostic TestStep objects
- Assign unique IDs to each step (e.g., "step-1", "step-2", etc.)
- Extract appropriate selectors with resilient strategies
- Handle different action types (navigate, input, click, assert, wait, select, hover, keypress)
- Apply appropriate timeout values for each step
- Set proper waitFor conditions based on the action context
- Populate context data for debugging and self-healing

Error handling:
- Implement retry mechanism (max 3 attempts)
- Capture detailed error information
- Handle network errors, timeouts, and invalid selectors

Follow these code practices:
- Functions should be small (max 25 lines)
- Use meaningful variable and function names
- Add JSDoc comments for public methods
- Follow SOLID principles
- Separate concerns (MCP communication vs TestStep generation)
- Implement proper error handling
- Add logging at appropriate levels

Manual testing:
Create a simple CLI script (src/scenario-parser/cli.ts) that:
- Takes a JSON file with a test scenario as input
- Runs the parser
- Outputs the generated TestSteps
- Can be run with: npm run parse-scenario -- path/to/scenario.json

Add a sample scenario JSON file in examples/scenarios/login-scenario.json that can be used for testing.

Include README.md with:
- Purpose of the module
- API documentation
- Example usage
- How to run manual tests
```

### Scenario Parser Tests Prompt

```
Create comprehensive tests for the Scenario Parser module of the AI-powered E2E test generation system. Implement both unit and integration tests.

Create the following test files:
1. tests/scenario-parser/scenario-parser.test.ts - Main test file for ScenarioParser class
2. tests/scenario-parser/mcp-client.test.ts - Tests for MCP Playwright client
3. tests/scenario-parser/test-step-generator.test.ts - Tests for TestStep generation
4. tests/scenario-parser/integration.test.ts - Integration tests

Unit tests for ScenarioParser:
- Test scenario validation (valid/invalid inputs)
- Test parsing logic with mocked MCP client
- Test error handling and retry mechanism
- Test getLastExecutionSnapshot()

Unit tests for MCP client:
- Test URL navigation
- Test action execution with different action types
- Test snapshot retrieval
- Test error handling for API failures

Unit tests for TestStep generator:
- Test conversion from MCP operations to TestSteps
- Test selector extraction
- Test handling of different action types
- Test context information is properly captured

Integration tests:
- Test the complete flow with mock MCP server
- Test with various scenario types (login, form submission, navigation)
- Test error cases and recovery
- Test performance (parsing should complete within reasonable time)

Create mocks:
- Mock MCP Playwright Server responses
- Mock DOM snapshots
- Mock error conditions

Follow these testing practices:
- Use descriptive test names (should/when/then pattern)
- One assertion per test where possible
- Use beforeEach for test setup
- Properly clean up after tests
- Use test fixtures for common scenarios

Add test script to package.json:
- npm run test:parser - Runs all parser tests
- npm run test:parser:unit - Runs just unit tests
- npm run test:parser:integration - Runs just integration tests

Create a manual test script that:
- Accepts a sample scenario
- Runs the parser against it
- Displays the output in a readable format
- Can be run with: npm run test:parser:manual

Include test documentation in tests/scenario-parser/README.md with:
- Overview of testing approach
- How to run the tests
- How to add new tests
- Common test scenarios
```

## Marathon Execution Engine Module

### Marathon Engine Implementation Prompt

```
Implement the Marathon Execution Engine module for the AI-powered E2E test generation system according to the PRD. This module executes TestStep objects using Playwright in a secure environment.

Create the following files:
1. src/marathon-engine/index.ts - Main entry point exporting the MarathonEngine class
2. src/marathon-engine/types.ts - Module-specific types
3. src/marathon-engine/test-step-executor.ts - Logic to execute TestStep objects
4. src/marathon-engine/security.ts - Security-related functionality
5. src/marathon-engine/README.md - Documentation for the module

Implement the MarathonEngine class with these methods:
- execute(request: ExecutionRequest): Promise<ExecutionResult>
- validateTestStep(step: TestStep): boolean
- getLastExecutionState(): any | null

The TestStepExecutor should:
- Map TestStep actions to Playwright API calls
- Execute steps sequentially
- Capture detailed execution information
- Handle errors and timeout conditions

Security implementation:
- URL navigation restriction (only allow the specified URL)
- Implement action allowlisting functionality (only permit actions defined in the allowedActions list)
- Leave placeholders for future security measures (with comments)

Core functionality:
- Support basic actions: navigate, input, click, assert, wait, select, hover, keypress
- Handle TestStep context information
- Respect step-specific timeouts
- Create new Playwright browser contexts for isolation
- Capture screenshots on errors
- Implement retry mechanism based on maxRetries value

Follow these code practices:
- Keep functions focused and small (max 25 lines)
- Use dependency injection for easier testing
- Add clear error messages
- Implement proper try/catch blocks
- Use async/await consistently
- Add logging at appropriate levels
- Use TypeScript types effectively

Manual testing:
Create a CLI script (src/marathon-engine/cli.ts) that:
- Takes a JSON file with TestStep objects as input
- Runs the marathon engine
- Reports execution results
- Can be run with: npm run execute-steps -- path/to/teststeps.json

Add sample TestSteps in examples/teststeps/login-steps.json for testing:

[
  {
    "id": "step-1",
    "action": "navigate",
    "value": "https://example.com/login",
    "description": "Navigate to login page",
    "waitFor": "networkidle",
    "isLastStep": false
  },
  {
    "id": "step-2",
    "action": "input",
    "selector": "#username",
    "value": "testuser",
    "description": "Enter username",
    "waitFor": "visible",
    "isLastStep": false
  },
  {
    "id": "step-3",
    "action": "input",
    "selector": "#password",
    "value": "password123",
    "description": "Enter password",
    "waitFor": "visible",
    "isLastStep": false
  },
  {
    "id": "step-4",
    "action": "click",
    "selector": "#login-button",
    "description": "Click login button",
    "waitFor": "visible",
    "isLastStep": false
  },
  {
    "id": "step-5",
    "action": "assert",
    "selector": "#welcome-message",
    "value": "Welcome!",
    "description": "Verify welcome message",
    "isLastStep": true
  }
]


Include README.md with:
- Purpose of the module
- API documentation
- Security considerations
- Example usage
- How to run manual tests
```

### Marathon Engine Tests Prompt

```
Create comprehensive tests for the Marathon Execution Engine module of the AI-powered E2E test generation system. Implement both unit and integration tests.

Create the following test files:
1. tests/marathon-engine/marathon-engine.test.ts - Main test file for MarathonEngine class
2. tests/marathon-engine/test-step-executor.test.ts - Tests for TestStep execution
3. tests/marathon-engine/security.test.ts - Tests for security features
4. tests/marathon-engine/integration.test.ts - Integration tests

Unit tests for MarathonEngine:
- Test request validation
- Test execution flow with mocked executor
- Test error handling and reporting
- Test getLastExecutionState()

Unit tests for TestStepExecutor:
- Test mapping of TestSteps to Playwright actions
- Test execution of different action types
- Test browser context creation and isolation
- Test error handling during execution
- Test handling of step-specific timeouts
- Test retry mechanism using maxRetries

Unit tests for security features:
- Test URL navigation restrictions
- Test action allowlisting (ensure only allowed actions are executed)
- Test validation logic

Integration tests:
- Test executing real TestSteps against a test website
- Test handling of various TestStep sequences
- Test error recovery
- Test execution results match expected outputs

Create mocks:
- Mock Playwright Page object
- Mock Browser context
- Mock TestSteps with different actions
- Mock error conditions

Follow these testing practices:
- Use descriptive test names
- Isolate tests from external dependencies where possible
- Clean up browser contexts after tests
- Test both success and failure paths
- Test boundary conditions

Add test script to package.json:
- npm run test:engine - Runs all engine tests
- npm run test:engine:unit - Runs just unit tests
- npm run test:engine:integration - Runs just integration tests

Create a manual test script that:
- Accepts a sample TestStep JSON file
- Executes the steps using the engine
- Displays detailed results
- Can be run with: npm run test:engine:manual

Include test documentation in tests/marathon-engine/README.md with:
- Overview of testing approach
- Description of test fixtures
- How to run the tests
- How to debug failed tests
```

## TestStep to Playwright Code Converter Module

### TestStep Converter Implementation Prompt

```
Implement the TestStep to Playwright Code Converter module for the AI-powered E2E test generation system according to the PRD. This module converts validated TestStep objects into Playwright test code in TypeScript.

Create the following files:
1. src/test-converter/index.ts - Main entry point exporting the TestStepConverter class
2. src/test-converter/types.ts - Module-specific types
3. src/test-converter/code-generator.ts - Core logic for generating Playwright code
4. src/test-converter/templates.ts - Code templates for different test components
5. src/test-converter/README.md - Documentation for the module

Implement the TestStepConverter class with these methods:
- convert(request: ConverterRequest): ConverterResult
- supportedFrameworks(): string[]
- validateTestSteps(steps: TestStep[]): boolean

The CodeGenerator should:
- Generate Playwright test code from framework-agnostic TestStep objects
- Translate abstract actions to specific Playwright API calls
- Create proper test structure with imports
- Add comments based on step descriptions
- Generate appropriate assertions
- Format the code properly
- Handle step-specific timeouts in the generated code

Templates should include:
- Test file header with imports
- Test block structure
- Action-to-implementation mapping (e.g., each abstract action maps to specific Playwright calls):
  * 'navigate' -> page.goto()
  * 'input' -> page.fill()
  * 'click' -> page.click()
  * 'assert' -> expect() with appropriate matchers
  * 'wait' -> page.waitForSelector() or other waiting methods
  * 'select' -> page.selectOption()
  * 'hover' -> page.hover()
  * 'keypress' -> page.press()
- Comment templates

Core functionality:
- Support all TestStep action types
- Generate readable and well-formatted code
- Include appropriate error handling in generated code
- Support parameterized test names

Follow these code practices:
- Use template literals wisely
- Keep functions small and focused
- Use descriptive variable names
- Follow the single responsibility principle
- Add JSDoc comments to public methods
- Use TypeScript types effectively
- Ensure generated code is properly indented

Manual testing:
Create a CLI script (src/test-converter/cli.ts) that:
- Takes a JSON file with TestStep objects as input
- Runs the converter
- Outputs the generated Playwright code to a file
- Can be run with: npm run convert-steps -- path/to/teststeps.json output.spec.ts

Add sample TestSteps in examples/teststeps/login-steps.json for testing:

```json
[
  {
    "id": "step-1",
    "action": "navigate",
    "value": "https://example.com/login",
    "description": "Navigate to login page",
    "waitFor": "networkidle",
    "isLastStep": false
  },
  {
    "id": "step-2",
    "action": "input",
    "selector": "#username",
    "value": "testuser",
    "description": "Enter username",
    "waitFor": "visible",
    "isLastStep": false
  },
  {
    "id": "step-3",
    "action": "input",
    "selector": "#password",
    "value": "password123",
    "description": "Enter password",
    "waitFor": "visible",
    "isLastStep": false
  },
  {
    "id": "step-4",
    "action": "click",
    "selector": "#login-button",
    "description": "Click login button",
    "waitFor": "visible",
    "isLastStep": false
  },
  {
    "id": "step-5",
    "action": "assert",
    "selector": "#welcome-message",
    "value": "Welcome!",
    "description": "Verify welcome message",
    "isLastStep": true
  }
]
```

Include README.md with:
- Purpose of the module
- API documentation
- Example usage
- Sample input and output
- How to run manual tests
```

### TestStep Converter Tests Prompt

```
Create comprehensive tests for the TestStep to Playwright Code Converter module of the AI-powered E2E test generation system. Implement both unit and integration tests.

Create the following test files:
1. tests/test-converter/test-step-converter.test.ts - Main test file for TestStepConverter class
2. tests/test-converter/code-generator.test.ts - Tests for code generation logic
3. tests/test-converter/templates.test.ts - Tests for code templates
4. tests/test-converter/integration.test.ts - Integration tests

Unit tests for TestStepConverter:
- Test validation of TestStep objects
- Test conversion request handling
- Test error handling
- Test supportedFrameworks()

Unit tests for CodeGenerator:
- Test code generation for each action type
- Test translation from abstract actions to framework-specific calls
- Test timeout handling in generated code
- Test comment generation
- Test assertion generation
- Test error handling in generated code

Unit tests for templates:
- Test each template renders correctly
- Test template variables are properly replaced
- Test template composition

Integration tests:
- Test end-to-end conversion process
- Test with various TestStep sequences
- Test generated code is valid TypeScript
- Test generated code runs successfully with Playwright

Create test fixtures:
- Sample TestStep objects for different scenarios
- Expected code output for comparison
- Mock TestSteps with different actions

Validation tests:
- Test the generated code can be compiled
- Test the generated code follows best practices
- Test the generated code works when executed

Follow these testing practices:
- Use snapshot testing for code output comparison
- Test edge cases and boundary conditions
- Isolate tests from external dependencies
- Use descriptive test names

Add test script to package.json:
- npm run test:converter - Runs all converter tests
- npm run test:converter:unit - Runs just unit tests
- npm run test:converter:integration - Runs just integration tests

Create a manual test script that:
- Accepts sample TestSteps
- Converts them to Playwright code
- Validates the generated code
- Executes the generated code if possible
- Can be run with: npm run test:converter:manual

Include test documentation in tests/test-converter/README.md with:
- Overview of testing approach
- Description of test fixtures
- How to add new test cases
- How to validate generated code
```

## Playwright Runner Module

### Playwright Runner Implementation Prompt

```
Implement the Playwright Runner module for the AI-powered E2E test generation system according to the PRD. This module executes the generated Playwright test code and reports results.

Create the following files:
1. src/playwright-runner/index.ts - Main entry point exporting the PlaywrightRunner class
2. src/playwright-runner/types.ts - Module-specific types
3. src/playwright-runner/code-executor.ts - Logic to execute Playwright code
4. src/playwright-runner/result-formatter.ts - Format execution results
5. src/playwright-runner/README.md - Documentation for the module

Implement the PlaywrightRunner class with these methods:
- run(request: RunnerRequest): Promise<RunnerResult>
- validateCode(code: string): boolean

The CodeExecutor should:
- Create a temporary test file from the provided code
- Execute the test using Playwright's test runner
- Capture logs, screenshots, and execution results
- Clean up temporary files after execution

The ResultFormatter should:
- Parse Playwright execution results
- Format results in a consistent structure
- Include relevant error information
- Calculate execution statistics

Core functionality:
- Support running code with different browser options
- Provide detailed error information on failures
- Capture execution logs
- Support execution timeouts

Follow these code practices:
- Use proper file handling with cleanup
- Implement robust error handling
- Keep functions small and focused
- Use async/await correctly
- Add appropriate logging
- Separate concerns (execution vs. result processing)

Manual testing:
Create a CLI script (src/playwright-runner/cli.ts) that:
- Takes a Playwright test file as input
- Runs the test
- Displays the execution results
- Can be run with: npm run run-test -- path/to/test.spec.ts

Include README.md with:
- Purpose of the module
- API documentation
- Example usage
- How to run manual tests
- Troubleshooting common issues
```

### Playwright Runner Tests Prompt

```
Create comprehensive tests for the Playwright Runner module of the AI-powered E2E test generation system. Implement both unit and integration tests.

Create the following test files:
1. tests/playwright-runner/playwright-runner.test.ts - Main test file for PlaywrightRunner class
2. tests/playwright-runner/code-executor.test.ts - Tests for code execution logic
3. tests/playwright-runner/result-formatter.test.ts - Tests for result formatting
4. tests/playwright-runner/integration.test.ts - Integration tests

Unit tests for PlaywrightRunner:
- Test code validation
- Test run method with mocked executor
- Test error handling
- Test option processing

Unit tests for CodeExecutor:
- Test file creation
- Test Playwright execution
- Test result capturing
- Test cleanup procedures
- Test timeout handling

Unit tests for ResultFormatter:
- Test parsing of different result types
- Test error formatting
- Test statistics calculation
- Test output structure matches expected format

Integration tests:
- Test running actual Playwright tests
- Test with passing tests
- Test with failing tests
- Test with syntax errors
- Test with runtime errors
- Test with different browser configurations

Create test fixtures:
- Sample Playwright test files
- Mock execution results
- Error scenarios

Follow these testing practices:
- Mock filesystem operations where appropriate
- Mock Playwright execution for unit tests
- Use real Playwright execution for integration tests
- Test edge cases (empty files, large outputs)

Add test script to package.json:
- npm run test:runner - Runs all runner tests
- npm run test:runner:unit - Runs just unit tests
- npm run test:runner:integration - Runs just integration tests

Create a manual test script that:
- Takes a sample test file
- Executes it with the runner
- Displays detailed results
- Can be run with: npm run test:runner:manual

Include test documentation in tests/playwright-runner/README.md with:
- Overview of testing approach
- How to run the tests
- How to add new test cases
- How to debug issues with the runner
```

## End-to-End Integration

### Integration Prompt

```
Create the end-to-end integration for the AI-powered E2E test generation system. This will tie together all four modules into a complete workflow.

Create the following files:
1. src/index.ts - Main entry point for the system
2. src/types.ts - Shared types for the integrated system
3. src/workflow.ts - Orchestrates the complete test generation workflow
4. src/cli.ts - Command-line interface for the system
5. README.md - Main documentation for the entire system

Implement the main workflow that:
1. Takes a human-readable test scenario as input
2. Uses ScenarioParser to convert it to framework-agnostic TestStep objects
3. Uses MarathonEngine to validate and execute the TestSteps
4. Uses TestStepConverter to translate TestSteps into framework-specific Playwright code
5. Uses PlaywrightRunner to execute the generated code
6. Reports comprehensive results

Create a CLI that:
- Accepts a scenario file as input
- Provides options for each step of the process
- Allows saving artifacts (TestSteps, generated code, results)
- Supports verbose logging
- Can be run with: npm run inteli-test -- path/to/scenario.json

Core functionality:
- Complete end-to-end pipeline
- Proper error handling at each stage
- Progress reporting
- Artifact management (save outputs from each stage)

Follow these integration practices:
- Use dependency injection
- Maintain separation of concerns
- Add comprehensive logging
- Handle errors at appropriate levels
- Create a clean and intuitive API

Include configuration options:
- Environment variables
- Configuration file support
- Command-line arguments

Documentation in README.md should include:
- System overview and architecture
- Framework-agnostic design principles
- Explanation of the TestStep interface and its role
- Installation instructions
- Usage examples with sample commands
- Configuration options
- Troubleshooting guide
- Module documentation references

Create a quickstart guide with examples of:
- Simple login test
- Form submission test
- Basic navigation and assertion test
```

### End-to-End Tests Prompt

```
Create comprehensive end-to-end tests for the complete AI-powered E2E test generation system. These tests should validate the entire workflow from scenario to test execution.

Create the following test files:
1. tests/e2e/workflow.test.ts - Tests for the complete workflow
2. tests/e2e/cli.test.ts - Tests for the CLI interface
3. tests/e2e/fixtures.ts - Test fixtures and utilities
4. tests/e2e/scenarios/ - Directory with test scenarios

End-to-end workflow tests:
- Test the complete pipeline with various scenarios
- Test error handling at each stage
- Test with different configuration options
- Measure performance and execution time

CLI tests:
- Test command-line argument processing
- Test different command combinations
- Test help and version commands
- Test with invalid inputs
- Test output formatting

Test scenarios should include:
- Login flow
- Form submission
- Navigation sequence
- Element interaction
- Assertions and validations
- Error cases

Create test fixtures:
- Sample test websites (static HTML or simple servers)
- Predefined scenarios of varying complexity
- Expected outputs for each stage

Performance tests:
- Measure execution time for different scenarios
- Ensure system meets performance requirements

Follow these testing practices:
- Use test timeouts appropriate for end-to-end tests
- Clean up all artifacts after tests
- Use descriptive test names
- Document test prerequisites

Add test script to package.json:
- npm run test:e2e - Runs all end-to-end tests
- npm run test:e2e:workflow - Tests just the workflow
- npm run test:e2e:cli - Tests just the CLI

Create a manual test script that:
- Runs the complete system with a sample scenario
- Shows detailed output from each stage
- Can be run with: npm run test:e2e:manual

Include test documentation in tests/e2e/README.md with:
- End-to-end testing approach
- Test prerequisites
- How to run the tests
- How to interpret test results
- Common failure scenarios and troubleshooting
```

## Conclusion

These prompts provide comprehensive guidance for implementing the complete AI-powered E2E test generation system as specified in the PRD. Each module has dedicated prompts for both implementation and testing, ensuring complete coverage of requirements.

Use these prompts in sequence, starting with infrastructure setup, then implementing each module, and finally integrating everything together. The testing prompts should be used alongside implementation to ensure code quality and compliance with requirements. 