import { NLToActionTranslatorLogic } from './nl-translator.logic';
import { LLMPromptPayload } from '../prompt-builder';
import { jest } from '@jest/globals';
import { AIMessage } from '@langchain/core/messages';

// Mock the LangChain modules
jest.mock('@langchain/openai');
jest.mock('@langchain/anthropic');
jest.mock('@langchain/google-vertexai');

describe('NLToActionTranslatorLogic', () => {
  let translator: NLToActionTranslatorLogic;
  let mockInvoke: any;
  let mockBindTools: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockInvoke = jest.fn();
    mockBindTools = jest.fn();
    mockBindTools.mockReturnValue({ invoke: mockInvoke });
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      translator = new NLToActionTranslatorLogic();
      expect(translator).toBeDefined();
    });

    it('should initialize with custom config', () => {
      translator = new NLToActionTranslatorLogic({
        provider: 'anthropic',
        model: 'claude-3-sonnet',
        temperature: 0.5,
      });
      expect(translator).toBeDefined();
    });

    it('should throw error for unsupported provider', () => {
      expect(() => {
        new NLToActionTranslatorLogic({
          provider: 'azure' as any, // Azure not implemented yet
        });
      }).toThrow('Unsupported LLM provider: azure');
    });
  });

  describe('translateLogic', () => {
    const mockPromptPayload: LLMPromptPayload = {
      systemPrompt: 'You are a web automation assistant...',
      userPrompt: 'Click the submit button',
      functions: [
        {
          name: 'perform_browser_action',
          description: 'Perform a browser action',
          parameters: {
            type: 'object',
            properties: {
              actionType: { type: 'string', enum: ['click', 'input', 'navigate', 'assert', 'unknown'] },
              targetSelector: { type: 'string' },
              description: { type: 'string' },
            },
            required: ['actionType', 'description'],
          },
        },
      ],
    };

    beforeEach(() => {
      translator = new NLToActionTranslatorLogic({ provider: 'openai' });
      // Mock the LLM with simpler approach
      (translator as any).llm = { bindTools: mockBindTools };
    });

    it('should successfully translate a click action', async () => {
      // Mock successful LLM response with tool call
      const mockResponse = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'perform_browser_action',
            args: {
              actionType: 'click',
              targetSelector: 'highlightIndex=5',
              description: 'Click the submit button',
              confidenceScore: 0.95,
            },
            id: 'test-id',
          },
        ],
      });

      (mockInvoke as any).mockResolvedValue(mockResponse);

      const result = await translator.translateLogic(mockPromptPayload);

      expect(result.step).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.step?.actionType).toBe('click');
      expect(result.step?.targetSelector).toBe('highlightIndex=5');
      expect(result.step?.description).toBe('Click the submit button');
      expect(result.step?.confidenceScore).toBe(0.95);
    });

    it('should handle input action with value', async () => {
      const mockResponse = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'perform_browser_action',
            args: {
              actionType: 'input',
              targetSelector: 'highlightIndex=3',
              inputValue: 'John Doe',
              description: 'Enter name in the input field',
            },
            id: 'test-id',
          },
        ],
      });

      (mockInvoke as any).mockResolvedValue(mockResponse);

      const result = await translator.translateLogic(mockPromptPayload);

      expect(result.step).toBeDefined();
      expect(result.step?.actionType).toBe('input');
      expect(result.step?.inputValue).toBe('John Doe');
    });

    it('should handle navigate action', async () => {
      const mockResponse = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'perform_browser_action',
            args: {
              actionType: 'navigate',
              url: 'https://example.com',
              description: 'Navigate to example.com',
            },
            id: 'test-id',
          },
        ],
      });

      (mockInvoke as any).mockResolvedValue(mockResponse);

      const result = await translator.translateLogic(mockPromptPayload);

      expect(result.step).toBeDefined();
      expect(result.step?.actionType).toBe('navigate');
      expect(result.step?.url).toBe('https://example.com');
    });

    it('should handle ambiguous action', async () => {
      const mockResponse = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'perform_browser_action',
            args: {
              actionType: 'unknown',
              description: 'User action is unclear',
              isAmbiguous: true,
              error: 'Multiple buttons found, unclear which one to click',
            },
            id: 'test-id',
          },
        ],
      });

      (mockInvoke as any).mockResolvedValue(mockResponse);

      const result = await translator.translateLogic(mockPromptPayload);

      expect(result.step).toBeDefined();
      expect(result.step?.actionType).toBe('unknown');
      expect(result.step?.isAmbiguous).toBe(true);
      expect(result.step?.error).toContain('Multiple buttons found');
    });

    it('should handle missing function call in response', async () => {
      const mockResponse = new AIMessage({
        content: 'Some text response without function call',
      });

      (mockInvoke as any).mockResolvedValue(mockResponse);

      const result = await translator.translateLogic(mockPromptPayload);

      expect(result.step).toBeUndefined();
      expect(result.error).toBe('No function call found in LLM response');
    });

    it('should handle invalid function call arguments', async () => {
      const mockResponse = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'perform_browser_action',
            args: {}, // Empty args object instead of null
            id: 'test-id',
          },
        ],
      });

      (mockInvoke as any).mockResolvedValue(mockResponse);

      const result = await translator.translateLogic(mockPromptPayload);

      expect(result.step).toBeUndefined();
      expect(result.error).toBe('Failed to parse IntermediateStep from function call');
    });

    it('should handle missing actionType', async () => {
      const mockResponse = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'perform_browser_action',
            args: {
              description: 'Click the submit button',
              // Missing actionType
            },
            id: 'test-id',
          },
        ],
      });

      (mockInvoke as any).mockResolvedValue(mockResponse);

      const result = await translator.translateLogic(mockPromptPayload);

      expect(result.step).toBeUndefined();
      expect(result.error).toBe('Failed to parse IntermediateStep from function call');
    });

    it('should handle missing description', async () => {
      const mockResponse = new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'perform_browser_action',
            args: {
              actionType: 'click',
              // Missing description
            },
            id: 'test-id',
          },
        ],
      });

      (mockInvoke as any).mockResolvedValue(mockResponse);

      const result = await translator.translateLogic(mockPromptPayload);

      expect(result.step).toBeUndefined();
      expect(result.error).toBe('Failed to parse IntermediateStep from function call');
    });

    it('should handle LLM invocation errors', async () => {
      (mockInvoke as any).mockRejectedValue(new Error('API rate limit exceeded'));

      const result = await translator.translateLogic(mockPromptPayload);

      expect(result.step).toBeUndefined();
      expect(result.error).toBe('API rate limit exceeded');
    });
  });

  describe('updateConfig', () => {
    it('should update configuration and reinitialize LLM', () => {
      translator = new NLToActionTranslatorLogic({ provider: 'openai' });

      translator.updateConfig({ provider: 'anthropic', temperature: 0.7 });

      expect((translator as any).config.provider).toBe('anthropic');
      expect((translator as any).config.temperature).toBe(0.7);
    });
  });
});
