import { TestScenario, ValidationError } from '@scenario-parser/interfaces';
import { validateScenarioLogic } from './validator.logic';

describe('Scenario Input Validation', () => {
  let validScenario: TestScenario;

  beforeEach(() => {
    // Reset to a valid scenario before each test
    validScenario = {
      url: 'https://example.com',
      actions: ['Click button "Login"', 'Enter "testuser" into #username'],
    };
  });

  test('should pass for a valid scenario', () => {
    expect(() => validateScenarioLogic(validScenario)).not.toThrow();
  });

  test('should throw if scenario is null or undefined', () => {
    // @ts-expect-error - Testing invalid input
    expect(() => validateScenarioLogic(null)).toThrow(
      'Scenario input cannot be null or undefined.',
    );
    // @ts-expect-error - Testing invalid input
    expect(() => validateScenarioLogic(undefined)).toThrow(
      'Scenario input cannot be null or undefined.',
    );
  });

  // URL Validations
  test('should throw if url is missing', () => {
    // @ts-expect-error - Testing missing property
    delete validScenario.url;
    expect(() => validateScenarioLogic(validScenario)).toThrow(
      'Scenario must include a valid non-empty starting URL.',
    );
  });

  test('should throw if url is not a string', () => {
    // @ts-expect-error - Testing invalid type
    validScenario.url = 123;
    expect(() => validateScenarioLogic(validScenario)).toThrow(
      'Scenario must include a valid non-empty starting URL.',
    );
  });

  test('should throw if url is an empty string', () => {
    validScenario.url = '';
    expect(() => validateScenarioLogic(validScenario)).toThrow(
      'Scenario must include a valid non-empty starting URL.',
    );
  });

  test('should throw if url is not a valid URL format', () => {
    validScenario.url = 'not-a-valid-url';
    expect(() => validateScenarioLogic(validScenario)).toThrow(
      new ValidationError(`Invalid URL format: ${validScenario.url}`),
    );
    validScenario.url = 'http://'; // Incomplete
    expect(() => validateScenarioLogic(validScenario)).toThrow(
      new ValidationError(`Invalid URL format: ${validScenario.url}`),
    );
  });

  // Actions Validations
  test('should throw if actions are missing', () => {
    // @ts-expect-error - Testing missing property
    delete validScenario.actions;
    expect(() => validateScenarioLogic(validScenario)).toThrow(
      'Scenario must include at least one action string in the actions array.',
    );
  });

  test('should throw if actions is not an array', () => {
    // @ts-expect-error - Testing invalid type
    validScenario.actions = 'not-an-array';
    expect(() => validateScenarioLogic(validScenario)).toThrow(
      'Scenario must include at least one action string in the actions array.',
    );
  });

  test('should throw if actions array is empty', () => {
    validScenario.actions = [];
    expect(() => validateScenarioLogic(validScenario)).toThrow(
      'Scenario must include at least one action string in the actions array.',
    );
  });

  test('should throw if any action is not a string', () => {
    // @ts-expect-error - Testing invalid array element type
    validScenario.actions.push(123);
    expect(() => validateScenarioLogic(validScenario)).toThrow(
      'Action at index 2 must be a non-empty string.',
    );
  });

  test('should throw if any action is an empty string', () => {
    validScenario.actions.push('');
    expect(() => validateScenarioLogic(validScenario)).toThrow(
      'Action at index 2 must be a non-empty string.',
    );
  });

  test('should throw if any action is only whitespace', () => {
    validScenario.actions.push('   ');
    expect(() => validateScenarioLogic(validScenario)).toThrow(
      'Action at index 2 must be a non-empty string.',
    );
  });
});
