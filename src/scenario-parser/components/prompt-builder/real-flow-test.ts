import { PromptBuilderService, LLMPromptPayload } from './prompt-builder.service';
import { DomProcessorService } from '../dom-processor/dom-processor.service';
import { PlaywrightBridgeService } from '../playwright-bridge/playwright-bridge.service';
import { BrowserState, SelectorMap, SerializableDOMNode } from '@scenario-parser/interfaces';

/**
 * Real Flow Test - Tests the complete pipeline using actual services
 *
 * This script demonstrates the full flow:
 * 1. Launch real browser
 * 2. Navigate to real webpage
 * 3. Extract real DOM using DomProcessorService
 * 4. Generate real prompt using PromptBuilderService
 * 5. Show the complete prompt that would be sent to LLM
 */
class RealFlowTest {
  private playwrightBridge: PlaywrightBridgeService;
  private domProcessor: DomProcessorService;
  private promptBuilder: PromptBuilderService;

  constructor() {
    // Initialize real services
    this.playwrightBridge = new PlaywrightBridgeService({
      launchOptions: {
        headless: false, // Set to true if you don't want to see the browser
      },
    });
    this.domProcessor = new DomProcessorService(this.playwrightBridge);
    this.promptBuilder = new PromptBuilderService();
  }

  async runCompleteFlow() {
    console.log('🚀 Starting Real Flow Test...\n');

    try {
      // Step 1: Initialize browser
      console.log('📦 Initializing browser...');
      await this.playwrightBridge.initialize();
      console.log('✅ Browser initialized\n');

      // Step 2: Navigate to real page
      const testUrl = 'https://example.com'; // Change this to any URL you want to test
      console.log(`🌐 Navigating to: ${testUrl}`);
      await this.playwrightBridge.navigateTo(testUrl);
      console.log('✅ Navigation complete\n');

      // Step 3: Extract real DOM
      console.log('🔍 Extracting DOM state...');
      const { domTree, selectorMap, browserState } = await this.domProcessor.getDomState({
        doHighlightElements: true,
        viewportExpansion: 100,
      });
      console.log(`✅ DOM extracted - Found ${Object.keys(selectorMap).length} interactive elements\n`);

      // Step 4: Generate prompt with real user action
      const userAction = 'Click on any link on this page'; // Change this to test different actions
      console.log(`🤖 Generating prompt for action: "${userAction}"`);

      const promptPayload = await this.promptBuilder.createLlmPromptPayload(domTree, userAction, browserState);
      console.log('✅ Prompt generated\n');

      // Step 5: Display results
      this.displayResults(promptPayload, browserState, selectorMap);
    } catch (error) {
      console.error('❌ Error in real flow test:', error);
    } finally {
      // Cleanup
      console.log('\n🧹 Cleaning up...');
      await this.playwrightBridge.close();
      console.log('✅ Cleanup complete');
    }
  }

  private displayResults(promptPayload: LLMPromptPayload, browserState: BrowserState, selectorMap: SelectorMap) {
    console.log('='.repeat(100));
    console.log('📋 COMPLETE PROMPT ANALYSIS');
    console.log('='.repeat(100));

    // Browser context
    console.log('\n🌐 BROWSER CONTEXT:');
    console.log(`URL: ${browserState.url}`);
    console.log(`Title: ${browserState.title}`);
    console.log(`Interactive Elements: ${Object.keys(selectorMap).length}`);
    console.log(`Viewport: ${browserState.viewportInfo?.width}x${browserState.viewportInfo?.height}`);

    // Interactive elements summary
    if (Object.keys(selectorMap).length > 0) {
      console.log('\n🎯 INTERACTIVE ELEMENTS FOUND:');
      Object.entries(selectorMap).forEach(([index, element]: [string, SerializableDOMNode]) => {
        console.log(
          `  [${index}] <${element.tag}> ${element.attributes?.id ? `id="${element.attributes.id}"` : ''} ${element.attributes?.class ? `class="${element.attributes.class}"` : ''}`,
        );
      });
    }

    // System prompt
    console.log('\n🤖 SYSTEM PROMPT:');
    console.log('-'.repeat(80));
    console.log(promptPayload.systemPrompt);

    // User prompt
    console.log('\n👤 USER PROMPT:');
    console.log('-'.repeat(80));
    console.log(promptPayload.userPrompt);

    // Function schema
    console.log('\n⚙️  FUNCTION SCHEMA:');
    console.log('-'.repeat(80));
    console.log(JSON.stringify(promptPayload.functions[0], null, 2));

    console.log('\n' + '='.repeat(100));
    console.log('📊 ANALYSIS COMPLETE');
    console.log('='.repeat(100));
  }

  // Test multiple scenarios
  async runMultipleScenarios() {
    const scenarios = [
      {
        url: 'https://example.com',
        action: 'Click on the "More information..." link',
      },
      {
        url: 'https://httpbin.org/forms/post',
        action: 'Fill in the form and submit it',
      },
      {
        url: 'https://www.google.com',
        action: 'Search for "typescript testing"',
      },
    ];

    for (const [index, scenario] of scenarios.entries()) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🧪 SCENARIO ${index + 1}: ${scenario.url}`);
      console.log('='.repeat(60));

      try {
        await this.playwrightBridge.initialize();

        console.log(`🌐 Navigating to: ${scenario.url}`);
        await this.playwrightBridge.navigateTo(scenario.url);

        const { domTree, selectorMap, browserState } = await this.domProcessor.getDomState({
          doHighlightElements: true,
        });

        const promptPayload = await this.promptBuilder.createLlmPromptPayload(domTree, scenario.action, browserState);

        console.log(`\n📝 Action: "${scenario.action}"`);
        console.log(`🎯 Found ${Object.keys(selectorMap).length} interactive elements`);
        console.log('\n👤 Generated User Prompt:');
        console.log('-'.repeat(40));
        console.log(promptPayload.userPrompt.substring(0, 500) + '...');
      } catch (error) {
        console.error(`❌ Error in scenario ${index + 1}:`, error);
      }

      await this.playwrightBridge.close();
    }
  }
}

// Main execution
async function main() {
  const tester = new RealFlowTest();

  // Choose which test to run:

  // Option 1: Single detailed test
  await tester.runCompleteFlow();

  // Option 2: Multiple quick scenarios (uncomment to use)
  // await tester.runMultipleScenarios();
}

// Execute if this file is run directly
if (require.main === module) {
  main().catch(console.error);
}

export { RealFlowTest };
