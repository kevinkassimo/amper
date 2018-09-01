const {By, until} = require('selenium-webdriver');

const {ScreenShotManager} = require('../../lib/screenshot');
const helper = require('../../lib/helper');

/**
 * This experiment is aimed to address the issue of things breaking in shadow-dom
 */

/**
 * This is NOT a mocha 'describe'.
 * This is using a custom (and buggy) implementation that allows each test to become an independent unit
 * that could be scheduled to different browsers (in the future on different machines) to run concurrently.
 * Only beforeEach(), afterEach(), and it() are implemented.
 * `browser` is the driver, and `env` is an object to store info across beforeEach, it and afterEach
 */
describe.only('shadow dom actions', () => {
  beforeEach(async (browser, env) => {
    // Visit page FIRST!
    await browser.get('http://localhost:8080/shadow-dom/shadow-actions.html');
    // Configure screenshot manager
    env.screenShotManager = new ScreenShotManager(browser, 'shadow-dom');
    // Make a decent window size for screenshots.
    await env.screenShotManager.setWindowSize({
      height: 500,
      width: 800,
      x: 0,
      y: 0,
    });
    // Wait for attaching shadow root
    await browser.wait(until.elementLocated(By.css('#shadowRoot')));
    // Get shadow root
    env.shadowRoot = await helper.shadow.getRootFrom(browser, await browser.findElement(By.css('#shadowRoot')));
    // Set query base element to the shadow root
    env.screenShotManager.setSelectorBase(env.shadowRoot);
  });

  afterEach(async (browser, env) => {
  });

  it('should toggleVisibility', async (browser, env) => {
    // Wait for visible of element: basic AMP loaded
    await browser.wait(async () => {
      return await env.shadowRoot.findElement(By.css('#secret')).isDisplayed();
    });
    // Find button from shadowRoot to click, should hide text
    await env.shadowRoot.findElement(By.css('#btn')).click();
    // Wait for text to be hidden
    await browser.wait(async () => {
      return !(await env.shadowRoot.findElement(By.css('#secret')).isDisplayed());
    });
    // Take a screenshot
    await env.screenShotManager.takeElementScreenshot('#shadow-main', `shadow-toggleVisibility-hidden-${env.capability}.png`);
    // Find button from shadowRoot to click, should show text
    await env.shadowRoot.findElement(By.css('#btn')).click();
    // Wait for text to be shown
    await browser.wait(async () => {
      return await env.shadowRoot.findElement(By.css('#secret')).isDisplayed();
    });
    // Take a screenshot
    await env.screenShotManager.takeElementScreenshot('#shadow-main', `shadow-toggleVisibility-shown-${env.capability}.png`);
  });

  /**
   * NOTICE: this test would FAIL if sent for visual-diff
   * There is a bug with scrollTo in AMP shadow doc
   * See https://github.com/ampproject/amphtml/issues/17792
   */
  it.skip('should scrollTo element', async (browser, env) => {
    // Wait for visible of element: basic AMP loaded
    await browser.wait(async () => {
      return await env.shadowRoot.findElement(By.css('#scroll-btn')).isDisplayed();
    });
    // Take a screenshot
    await env.screenShotManager.takeScreenshot(`shadow-scrollTo-before-${env.capability}.png`);
    // Find button from shadowRoot to click, should scroll to #bottom-text
    await env.shadowRoot.findElement(By.css('#scroll-btn')).click();
    // Wait for a few seconds (there is no better way)
    await helper.wait.forMS(1000);
    // Take a screenshot
    await env.screenShotManager.takeScreenshot(`shadow-scrollTo-after-${env.capability}.png`);
  });
}).timeout(20000);
