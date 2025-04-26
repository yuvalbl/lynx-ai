# TestStep to Playwright Code Converter Module

## Overview

The TestStep to Playwright Code Converter is responsible for converting validated `TestStep` objects into executable Playwright test code in TypeScript format. It generates clean, maintainable, and self-documenting test scripts.

## Responsibilities

- Receive validated collections of `TestStep` objects
- Generate valid Playwright test code in TypeScript
- Include appropriate imports and test structure
- Add descriptive comments based on the test step descriptions
- Create proper assertions for verification steps
- Produce clean, well-formatted code that follows best practices

## API

The Test Converter exposes the following API:

```typescript
interface TestConverter {
  convert(testSteps: TestStep[]): Promise<string>;
  getLastConvertedCode(): string | null;
}
```

## Flow

1. Receive a collection of validated `TestStep` objects
2. Group related steps for improved organization
3. Generate imports and test structure
4. Map each `TestStep` to the corresponding Playwright API call
5. Add appropriate comments based on the test step descriptions
6. Add proper assertions for verification steps
7. Return the generated code as a string

## Example Usage

```typescript
const converter = new TestConverter();
const testSteps = [
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
    isLastStep: false
  },
  {
    id: 'step-3',
    action: 'assert',
    selector: '#welcome-message',
    value: 'Welcome!',
    description: 'Verify welcome message',
    isLastStep: true
  }
];

const playwriteCode = await converter.convert(testSteps);
```

## Generated Code Quality

The converter focuses on producing high-quality, maintainable code:
- Includes proper imports
- Uses TypeScript for type safety
- Follows Playwright best practices
- Adds descriptive comments
- Uses consistent formatting
- Includes proper error handling and assertions 