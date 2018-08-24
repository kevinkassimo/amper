const fs = require('fs');
const {By, until} = require('selenium-webdriver');
const Jimp = require('jimp');

// So, one thing I noticed it that there is a library called 'chai-webdriver'
// It offers a really nice expect format.
// However, it has not been updated for 2 years, during which webdriverjs dropped
// support for promise manager.
// Nevertheless, it will still be interesting to check out.

function createDirIfNeeded(dirName) {
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName);
  }
}

async function setWindowSize(browser, env) {
  await browser.manage().window().setRect({
    height: 500,
    width: 800,
    x: 0,
    y: 0,
  });
}

// Prereq: ensure that 
async function takeElementScreenshot(fileDir, fileName, bySelector, browser, env) {
  createDirIfNeeded(fileDir);
  const fullFileName = `${fileDir}/${fileName}`;
  fs.writeFileSync(fullFileName, await browser.takeScreenshot(), 'base64');
  const elementRect = await browser.findElement(bySelector).getRect();
  let image = await Jimp.read(fullFileName);
  await image.crop(
    elementRect.x,
    elementRect.y,
    elementRect.width,
    elementRect.height
  );
  await image.write(fullFileName);
}

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
    // Make a decent window size for screenshots.
    // It turns out this matters pretty much for different components.
    // It is suggested that on HTML side, add proper CSS rules to make things simpler
    // Also, it is suggested that different carousel for testing sit on a different page
    await setWindowSize(browser);
    await browser.get('http://localhost:8080/amp-carousel/slides.amp.html');
    await browser.findElement(By.css('amp-carousel[type="slides"]'));
  });

  afterEach(async (browser, env) => {
  });

  it('should load carousel', async (browser, env) => {
    createDirIfNeeded('screenshots/amp-carousel');
    await takeElementScreenshot('screenshots/amp-carousel', `slides-${env.capability}-page-2.png`, By.css('amp-carousel'), browser, env);
  });

  // For functional testing, we are more focusing on reproducible end results that are similar to what users will actually get.
  // We are more focusing on getting the final slide state visual changes compared to animation process
  it('should be able to navigate through carousel', async (browser, env) => {
    // Ensure buttons are ready
    await waitForButtons(browser, env);
    // Initially, we just wait for next button to be visible
    await browser.wait(until.elementIsVisible(env.nextButton));
    // SLIDE 1
    // Take a screenshot
    await takeElementScreenshot('screenshots/amp-carousel', `slides-${env.capability}-page-1.png`, By.css('amp-carousel'), browser, env);
    // Click the next button to move to next page
    await env.nextButton.click();
    // Slide change would result in title for accessibility to change correspondingly
    // Another option: inject script, listen for `slidescroll.slideChange` event, and triggers DOM change correspondingly
    // (in a way, title is basically doing what we may want to create manually for injecting code)
    // Both options above are guaranteed to happen only after animation complete.
    await browser.wait(until.elementLocated(By.css('[title="Next item in carousel (3 of 4)"]')));
    // SLIDE 2
    // Take a screenshot
    await takeElementScreenshot('screenshots/amp-carousel', `slides-${env.capability}-page-2.png`, By.css('amp-carousel'), browser, env);
    // Click the next button to move to next page
    await env.nextButton.click();
    // Do same thing as above
    await browser.wait(until.elementLocated(By.css('[title="Next item in carousel (4 of 4)"]')));
    // SLIDE 3
    // Take a screenshot
    await takeElementScreenshot('screenshots/amp-carousel', `slides-${env.capability}-page-3.png`, By.css('amp-carousel'), browser, env);
    // Click the next button to move to next page
    await env.nextButton.click();
    // Do same thing as above
    await browser.wait(until.elementLocated(By.css('[title="Previous item in carousel (3 of 4)"]')));
    // SLIDE 4
    // Take a screenshot
    await takeElementScreenshot('screenshots/amp-carousel', `slides-${env.capability}-page-4.png`, By.css('amp-carousel'), browser, env);
    // Click the next button to move to next page
    await env.prevButton.click();
    // Do same thing as above
    await browser.wait(until.elementLocated(By.css('[title="Previous item in carousel (2 of 4)"]')));
    // SLIDE 3
    // Take a screenshot for the trip that goes back
    await takeElementScreenshot('screenshots/amp-carousel', `slides-${env.capability}-page-3-prev.png`, By.css('amp-carousel'), browser, env);
    // Click the next button to move to next page
    await env.prevButton.click();
    // Do same thing as above
    await browser.wait(until.elementLocated(By.css('[title="Previous item in carousel (1 of 4)"]')));
    // SLIDE 2
    // Take a screenshot for the trip that goes back
    await takeElementScreenshot('screenshots/amp-carousel', `slides-${env.capability}-page-2-prev.png`, By.css('amp-carousel'), browser, env);
    // Click the next button to move to next page
    await env.prevButton.click();
    // Do same thing as above
    await browser.wait(until.elementLocated(By.css('[title="Next item in carousel (2 of 4)"]')));
    // SLIDE 1
    // Take a screenshot for the trip that goes back
    await takeElementScreenshot('screenshots/amp-carousel', `slides-${env.capability}-page-1-prev.png`, By.css('amp-carousel'), browser, env);
  });
}).timeout(20000);
