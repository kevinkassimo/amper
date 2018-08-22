const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const safari = require('selenium-webdriver/safari');

const registerdCapabilities = require('../capabilities');

/**
 * @typedef {{
 *   type: string
 *   driver: ThenableWebDriver
 * }}
 */
let DriverInfo;

// Options
const chromeOptions = new chrome.Options();
chromeOptions.addArguments('--headless');

const firefoxOptions = new firefox.Options();
firefoxOptions.addArguments('--headless');
// Safari cannot be headless
const safariOptions = new safari.Options();

class SyncDriverRunner {
  constructor(driverInfos) {
    this.driverInfos = driverInfos;
    this.runnerPromises = [];
  }

  run(cb) {
    this.driverInfos.forEach((driverInfo) => {
      cb(driverInfo.type, driverInfo.driver, resolve);
    });
  }
}

class SyncDrivers {
  constructor(caps) {
    this.driverInfos = {};
    caps.forEach((cap) => {
      if (!(cap in this.driverInfos)) {
        // Capability not exist
        if (!(cap in registerdCapabilities)) {
          throw new Error(`Cannot find capabilities for ${cap}`);
        }
        const driver = new webdriver.Builder()
          .withCapabilities(registerdCapabilities[cap])
          .setChromeOptions(chromeOptions)
          .setFirefoxOptions(firefoxOptions)
          .setSafariOptions(safariOptions)
          .build();
        this.driverInfos[cap] = {
          type: cap,
          driver,
        };
      }
      return this.driverInfos[cap];
    });
  }
  
  cleanup() {
    for (let type in this.driverInfos) {
      this.driverInfos[type].driver.quit();
      delete this.driverInfos[type];
    }
  }
}

module.exports = {
  SyncDrivers,
}
