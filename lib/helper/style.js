const {By, ThenableDriver} = require('selenium-webdriver');

/**
 * Get style property of an element
 * @param {ThenableDriver} browser driver
 * @param {*} selector CSS selector for element
 * @returns {Promise<Object|null>} style
 */
async function getStyle(browser, selector) {
  return JSON.parse(await browser.executeScript(function(selector) {
    var el = document.querySelector(selector);
    var style = el ? el.style : null;
    return JSON.stringify(style);
  }, selector));
}

/**
 * Get computed style of an element
 * @param {ThenableDriver} browser driver
 * @param {string} selector CSS selector for element
 * @returns {Promise<Object|null>} computedStyle
 */
async function getComputedStyle(browser, selector) {
  return JSON.parse(await browser.executeScript(function(selector) {
    var el = document.querySelector(selector);
    var style = el ? window.getComputedStyle(el) : null;
    return JSON.stringify(style);
  }, selector));
}

module.exports = {
  getStyle,
  getComputedStyle,
};
