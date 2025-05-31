import { createLogger } from '@common/logger';
import { IntermediateStep, TestStepAction } from '@scenario-parser/interfaces';
import { LLMPromptPayload } from '../prompt-builder';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatVertexAI } from '@langchain/google-vertexai';

// LLM configuration interface
export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'azure';
  model?: string;
  temperature?: number;
  apiKey?: string;
  maxTokens?: number;
}

const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
  temperature: 0.1,
  maxTokens: 1000,
};

// Add interface for function call structure with proper types
interface FunctionCallArguments {
  actionType: string;
  description: string;
  targetSelector?: string;
  inputValue?: string | number | boolean;
  url?: string;
  isAmbiguous?: boolean;
  confidenceScore?: number;
  error?: string;
}

interface FunctionCall {
  name: string;
  arguments: FunctionCallArguments;
}

// Translates natural language actions into structured IntermediateStep objects using LLM function calling
export class NLToActionTranslatorLogic {
  private readonly logger = createLogger(NLToActionTranslatorLogic.name);
  private llm: ChatOpenAI | ChatAnthropic | ChatVertexAI;
  private config: LLMConfig;

  constructor(config?: Partial<LLMConfig>) {
    this.config = { ...DEFAULT_LLM_CONFIG, ...config };
    this.llm = this.initializeLLM();
  }

  // Initialize the LLM based on provider
  private initializeLLM(): ChatOpenAI | ChatAnthropic | ChatVertexAI {
    const { provider, model, temperature, apiKey, maxTokens } = this.config;

    switch (provider) {
      case 'openai':
        return new ChatOpenAI({
          modelName: model || 'gpt-4-turbo-preview',
          temperature,
          openAIApiKey: apiKey || process.env.OPENAI_API_KEY,
          maxTokens,
        });

      case 'anthropic':
        return new ChatAnthropic({
          model: model || 'claude-3-opus-20240229',
          temperature,
          anthropicApiKey: apiKey || process.env.ANTHROPIC_API_KEY,
          maxTokens,
        });

      case 'google':
        return new ChatVertexAI({
          model: model || 'gemini-pro',
          temperature,
          maxOutputTokens: maxTokens,
        });

      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }

  // Main translation method
  async translateLogic(promptPayload: LLMPromptPayload): Promise<{ step?: IntermediateStep; error?: string }> {
    try {
      this.logger.info('Starting natural language to action translation', {
        provider: this.config.provider,
        model: this.config.model,
      });

      // Prepare messages for the LLM
      const messages = [new SystemMessage(promptPayload.systemPrompt), new HumanMessage(promptPayload.userPrompt)];

      // Bind the tools to the LLM for function calling
      const llmWithTools = this.llm.bindTools(promptPayload.functions);

      // Invoke the LLM
      const response = await llmWithTools.invoke(messages);

      // Extract the function call from the response
      const functionCall = this.extractFunctionCall(response);

      if (!functionCall) {
        const errorMsg = 'No function call found in LLM response';
        this.logger.error(errorMsg);
        return { error: errorMsg };
      }

      // Parse and validate the IntermediateStep
      const intermediateStep = this.parseIntermediateStep(functionCall);

      if (!intermediateStep) {
        const errorMsg = 'Failed to parse IntermediateStep from function call';
        this.logger.error(errorMsg, { functionCall });
        return { error: errorMsg };
      }

      this.logger.info('Successfully translated natural language to action', {
        actionType: intermediateStep.actionType,
        targetSelector: intermediateStep.targetSelector,
        confidenceScore: intermediateStep.confidenceScore,
      });

      return { step: intermediateStep };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during translation';
      this.logger.error('Error during LLM translation', { error: errorMessage });
      return { error: errorMessage };
    }
  }

  // Extract function call from LLM response
  private extractFunctionCall(response: AIMessage): FunctionCall | null {
    // Check if the response has tool_calls
    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolCall = response.tool_calls[0];
      return {
        name: toolCall.name,
        arguments: toolCall.args as FunctionCallArguments,
      };
    }

    return null;
  }

  // Parse the function call arguments into IntermediateStep
  private parseIntermediateStep(functionCall: FunctionCall): IntermediateStep | null {
    try {
      const args = functionCall.arguments;

      // Validate required fields
      if (!args.actionType || !args.description) {
        this.logger.error('Missing required fields in function call arguments', { args });
        return null;
      }

      // Validate actionType
      const validActionTypes = ['click', 'input', 'navigate', 'assert', 'unknown'];
      if (!validActionTypes.includes(args.actionType)) {
        this.logger.error('Invalid actionType in function call arguments', { actionType: args.actionType });
        return null;
      }

      // Construct IntermediateStep
      const intermediateStep: IntermediateStep = {
        actionType: args.actionType as TestStepAction | 'unknown',
        description: args.description,
      };

      // Add optional fields if present
      if (args.targetSelector !== undefined) {
        intermediateStep.targetSelector = args.targetSelector;
      }
      if (args.inputValue !== undefined) {
        intermediateStep.inputValue = args.inputValue;
      }
      if (args.url !== undefined) {
        intermediateStep.url = args.url;
      }
      if (args.isAmbiguous !== undefined) {
        intermediateStep.isAmbiguous = args.isAmbiguous;
      }
      if (args.confidenceScore !== undefined) {
        intermediateStep.confidenceScore = args.confidenceScore;
      }
      if (args.error !== undefined) {
        intermediateStep.error = args.error;
      }

      return intermediateStep;
    } catch (error) {
      this.logger.error('Error parsing IntermediateStep', { error, functionCall });
      return null;
    }
  }

  // Update LLM configuration
  updateConfig(config: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...config };
    this.llm = this.initializeLLM();
    this.logger.info('Updated LLM configuration', { config: this.config });
  }
}
