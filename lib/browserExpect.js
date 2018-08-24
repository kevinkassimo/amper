const {By, until} = require('selenium-webdriver');

/**
 * This is originally intended for creating expect sentences like this one:
 *
 * domOf(browser).expect('css-selector').to.not.haveClass('someClass')
 *
 * It originally intended as an updated clone of chai-webdriver
 * However, since we are shifting focus to majorly on the visual-diff
 * This might not be needed.
 *
 * The file is kept for future reference.
 */

class BrowserExpectFactory {
  constructor(browser) {
    this.browser = browser;
  }

  DOM() {
    return new BrowserDOMExpect(this.browser);
  }
}

class BrowserDOMExpect {
  constructor(browser) {
    this.browser = browser;
    this.selector = null;
    this.reversed = false;
  }

  expect(selector) {
    this.selector = selector;
    return this;
  }

  get to() {
    this.reversed = false;
    return this;
  }

  get not() {
    this.reversed = true;
    return this;
  }

  createReturn(shouldNotSucceedMessage, shouldNotFailMessage) {
    return (cond) => {
      if (cond) {
        if (this.reversed) {
          throw new Error(shouldNotSucceedMessage);
        }
      } else {
        if (!this.reversed) {
          throw new Error(shouldNotFailMessage);
        }
      }
    }
  }

  async elementGetter_() {
    const element = await this.browser.findElement(By.css(this.selector));
    if (!element) {
      throw new Error(`Element with selector '${this.selector}' could not be found.`);
    }
    return element;
  }

  async haveClass(className) {
    const element = await this.elementGetter_();
    const ret = this.createReturn(
      `Element '${this.selector}' should not have class '${className}'`,
      `Element '${this.selector}' should have class '${className}'`,
    );

    const classNames = await element.getAttribute('class');
    if (!classNames) {
      return ret(false);
    }
    const classList = classNames.split(' ');
    return ret(classList.indexOf(className) >= 0);
  }
}

module.exports = {
  domOf: (browser) => {
    return new BrowserExpectFactory(browser).DOM();
  },
};
