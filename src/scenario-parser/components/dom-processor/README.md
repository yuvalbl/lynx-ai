# DOM Processor Service

The DOM Processor Service extracts and processes the Document Object Model (DOM) from web pages using Playwright. It transforms the DOM into a serializable object structure with advanced browser-use features including history tracking, element change detection, and coordinate mapping for AI/LLM-based test generation.

## Overview

This service provides comprehensive DOM processing capabilities:

1. **DOM Tree Construction**: Execute `buildDomTree.js` and build structured DOM representation
2. **Element Enhancement**: Add coordinates, hashes, and browser-use features
3. **History Tracking**: Track DOM changes across page states for context
4. **Change Detection**: Identify new, removed, and modified elements
5. **Browser State Management**: Maintain comprehensive browser state with viewport info
6. **LLM Integration**: Format DOM and history data for AI consumption

## Refactored Architecture

The DOM Processor has been refactored into focused, maintainable services following SOLID principles. Each service has a single responsibility and is under 200 lines of code.

## Sequential Processing Pipeline

```
Input: buildDomTree.js result
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DOM Processor Service                        │
│                         (Orchestrator)                         │
│                                                                 │
│  Coordinates the sequential processing pipeline                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
              ┌───────────────────┐
              │   DOM Tree        │  Step 1: Parse raw data
              │   Builder         │  • Extract node map & root ID
              │   Service         │  • Create SerializableDOMNode tree
              │                   │  • Build selector map
              │ Uses: No external │  • Handle text nodes & linking
              │       processors  │
              └─────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │   DOM             │  Step 2: Add browser-use features
              │   Enhancement     │  • Add element hashes
              │   Service         │  • Calculate coordinates
              │                   │  • Mark new elements
              │ Uses:             │  • Detect changes
              │ ClickableElement  │
              │ Processor         │
              └─────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │   Browser         │  Step 3: Create complete state
              │   State           │  • Get page info (URL, title)
              │   Service         │  • Add viewport info
              │                   │  • Process history changes
              │ Uses:             │  • Format for LLM
              │ HistoryTree       │
              │ Processor         │
              └─────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │    Final Result   │
              │                   │
              │ • domTree         │
              │ • selectorMap     │
              │ • browserState    │
              └───────────────────┘
```

### Input/Output Examples

**Input:** Raw buildDomTree.js data
```json
{ "rootId": "node_1", "map": { "node_1": { "tagName": "button", "xpath": "//button[1]" } } }
```

**DOM Tree Builder Output:** Basic DOM tree + selector map
```typescript
domTree: { tag: "button", xpath: "//button[1]", highlightIndex: 0 }
selectorMap: { 0: <button_node> }
```

**DOM Enhancement Output:** Enhanced DOM with coordinates & hashes
```typescript
domTree: { 
  tag: "button", 
  coordinates: { x: 100, y: 200 },
  hash: "abc123",
  isNew: false 
}
```

**Final Output:** Complete browser state
```typescript
browserState: {
  url: "https://example.com",
  title: "Example Page",
  domTree: <enhanced_tree>,
  viewportInfo: { width: 1920, height: 1080 }
}
```

## Service Components

### 1. DomTreeBuilderService (`services/dom-tree-builder.service.ts`)
**Responsibility**: Build DOM tree from raw browser data
- Parses buildDomTree.js output into SerializableDOMNode tree
- Creates selector map for interactive elements
- Handles text nodes and element hierarchies
- Manages parent-child relationships

### 2. DomEnhancementService (`services/dom-enhancement.service.ts`)
**Responsibility**: Add browser-use features to DOM tree
- Calculates element coordinates (page and viewport)
- Adds element hashes for change detection
- Marks new elements based on previous state
- Integrates with ClickableElementProcessor

### 3. BrowserStateService (`services/browser-state.service.ts`)
**Responsibility**: Manage browser state and history
- Creates comprehensive BrowserState objects
- Integrates with HistoryTreeProcessor for change tracking
- Provides LLM-formatted history context
- Manages viewport information

### 4. Advanced Processors (`processors/`)

#### ClickableElementProcessor
- **Element Hashing**: Creates unique hashes for elements across page states
- **Change Detection**: Identifies added/removed elements
- **New Element Marking**: Flags newly appeared elements

#### HistoryTreeProcessor
- **DOM History**: Maintains history of DOM states
- **Change Analysis**: Tracks element appearances/disappearances
- **LLM Context**: Formats history for AI consumption

## Key Features

### Browser-Use Integration
- **Element Hashing**: Unique identification across page states
- **Coordinate Mapping**: Page and viewport coordinates for all interactive elements
- **History Tracking**: Maintains DOM change history for context
- **Change Detection**: Identifies new, removed, and modified elements

### LLM-Ready Output
- **Formatted History**: Recent changes formatted for AI consumption
- **Interactive Elements**: Clear mapping with coordinates and attributes
- **Context Preservation**: Maintains state across multiple interactions

### Error Handling & Fallbacks
- **Graceful Degradation**: Continues processing even if enhancement fails
- **Empty State Handling**: Proper fallbacks for blank pages
- **Coordinate Failures**: Continues without coordinates if calculation fails

## Testing Strategy

### Unit Tests
- **Service Isolation**: Each service tested independently
- **Mock Dependencies**: Playwright Bridge and processors mocked
- **Edge Cases**: Error conditions, empty states, malformed data

### Integration Tests
- **Full Pipeline**: End-to-end DOM processing with real browser
- **Real Pages**: Various HTML structures and interactive elements
- **History Tracking**: Multi-step scenarios with DOM changes
- **Coordinate Accuracy**: Verify element positioning

## Usage Example

```typescript
// Initialize the service with a Playwright Bridge instance
const playwrightBridge = new PlaywrightBridgeService();
await playwrightBridge.initialize();
const domProcessor = new DomProcessorService(playwrightBridge);

// Navigate to a page
await playwrightBridge.navigateTo('https://example.com');

// Get enhanced DOM state with history
const { domTree, selectorMap, browserState } = await domProcessor.getDomState({
  doHighlightElements: true,
  viewportExpansion: 100
});

// Access enhanced features
console.log(`Root tag: ${domTree.tag}`);
console.log(`Interactive elements: ${Object.keys(selectorMap).length}`);
console.log(`Page URL: ${browserState.url}`);
console.log(`Viewport: ${browserState.viewportInfo?.width}x${browserState.viewportInfo?.height}`);

// Get history context for LLM
const historyContext = domProcessor.getFormattedHistoryForLLM();
console.log('Recent changes:', historyContext);

// Navigate to another page to see change detection
await playwrightBridge.navigateTo('https://example.com/page2');
const { domTree: newDomTree } = await domProcessor.getDomState();
// New elements will be marked with isNew: true

// Clean up
await playwrightBridge.close();
```

## File Structure

```
src/scenario-parser/components/dom-processor/
├── services/
│   ├── dom-tree-builder.service.ts      # DOM tree construction
│   ├── dom-enhancement.service.ts       # Coordinates & hashes
│   ├── browser-state.service.ts         # State management
│   └── index.ts                         # Service exports
├── processors/
│   ├── clickable-element-processor.service.ts  # Element hashing & change detection
│   ├── history-tree-processor.service.ts       # DOM history tracking
│   └── index.ts                                # Processor exports
├── dom-processor.service.ts             # Main orchestrator
├── buildDomTree.js                      # Browser-side DOM extraction script
└── README.md                            # This documentation
```

## Related Files

- `buildDomTree.js`: Browser-side script for DOM extraction
- `playwright-bridge.service.ts`: Playwright browser management
- `interfaces/internal.types.ts`: Enhanced type definitions with browser-use features
- Unit tests: `*.unit.spec.ts` files for each service
- Integration tests: `*.integration.spec.ts` for full pipeline testing

## Benefits of Refactored Architecture

1. **Maintainability**: Each service under 200 lines with single responsibility
2. **Testability**: Focused units easier to test and mock
3. **Extensibility**: Easy to add new features without affecting other components
4. **Performance**: Modular loading and execution
5. **Browser-Use Compatible**: Full integration of advanced DOM processing features
6. **Production Ready**: Proper error handling, logging, and type safety 