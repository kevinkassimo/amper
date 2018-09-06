const {By} = require('selenium-webdriver');

const {AmpImgInjector} = require('../../lib/injector');
const {ScreenShotManager} = require('../../lib/screenshot');
const helper = require('../../lib/helper');

describe.exceptForCapabilities(['mobile-chrome'], 'amp-carousel[type=slides] single slide', () => {
  beforeEach(async (browser, env) => {
    // It is suggested that on HTML side, add proper CSS rules to make things simpler
    // Also, it is suggested that different carousel for testing sit on a different page
    await browser.get('http://localhost:8080/amp-carousel/slides-single.amp.html');
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

  it('should not have prev/next buttons shown', async (browser, env) => {
    // In theory, we could just wait for the slider to set the button titles.
    // HOWEVER, we are not guaranteed if the behavior would persist in future releases
    // Instead, we wait for the image we want to load
    await env.ampImgInjector.waitForLoad('#img-1');
    // And then wait for an extra second
    await helper.wait.forMS(1000);
    // And then take a screenshot
    await env.screenShotManager.takeElementScreenshot('amp-carousel', `slides-single-no-buttons-${env.capability}.png`);
  });
});
