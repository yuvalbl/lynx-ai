# DOM Processor Service

The DOM Processor Service extracts and processes the Document Object Model (DOM) from web pages using Playwright. It transforms the DOM into a serializable object structure that can be used for analysis, particularly for AI/LLM-based test generation.

## Overview

This service provides the critical capability to:

1. Execute the `buildDomTree.js` script in the browser context
2. Process the resulting DOM data into a structured tree representation
3. Create a mapping of interactive elements for easy reference
4. Handle text nodes, element hierarchies, and parent-child relationships
5. Manage error cases and provide fallback mechanisms

## Architecture

The DOM Processor Service works in conjunction with the Playwright Bridge Service to communicate with the browser. The process follows these steps:

```
┌────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ DOM Processor  │     │ Playwright      │     │  Browser        │
│   Service      │────>│   Bridge        │────>│                 │
│                │     │   Service       │     │                 │
└────────────────┘     └─────────────────┘     └─────────────────┘
        │                                              │
        │ 1. Request DOM state                         │
        │                                              │
        │                                              │
        │                                              │
        │                                              │
        │                 2. Execute buildDomTree.js   │
        │<─────────────────────────────────────────────│
        │                                              │
        │ 3. Process DOM data                          │
        ↓                                              │
┌────────────────┐                                     │
│ Serializable   │                                     │
│  DOM Tree +    │                                     │
│ Selector Map   │                                     │
└────────────────┘                                     │
```

## Key Components

### DOM Tree Construction

The DOM tree is constructed in two passes:

1. **First Pass**: Parse all nodes from the raw data map returned by `buildDomTree.js`
2. **Second Pass**: Link parent-child relationships between nodes

This approach matches the Python implementation pattern in the original `browser-use` codebase.

### Text Node Handling

Text nodes are properly processed and included in the DOM tree:

- Text nodes are created with the special tag name `#text`
- They maintain their text content and visibility properties
- They become children of their parent element nodes

### Selector Mapping

A selector map is created to provide easy access to interactive elements:

- Maps `highlightIndex` to the corresponding DOM node
- Used by the LLM to reference elements in generated instructions
- Only includes visible and interactive elements

## Testing Strategy

The DOM Processor Service is tested using both unit and integration tests:

### Unit Tests (`dom-processor.service.unit.spec.ts`)

- Mock the Playwright Bridge to isolate the DOM Processor logic
- Test individual methods like `parseNode`, `constructDomTree`, etc.
- Verify error handling, text node processing, and tree construction
- Test with sample DOM data structures that mimic real browser output

### Integration Tests (`dom-processor.service.integration.spec.ts`)

- Use actual Playwright instances with real browser rendering
- Test with various HTML page structures
- Verify correct extraction of elements, attributes, and relationships
- Test text node handling in real-world scenarios
- Ensure interactive elements are properly identified and mapped

These tests ensure the service correctly processes DOM structures and maintains compatibility with the Python implementation.

## Usage Example

```typescript
// Initialize the service with a Playwright Bridge instance
const playwrightBridge = new PlaywrightBridgeService();
await playwrightBridge.initialize();
const domProcessor = new DomProcessorService(playwrightBridge);

// Navigate to a page
await playwrightBridge.navigateTo('https://example.com');

// Get the DOM state
const { domTree, selectorMap } = await domProcessor.getDomState();

// Access the DOM structure
console.log(`Root tag: ${domTree.tag}`);
console.log(`Number of interactive elements: ${Object.keys(selectorMap).length}`);

// Clean up
await playwrightBridge.close();
```

## Related Files

- `buildDomTree.js`: The browser-side script that extracts DOM information
- `playwright-bridge.service.ts`: The service that manages Playwright browser instances
- `dom-processor.service.ts`: This service implementation
- `dom-processor.service.unit.spec.ts`: Unit tests for this service
- `dom-processor.service.integration.spec.ts`: Integration tests for this service 