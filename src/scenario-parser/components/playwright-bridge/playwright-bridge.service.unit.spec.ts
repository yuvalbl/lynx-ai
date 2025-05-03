// Mock the modules first
jest.mock('playwright');
jest.mock('@common/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Then import after mocking
import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { PlaywrightBridgeService, PlaywrightBridgeError } from './playwright-bridge.service';
import { createLogger } from '@common/logger';

// For testing access to private members
interface PlaywrightBridgeServiceTestAccess {
  config: {
    browserType: 'chromium' | 'firefox' | 'webkit';
  };
}

// Minimal Mocks for Sanity Checks
const mockPage = {
  goto: jest.fn(),
  setDefaultTimeout: jest.fn(),
} as unknown as Page;

const mockContext = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn(),
} as unknown as BrowserContext;

const mockBrowser = {
  newContext: jest.fn().mockResolvedValue(mockContext),
  close: jest.fn(),
} as unknown as Browser;

// Mock only chromium launch function
(chromium.launch as jest.Mock).mockResolvedValue(mockBrowser);

describe('PlaywrightBridgeService (Unit Sanity)', () => {
  let bridgeService: PlaywrightBridgeService;
  const mockLogger = createLogger('test');

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    (chromium.launch as jest.Mock).mockResolvedValue(mockBrowser);
    (mockBrowser.newContext as jest.Mock).mockResolvedValue(mockContext);
    (mockContext.newPage as jest.Mock).mockResolvedValue(mockPage);
  });

  it('should construct with default config', () => {
    bridgeService = new PlaywrightBridgeService();
    expect((bridgeService as unknown as PlaywrightBridgeServiceTestAccess).config.browserType).toBe(
      'chromium',
    );
  });

  it('should initialize correctly (mocked)', async () => {
    bridgeService = new PlaywrightBridgeService();
    await bridgeService.initialize();

    expect(chromium.launch).toHaveBeenCalledWith({ headless: true });
    expect(mockBrowser.newContext).toHaveBeenCalledWith({});
    expect(mockContext.newPage).toHaveBeenCalled();
    expect(mockPage.setDefaultTimeout).toHaveBeenCalledWith(30000);
    expect(mockLogger.info).toHaveBeenCalledWith('Playwright Bridge initialized with chromium.');
  });

  it('should handle initialization failure (mocked)', async () => {
    const initError = new Error('Launch failed');
    (chromium.launch as jest.Mock).mockRejectedValueOnce(initError);
    bridgeService = new PlaywrightBridgeService();

    await expect(bridgeService.initialize()).rejects.toThrow(
      new PlaywrightBridgeError(`Failed to initialize Playwright: ${initError.message}`, initError),
    );
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize Playwright Bridge:', {
      error: initError,
    });
  });

  it('should throw error if getPage called before initialize', async () => {
    bridgeService = new PlaywrightBridgeService();
    await expect(bridgeService.getPage()).rejects.toThrow(
      'Playwright Page is not initialized. Call initialize() first.',
    );
  });

  it('should return the page object after initialize (mocked)', async () => {
    bridgeService = new PlaywrightBridgeService();
    await bridgeService.initialize();
    const page = await bridgeService.getPage();
    expect(page).toBe(mockPage);
  });

  it('navigateTo should call page.goto (mocked)', async () => {
    bridgeService = new PlaywrightBridgeService();
    await bridgeService.initialize();
    const url = 'https://example.com';
    await bridgeService.navigateTo(url);
    expect(mockPage.goto).toHaveBeenCalledWith(url, { waitUntil: 'networkidle' });
  });

  it('close should call context.close and browser.close (mocked)', async () => {
    bridgeService = new PlaywrightBridgeService();
    await bridgeService.initialize();
    await bridgeService.close();

    expect(mockContext.close).toHaveBeenCalled();
    expect(mockBrowser.close).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith('Playwright Bridge closed.');
  });
});
