const {By} = require('selenium-webdriver');

/**
 * Wait until an element disappears.
 * 
 * @param {ThenableDriver} browser driver
 * @param {string} selector CSS selector
 */
async function whileLocated(browser, selector, timeout = 10000) {
  await browser.wait(async () => {
    const matchingElementArr = await browser.findElements(By.css(selector));
    return matchingElementArr.length === 0;
  }, timeout, `The element [${selector}] was still present when it should have disappeared.`);
}

/**
 * Wait for certain milliseconds
 * 
 * @param {number} timeout timeout in milliseconds
 */
async function forMS(timeout) {
  await new Promise(resolve => setTimeout(resolve, timeout));
}

module.exports = {
  whileLocated,
  forMS,
};
