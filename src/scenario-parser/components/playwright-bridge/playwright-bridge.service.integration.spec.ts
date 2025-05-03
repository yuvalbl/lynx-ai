import { PlaywrightBridgeService } from './playwright-bridge.service';

// These tests use actual browser instances
describe('PlaywrightBridgeService (Integration)', () => {
  let bridgeService: PlaywrightBridgeService;

  jest.setTimeout(30000);

  beforeEach(() => {
    bridgeService = new PlaywrightBridgeService({
      launchOptions: { headless: true },
    });
  });

  afterEach(async () => {
    await bridgeService.close();
  });

  it('should actually launch a browser and navigate to a URL', async () => {
    await bridgeService.initialize();

    const testUrl = 'https://example.com/';
    await bridgeService.navigateTo(testUrl);

    const currentUrl = await bridgeService.getCurrentUrl();
    expect(currentUrl).toBe(testUrl);

    // Verify we can get the page content
    const content = await bridgeService.getPageContent();
    expect(content).toContain('<html');
    expect(content).toContain('Example Domain');
  });

  it('should perform click interactions on a real page', async () => {
    await bridgeService.initialize();

    await bridgeService.navigateTo('https://github.com');

    // Get header content before clicking "Sign in"
    const beforeContent = await bridgeService.getPageContent();
    expect(beforeContent).toContain('Sign in');

    await bridgeService.click('.HeaderMenu-link--sign-in');

    // Verify we reached the login page
    const currentUrl = await bridgeService.getCurrentUrl();
    expect(currentUrl).toContain('/login');

    // Verify page content changed
    const afterContent = await bridgeService.getPageContent();
    expect(afterContent).toContain('Sign in to GitHub');
  });

  it('should handle form interactions (type into fields)', async () => {
    await bridgeService.initialize();

    await bridgeService.navigateTo('https://github.com/login');

    // Type into username field (without submitting)
    const testUsername = 'test-integration-user';
    await bridgeService.type('#login_field', testUsername);

    // Verify the field content has changed (requires evaluate)
    const fieldValue = await bridgeService.evaluate<string>(() => {
      const input = document.querySelector('#login_field') as HTMLInputElement;
      return input ? input.value : '';
    });

    expect(fieldValue).toBe(testUsername);
  });

  it('should handle navigation history with goBack', async () => {
    await bridgeService.initialize();

    await bridgeService.navigateTo('https://example.com/');

    await bridgeService.navigateTo('https://github.com/');

    // Verify we're on second page
    let currentUrl = await bridgeService.getCurrentUrl();
    expect(currentUrl).toContain('github.com');

    // Go back to first page
    await bridgeService.goBack();

    // Verify we got back to the first page
    currentUrl = await bridgeService.getCurrentUrl();
    expect(currentUrl).toContain('example.com');
  });

  it('should handle waiting for page load states', async () => {
    await bridgeService.initialize();

    await bridgeService.navigateTo('https://example.com/');

    // Explicitly wait for a load state
    await bridgeService.waitForLoadState('domcontentloaded');

    // Should be able to access content after the wait
    const content = await bridgeService.getPageContent();
    expect(content).toContain('Example Domain');
  });
});
