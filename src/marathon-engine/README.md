# Marathon Execution Engine Module

## Overview

The Marathon Execution Engine is responsible for executing `TestStep` objects using Playwright in a secure environment. It's the component that interacts directly with the web application under test and provides feedback for self-correction.

## Responsibilities

- Execute `TestStep` objects by mapping them to Playwright API calls
- Ensure secure execution within a controlled environment
- Capture detailed error information when execution fails
- Report success/failure for each test step
- Provide snapshots and context information for debugging

## API

The Marathon Execution Engine exposes the following API:

```typescript
interface MarathonEngine {
  execute(request: ExecutionRequest): Promise<OperationResult>;
  getLastExecutionContext(): any | null;
}
```

## Flow

1. Receive a collection of `TestStep` objects
2. Create a new, isolated Playwright browser context
3. Sequentially execute each `TestStep` by mapping it to the corresponding Playwright API call
4. For each step, validate the outcome and capture state information
5. If an error occurs, capture detailed error context
6. Return the overall execution result with timing information

## Example Usage

```typescript
const engine = new MarathonEngine();
const request = {
  testSteps: [
    { 
      id: 'step-1', 
      action: 'navigate', 
      value: 'https://example.com', 
      description: 'Navigate to home page',
      isLastStep: false
    },
    { 
      id: 'step-2', 
      action: 'click', 
      selector: '#login-button', 
      description: 'Click login button',
      isLastStep: true
    }
  ]
};

const result = await engine.execute(request);
```

## Security Features

The Marathon Engine implements various security measures:
- URL navigation restriction to prevent access to unauthorized domains
- Action allowlisting to limit what operations can be performed
- Input sanitization to prevent injection attacks
- Execution timeouts to prevent long-running operations 