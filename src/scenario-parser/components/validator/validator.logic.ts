import { TestScenario, ValidationError } from '@scenario-parser/interfaces';

// Throws ValidationError on failure
export function validateScenarioLogic(scenario: TestScenario): void {
  if (!scenario) {
    throw new ValidationError('Scenario input cannot be null or undefined.');
  }

  if (typeof scenario.url !== 'string' || scenario.url.trim() === '') {
    throw new ValidationError('Scenario must include a valid non-empty starting URL.');
  }

  try {
    // Basic URL format check
    new URL(scenario.url);
  } catch (e) {
    throw new ValidationError(`Invalid URL format: ${scenario.url}`);
  }

  if (!Array.isArray(scenario.actions) || scenario.actions.length === 0) {
    throw new ValidationError('Scenario must include at least one action string in the actions array.');
  }

  for (let i = 0; i < scenario.actions.length; i++) {
    if (typeof scenario.actions[i] !== 'string' || scenario.actions[i].trim() === '') {
      throw new ValidationError(`Action at index ${i} must be a non-empty string.`);
    }
  }
}
