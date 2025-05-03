import {
  Browser,
  BrowserContext,
  Page,
  chromium,
  firefox,
  webkit,
  BrowserType,
  LaunchOptions,
  BrowserContextOptions,
} from 'playwright';
import { TabInfo } from '@scenario-parser/interfaces';
import { createLogger } from '@common/logger';

const logger = createLogger('playwright-bridge');

interface PlaywrightBridgeConfig {
  browserType?: 'chromium' | 'firefox' | 'webkit';
  launchOptions?: LaunchOptions;
  contextOptions?: BrowserContextOptions;
  defaultTimeout: number;
}

export class PlaywrightBridgeError extends Error {
  constructor(
    message: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = 'PlaywrightBridgeError';
  }
}

// TODO: Define a more specific type for the script argument in evaluate
type EvaluateScript<R> = string | ((args: unknown) => R | Promise<R>);

export class PlaywrightBridgeService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: PlaywrightBridgeConfig;
  private browserInstanceType: BrowserType<Browser> | null = null;

  constructor(config: Partial<PlaywrightBridgeConfig> = {}) {
    this.config = {
      browserType: 'chromium',
      launchOptions: { headless: true },
      contextOptions: {},
      defaultTimeout: 30000, // Ensure a default number value
      ...config,
    };
  }

  async initialize(): Promise<void> {
    try {
      switch (this.config.browserType) {
        case 'firefox':
          this.browserInstanceType = firefox;
          break;
        case 'webkit':
          this.browserInstanceType = webkit;
          break;
        case 'chromium':
        default:
          this.browserInstanceType = chromium;
          break;
      }
      this.browser = await this.browserInstanceType.launch(this.config.launchOptions);
      this.context = await this.browser.newContext(this.config.contextOptions);
      this.page = await this.context.newPage();
      // Ensure config.defaultTimeout is passed, which is guaranteed to be a number now
      this.page.setDefaultTimeout(this.config.defaultTimeout);
      logger.info(`Playwright Bridge initialized with ${this.config.browserType}.`);
    } catch (error: unknown) {
      logger.error('Failed to initialize Playwright Bridge:', { error });
      await this.close();
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new PlaywrightBridgeError(
        `Failed to initialize Playwright: ${errorMessage}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async getPage(): Promise<Page> {
    if (!this.page) {
      throw new PlaywrightBridgeError(
        'Playwright Page is not initialized. Call initialize() first.',
      );
    }
    return this.page;
  }

  async navigateTo(url: string): Promise<void> {
    const currentPage = await this.getPage();
    try {
      await currentPage.goto(url, { waitUntil: 'networkidle' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new PlaywrightBridgeError(
        `Failed to navigate to URL "${url}": ${errorMessage}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async goBack(): Promise<void> {
    const currentPage = await this.getPage();
    try {
      await currentPage.goBack({ waitUntil: 'networkidle' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new PlaywrightBridgeError(
        `Failed to navigate back: ${errorMessage}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async evaluate<R>(script: EvaluateScript<R>, args?: unknown): Promise<R> {
    const currentPage = await this.getPage();
    try {
      return await currentPage.evaluate<R, typeof args>(script, args);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new PlaywrightBridgeError(
        `Failed to evaluate script: ${errorMessage}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async click(selector: string): Promise<void> {
    const currentPage = await this.getPage();
    try {
      await currentPage.locator(selector).click();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new PlaywrightBridgeError(
        `Failed to click selector "${selector}": ${errorMessage}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async type(selector: string, text: string): Promise<void> {
    const currentPage = await this.getPage();
    try {
      await currentPage.locator(selector).fill(text);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new PlaywrightBridgeError(
        `Failed to type into selector "${selector}": ${errorMessage}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async hover(selector: string): Promise<void> {
    const currentPage = await this.getPage();
    try {
      await currentPage.locator(selector).hover();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new PlaywrightBridgeError(
        `Failed to hover over selector "${selector}": ${errorMessage}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async pressKey(selector: string, key: string): Promise<void> {
    const currentPage = await this.getPage();
    try {
      await currentPage.locator(selector).press(key);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new PlaywrightBridgeError(
        `Failed to press key "${key}" on selector "${selector}": ${errorMessage}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async selectOption(selector: string, value: string | string[]): Promise<void> {
    const currentPage = await this.getPage();
    try {
      await currentPage.locator(selector).selectOption(value);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new PlaywrightBridgeError(
        `Failed to select option(s) for selector "${selector}": ${errorMessage}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async waitForLoadState(
    state?: 'load' | 'domcontentloaded' | 'networkidle',
    options?: { timeout?: number },
  ): Promise<void> {
    const currentPage = await this.getPage();
    try {
      await currentPage.waitForLoadState(state, options);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new PlaywrightBridgeError(
        `Failed to wait for load state "${state}": ${errorMessage}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async getCurrentUrl(): Promise<string> {
    const currentPage = await this.getPage();
    try {
      return currentPage.url();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new PlaywrightBridgeError(
        `Failed to get current URL: ${errorMessage}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async getPageContent(): Promise<string> {
    const currentPage = await this.getPage();
    try {
      return await currentPage.content();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new PlaywrightBridgeError(
        `Failed to get page content: ${errorMessage}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async getTabsInfo(): Promise<TabInfo[]> {
    if (!this.context) {
      throw new PlaywrightBridgeError('Browser context is not initialized.');
    }
    const pages = this.context.pages();
    return pages.map((p, index) => ({
      pageIndex: index,
      url: p.url(),
      title: '', // Keeping title blank for now. TODO: Implement title retrieval
    }));
  }

  async switchToTab(pageIndex: number): Promise<void> {
    if (!this.context) {
      throw new PlaywrightBridgeError('Browser context is not initialized.');
    }
    const pages = this.context.pages();
    if (pageIndex < 0 || pageIndex >= pages.length) {
      throw new PlaywrightBridgeError(
        `Invalid page index ${pageIndex}. Only ${pages.length} tabs open.`,
      );
    }
    this.page = pages[pageIndex];
    await this.page.bringToFront();
  }

  async close(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close();
        this.context = null;
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      this.browserInstanceType = null;
      logger.info('Playwright Bridge closed.');
    } catch (error: unknown) {
      logger.error('Error closing Playwright Bridge:', { error });
    }
  }
}
