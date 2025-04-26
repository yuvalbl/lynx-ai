# Playwright Runner Module

## Overview

The Playwright Runner is responsible for executing the generated Playwright test code and reporting the results. It's the final stage in the AI test generation pipeline.

## Responsibilities

- Execute the generated Playwright test code
- Report detailed test results, including pass/fail status
- Capture screenshots and videos of test execution
- Provide detailed logs for debugging
- Support different execution environments (local, CI/CD)

## API

The Playwright Runner exposes the following API:

```typescript
interface PlaywrightRunner {
  execute(code: string, options?: PlaywrightRunnerOptions): Promise<RunnerResult>;
  getLastExecutionResults(): RunnerResult | null;
}

interface PlaywrightRunnerOptions {
  browser?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  timeout?: number;
  recordVideo?: boolean;
  screenshotOnFailure?: boolean;
  traceEnabled?: boolean;
}

interface RunnerResult {
  success: boolean;
  executionTimeMs: number;
  testResults: {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
  };
  errors?: Array<{
    message: string;
    stack?: string;
    screenshot?: string;
  }>;
  artifacts?: {
    videoPath?: string;
    tracePath?: string;
    screenshotPaths?: string[];
  };
}
```

## Flow

1. Receive the generated Playwright test code as a string
2. Create a temporary test file with the code
3. Configure Playwright to run the test with the specified options
4. Execute the test using the standard Playwright test runner
5. Collect test results, including pass/fail status and execution logs
6. Capture any artifacts (screenshots, videos, traces)
7. Clean up temporary files
8. Return the detailed test results

## Example Usage

```typescript
const runner = new PlaywrightRunner();
const testCode = `
  import { test, expect } from '@playwright/test';

  test('Login Test', async ({ page }) => {
    await page.goto('https://example.com/login');
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'password123');
    await page.click('#login-button');
    expect(await page.locator('#welcome-message')).toBeVisible();
  });
`;

const options = {
  browser: 'chromium',
  headless: true,
  recordVideo: true,
  screenshotOnFailure: true
};

const result = await runner.execute(testCode, options);
```

## Execution Environments

The runner supports various execution environments:
- Local development
- Continuous Integration (CI)
- Continuous Deployment (CD)
- Docker containers
- Cloud-based execution 