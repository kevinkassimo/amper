const {By, until} = require('selenium-webdriver');

const {AmpImgInjector} = require('../../lib/injector');
const {ScreenShotManager} = require('../../lib/screenshot');

async function waitForButtons(browser, env) {
  const prevButtonSelector = By.css('#slides .amp-carousel-button.amp-carousel-button-prev');
  const nextButtonSelector = By.css('#slides .amp-carousel-button.amp-carousel-button-next');
  await browser.wait(until.elementLocated(prevButtonSelector));
  await browser.wait(until.elementLocated(nextButtonSelector));
  env.prevButton = await browser.findElement(prevButtonSelector);
  env.nextButton = await browser.findElement(nextButtonSelector);
}

describe.withCapabilities(['chrome'], 'amp-carousel[type=slides loop]', () => {
  beforeEach(async (browser, env) => {
    // It is suggested that on HTML side, add proper CSS rules to make things simpler
    // Also, it is suggested that different carousel for testing sit on a different page
    await browser.get('http://localhost:8080/amp-carousel/slides-loop.amp.html');
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

  it('should be able to navigate through loopable carousel', async (browser, env) => {
    // Ensure buttons are ready
    await waitForButtons(browser, env);
    // Initially, we just wait for prev and next button to be visible
    await browser.wait(until.elementIsVisible(env.prevButton));
    await browser.wait(until.elementIsVisible(env.nextButton));
    // SLIDE 1
    // Wait for img tag of amp-img to be loaded, we want the screenshot to actually have the image.
    // This `amper-amp-img-loaded` attribute is injected in HTML file (injected when 'load' event is triggered).
    // We are explicitly doing this, since the above await only guarantees correct slides to be displayed
    // But no guarantee for img to be loaded
    await env.ampImgInjector.waitForLoad('#img-1');
    // Take a screenshot
    await env.screenShotManager.takeElementScreenshot('amp-carousel', `slides-loop-${env.capability}-page-1.png`);
    // Click the next button to move to next page
    await env.nextButton.click();
    // Do same thing as above
    await browser.wait(until.elementLocated(By.css('[title="Next item in carousel (3 of 3)"]')));
    // SLIDE 2
    // Wait for img tag of amp-img to be loaded, we want the screenshot to actually have the image.
    await env.ampImgInjector.waitForLoad('#img-2');
    // Take a screenshot
    await env.screenShotManager.takeElementScreenshot('amp-carousel', `slides-loop-${env.capability}-page-2.png`);
    // Click the next button to move to next page
    await env.nextButton.click();
    // Do same thign as above
    await browser.wait(until.elementLocated(By.css('[title="Next item in carousel (1 of 3)"]')));
    // SLIDE 3
    // Wait for img tag of amp-img to be loaded, we want the screenshot to actually have the image.
    await env.ampImgInjector.waitForLoad('#img-3');
    // Take a screenshot
    await env.screenShotManager.takeElementScreenshot('amp-carousel', `slides-loop-${env.capability}-page-3.png`);
    // Click the next button to move to next page
    await env.nextButton.click();
    // Do same thign as above
    await browser.wait(until.elementLocated(By.css('[title="Next item in carousel (2 of 3)"]')));
    // SLIDE 1 AGAIN
    // Take a screenshot
    await env.screenShotManager.takeElementScreenshot('amp-carousel', `slides-loop-${env.capability}-page-1-again.png`);
    // Click the next button to move to next page
    await env.prevButton.click();
    // Do same thign as above
    await browser.wait(until.elementLocated(By.css('[title="Next item in carousel (1 of 3)"]')));
    // SLIDE 3 AGAIN
    // Take a screenshot
    await env.screenShotManager.takeElementScreenshot('amp-carousel', `slides-loop-${env.capability}-page-3-again.png`);
  });
});
