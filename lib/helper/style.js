const {By, ThenableDriver} = require('selenium-webdriver');

/**
 * Get style property of an element
 * @param {ThenableDriver} browser driver
 * @param {string} selector CSS selector for element
 * @returns {Promise<Object|null>} style
 */
async function getStyles(browser, selector) {
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
async function getComputedStyles(browser, selector) {
  return JSON.parse(await browser.executeScript(function(selector) {
    var el = document.querySelector(selector);
    var style = el ? window.getComputedStyle(el) : null;
    return JSON.stringify(style);
  }, selector));
}

/**
 * Get single style property of an element by name
 * @param {ThenableDriver} browser driver
 * @param {string} selector CSS selector for element
 * @param {string} name name of style rule we want
 * @returns {Promise<any>} style
 */
async function getStyleByName(browser, selector, name) {
  return JSON.parse(await browser.executeScript(function(selector, name) {
    var el = document.querySelector(selector);
    var style = el ? el.style : null;
    return style[name];
  }, selector, name));
}

/**
 * Get single computed style of an element by name
 * @param {ThenableDriver} browser driver
 * @param {string} selector CSS selector for element
 * @param {string} name name of style rule we want
 * @returns {Promise<any>} computedStyle
 */
async function getComputedStyleByName(browser, selector, name) {
  return JSON.parse(await browser.executeScript(function(selector, name) {
    var el = document.querySelector(selector);
    var style = el ? window.getComputedStyle(el) : null;
    return style[name];
  }, selector, name));
}

module.exports = {
  getStyles,
  getComputedStyles,
  getStyleByName,
  getComputedStyleByName,
};
