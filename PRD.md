# Product Requirements Document (PRD)

**Project Title:** AI-Powered End-to-End Test Generation with Playwright and MCP Playwright Server

**Version:** 1.0 (MVP)

**Date:** February 11, 2025

## 1. Introduction

This document outlines the requirements for an AI-powered system that automatically generates end-to-end (E2E) tests for web applications using Playwright and the MCP Playwright Server. The system will take human-readable test scenarios as input and produce executable Playwright test code in TypeScript. The system is designed to be modular, self-correcting, and secure. This PRD is intended for use by a reasoning AI system capable of understanding natural language, technical specifications, and code examples.

## 2. Goals

*   **Automate E2E Test Generation:** Reduce the manual effort required to create and maintain E2E tests.
*   **Improve Test Accuracy:** Leverage AI to generate tests that accurately reflect user behavior and are robust to minor UI changes.
*   **Self-Healing Tests:** Implement a feedback loop that allows the system to automatically correct errors in generated tests.
*   **Secure Execution:** Ensure that the generated tests are executed securely, preventing any malicious code from being run.
*   **Modular Design:** Create a system that is easy to maintain, extend, and test.
*   **Deliver the MVP:** Create a working prototype with essential functionality.

## 3. Target Users

*   Software Developers
*   QA Engineers
*   SDETs (Software Development Engineers in Test)

## 4. System Overview

The system is composed of four main modules with well-defined APIs:

*   **Scenario Parser:** Transforms human-readable test scenarios into structured `TestStep` objects using the MCP Playwright Server.
*   **Marathon Execution Engine:** Executes `TestStep` objects using Playwright in a secure environment, providing feedback for self-correction.
*   **TestStep to Playwright Code Converter:** Converts validated `TestStep` objects into Playwright test code (TypeScript).
*   **Playwright Runner:** Executes the generated Playwright tests and reports the results.

## 5. Functional Requirements

### 5.1. Scenario Parser

*   **FR-SP-1: Input Processing:**
    *   Accept input in JSON format, conforming to the following schema:
        ```json
        {
          "url": "string (valid URL)",
          "actions": [
            "string (human-readable action description)"
          ]
        }
        ```
        *Example:*
        ```json
        {
          "url": "https://example.com",
          "actions": [
            "Navigate to the login page",
            "Enter 'testuser' in the username field",
            "Enter 'password123' in the password field",
            "Click the login button",
            "Verify that the welcome message is displayed"
          ]
        }
        ```
    *   Validate the input JSON schema.  Reject invalid input with clear error messages.
*   **FR-SP-2: MCP Playwright Server Interaction:**
    *   Construct MCP Playwright server commands based on the input scenario.
    *   The system will use the MCP Playwright server to:
        *   Navigate to the target URL (`url` from the input JSON).
        *   Execute actions sequentially from the `actions` array.
        *   Capture snapshots of DOM state between actions for validation.
    *   MCP Playwright server commands include:
        *   `mcp_playwright_browser_navigate` - Navigate to the specified URL
        *   `mcp_playwright_browser_snapshot` - Take accessibility snapshot of the page
        *   `mcp_playwright_browser_click` - Click on an element
        *   `mcp_playwright_browser_type` - Type text into an input field
        *   `mcp_playwright_browser_select_option` - Select an option from a dropdown
        *   And other supported Playwright operations
    *   Handle potential MCP Playwright server errors gracefully. Retry a limited number of times (e.g., 3 times) before failing.
*   **FR-SP-3: `TestStep` Generation:**
    *   Convert the MCP Playwright server operations into a collection of `TestStep` objects as defined in section 6.1 Common Interfaces.
    *   Map MCP Playwright server operations to appropriate `TestStep` actions and properties. For example:
        *   An MCP operation of navigating to a URL should map to a `TestStep` with `action: 'navigate'`.
        *   An MCP operation of typing text into an input field should map to a `TestStep` with `action: 'input'`, including the `selector` and `value`.
        *   An MCP operation of clicking an element should map to a `TestStep` with `action: 'click'`, including the `selector`.
        *   Assertions (e.g., verifying text content) should map to `TestStep` objects with `action: 'assert'`. The `value` field will contain expected value.
    *   Populate the `context` field of each `TestStep` with the MCP Playwright snapshot for that step. This is *critical* for debugging and self-healing.
* **FR-SP-4: Self-Correction Loop:**
    *   Receive feedback from the Marathon Execution Engine (success/failure status and error information).
    *   If the Marathon Engine reports a failure:
        *   Construct a new sequence of MCP Playwright server commands that includes:
            *   The original instructions.
            *   Information about the previous execution attempt.
            *   The error information from the Marathon Engine.
            *   Alternative element selectors or interaction methods to overcome the error.
        *   Execute the new commands using the MCP Playwright server.
        *   Repeat the process of capturing snapshots, generating `TestStep` objects, and sending them to the Marathon Engine.
        *   Limit the number of self-correction iterations (e.g., to 5). If the maximum number of iterations is reached without success, report a failure.
* **FR-SP-5: Error Handling:**
    *   Handle different error types:
        *   MCP Playwright server errors
        *   Network errors
        *   Invalid selectors
        *   Timeouts
        *   Missing elements
    *   Provide clear error messages that include context about the failed action.
    *   Capture screenshots and DOM snapshots at the time of error for debugging.

### 5.2. Marathon Execution Engine

*   **FR-ME-1: `TestStep` Execution:**
    *   Receive a collection of `TestStep` objects from the Scenario Parser.
    *   Sequentially execute each `TestStep` by mapping it to the corresponding Playwright API call.  For example:
        *   `{ id: 'step-1', action: 'navigate', value: 'https://example.com' }`  ->  `await page.goto('https://example.com');`
        *   `{ id: 'step-2', action: 'input', selector: '#username', value: 'testuser' }` -> `await page.fill('#username', 'testuser');`
        *   `{ id: 'step-3', action: 'click', selector: '#login-button' }` -> `await page.click('#login-button');`
        *   `{ id: 'step-4', action: 'assert', selector: '#welcome-message', value: 'Welcome!' }` -> `expect(await page.locator('#welcome-message')).toHaveText('Welcome!');`
    *   Use a new, isolated Playwright browser context for each execution attempt.
*   **FR-ME-2: Security:**
    *   **URL Navigation Restriction:** Ensure that the MCP Playwright server can only navigate to the URL specified in the input scenario.
    *   **Note:** Additional security measures including action allowlisting, input sanitization, and timeouts will be implemented after the MVP phase.
*   **FR-ME-3: Error Handling:**
    *   Catch any errors that occur during Playwright execution.
    *   Capture detailed error information, including:
        *   The error message from Playwright.
        *   The `TestStep` that caused the error.
        *   A screenshot of the page (if possible).
        *   A partial DOM snapshot (if applicable).
    *   Return the error information to the Scenario Parser.
*   **FR-ME-4: Success/Failure Reporting:**
    *   Report the success or failure of the `TestStep` execution to the Scenario Parser.

### 5.3. TestStep to Playwright Code Converter

*   **FR-TC-1: Code Generation:**
    *   Receive a *validated* collection of `TestStep` objects (i.e., after successful execution in the Marathon Engine).
    *   Generate a string containing valid Playwright test code (TypeScript).
    *   The generated code should include:
        *   Necessary imports (e.g., `import { test, expect } from '@playwright/test';`).
        *   A `test` block with a descriptive name (e.g., derived from the original scenario).
        *   A sequence of Playwright API calls corresponding to the `TestStep` objects.
        *   Appropriate `expect` assertions for `TestStep` objects with `action: 'assert'`.
        *   Comments in the generated code, explaining each step (using the `description` from the `TestStep`).
    *   Example:
        *Input TestStep Collection:*
        ```typescript
        [
          { 
            id: "step-1", 
            action: 'navigate', 
            value: 'https://example.com/login', 
            description: 'Navigate to login page',
            waitFor: 'networkidle',
            isLastStep: false
          },
          { 
            id: "step-2", 
            action: 'input', 
            selector: '#username', 
            value: 'testuser', 
            description: 'Enter username',
            waitFor: 'visible',
            isLastStep: false
          },
          { 
            id: "step-3", 
            action: 'click', 
            selector: '#login-button', 
            description: 'Click login button',
            waitFor: 'visible',
            isLastStep: false
          },
          { 
            id: "step-4", 
            action: 'assert', 
            selector: '#welcome-message', 
            value: 'Welcome!', 
            description: 'Verify welcome message',
            isLastStep: true
          }
        ]
        ```
        *Generated Playwright Code (example):*
        ```typescript
        import { test, expect } from '@playwright/test';

        test('Login Test', async ({ page }) => {
          // Navigate to login page
          await page.goto('https://example.com/login');

          // Enter username
          await page.type('#username', 'testuser');

          // Click login button
          await page.click('#login-button');

          // Verify welcome message
          expect(await page.innerText('#welcome-message')).toBe('Welcome!');
        });
        ```

*   **FR-TC-2: Framework-Agnostic TestStep Schema:**
    *   The `TestStep` interface (as defined in section 6.1 Common Interfaces) is designed to accommodate multiple test frameworks beyond Playwright.
    *   Each `TestStep` contains:
        *   Abstract representations of actions (navigation, input, assertion) that can be mapped to any framework
        *   Framework-neutral selectors where possible (CSS selectors preferred for compatibility)
        *   Sufficient context data to enable conversion to different frameworks
    *   The interface supports extension through optional properties for framework-specific features
    *   Example of framework-agnostic design: See the Unified TestStep interface in section 6.1 Common Interfaces.

### 5.4. Playwright Runner

*   **FR-PR-1: Test Execution:**
    *   Receive the generated Playwright test code (string).
    *   Execute the code using the standard Playwright test runner.
    *   Report the test results (pass/fail, along with standard Playwright output).

## 6. Module Interfaces and API Specifications

### 6.1. Common Interfaces

*   **Base Options:**
    ```typescript
    interface CommonOptions {
      timeoutMs?: number;
      retryCount?: number;
    }
    ```

*   **Error Information:**
    ```typescript
    interface ErrorInfo {
      step?: number;
      message: string;
      action?: string;
      selector?: string;
      screenshot?: string; // Base64 encoded
      domSnapshot?: any;
      stack?: string;
      context?: any;
    }
    ```

*   **Operation Result:**
    ```typescript
    interface OperationResult {
      success: boolean;
      executionTimeMs: number; // Execution time in milliseconds
      error?: ErrorInfo;
    }
    ```

*   **Unified TestStep:**
    ```typescript
    interface TestStep {
      // Core identification
      id: string; // Unique identifier for the step
      description: string; // Human-readable description
      
      // Action information - single source of truth for what operation to perform
      action: 'navigate' | 'input' | 'click' | 'assert' | 'wait' | 'select' | 'hover' | 'keypress';
      
      // Targeting
      selector?: string; // CSS selector or other locator strategy
      
      // Action details
      value?: any; // Action value (text to type, expected assertion value, etc.)
      timeout?: number; // Step-specific timeout
      
      // Waiting
      waitFor?: 'visible' | 'networkidle' | 'domcontentloaded' | 'load';
      
      // Control flow
      isLastStep: boolean;
      
      // Context for debugging and self-healing
      context?: {
        mcpSnapshot?: any; // Page snapshot from MCP Playwright
        domState?: any; // DOM state at the time of execution
        attemptCount?: number; // Number of attempts made
        errors?: Array<{
          message: string;
          timestamp: string;
        }>;
      };
      
      // Simple retry strategy
      maxRetries?: number;
    }
    ```

### 6.2. Scenario Parser API

*   **Input:**
    ```typescript
    interface TestScenario {
      url: string;
      actions: string[];
      options?: CommonOptions & {
        // Additional parser-specific options
        maxSteps?: number;
      };
    }
    ```

*   **Output:**
    ```typescript
    interface ParserResult extends OperationResult {
      testSteps: TestStep[];
      status: 'success' | 'partial' | 'failed';
      errors?: ErrorInfo[];
    }
    ```

*   **Methods:**
    ```typescript
    interface ScenarioParser {
      parse(scenario: TestScenario): Promise<ParserResult>;
      validateScenario(scenario: TestScenario): boolean;
      getLastExecutionSnapshot(): any | null;
    }
    ```

### 6.3. Marathon Execution Engine API

*   **Input:**
    ```typescript
    interface ExecutionRequest {
      testSteps: TestStep[];
      options?: CommonOptions & {
        securityOptions?: {
          allowedActions?: string[];
        };
      };
    }
    ```