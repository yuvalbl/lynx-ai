import { createLogger } from '@common/logger';
import { SerializableDOMNode, ViewportInfo, CoordinateSet } from '@scenario-parser/interfaces';
import { PlaywrightBridgeService } from '../../playwright-bridge/playwright-bridge.service';
import { ClickableElementProcessor } from '../processors';

// Enhances DOM trees with browser-use features like coordinates, hashes, and viewport information
export class DomEnhancementService {
  private static readonly logger = createLogger(DomEnhancementService.name);

  // Enhance DOM tree with browser-use features
  static async enhanceDomTree(
    domTree: SerializableDOMNode,
    playwrightBridge: PlaywrightBridgeService,
    previousClickableHashes: Set<string>,
  ): Promise<{ enhancedDomTree: SerializableDOMNode; currentHashes: Set<string> }> {
    // Add hashes to all interactive elements
    this.addHashesToDomTree(domTree);

    // Add coordinates and viewport information
    await this.addCoordinatesAndViewportInfo(domTree, playwrightBridge);

    // Mark new elements based on previous state
    const currentHashes = ClickableElementProcessor.getClickableElementsHashes(domTree);
    ClickableElementProcessor.markNewElements(domTree, previousClickableHashes);

    return { enhancedDomTree: domTree, currentHashes };
  }

  // Add hashes to DOM tree elements
  private static addHashesToDomTree(domTree: SerializableDOMNode): void {
    const traverse = (node: SerializableDOMNode) => {
      if (node.highlightIndex !== undefined && node.isInteractive && node.isTopElement) {
        node.hash = ClickableElementProcessor.createHashedDomElement(node);
      }

      for (const child of node.children) {
        traverse(child);
      }
    };

    traverse(domTree);
  }

  // Add coordinates and viewport information to elements
  private static async addCoordinatesAndViewportInfo(
    domTree: SerializableDOMNode,
    playwrightBridge: PlaywrightBridgeService,
  ): Promise<void> {
    try {
      const page = await playwrightBridge.getPage();
      if (!page) return;

      // Get viewport info
      const viewportInfo = await this.getViewportInfo(playwrightBridge);

      // Add coordinates to interactive elements
      await this.addCoordinatesToElements(domTree, viewportInfo, playwrightBridge);
    } catch (error) {
      this.logger.warn('Failed to add coordinates and viewport info', { error });
    }
  }

  // Get viewport information
  private static async getViewportInfo(playwrightBridge: PlaywrightBridgeService): Promise<ViewportInfo> {
    const page = await playwrightBridge.getPage();
    if (!page) {
      return { scrollX: 0, scrollY: 0, width: 1920, height: 1080 };
    }

    return await playwrightBridge.evaluate(() => {
      return {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
      };
    });
  }

  // Add coordinates to elements
  private static async addCoordinatesToElements(
    domTree: SerializableDOMNode,
    viewportInfo: ViewportInfo,
    playwrightBridge: PlaywrightBridgeService,
  ): Promise<void> {
    const traverse = async (node: SerializableDOMNode) => {
      if (node.highlightIndex !== undefined && node.isInteractive && node.isTopElement && node.xpath) {
        try {
          const coordinates = await this.getElementCoordinates(node.xpath, playwrightBridge);
          if (coordinates) {
            node.pageCoordinates = coordinates;
            node.viewportCoordinates = this.convertToViewportCoordinates(coordinates, viewportInfo);
            node.viewportInfo = viewportInfo;
          }
        } catch (error) {
          this.logger.debug('Failed to get coordinates for element', { xpath: node.xpath, error });
        }
      }

      for (const child of node.children) {
        await traverse(child);
      }
    };

    await traverse(domTree);
  }

  // Get element coordinates using xpath
  private static async getElementCoordinates(
    xpath: string,
    playwrightBridge: PlaywrightBridgeService,
  ): Promise<CoordinateSet | null> {
    try {
      return await playwrightBridge.evaluate((args: unknown) => {
        const xpathStr = args as string;
        const element = document.evaluate(xpathStr, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
          .singleNodeValue as Element;

        if (!element) return null;

        const rect = element.getBoundingClientRect();
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        return {
          topLeft: { x: rect.left + scrollX, y: rect.top + scrollY },
          topRight: { x: rect.right + scrollX, y: rect.top + scrollY },
          bottomLeft: { x: rect.left + scrollX, y: rect.bottom + scrollY },
          bottomRight: { x: rect.right + scrollX, y: rect.bottom + scrollY },
          center: {
            x: rect.left + rect.width / 2 + scrollX,
            y: rect.top + rect.height / 2 + scrollY,
          },
          width: rect.width,
          height: rect.height,
        };
      }, xpath);
    } catch (error) {
      this.logger.debug('Error getting element coordinates', { xpath, error });
      return null;
    }
  }

  // Convert page coordinates to viewport coordinates
  private static convertToViewportCoordinates(pageCoords: CoordinateSet, viewportInfo: ViewportInfo): CoordinateSet {
    const offsetX = -viewportInfo.scrollX;
    const offsetY = -viewportInfo.scrollY;

    return {
      topLeft: { x: pageCoords.topLeft.x + offsetX, y: pageCoords.topLeft.y + offsetY },
      topRight: { x: pageCoords.topRight.x + offsetX, y: pageCoords.topRight.y + offsetY },
      bottomLeft: { x: pageCoords.bottomLeft.x + offsetX, y: pageCoords.bottomLeft.y + offsetY },
      bottomRight: { x: pageCoords.bottomRight.x + offsetX, y: pageCoords.bottomRight.y + offsetY },
      center: { x: pageCoords.center.x + offsetX, y: pageCoords.center.y + offsetY },
      width: pageCoords.width,
      height: pageCoords.height,
    };
  }
}
