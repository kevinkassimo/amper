const {ThenableDriver} = require('selenium-webdriver');

/**
 * Scroll page to, based on options (same as window.scroll's options);
 * @param {ThenableDriver} browser driver
 * @param {Object} options options for window.scroll
 */
async function pageTo(browser, options) {
  await browser.executeScript(function(optionsString) {
    var options = JSON.parse(optionsString);
    window.scroll(options);
  }, JSON.stringify(options));
}

module.exports = {
  pageTo,
};
