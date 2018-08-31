const {By, until} = require('selenium-webdriver');
const {LegacyActionSequence} = require('selenium-webdriver/lib/actions');
const {Key} = require('selenium-webdriver/lib/input');

const {AmpImgInjector} = require('../../lib/injector');
const {ScreenShotManager} = require('../../lib/screenshot');
const helper = require('../../lib/helper');

// See comment in doc about CSS animation
// This might not be the best approach
async function waitForHintDisappear(browser) {
  // Wait for hints to disappear, keeping our screenshot result uniform
  await browser.wait(async () => {
    // There seems to be no better way here other than access internal classes
    const leftHintOpacity = await helper.style.getComputedStyleByName(browser, '.i-amphtml-image-slider-container > .i-amphtml-image-slider-hint', 'opacity');
    // Use adjacent sibling to flip find order
    const rightHintOpacity = await helper.style.getComputedStyleByName(browser, '.i-amphtml-image-slider-container > .i-amphtml-image-slider-hint ~ .i-amphtml-image-slider-hint', 'opacity');
    return Number(leftHintOpacity) === 0 && Number(rightHintOpacity) === 0;
  });
  // Request an animation frame
  await browser.executeAsyncScript(function () {
    // See http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/ie_exports_Driver.html#executeAsyncScript
    var cb = arguments[arguments.length - 1];
    window.requestAnimationFrame(cb);
  });
}

// See comment in doc about CSS animation
// This might not be the best approach
async function waitForHintReappear(browser) {
  // Wait for hints to disappear, keeping our screenshot result uniform
  await browser.wait(async () => {
    // There seems to be no better way here other than access internal classes
    const leftHintOpacity = await helper.style.getComputedStyleByName(browser, '.i-amphtml-image-slider-container > .i-amphtml-image-slider-hint', 'opacity');
    // Use adjacent sibling to flip find order
    const rightHintOpacity = await helper.style.getComputedStyleByName(browser, '.i-amphtml-image-slider-container > .i-amphtml-image-slider-hint ~ .i-amphtml-image-slider-hint', 'opacity');
    return Number(leftHintOpacity) === 1 && Number(rightHintOpacity) === 1;
  });
  // Request an animation frame
  await browser.executeAsyncScript(function () {
    // See http://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/ie_exports_Driver.html#executeAsyncScript
    var cb = arguments[arguments.length - 1];
    window.requestAnimationFrame(cb);
  });
}

/**
 * This is NOT a mocha 'describe'.
 * This is using a custom (and buggy) implementation that allows each test to become an independent unit
 * that could be scheduled to different browsers (in the future on different machines) to run concurrently.
 * Only beforeEach(), afterEach(), and it() are implemented.
 * `browser` is the driver, and `env` is an object to store info across beforeEach, it and afterEach
 */
describe('amp-image-slider', () => {
  beforeEach(async (browser, env) => {
    // Visit page FIRST!
    await browser.get('http://localhost:8080/amp-image-slider/slider.amp.html');
    // Set experiment cookie (Selenium can only set cookies for already opened domain page)
    await browser.manage().addCookie({
      name: 'AMP_EXP',
      value: 'amp-image-slider',
    });
    // Go to page
    await browser.get('http://localhost:8080/amp-image-slider/slider.amp.html');
    // Ensure the slider is there
    await browser.findElement(By.css('amp-image-slider'));
    // Inject code that expose img load event to DOM attribute
    env.ampImgInjector = new AmpImgInjector(browser);
    await env.ampImgInjector.injectLoadScript();
    // Wait for both images in the slider to be loaded
    await env.ampImgInjector.waitForLoad('#img-1');
    await env.ampImgInjector.waitForLoad('#img-2');
    // Wait for the hints to be attached (last operation that demonstrates end of amp-image-slider layout)
    await browser.wait(until.elementLocated(By.css('.amp-image-slider-hint-left')));
    await browser.wait(until.elementLocated(By.css('.amp-image-slider-hint-right')));
    // Configure screenshot manager
    env.screenShotManager = new ScreenShotManager(browser, 'amp-image-slider');
    // Make a decent window size for screenshots.
    await env.screenShotManager.setWindowSize({
      height: 500,
      width: 800,
      x: 0,
      y: 0,
    });
  });

  afterEach(async (browser, env) => {
  });

  it('should load slider', async (browser, env) => {
    await env.screenShotManager.takeElementScreenshot('amp-image-slider', `slider-load-${env.capability}.png`);
  });

  it('should move slider bar to position on click', async (browser, env) => {
    const slider = await browser.findElement(By.css('amp-image-slider'));
    // We have right label on this example, so we can get this element handle
    const rightLabelWrapper = await browser.findElement(By.css('.i-amphtml-image-slider-label-wrapper.i-amphtml-image-slider-push-left'));
    // Style is the attribute for use to know if the DOM has updated or not
    const rightLabelWrapperStyle = await rightLabelWrapper.getAttribute('style');
    if (env.capability === 'chrome') {
      // Chrome only supports LegacyActionSequence
      // LegacyActionSequence stores a seq of actions that would only perform when we call .perform()
      const actionSeq = new LegacyActionSequence(browser);
      // Move mouse to slider with offset
      actionSeq.mouseMove(slider, {x: 100, y: 1});
      // Mouse down
      actionSeq.mouseDown();
      // Mouse up
      actionSeq.mouseUp();
      // Dispatch actions
      await actionSeq.perform();

      // Wait for right wrapper to change transform (style)
      await browser.wait(async () => {
        const newStyle = await rightLabelWrapper.getAttribute('style');
        return newStyle !== rightLabelWrapperStyle;
      });

      // Wait for hints to disappear, keeping our screenshot result uniform
      await waitForHintDisappear(browser);

      await env.screenShotManager.takeElementScreenshot('amp-image-slider', `slider-click-${env.capability}.png`);
    }
  });

  it('should move slider bar to position on mousemove', async (browser, env) => {
    const slider = await browser.findElement(By.css('amp-image-slider'));
    // We have right label on this example, so we can get this element handle
    const rightLabelWrapper = await browser.findElement(By.css('.i-amphtml-image-slider-label-wrapper.i-amphtml-image-slider-push-left'));
    // Style is the attribute for use to know if the DOM has updated or not
    let rightLabelWrapperStyle = await rightLabelWrapper.getAttribute('style');
    if (env.capability === 'chrome') {
      // In this sequence, we only do mousedown and mousemove, Should move slider
      const actionSeq1 = new LegacyActionSequence(browser);
      // Move mouse to slider with offset
      actionSeq1.mouseMove(slider, {x: 300, y: 1});
      // Mouse down
      actionSeq1.mouseDown();
      // Perform
      await actionSeq1.perform();
      // Wait for right wrapper to change transform (style)
      await browser.wait(async () => {
        const newStyle = await rightLabelWrapper.getAttribute('style');
        return newStyle !== rightLabelWrapperStyle;
      });

      // Wait for hints to disappear, keeping our screenshot result uniform
      await waitForHintDisappear(browser);

      // Take the first screenshot, such that we know mousedown moves correctly
      await env.screenShotManager.takeElementScreenshot('amp-image-slider', `slider-move-${env.capability}-1.png`);

      // Refresh style
      rightLabelWrapperStyle = await rightLabelWrapper.getAttribute('style');

      // In this sequence, we only do mouseup and mousemove. Should move slider
      const actionSeq2 = new LegacyActionSequence(browser);
      // Move mouse to slider with offset
      actionSeq2.mouseMove(slider, {x: 100, y: 1});
      // Mouse up
      actionSeq2.mouseUp();
      // Dispatch actions
      await actionSeq2.perform();

      // Wait for right wrapper to change transform (style)
      await browser.wait(async () => {
        const newStyle = await rightLabelWrapper.getAttribute('style');
        return newStyle !== rightLabelWrapperStyle;
      });

      // Take a second screenshot, such that we know mousemove moves correctly
      await env.screenShotManager.takeElementScreenshot('amp-image-slider', `slider-move-${env.capability}-2.png`);

      // Refresh style
      rightLabelWrapperStyle = await rightLabelWrapper.getAttribute('style');

      // In this sequence, we only do mousemove. Should NOT move slider
      const actionSeq3 = new LegacyActionSequence(browser);
      // Move mouse to slider with offset
      actionSeq3.mouseMove(slider, {x: 300, y: 1});
      // Dispatch actions
      await actionSeq3.perform();

      // Wait for 1 second (so that we are sure if something happens, it should have happened (but nothing should happen))
      await helper.wait.forMS(1000);

      // Take a second screenshot, such that we know mousemove moves correctly
      await env.screenShotManager.takeElementScreenshot('amp-image-slider', `slider-move-${env.capability}-3.png`);
    }
  });

  /**
   * NOTICE: this test is expected to flake, since we are now even farther from the DOM
   */
  it('should show hint again after scrolling out and back into viewport', async (browser, env) => {
    const slider = await browser.findElement(By.css('amp-image-slider'));
    if (env.capability === 'chrome') {
      // Take a screenshot for condition before operations (hint should be there)
      await env.screenShotManager.takeElementScreenshot('amp-image-slider', `slider-scroll-reappear-${env.capability}-1.png`);
      // Create a basic action
      const actionSeq = new LegacyActionSequence(browser);
      // Move mouse to slider with offset
      actionSeq.mouseMove(slider, {x: 250, y: 1});
      // Mouse down
      actionSeq.mouseDown();
      // Mouse up
      actionSeq.mouseUp();
      // Dispatch actions
      await actionSeq.perform();
      // Wait for hint to disappear
      await waitForHintDisappear(browser);
      // Take a screenshot for condition before scrolling away (hint should disappear)
      await env.screenShotManager.takeElementScreenshot('amp-image-slider', `slider-scroll-reappear-${env.capability}-2.png`);
      // Scroll away
      await helper.scroll.pageTo(browser, {top: 10000});
      // Wait for 1 second
      await helper.wait.forMS(1000);
      // Scroll back
      await helper.scroll.pageTo(browser, {top: 0});
      // Wait for the hint to reappear
      await waitForHintReappear(browser);
      // Take a screenshot for condition after scrolling back (hint should reappear)
      await env.screenShotManager.takeElementScreenshot('amp-image-slider', `slider-scroll-reappear-${env.capability}-3.png`);
    }
  });

  it('should move slider with keyboard', async (browser, env) => {
    if (env.capability === 'chrome') {
      // The following is also legacy, currently only working on Chrome
      const actionSeq1 = new LegacyActionSequence(browser);
      // FOCUS first
      actionSeq1.sendKeys(Key.TAB);
      // Press down left key
      actionSeq1.sendKeys(Key.LEFT);
      // Dispatch actions
      await actionSeq1.perform();
      // Wait for a second, we have no idea when the runtime finished moving
      await helper.wait.forMS(1000);
      // Also ensure there is no interfering hint
      await waitForHintDisappear(browser);
      // Take a screenshot for condition after scrolling back (hint should reappear)
      await env.screenShotManager.takeElementScreenshot('amp-image-slider', `slider-keyboard-${env.capability}-1.png`);
      // Another sequence
      const actionSeq2 = new LegacyActionSequence(browser);
      // Still focused for now...
      // Press down 2 left key presses
      actionSeq2.sendKeys(Key.PAGE_DOWN);
      // Explicitly lift key
      // actionSeq2.keyUp(Key.PAGE_DOWN);
      // Dispatch actions
      await actionSeq2.perform();
      // Wait for a second, we have no idea when the runtime finished moving
      await helper.wait.forMS(1000);
      // Take a screenshot for condition after scrolling back (hint should reappear)
      await env.screenShotManager.takeElementScreenshot('amp-image-slider', `slider-keyboard-${env.capability}-2.png`);
    }
  });

  it('should move slider with .seekTo action', async (browser, env) => {
    // Find the button for seeking
    const seekButton = await browser.findElement(By.css('#btn'));
    // Click the button
    await seekButton.click();
    // No guarantee if something happens or not, wait for 1 sec
    await helper.wait.forMS(1000);
    // Take a screenshot for condition after scrolling back (hint should reappear)
    await env.screenShotManager.takeElementScreenshot('amp-image-slider', `slider-seekTo-${env.capability}.png`);
  });
}).timeout(20000);
