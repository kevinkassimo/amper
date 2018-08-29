const fs = require('fs');
const {By} = require('selenium-webdriver');
const Jimp = require('jimp');

/**
 * Manage taking screenshots
 */
class ScreenShotManager {
  /**
   * Initialize manager
   * @param {ThenableDriver} browser driver
   * @param {string} dir directory to save screenshots, relative to $NODE_PATH/screenshots
   */
  constructor(browser, dir) {
    this.browser = browser;
    this.dir = `${process.env.NODE_PATH}/screenshots/${dir}`;
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir);
    }
  }

  /**
   * Resize window to prepare for taking a screenshot
   * @param {Object} rect rect for window to resize to
   */
  async setWindowSize(rect) {
    await this.browser.manage().window().setRect(rect);
  }

  /**
   * Take screenshot for element on page
   * @param {*} selector CSS selector for element
   * @param {*} filename filename to save the screenshot
   * @param {boolean} useWebElementAPI use WebElement.takeScreenshot(scroll) (would not work for chrome)
   */
  async takeElementScreenshot(selector, filename, useWebElementAPI = false) {
    if (useWebElementAPI) {
      // Only works in firefox. Do not use it!
      const element = await this.browser.findElement(By.css(selector));
      const fullFileName = `${this.dir}/${filename}`;
      fs.writeFileSync(fullFileName, await element.takeScreenshot(true), 'base64');
      return;
    }

    const fullFileName = `${this.dir}/${filename}`;
    fs.writeFileSync(fullFileName, await this.browser.takeScreenshot(), 'base64');
    const elementRect = await this.browser.findElement(By.css(selector)).getRect();
    let image = await Jimp.read(fullFileName);
    await image.crop(
      elementRect.x,
      elementRect.y,
      elementRect.width,
      elementRect.height
    );
    await image.write(fullFileName);
  }
}

module.exports = {
  ScreenShotManager,
};
