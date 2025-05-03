# Tech Context

Technologies used, development setup, technical constraints, dependencies.

## Core Technologies

*   **Language:** TypeScript
*   **Browser Automation:** Playwright (using direct integration, not MCP)
*   **Testing Framework:** Jest (with `ts-jest`)
*   **Runtime:** Node.js
*   **Logging:** Winston

## Key Dependencies

*   `playwright`: Core browser automation library (Production dependency).
*   `@playwright/test`: Test runner and framework components (Production dependency, required for type compatibility and potentially test execution).
*   `winston`: Logging library.
*   `jest`, `ts-jest`, `@types/jest`: Testing dependencies (Dev dependencies).
*   `typescript`, `ts-node`, `ts-node-dev`: TypeScript compilation and execution (Dev dependencies).
*   `eslint`, `prettier`: Linting and formatting (Dev dependencies).

## Setup & Constraints

*   Requires Node.js and npm installed.
*   Requires Playwright browsers to be installed (`npx playwright install`).
*   Development relies on `ts-node-dev` for live reloading. 