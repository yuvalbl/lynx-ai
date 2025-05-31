import { createLogger } from '@common/logger';
import { SerializableDOMNode, TabInfo, BrowserState } from '@scenario-parser/interfaces';
import { HistoryTreeProcessor } from '../dom-processor/processors';
import systemPromptTemplate from './templates/system-prompt';
import userPromptTemplate from './templates/user-prompt';

// Define the structure for LLM prompt payload
export interface LLMPromptPayload {
  systemPrompt: string;
  userPrompt: string;
  functions: FunctionDefinition[];
}

// Function definition for LangChain function calling
export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<
      string,
      {
        type: string | string[];
        enum?: string[];
        minimum?: number;
        maximum?: number;
        description?: string;
      }
    >;
    required: string[];
  };
}

// Formats DOM trees and user actions into LLM-ready prompts following browser-use patterns
export class PromptBuilderService {
  private static readonly logger = createLogger(PromptBuilderService.name);

  constructor() {
    // No need for async template loading anymore
  }

  // Main method to format DOM for LLM following browser-use pattern
  formatDomForLLM(domTree: SerializableDOMNode, browserState?: BrowserState): string {
    // Follow browser-use format exactly
    const sections: string[] = [];

    // Add current URL and tabs (browser-use format)
    if (browserState) {
      sections.push(`Current url: ${browserState.url}`);

      // Add tab information if available
      if (browserState.tabs && browserState.tabs.length > 0) {
        sections.push('Available tabs:');
        const tabsStr = browserState.tabs.map((tab) => `{'url': '${tab.url}', 'title': '${tab.title}'}`).join(', ');
        sections.push(`[${tabsStr}]`);
      }
    }

    // Add interactive elements in browser-use format
    const interactiveElementsStr = this.clickableElementsToString(domTree);
    sections.push('Interactive elements from top layer of the current page inside the viewport:');
    sections.push(interactiveElementsStr);

    return sections.join('\n');
  }

  // Replicate browser-use's clickable_elements_to_string logic
  private clickableElementsToString(domTree: SerializableDOMNode): string {
    const result: string[] = [];
    result.push('[Start of page]');

    // Process the DOM tree following browser-use logic
    this.processNodeForText(domTree, result, new Set());

    result.push('[End of page]');
    return result.join('\n');
  }

  // Process node for text inclusion following browser-use rules
  private processNodeForText(node: SerializableDOMNode, result: string[], processedHighlights: Set<number>): void {
    // Rule 1: Text nodes without highlighted parents
    if (node.tag === '#text') {
      const text = node.text?.trim();
      if (text && text.length > 0 && this.shouldIncludeTextNode(node)) {
        result.push(text);
      }
      return;
    }

    // Rule 2: Interactive elements with highlight index
    if (
      node.highlightIndex !== undefined &&
      node.isInteractive &&
      node.isTopElement &&
      !processedHighlights.has(node.highlightIndex)
    ) {
      processedHighlights.add(node.highlightIndex);

      // Format interactive element in browser-use style
      const elementStr = this.formatInteractiveElement(node);
      result.push(elementStr);

      // In browser-use, we don't add separate text content after interactive elements
      // The text is already included in the formatInteractiveElement call
      return;
    }

    // Rule 3: Process children for non-interactive visible elements
    if (node.isVisible && node.isTopElement && node.highlightIndex === undefined) {
      for (const child of node.children) {
        this.processNodeForText(child, result, processedHighlights);
      }
    }
  }

  // Check if text node should be included (browser-use logic)
  private shouldIncludeTextNode(textNode: SerializableDOMNode): boolean {
    // Text node should be included if:
    // 1. It doesn't have a parent with highlightIndex
    // 2. Its parent is visible and top element
    let parent = textNode.parent;
    while (parent) {
      if (parent.highlightIndex !== undefined) {
        return false; // Has highlighted parent, will be included with that element
      }
      parent = parent.parent;
    }

    // Check if immediate parent is visible and top element
    const immediateParent = textNode.parent;
    return immediateParent ? Boolean(immediateParent.isVisible) && Boolean(immediateParent.isTopElement) : false;
  }

  // Format interactive element in browser-use style
  private formatInteractiveElement(node: SerializableDOMNode): string {
    let result = `[${node.highlightIndex}]<${node.tag}`;

    // Add key attributes (browser-use style)
    const keyAttrs = ['href', 'type', 'name', 'id', 'class', 'aria-label', 'placeholder'];
    const attrs: string[] = [];

    for (const attr of keyAttrs) {
      if (node.attributes[attr]) {
        attrs.push(`${attr}='${node.attributes[attr]}'`);
      }
    }

    if (attrs.length > 0) {
      result += ` ${attrs.join(' ')}`;
    }

    result += '>';

    // Add text content if available
    const textContent = this.getElementTextContent(node);
    if (textContent) {
      result += textContent;
    }

    result += ` />`;
    return result;
  }

  // Get all text content until next clickable element (browser-use logic)
  private getAllTextTillNextClickableElement(node: SerializableDOMNode): string {
    const textParts: string[] = [];

    const collectText = (n: SerializableDOMNode): boolean => {
      // Stop if we hit another highlighted element
      if (n !== node && n.highlightIndex !== undefined && n.isInteractive) {
        return false; // Stop collection
      }

      if (n.tag === '#text' && n.text) {
        const text = n.text.trim();
        if (text) {
          textParts.push(text);
        }
      }

      // Continue with children
      for (const child of n.children) {
        if (!collectText(child)) {
          return false; // Propagate stop signal
        }
      }

      return true; // Continue collection
    };

    collectText(node);
    return textParts.join(' ').trim();
  }

  // Get text content for an element (simplified)
  private getElementTextContent(node: SerializableDOMNode): string {
    const textParts: string[] = [];

    const collectText = (n: SerializableDOMNode, maxDepth = 2, currentDepth = 0) => {
      if (currentDepth > maxDepth) return;

      if (n.tag === '#text' && n.text) {
        textParts.push(n.text.trim());
      } else {
        for (const child of n.children) {
          collectText(child, maxDepth, currentDepth + 1);
        }
      }
    };

    collectText(node);
    const fullText = textParts.join(' ').trim();
    return fullText.length > 100 ? `${fullText.substring(0, 100)}...` : fullText;
  }

  // Enhanced createLlmPromptPayload following browser-use format
  createLlmPromptPayload(
    domTree: SerializableDOMNode,
    userAction: string,
    browserState?: BrowserState,
    _tabInfo?: TabInfo[],
  ): LLMPromptPayload {
    const systemPrompt = this.buildSystemPrompt();

    // Build user prompt using template
    const historyContext = this.getHistoryContext();
    const formattedDom = this.formatDomForLLM(domTree, browserState);
    const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const userPrompt = userPromptTemplate
      .replace(/\{\{userAction\}\}/g, userAction)
      .replace(/\{\{historyContext\}\}/g, historyContext || '')
      .replace(/\{\{formattedDom\}\}/g, formattedDom)
      .replace(/\{\{currentStep\}\}/g, '1')
      .replace(/\{\{totalSteps\}\}/g, '10')
      .replace(/\{\{currentDateTime\}\}/g, currentDateTime);

    return {
      systemPrompt,
      userPrompt,
      functions: this.getFunctionDefinitions(),
    };
  }

  // Get history context for LLM
  private getHistoryContext(): string {
    try {
      const historySize = HistoryTreeProcessor.getHistorySize();
      if (historySize.elements === 0) {
        return '';
      }

      // Get formatted history from the processor
      const historyFormatted = HistoryTreeProcessor.formatHistoryForLLM([]);

      if (historyFormatted) {
        return historyFormatted;
      }

      return '';
    } catch (error) {
      PromptBuilderService.logger.debug('Failed to get history context', { error });
      return '';
    }
  }

  // Build the system prompt for the LLM (enhanced for browser-use compatibility)
  private buildSystemPrompt(): string {
    return systemPromptTemplate;
  }

  // Get the function definition for IntermediateStep
  private getFunctionDefinitions(): FunctionDefinition[] {
    return [
      {
        name: 'perform_browser_action',
        description: "Perform a browser action based on the user's natural language request",
        parameters: {
          type: 'object',
          properties: {
            actionType: {
              type: 'string',
              enum: ['click', 'input', 'navigate', 'assert', 'unknown'],
              description: 'The type of action to perform',
            },
            targetSelector: {
              type: 'string',
              description:
                'For element interactions, use format "highlightIndex=N" where N is the element index from the DOM',
            },
            inputValue: {
              type: ['string', 'number', 'boolean'],
              description: 'The value to input (for input actions) or assert (for assert actions)',
            },
            url: {
              type: 'string',
              description: 'The URL to navigate to (for navigate actions)',
            },
            description: {
              type: 'string',
              description: 'The original user action description',
            },
            isAmbiguous: {
              type: 'boolean',
              description: 'Whether the action request is ambiguous or unclear',
            },
            confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Confidence level in the action interpretation (0-1)',
            },
            error: {
              type: 'string',
              description: 'Error message if action cannot be determined or is ambiguous',
            },
          },
          required: ['actionType', 'description', 'isAmbiguous', 'confidence'],
        },
      },
    ];
  }

  // Count total nodes in DOM tree
  private countNodes(node: SerializableDOMNode): number {
    let count = 1;
    for (const child of node.children) {
      count += this.countNodes(child);
    }
    return count;
  }
}
