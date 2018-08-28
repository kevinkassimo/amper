const fs = require('fs');
const {By} = require('selenium-webdriver');
const Jimp = require('jimp');

class ScreenShotManager {
  constructor(browser, dir) {
    this.browser = browser;
    this.dir = `${process.env.NODE_PATH}/screenshots/${dir}`;
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir);
    }
  }

  async setWindowSize(rect) {
    await this.browser.manage().window().setRect(rect);
  }

  async takeElementScreenshot(selector, filename) {
    const fullFileName = `${this.dir}/${filename}`;
    fs.writeFileSync(fullFileName, await this.browser.takeScreenshot(), 'base64');
    const elementRect = await this.browser.findElement(By.css(selector)).getRect();
    let image = await Jimp.read(fullFileName);
    // console.log(elementRect);
    // console.log(await this.browser.manage().window().getRect());
    await image.crop(
      elementRect.x,
      elementRect.y,
      elementRect.width,
      elementRect.height
    );
    // await image.write(fullFileName);
  }
}

module.exports = {
  ScreenShotManager,
};
