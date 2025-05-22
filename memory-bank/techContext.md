# Tech Context

Technologies used, development setup, technical constraints, dependencies.

## Core Technologies

*   **Language:** TypeScript
*   **Browser Automation:** Playwright (using direct integration, not MCP)
*   **Testing Framework:** Jest (with `ts-jest`)
*   **Runtime:** Node.js
*   **Logging:** Winston
*   **DOM Processing:** Custom DOM tree builder (inspired by `browser-use`)

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
*   DOM processing is optimized but still requires careful performance management for complex pages.

## Coding Standards & Practices

*   **Imports:** Use scoped imports (e.g., `@common/logger`, `@scenario-parser/interfaces`) whenever possible, leveraging TypeScript path aliases defined in `tsconfig.json`.
*   **Third-Party Libraries:** Avoid adding new third-party libraries without explicit discussion and approval.
*   **Logging:** Utilize the project's standard Winston logger via the `createLogger` function in [`src/common/logger.ts`](mdc:src/common/logger.ts). Example usage can be seen in components like [`playwright-bridge.service.ts`](mdc:src/scenario-parser/components/playwright-bridge/playwright-bridge.service.ts) and [`dom-processor.service.ts`](mdc:src/scenario-parser/components/dom-processor/dom-processor.service.ts).
*   **Performance Optimization:** Use caching for expensive DOM operations, implement multi-pass algorithms where appropriate, and include performance metrics in debug mode.
*   **Linting & Formatting:** After creating or modifying files, run `npm run lint:fix` to automatically correct linting and formatting errors according to project standards (ESLint, Prettier). 