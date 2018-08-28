const fs = require('fs');
const {By, until} = require('selenium-webdriver');

const {AmpImgInjector} = require('../../lib/inject');
const {ScreenShotManager} = require('../../lib/screenshot');
const helper = require('../../lib/helper');

// So, one thing I noticed it that there is a library called 'chai-webdriver'
// It offers a really nice expect format.
// However, it has not been updated for 2 years, during which webdriverjs dropped
// support for promise manager.
// Nevertheless, it will still be interesting to check out.

function roundedEqual(a, b) {
  return Math.round(a) === Math.round(b);
}

async function waitForButtons(browser, env) {
  const prevButtonSelector = By.css('#slides .amp-carousel-button.amp-carousel-button-prev');
  const nextButtonSelector = By.css('#slides .amp-carousel-button.amp-carousel-button-next');
  await browser.wait(until.elementLocated(prevButtonSelector));
  await browser.wait(until.elementLocated(nextButtonSelector));
  env.prevButton = await browser.findElement(prevButtonSelector);
  env.nextButton = await browser.findElement(nextButtonSelector);
}

function isSameRect(rect1, rect2) {
  expect(rect1.x).to.equal(rect2.x);
  expect(rect1.width).to.equal(rect2.width);
  // There is a BUG with carousel
  // that has a white padding at its bottom.
  // Thus, currently things below are not tested.
  // expect(rect1.y).to.equal(rect2.y);
  // expect(rect1.height).to.equal(rect2.height);
}

/**
 * This is NOT a mocha 'describe'.
 * This is using a custom (and buggy) implementation that allows each test to become an independent unit
 * that could be scheduled to different browsers (in the future on different machines) to run concurrently.
 * Only beforeEach(), afterEach(), and it() are implemented.
 * `browser` is the driver, and `env` is an object to store info across beforeEach, it and afterEach
 */
describe('amp-carousel[type=slides]', () => {
  beforeEach(async (browser, env) => {
    // It is suggested that on HTML side, add proper CSS rules to make things simpler
    // Also, it is suggested that different carousel for testing sit on a different page
    await browser.get('http://localhost:8080/amp-carousel/slides.amp.html');
    await browser.findElement(By.css('amp-carousel[type="slides"]'));
    env.ampImgInjector = new AmpImgInjector(browser);
    await env.ampImgInjector.injectLoadScript();
    env.screenShotManager = new ScreenShotManager(browser, 'amp-carousel');
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

  it('should load carousel', async (browser, env) => {
    await env.screenShotManager.takeElementScreenshot('amp-carousel', `slides-${env.capability}-default.png`);
  });

  /**
   * Analysis:
   * This test validates that the click to show slide functionality is working correctly.
   * It still flakes for the following reason:
   * 1. We have yet to validate that the images are loaded properly, meaning that 
   */
  // For functional testing, we are more focusing on reproducible end results that are similar to what users will actually get.
  // We are more focusing on getting the final slide state visual changes compared to animation process
  it('should be able to navigate through carousel', async (browser, env) => {
    // Ensure buttons are ready
    await waitForButtons(browser, env);
    // Initially, we just wait for next button to be visible
    await browser.wait(until.elementIsVisible(env.nextButton));
    // SLIDE 1
    // Take a screenshot
    await env.screenShotManager.takeElementScreenshot('amp-carousel', `slides-${env.capability}-page-1.png`);
    // Click the next button to move to next page
    await env.nextButton.click();
    // Slide change would result in title for accessibility to change correspondingly
    // Another option: inject script, listen for `slidescroll.slideChange` event, and triggers DOM change correspondingly
    // (in a way, title is basically doing what we may want to create manually for injecting code)
    // Both options above are guaranteed to happen only after animation complete.
    await browser.wait(until.elementLocated(By.css('[title="Next item in carousel (3 of 4)"]')));
    // SLIDE 2
    // Wait for img tag of amp-img to be loaded, we want the screenshot to actually have the image.
    // This `test-load` attribute is injected in HTML file (injected when 'load' event is triggered).
    // We are explicitly doing this, since the above await only guarantees correct slides to be displayed
    // But no guarantee for img to be loaded
    await env.ampImgInjector.waitForLoad('#img-1');
    // Take a screenshot
    await env.screenShotManager.takeElementScreenshot('amp-carousel', `slides-${env.capability}-page-2.png`);
    // Click the next button to move to next page
    await env.nextButton.click();
    // Do same thing as above
    await browser.wait(until.elementLocated(By.css('[title="Next item in carousel (4 of 4)"]')));
    // SLIDE 3
    // Wait for img tag of amp-img to be loaded, we want the screenshot to actually have the image.
    await env.ampImgInjector.waitForLoad('#img-2');
    // Take a screenshot
    await env.screenShotManager.takeElementScreenshot('amp-carousel', `slides-${env.capability}-page-3.png`);
    // Click the next button to move to next page
    await env.nextButton.click();
    // Do same thing as above
    await browser.wait(until.elementLocated(By.css('[title="Previous item in carousel (3 of 4)"]')));
    // SLIDE 4
    // Wait for img tag of amp-img to be loaded, we want the screenshot to actually have the image.
    await env.ampImgInjector.waitForLoad('#img-3');
    // Take a screenshot
    await env.screenShotManager.takeElementScreenshot('amp-carousel', `slides-${env.capability}-page-4.png`);
    // Click the next button to move to next page
    await env.prevButton.click();
    // Do same thing as above
    await browser.wait(until.elementLocated(By.css('[title="Previous item in carousel (2 of 4)"]')));
    // SLIDE 3
    // Wait for img tag of amp-img to be loaded, we want the screenshot to actually have the image.
    await env.ampImgInjector.waitForLoad('#img-2');
    // Take a screenshot for the trip that goes back
    await env.screenShotManager.takeElementScreenshot('amp-carousel', `slides-${env.capability}-page-3-prev.png`);
    // Click the next button to move to next page
    await env.prevButton.click();
    // Do same thing as above
    await browser.wait(until.elementLocated(By.css('[title="Previous item in carousel (1 of 4)"]')));
    // SLIDE 2
    // Wait for img tag of amp-img to be loaded, we want the screenshot to actually have the image.
    fs.writeFileSync('temp.html', await browser.findElement(By.css('body')).getAttribute('innerHTML'));
    await env.ampImgInjector.waitForLoad('#img-1');
    // Take a screenshot for the trip that goes back
    await env.screenShotManager.takeElementScreenshot('amp-carousel', `slides-${env.capability}-page-2-prev.png`);
    // Click the next button to move to next page
    await env.prevButton.click();
    // Do same thing as above
    await browser.wait(until.elementLocated(By.css('[title="Next item in carousel (2 of 4)"]')));
    // SLIDE 1
    // Take a screenshot for the trip that goes back
    await env.screenShotManager.takeElementScreenshot('amp-carousel', `slides-${env.capability}-page-1-prev.png`);
  });

  it('should allow scroll operations', async (browser, env) => {
    // Ensure buttons are ready
    await waitForButtons(browser, env);
    // Initially, we just wait for next button to be visible
    await browser.wait(until.elementIsVisible(env.nextButton));

    // amp-carousel uses scroll to move, instead of touchmove!
    // NOTICE: this only works for chrome...
    // The firefox version could NOT yet be implemented:
    // 1. driver.actions() seems does not offer an easy way for scroll
    // 2. firefox throws on pointerType == TOUCH
    await helper.touch.scrollFromElement(browser, '.i-amphtml-slides-container', {
      x: 300,
      y: -10,
    }, true);

    // Ensure we are at the second slide
    await browser.wait(until.elementLocated(By.css('[title="Next item in carousel (3 of 4)"]')));
    // Wait for image
    await env.ampImgInjector.waitForLoad('#img-1');
    // Take a screenshot
    await env.screenShotManager.takeElementScreenshot('amp-carousel', `slides-${env.capability}-scroll.png`);

    // NOTICE: the following is the original wrong implementation. Kept for future reference.
    /*
    // Generate 4 points that are used for dragging (they are not actually topLeft, etc. Just somewhere close to there, 10 is a magic offset)
    const carouselRect = await browser.findElement(By.css('amp-carousel')).getRect();
    const touchPoints = {
      topLeft: {x: carouselRect.x + 10, y: carouselRect.y + 10},
      right: {x: carouselRect.x + carouselRect.width - 50, y: 0},
      left: {x: carouselRect.x + 50, y: 0},
      topRight: {x: carouselRect.x + carouselRect.width - 10, y: carouselRect.y + 10},
      bottomLeft: {x: carouselRect.x + 10, y: carouselRect.y + carouselRect.height - 10},
      bottomRight: {x: carouselRect.x + carouselRect.width - 10, y: carouselRect.y + carouselRect.height - 10},
    };
    // Swipe from top left to bottom right, should advance to next slide
    await helper.touch.swipe(browser, {
      start: touchPoints.right,
      end: touchPoints.left,
      duration: 500,
    }, true);
    */
  });
}).timeout(2000000);
