# AI-Powered End-to-End Test Generation System

A modular system for automatically generating and executing end-to-end tests using TypeScript, Playwright, and MCP Playwright Server. The system takes human-readable test scenarios as input and produces executable Playwright test code.

## 🚀 Features

- **Natural Language Processing**: Convert human-readable test scenarios into structured test steps
- **AI-Powered Test Generation**: Leverage AI to create robust and maintainable tests
- **Self-Healing Tests**: Automatic correction of test failures
- **Secure Execution**: Safe execution of generated tests
- **Modular Architecture**: Clean separation of concerns with well-defined interfaces

## 🏗️ Architecture

The system consists of four main modules:

1. **Scenario Parser**: Transforms human-readable test scenarios into structured `TestStep` objects
2. **Marathon Execution Engine**: Executes `TestStep` objects in a secure environment
3. **TestStep to Playwright Code Converter**: Converts `TestStep` objects into Playwright test code
4. **Playwright Runner**: Executes the generated Playwright tests and reports results

## 🛠️ Technology Stack

- TypeScript 4.x+
- Playwright
- MCP Playwright Server
- Jest for testing
- Winston for logging
- ESLint for code quality
- Prettier for code formatting

## 📋 Prerequisites

- Node.js 16.x or higher
- npm or yarn
- Access to MCP Playwright Server

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/ai-test-generator.git
   cd ai-test-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file with your configuration values.

## 🏁 Getting Started

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Run tests:
   ```bash
   npm test
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## 📖 Usage Example

```typescript
import { ScenarioParser } from './src/scenario-parser';
import { MarathonEngine } from './src/marathon-engine';
import { TestConverter } from './src/test-converter';
import { PlaywrightRunner } from './src/playwright-runner';

async function generateAndRunTest() {
  // 1. Parse the scenario
  const parser = new ScenarioParser();
  const scenario = {
    url: 'https://example.com',
    actions: [
      'Navigate to the login page',
      'Enter "testuser" in the username field',
      'Enter "password123" in the password field',
      'Click the login button',
      'Verify that the welcome message is displayed'
    ]
  };
  
  const parserResult = await parser.parse(scenario);
  
  // 2. Execute the test steps
  const engine = new MarathonEngine();
  const executionResult = await engine.execute({
    testSteps: parserResult.testSteps
  });
  
  if (!executionResult.success) {
    console.error('Test execution failed:', executionResult.error);
    return;
  }
  
  // 3. Convert to Playwright code
  const converter = new TestConverter();
  const playwrightCode = await converter.convert(parserResult.testSteps);
  
  // 4. Run the generated test
  const runner = new PlaywrightRunner();
  const runnerResult = await runner.execute(playwrightCode, {
    browser: 'chromium',
    headless: true
  });
  
  console.log('Test results:', runnerResult);
}
```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## 📝 Code Quality

Lint your code:

```bash
npm run lint
```

Fix linting issues:

```bash
npm run lint:fix
```

Format your code:

```bash
npm run format
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 