import { createLogger } from '@common/logger';
import { SerializableDOMNode, HashedDomElement } from '@scenario-parser/interfaces';
import { createHash } from 'crypto';

// Handles hashing and change detection for interactive DOM elements across page states
export class ClickableElementProcessor {
  private static readonly logger = createLogger(ClickableElementProcessor.name);

  // Reusable hash function - create once and reuse
  private static hash(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  // Get all clickable elements in the DOM tree
  static getClickableElements(domElement: SerializableDOMNode): SerializableDOMNode[] {
    const clickableElements: SerializableDOMNode[] = [];

    const traverse = (node: SerializableDOMNode) => {
      if (node.highlightIndex !== undefined && node.isInteractive && node.isTopElement) {
        clickableElements.push(node);
      }

      for (const child of node.children) {
        traverse(child);
      }
    };

    traverse(domElement);
    return clickableElements;
  }

  // Get hashes of all clickable elements for change detection
  static getClickableElementsHashes(domElement: SerializableDOMNode): Set<string> {
    const clickableElements = this.getClickableElements(domElement);
    return new Set(clickableElements.map((element) => this.hashDomElement(element)));
  }

  // Create a hash for a DOM element for tracking across page states
  static hashDomElement(domElement: SerializableDOMNode): string {
    const parentBranchPath = this.getParentBranchPath(domElement);
    const branchPathHash = this.hash(parentBranchPath.join('/'));
    const attributesHash = this.attributesHash(domElement.attributes);
    const xpathHash = this.hash(domElement.xpath);

    return this.hash(`${branchPathHash}-${attributesHash}-${xpathHash}`);
  }

  // Create structured hash object for element
  static createHashedDomElement(domElement: SerializableDOMNode): HashedDomElement {
    const parentBranchPath = this.getParentBranchPath(domElement);
    const branchPathHash = this.hash(parentBranchPath.join('/'));
    const attributesHash = this.attributesHash(domElement.attributes);
    const xpathHash = this.hash(domElement.xpath);

    return {
      branchPathHash,
      attributesHash,
      xpathHash,
    };
  }

  // Get the parent branch path for an element
  private static getParentBranchPath(domElement: SerializableDOMNode): string[] {
    const parents: SerializableDOMNode[] = [];
    let currentElement: SerializableDOMNode | undefined = domElement;

    while (currentElement?.parent) {
      parents.push(currentElement);
      currentElement = currentElement.parent;
    }

    parents.reverse();
    return parents.map((parent) => parent.tag);
  }

  // Create hash for element attributes
  private static attributesHash(attributes: Record<string, string>): string {
    const attributesString = Object.entries(attributes)
      .sort(([a], [b]) => a.localeCompare(b)) // Sort for consistent hashing
      .map(([key, value]) => `${key}=${value}`)
      .join('');
    return this.hash(attributesString);
  }

  // Create hash for text content (for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static textHash(domElement: SerializableDOMNode): string {
    const textString = this.getAllTextTillNextClickableElement(domElement);
    return this.hash(textString);
  }

  // Get all text content until the next clickable element
  private static getAllTextTillNextClickableElement(domElement: SerializableDOMNode, maxDepth = -1): string {
    const textParts: string[] = [];

    const collectText = (node: SerializableDOMNode, currentDepth: number) => {
      if (maxDepth !== -1 && currentDepth > maxDepth) {
        return;
      }

      // Skip this branch if we hit a highlighted element (except for the current node)
      if (node !== domElement && node.highlightIndex !== undefined) {
        return;
      }

      if (node.tag === '#text' && node.text) {
        textParts.push(node.text);
      } else {
        for (const child of node.children) {
          collectText(child, currentDepth + 1);
        }
      }
    };

    collectText(domElement, 0);
    return textParts.join('\n').trim();
  }

  // Compare two sets of hashes to detect changes
  static detectChanges(
    previousHashes: Set<string>,
    currentHashes: Set<string>,
  ): {
    added: Set<string>;
    removed: Set<string>;
    unchanged: Set<string>;
  } {
    const added = new Set<string>();
    const removed = new Set<string>();
    const unchanged = new Set<string>();

    // Find added elements
    for (const hash of currentHashes) {
      if (previousHashes.has(hash)) {
        unchanged.add(hash);
      } else {
        added.add(hash);
      }
    }

    // Find removed elements
    for (const hash of previousHashes) {
      if (!currentHashes.has(hash)) {
        removed.add(hash);
      }
    }

    this.logger.debug('Element changes detected', {
      added: added.size,
      removed: removed.size,
      unchanged: unchanged.size,
    });

    return { added, removed, unchanged };
  }

  // Mark new elements in the DOM tree based on hash comparison
  static markNewElements(domTree: SerializableDOMNode, previousHashes: Set<string>): SerializableDOMNode {
    const traverse = (node: SerializableDOMNode) => {
      if (node.highlightIndex !== undefined && node.isInteractive && node.isTopElement) {
        const elementHash = this.hashDomElement(node);
        node.isNew = !previousHashes.has(elementHash);
      }

      for (const child of node.children) {
        traverse(child);
      }
    };

    traverse(domTree);
    return domTree;
  }
}
