import { ClickableElementProcessor } from './clickable-element-processor.service';
import { SerializableDOMNode } from '@scenario-parser/interfaces';

describe('ClickableElementProcessor', () => {
  describe('getClickableElements', () => {
    it('should extract clickable elements with highlight indices', () => {
      const mockDomTree: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [
          {
            tag: 'button',
            xpath: '/body/button',
            attributes: { id: 'btn1' },
            children: [],
            isVisible: true,
            isInteractive: true,
            isTopElement: true,
            isInViewport: true,
            highlightIndex: 0,
            shadowRoot: false,
          },
          {
            tag: 'div',
            xpath: '/body/div',
            attributes: {},
            children: [
              {
                tag: 'a',
                xpath: '/body/div/a',
                attributes: { href: 'http://example.com' },
                children: [],
                isVisible: true,
                isInteractive: true,
                isTopElement: true,
                isInViewport: true,
                highlightIndex: 1,
                shadowRoot: false,
              },
            ],
            isVisible: true,
            isInteractive: false,
            isTopElement: true,
            isInViewport: true,
            shadowRoot: false,
          },
          {
            tag: 'span',
            xpath: '/body/span',
            attributes: {},
            children: [],
            isVisible: true,
            isInteractive: false,
            isTopElement: true,
            isInViewport: true,
            shadowRoot: false,
          },
        ],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const clickableElements = ClickableElementProcessor.getClickableElements(mockDomTree);

      expect(clickableElements).toHaveLength(2);
      expect(clickableElements[0].tag).toBe('button');
      expect(clickableElements[0].highlightIndex).toBe(0);
      expect(clickableElements[1].tag).toBe('a');
      expect(clickableElements[1].highlightIndex).toBe(1);
    });

    it('should return empty array when no clickable elements exist', () => {
      const mockDomTree: SerializableDOMNode = {
        tag: 'div',
        xpath: '/div',
        attributes: {},
        children: [
          {
            tag: 'span',
            xpath: '/div/span',
            attributes: {},
            children: [],
            isVisible: true,
            isInteractive: false,
            isTopElement: true,
            isInViewport: true,
            shadowRoot: false,
          },
        ],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const clickableElements = ClickableElementProcessor.getClickableElements(mockDomTree);

      expect(clickableElements).toHaveLength(0);
    });

    it('should only include elements that are interactive, top-level, and have highlight indices', () => {
      const mockDomTree: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [
          {
            tag: 'button',
            xpath: '/body/button1',
            attributes: {},
            children: [],
            isVisible: true,
            isInteractive: true,
            isTopElement: true,
            isInViewport: true,
            highlightIndex: 0,
            shadowRoot: false,
          },
          {
            tag: 'button',
            xpath: '/body/button2',
            attributes: {},
            children: [],
            isVisible: true,
            isInteractive: true,
            isTopElement: false, // Not top element
            isInViewport: true,
            highlightIndex: 1,
            shadowRoot: false,
          },
          {
            tag: 'button',
            xpath: '/body/button3',
            attributes: {},
            children: [],
            isVisible: true,
            isInteractive: false, // Not interactive
            isTopElement: true,
            isInViewport: true,
            highlightIndex: 2,
            shadowRoot: false,
          },
          {
            tag: 'button',
            xpath: '/body/button4',
            attributes: {},
            children: [],
            isVisible: true,
            isInteractive: true,
            isTopElement: true,
            isInViewport: true,
            // No highlight index
            shadowRoot: false,
          },
        ],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const clickableElements = ClickableElementProcessor.getClickableElements(mockDomTree);

      expect(clickableElements).toHaveLength(1);
      expect(clickableElements[0].highlightIndex).toBe(0);
    });
  });

  describe('getClickableElementsHashes', () => {
    it('should return set of hashes for clickable elements', () => {
      const mockElement: SerializableDOMNode = {
        tag: 'button',
        xpath: '/body/button',
        attributes: { id: 'test-btn' },
        children: [],
        isVisible: true,
        isInteractive: true,
        isTopElement: true,
        isInViewport: true,
        highlightIndex: 0,
        shadowRoot: false,
      };

      const mockDomTree: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [mockElement],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      // Set up parent relationship
      mockElement.parent = mockDomTree;

      const hashes = ClickableElementProcessor.getClickableElementsHashes(mockDomTree);

      expect(hashes.size).toBe(1);
      expect(Array.from(hashes)[0]).toMatch(/^[a-f0-9]{64}$/); // SHA256 hash
    });

    it('should return empty set when no clickable elements exist', () => {
      const mockDomTree: SerializableDOMNode = {
        tag: 'div',
        xpath: '/div',
        attributes: {},
        children: [],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const hashes = ClickableElementProcessor.getClickableElementsHashes(mockDomTree);

      expect(hashes.size).toBe(0);
    });
  });

  describe('hashDomElement', () => {
    it('should create consistent hash for same element', () => {
      const mockElement: SerializableDOMNode = {
        tag: 'button',
        xpath: '/body/button',
        attributes: { id: 'test', class: 'btn' },
        children: [],
        isVisible: true,
        isInteractive: true,
        isTopElement: true,
        isInViewport: true,
        highlightIndex: 0,
        shadowRoot: false,
      };

      const mockParent: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [mockElement],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      mockElement.parent = mockParent;

      const hash1 = ClickableElementProcessor.hashDomElement(mockElement);
      const hash2 = ClickableElementProcessor.hashDomElement(mockElement);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should create different hashes for different elements', () => {
      const mockParent: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const mockElement1: SerializableDOMNode = {
        tag: 'button',
        xpath: '/body/button1',
        attributes: { id: 'btn1' },
        children: [],
        parent: mockParent,
        isVisible: true,
        isInteractive: true,
        isTopElement: true,
        isInViewport: true,
        highlightIndex: 0,
        shadowRoot: false,
      };

      const mockElement2: SerializableDOMNode = {
        tag: 'button',
        xpath: '/body/button2',
        attributes: { id: 'btn2' },
        children: [],
        parent: mockParent,
        isVisible: true,
        isInteractive: true,
        isTopElement: true,
        isInViewport: true,
        highlightIndex: 1,
        shadowRoot: false,
      };

      const hash1 = ClickableElementProcessor.hashDomElement(mockElement1);
      const hash2 = ClickableElementProcessor.hashDomElement(mockElement2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('createHashedDomElement', () => {
    it('should create hashed DOM element with all hash components', () => {
      const mockElement: SerializableDOMNode = {
        tag: 'button',
        xpath: '/body/button',
        attributes: { id: 'test', class: 'btn' },
        children: [],
        isVisible: true,
        isInteractive: true,
        isTopElement: true,
        isInViewport: true,
        highlightIndex: 0,
        shadowRoot: false,
      };

      const mockParent: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [mockElement],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      mockElement.parent = mockParent;

      const hashedElement = ClickableElementProcessor.createHashedDomElement(mockElement);

      expect(hashedElement).toHaveProperty('branchPathHash');
      expect(hashedElement).toHaveProperty('attributesHash');
      expect(hashedElement).toHaveProperty('xpathHash');
      expect(hashedElement.branchPathHash).toMatch(/^[a-f0-9]{64}$/);
      expect(hashedElement.attributesHash).toMatch(/^[a-f0-9]{64}$/);
      expect(hashedElement.xpathHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should create consistent hashed element for same input', () => {
      const mockElement: SerializableDOMNode = {
        tag: 'input',
        xpath: '/form/input',
        attributes: { type: 'text', name: 'username' },
        children: [],
        isVisible: true,
        isInteractive: true,
        isTopElement: true,
        isInViewport: true,
        highlightIndex: 0,
        shadowRoot: false,
      };

      const hashedElement1 = ClickableElementProcessor.createHashedDomElement(mockElement);
      const hashedElement2 = ClickableElementProcessor.createHashedDomElement(mockElement);

      expect(hashedElement1).toEqual(hashedElement2);
    });
  });

  describe('detectChanges', () => {
    it('should detect added, removed, and unchanged elements', () => {
      const previousHashes = new Set(['hash1', 'hash2', 'hash3']);
      const currentHashes = new Set(['hash2', 'hash3', 'hash4', 'hash5']);

      const changes = ClickableElementProcessor.detectChanges(previousHashes, currentHashes);

      expect(changes.added).toEqual(new Set(['hash4', 'hash5']));
      expect(changes.removed).toEqual(new Set(['hash1']));
      expect(changes.unchanged).toEqual(new Set(['hash2', 'hash3']));
    });

    it('should handle empty previous hashes (all elements are new)', () => {
      const previousHashes = new Set<string>();
      const currentHashes = new Set(['hash1', 'hash2']);

      const changes = ClickableElementProcessor.detectChanges(previousHashes, currentHashes);

      expect(changes.added).toEqual(new Set(['hash1', 'hash2']));
      expect(changes.removed).toEqual(new Set());
      expect(changes.unchanged).toEqual(new Set());
    });

    it('should handle empty current hashes (all elements removed)', () => {
      const previousHashes = new Set(['hash1', 'hash2']);
      const currentHashes = new Set<string>();

      const changes = ClickableElementProcessor.detectChanges(previousHashes, currentHashes);

      expect(changes.added).toEqual(new Set());
      expect(changes.removed).toEqual(new Set(['hash1', 'hash2']));
      expect(changes.unchanged).toEqual(new Set());
    });

    it('should handle no changes', () => {
      const previousHashes = new Set(['hash1', 'hash2']);
      const currentHashes = new Set(['hash1', 'hash2']);

      const changes = ClickableElementProcessor.detectChanges(previousHashes, currentHashes);

      expect(changes.added).toEqual(new Set());
      expect(changes.removed).toEqual(new Set());
      expect(changes.unchanged).toEqual(new Set(['hash1', 'hash2']));
    });
  });

  describe('markNewElements', () => {
    it('should mark new interactive elements as isNew', () => {
      const mockElement1: SerializableDOMNode = {
        tag: 'button',
        xpath: '/body/button1',
        attributes: { id: 'btn1' },
        children: [],
        isVisible: true,
        isInteractive: true,
        isTopElement: true,
        isInViewport: true,
        highlightIndex: 0,
        shadowRoot: false,
      };

      const mockElement2: SerializableDOMNode = {
        tag: 'button',
        xpath: '/body/button2',
        attributes: { id: 'btn2' },
        children: [],
        isVisible: true,
        isInteractive: true,
        isTopElement: true,
        isInViewport: true,
        highlightIndex: 1,
        shadowRoot: false,
      };

      const mockDomTree: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [mockElement1, mockElement2],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      // Set up parent relationships
      mockElement1.parent = mockDomTree;
      mockElement2.parent = mockDomTree;

      // Create hash for first element only
      const element1Hash = ClickableElementProcessor.hashDomElement(mockElement1);
      const previousHashes = new Set([element1Hash]);

      const updatedTree = ClickableElementProcessor.markNewElements(mockDomTree, previousHashes);

      expect(updatedTree.children[0].isNew).toBe(false); // Existing element
      expect(updatedTree.children[1].isNew).toBe(true); // New element
    });

    it('should not modify non-interactive elements', () => {
      const mockElement: SerializableDOMNode = {
        tag: 'span',
        xpath: '/body/span',
        attributes: {},
        children: [],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const mockDomTree: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [mockElement],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const updatedTree = ClickableElementProcessor.markNewElements(mockDomTree, new Set());

      expect(updatedTree.children[0].isNew).toBeUndefined();
    });

    it('should handle elements without highlight indices', () => {
      const mockElement: SerializableDOMNode = {
        tag: 'button',
        xpath: '/body/button',
        attributes: {},
        children: [],
        isVisible: true,
        isInteractive: true,
        isTopElement: true,
        isInViewport: true,
        // No highlightIndex
        shadowRoot: false,
      };

      const mockDomTree: SerializableDOMNode = {
        tag: 'body',
        xpath: '/body',
        attributes: {},
        children: [mockElement],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      // Should not throw an error
      expect(() => {
        ClickableElementProcessor.markNewElements(mockDomTree, new Set());
      }).not.toThrow();

      expect(mockElement.isNew).toBeUndefined();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle element without parent in hash calculation', () => {
      const mockElement: SerializableDOMNode = {
        tag: 'button',
        xpath: '/button',
        attributes: {},
        children: [],
        // No parent
        isVisible: true,
        isInteractive: true,
        isTopElement: true,
        isInViewport: true,
        highlightIndex: 0,
        shadowRoot: false,
      };

      // Should not throw an error
      expect(() => {
        ClickableElementProcessor.hashDomElement(mockElement);
      }).not.toThrow();

      const hash = ClickableElementProcessor.hashDomElement(mockElement);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should handle element with empty attributes', () => {
      const mockElement: SerializableDOMNode = {
        tag: 'div',
        xpath: '/div',
        attributes: {},
        children: [],
        isVisible: true,
        isInteractive: true,
        isTopElement: true,
        isInViewport: true,
        highlightIndex: 0,
        shadowRoot: false,
      };

      const hashedElement = ClickableElementProcessor.createHashedDomElement(mockElement);

      expect(hashedElement.attributesHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should handle deep nested parent hierarchy', () => {
      // Create a deep nested structure
      const deepestElement: SerializableDOMNode = {
        tag: 'button',
        xpath: '/html/body/div/section/article/form/button',
        attributes: { id: 'deep-btn' },
        children: [],
        isVisible: true,
        isInteractive: true,
        isTopElement: true,
        isInViewport: true,
        highlightIndex: 0,
        shadowRoot: false,
      };

      // Create parent chain
      let currentParent: SerializableDOMNode = {
        tag: 'html',
        xpath: '/html',
        attributes: {},
        children: [],
        isVisible: true,
        isInteractive: false,
        isTopElement: true,
        isInViewport: true,
        shadowRoot: false,
      };

      const tags = ['body', 'div', 'section', 'article', 'form'];
      for (const tag of tags) {
        const newParent: SerializableDOMNode = {
          tag,
          xpath: `${currentParent.xpath}/${tag}`,
          attributes: {},
          children: [],
          parent: currentParent,
          isVisible: true,
          isInteractive: false,
          isTopElement: true,
          isInViewport: true,
          shadowRoot: false,
        };
        currentParent.children.push(newParent);
        currentParent = newParent;
      }

      deepestElement.parent = currentParent;

      const hash = ClickableElementProcessor.hashDomElement(deepestElement);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
