const {By, until} = require('selenium-webdriver');

const {AmpImgInjector} = require('../../lib/injector');
const {ScreenShotManager} = require('../../lib/screenshot');
const helper = require('../../lib/helper');

async function waitForButtons(browser, env) {
  const prevButtonSelector = By.css('#slides .amp-carousel-button.amp-carousel-button-prev');
  const nextButtonSelector = By.css('#slides .amp-carousel-button.amp-carousel-button-next');
  await browser.wait(until.elementLocated(prevButtonSelector));
  await browser.wait(until.elementLocated(nextButtonSelector));
  env.prevButton = await browser.findElement(prevButtonSelector);
  env.nextButton = await browser.findElement(nextButtonSelector);
}

describe.withCapabilities(['mobile-chrome'], 'amp-carousel[type=slides] no-controls', () => {
  beforeEach(async (browser, env) => {
    await browser.get('http://localhost:8080/amp-carousel/slides-no-controls.amp.html');
    env.ampImgInjector = new AmpImgInjector(browser);
    await env.ampImgInjector.injectLoadScript();
    env.screenShotManager = new ScreenShotManager(browser, 'amp-carousel');
  });

  // This is a basic test that ensures that buttons would EVENTUALLY be hidden
  it('should fade buttons eventually', async (browser, env) => {
    // Ensure buttons are ready
    await waitForButtons(browser, env);

    await browser.wait(async () => {
      return await browser.executeScript(function (prevButton, nextButton) {
        // Remember to convert to Number first!
        return !+window.getComputedStyle(prevButton).opacity && !+window.getComputedStyle(nextButton).opacity;
      }, env.prevButton, env.nextButton);
    });

    await env.screenShotManager.takeScreenshot(`slides-no-control-${env.capability}.png`);
  });

  // Goal: ensure that the buttons does NOT immediately fade, but still fade after 4 seconds
  // This test FLAKES
  it('should fade buttons in about 4 seconds', async (browser, env) => {
    // Ensure buttons are ready
    await waitForButtons(browser, env);

    // Wait for 2 seconds
    await helper.wait.forMS(2000);

    // This is the rare scenario where we will be using an `expect`.
    // This is due to if we were to take screenshots for comparison here,
    // The screenshot may differ EVERY single run
    // This is unfortunate: we are violating quite a bit principles here
    // If used in actual tests, REQUIRES CLEAR COMMENTS about what we are testing here!

    // We expect the animation has not yet been completed (animation class name still present)
    expect((await browser.findElement(By.css('body')).getAttribute('class')).split(' ').includes('i-amphtml-carousel-button-start-hint'));

    // Wait for another 3 seconds (slightly longer)
    await helper.wait.forMS(3000);

    // We now take a screenshot
    await env.screenShotManager.takeScreenshot(`slides-no-control-after-fade-${env.capability}.png`);
  });
}).timeout(20000);