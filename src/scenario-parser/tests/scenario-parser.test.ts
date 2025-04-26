import { TestScenario } from '../../common/types';
import { ScenarioParser } from '../index';

describe('ScenarioParser', () => {
  let parser: ScenarioParser;

  beforeEach(() => {
    parser = new ScenarioParser();
  });

  describe('validateScenario', () => {
    it('should return true for valid scenarios', () => {
      const validScenario: TestScenario = {
        url: 'https://example.com',
        actions: ['Navigate to home page', 'Click login button'],
      };

      expect(parser.validateScenario(validScenario)).toBe(true);
    });

    it('should return false for scenarios without URL', () => {
      const invalidScenario = {
        actions: ['Navigate to home page'],
      } as TestScenario;

      expect(parser.validateScenario(invalidScenario)).toBe(false);
    });

    it('should return false for scenarios without actions', () => {
      const invalidScenario = {
        url: 'https://example.com',
      } as TestScenario;

      expect(parser.validateScenario(invalidScenario)).toBe(false);
    });

    it('should return false for scenarios with empty actions array', () => {
      const invalidScenario: TestScenario = {
        url: 'https://example.com',
        actions: [],
      };

      expect(parser.validateScenario(invalidScenario)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should return a successful result for valid scenarios', async () => {
      const validScenario: TestScenario = {
        url: 'https://example.com',
        actions: ['Navigate to home page', 'Click login button'],
      };

      const result = await parser.parse(validScenario);

      expect(result.success).toBe(true);
      expect(result.status).toBe('success');
    });
  });
});
