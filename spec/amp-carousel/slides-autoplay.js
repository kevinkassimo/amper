const {By, until} = require('selenium-webdriver');

const {AmpImgInjector} = require('../../lib/injector');
const {ScreenShotManager} = require('../../lib/screenshot');

describe('amp-carousel[type=slides] autoplay', () => {
  beforeEach(async (browser, env) => {
    await browser.get('http://localhost:8080/amp-carousel/slides-autoplay.amp.html');
    env.ampImgInjector = new AmpImgInjector(browser);
    await env.ampImgInjector.injectLoadScript();
    env.screenShotManager = new ScreenShotManager(browser, 'amp-carousel');
    // Make a decent window size for screenshots.
    await env.screenShotManager.setWindowSize({
      height: 600,
      width: 800,
      x: 0,
      y: 0,
    });
  });

  /**
   * We are having some issues with autoplay in testing.
   * If we were to place the autoplaying carousel directly on HTML side,
   * we have no guarantee which slide it would be displaying when our code start to run.
   * Even if we inject the element dynamically, we would still have no idea if webdriver commands would return
   * before the carousel autoplays and goes to next slide (though not likely). 
   * The nature that webdriver commands are just HTTP requests worsen the problem
   * and make the test far more flaky.
   */
  it('should autoplay', async (browser, env) => {
    // THIS FLAKES BADLY
    // Wait for element load
    // await browser.wait(until.elementLocated(By.css('[title="Next item in carousel (2 of 3)"]')));
    // Wait for first slide
    await env.ampImgInjector.waitForLoad('#img-1');
    // Take a screenshot
    await env.screenShotManager.takeElementScreenshot('amp-carousel', `slides-autoplay-${env.capability}-page-1.png`);
    // Click button to start autoplay
    await browser.findElement(By.css('#toggler')).click();
    // Wait for next slide
    await browser.wait(until.elementLocated(By.css('[title="Next item in carousel (3 of 3)"]')));
    // Wait for image to load
    await env.ampImgInjector.waitForLoad('#img-2');
    // Take a screenshot
    await env.screenShotManager.takeElementScreenshot('amp-carousel', `slides-autoplay-${env.capability}-page-2.png`);
    // Wait for next slide
    await browser.wait(until.elementLocated(By.css('[title="Next item in carousel (1 of 3)"]')));
    // Wait for image to load
    await env.ampImgInjector.waitForLoad('#img-3');
    // Take a screenshot
    await env.screenShotManager.takeElementScreenshot('amp-carousel', `slides-autoplay-${env.capability}-page-3.png`);
    // Wait for next slide (loop)
    await browser.wait(until.elementLocated(By.css('[title="Next item in carousel (2 of 3)"]')));
    // Wait for image to load
    await env.ampImgInjector.waitForLoad('#img-1');
    // Take a screenshot
    await env.screenShotManager.takeElementScreenshot('amp-carousel', `slides-autoplay-${env.capability}-repeat-page-1.png`);
  });
}).timeout(20000);