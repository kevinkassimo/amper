const {By, until} = require('selenium-webdriver');
const {LegacyActionSequence} = require('selenium-webdriver/lib/actions');

const {AmpImgInjector} = require('../../lib/injector');
const {ScreenShotManager} = require('../../lib/screenshot');
const helper = require('../../lib/helper');

async function waitForHintDisappear(browser) {
  // Wait for hints to disappear, keeping our screenshot result uniform
  await browser.wait(async () => {
    const leftHintStyle = await helper.style.getComputedStyle(browser, '.i-amphtml-image-slider-container > .i-amphtml-image-slider-hint');
    // Use adjacent sibling to flip find order
    const rightHintStyle = await helper.style.getComputedStyle(browser, '.i-amphtml-image-slider-container > .i-amphtml-image-slider-hint ~ .i-amphtml-image-slider-hint');
    return leftHintStyle.opacity === '0' && rightHintStyle.opacity === '0';
  });
}

async function waitForHintReappear(browser) {
  // Wait for hints to disappear, keeping our screenshot result uniform
  await browser.wait(async () => {
    const leftHintStyle = await helper.style.getComputedStyle(browser, '.i-amphtml-image-slider-container > .i-amphtml-image-slider-hint');
    // Use adjacent sibling to flip find order
    const rightHintStyle = await helper.style.getComputedStyle(browser, '.i-amphtml-image-slider-container > .i-amphtml-image-slider-hint ~ .i-amphtml-image-slider-hint');
    return leftHintStyle.opacity === '1' && rightHintStyle.opacity === '1';
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
    await browser.wait(async () => {
      const hints = await browser.findElements(By.css('.i-amphtml-image-slider-hint'));
      return hints.length === 2;
    });
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
      await browser.wait(async () => {
        const leftHintStyle = await helper.style.getComputedStyle(browser, '.i-amphtml-image-slider-container > .i-amphtml-image-slider-hint');
        // Use adjacent sibling to flip find order
        const rightHintStyle = await helper.style.getComputedStyle(browser, '.i-amphtml-image-slider-container > .i-amphtml-image-slider-hint ~ .i-amphtml-image-slider-hint');
        return leftHintStyle.opacity === '0' && rightHintStyle.opacity === '0';
      });

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
      await browser.wait(async () => {
        const leftHintStyle = await helper.style.getComputedStyle(browser, '.i-amphtml-image-slider-container > .i-amphtml-image-slider-hint');
        // Use adjacent sibling to flip find order
        const rightHintStyle = await helper.style.getComputedStyle(browser, '.i-amphtml-image-slider-container > .i-amphtml-image-slider-hint ~ .i-amphtml-image-slider-hint');
        return leftHintStyle.opacity === '0' && rightHintStyle.opacity === '0';
      });

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
}).timeout(20000);
