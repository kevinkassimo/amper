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

describe.withCapabilities(['mobile-chrome'], 'amp-carousel[type=slides] no-controls', () => {
  beforeEach(async (browser, env) => {
    await browser.get('http://localhost:8080/amp-carousel/slides-no-controls.amp.html');
    env.ampImgInjector = new AmpImgInjector(browser);
    await env.ampImgInjector.injectLoadScript();
    env.screenShotManager = new ScreenShotManager(browser, 'amp-carousel');
  });

  it('should fade buttons', async (browser, env) => {
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
}).timeout(20000);