const fs = require('fs');
const {By, ThenableWebDriver} = require('selenium-webdriver');
const Jimp = require('jimp');

/**
 * Manage taking screenshots
 */
class ScreenShotManager {
  /**
   * Initialize manager
   * @param {ThenableWebDriver} browser driver
   * @param {string} dir directory to save screenshots, relative to $NODE_PATH/screenshots
   * @param {WebElement|null} baseElement base element where selector query will be conducted. This is to support shadow dom query element.
   */
  constructor(browser, dir, baseElement = null) {
    this.browser = browser;
    this.dir = `${process.env.NODE_PATH}/screenshots/${dir}`;
    if (!fs.existsSync(`${process.env.NODE_PATH}/screenshots`)) {
      fs.mkdirSync(`${process.env.NODE_PATH}/screenshots`);
    }
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir);
    }
    this.baseElement = baseElement;
  }

  /**
   * Resize window to prepare for taking a screenshot
   * @param {Object} rect rect for window to resize to
   */
  async setWindowSize(rect) {
    await this.browser.manage().window().setRect(rect);
  }

  /**
   * Set base element for future takeElementScreenshot selector query
   * @param {WebElement} baseElement base element for future takeElementScreenshot selector query
   */
  setSelectorBase(baseElement) {
    this.baseElement = baseElement;
  }

  /**
   * Take screenshot for element on page
   * @param {*} selector CSS selector for element
   * @param {*} filename filename to save the screenshot
   * @param {boolean} useWebElementAPI use WebElement.takeScreenshot(scroll) (would not work for chrome)
   */
  async takeElementScreenshot(selector, filename, useWebElementAPI = false) {
    const selectorBase = this.baseElement || this.browser;

    if (useWebElementAPI) {
      // Only works in firefox. Do not use it!
      const element = await selectorBase.findElement(By.css(selector));
      const fullFileName = `${this.dir}/${filename}`;
      fs.writeFileSync(fullFileName, await element.takeScreenshot(true), 'base64');
      return;
    }

    const fullFileName = `${this.dir}/${filename}`;
    fs.writeFileSync(fullFileName, await this.browser.takeScreenshot(), 'base64');
    const elementRect = await selectorBase.findElement(By.css(selector)).getRect();
    let image = await Jimp.read(fullFileName);
    await image.crop(
      elementRect.x,
      elementRect.y,
      elementRect.width,
      elementRect.height
    );
    await image.write(fullFileName);
  }

  /**
   * Take a screenshot (probably viewport or page, depends on drivers)
   */
  async takeScreenshot(filename) {
    const fullFileName = `${this.dir}/${filename}`;
    fs.writeFileSync(fullFileName, await this.browser.takeScreenshot(), 'base64');
  }
}

module.exports = {
  ScreenShotManager,
};
