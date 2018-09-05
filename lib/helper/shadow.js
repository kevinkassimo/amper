const {WebElement, ThenableBrowser} = require('selenium-webdriver');

/**
 * Get shadow root out of attached element
 * @param {ThenableBrowser} browser driver
 * @param {WebElement} element element where shadowRoot resides on
 * @returns {WebElement} element for shadow root
 */
async function getRootFrom(browser, element) {
  return await browser.executeScript(function(el) {
    return el.shadowRoot;
  }, element);
}

module.exports = {
  getRootFrom,
};
