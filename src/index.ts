import dotenv from 'dotenv';
import logger from './common/logger';

// Load environment variables
dotenv.config();

/**
 * Main entry point for the AI-powered test generation system.
 * This file serves as a simple validation that TypeScript can be run in dev mode.
 */
function main() {
  logger.info('AI Test Generator is starting up...');
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info('TypeScript development mode is working correctly!');

  // Display a simple message about the system's modules
  logger.info('Available modules:');
  logger.info('- Scenario Parser: Transforms human-readable scenarios into TestStep objects');
  logger.info('- Marathon Engine: Executes TestStep objects in a secure environment');
  logger.info('- Test Converter: Converts TestStep objects to Playwright test code');
  logger.info('- Playwright Runner: Executes the generated Playwright tests');
}

// Run the main function
main();
