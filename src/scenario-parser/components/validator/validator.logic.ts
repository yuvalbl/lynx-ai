import { TestScenario } from '../../interfaces';

export function validateScenarioLogic(scenario: TestScenario): void {
  if (!scenario) {
    throw new Error('Scenario input cannot be null or undefined.');
  }

  // Validate URL
  if (!scenario.url || typeof scenario.url !== 'string') {
    throw new Error('Scenario "url" must be a non-empty string.');
  }
  try {
    // Basic URL format check
    new URL(scenario.url);
  } catch (e) {
    throw new Error(`Scenario "url" is not a valid URL: ${scenario.url}`);
  }

  // Validate Actions
  if (!scenario.actions || !Array.isArray(scenario.actions)) {
    throw new Error('Scenario "actions" must be an array.');
  }
  if (scenario.actions.length === 0) {
    throw new Error('Scenario "actions" array cannot be empty.');
  }
  for (let i = 0; i < scenario.actions.length; i++) {
    const action = scenario.actions[i];
    if (!action || typeof action !== 'string' || action.trim().length === 0) {
      throw new Error(`Action at index ${i} must be a non-empty string.`);
    }
  }
}
