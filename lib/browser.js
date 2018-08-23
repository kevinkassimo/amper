const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const safari = require('selenium-webdriver/safari');

const {capabilities: registerdCapabilities} = require('../config');

const {
  info, warning, error, ok,
  writeInfo, writeWarning, writeError, writeOk,
} = require('./log');

// Options
const chromeOptions = new chrome.Options();
chromeOptions.addArguments('--headless');
const firefoxOptions = new firefox.Options();
firefoxOptions.addArguments('--headless');
// Safari cannot be headless
const safariOptions = new safari.Options();

/**
 * Create the real browser instance
 * @param {string} cap 
 */
function createBrowser(cap) {
  return new webdriver.Builder()
    .withCapabilities(cap)
    .setChromeOptions(chromeOptions)
    .setFirefoxOptions(firefoxOptions)
    .setSafariOptions(safariOptions)
    .build();
}

/**
 * Instance of a browser
 * Wrapping the real browser and connection to the group it belongs
 */
class BrowserInstance {
  /**
   * Create a new wrapper instance
   * @param {string} capName 
   * @param {BrowserGroups} groups 
   */
  constructor(capName, groups) {
    if (!(capName in registerdCapabilities)) {
      throw new Error(`Capability ${capName} not found.`);
    }
    const cap = registerdCapabilities[capName];
    this.capName_ = capName;
    this.browser_ = createBrowser(cap);
    this.groups_ = groups;
  }

  /**
   * Run a specific task
   * This will wait for the task to complete
   * @param {Task} task 
   */
  async runTask(task) {
    this.groups_.setBusy(this.capName_, this);
    try {
      await task.run(this.browser_);
      this.groups_.setFree(this.capName_, this);
    } catch (e) {
      this.groups_.setFree(this.capName_, this);
      throw e;
    }
  }

  /**
   * Kill the browser
   */
  async quit() {
    await this.browser_.quit();
  }
}

/**
 * Controlling a group of browsers
 * for scheduling tasks
 */
class BrowserGroups {
  /**
   * Create a new BrowserGroups
   */
  constructor() {
    this.browserMap = {};
    this.vacancyMap = {};
    this.pendingTaskMap = {};
  }

  /**
   * Remove browser from vacancy
   * @param {string} capName 
   * @param {BrowserInstance} instance 
   */
  setBusy(capName, instance) {
    let indexInVacancy = this.vacancyMap[capName].indexOf(instance);
    if (indexInVacancy >= 0) {
      this.vacancyMap[capName].splice(indexInVacancy, 1);
    }
  }

  /**
   * Notify that this browser is free
   * Either push to vacancyMap for future tasks to use
   * Or immediately run a pending task
   * @param {string} capName name of capacity
   * @param {BrowserInstance} instance BrowserInstance to be set free
   */
  setFree(capName, instance) {
    if (this.pendingTaskMap[capName].length > 0) {
      // So obviously, I thought Array.splice returns an element...
      // But it is NOT... It returns an array...
      const task = this.pendingTaskMap[capName].splice(0, 1)[0];
      instance.runTask(task);
    } else {
      if (this.vacancyMap[capName].indexOf(instance) < 0) {
        this.vacancyMap[capName].push(instance);
      }
    }
  }

  /**
   * Add certain number of browsers to the management group
   * @param {string} capName 
   * @param {number} count 
   */
  addBrowserInstances(capName, count) {
    let instances = [];
    for (let i = 0; i < count; i++) {
      instances.push(new BrowserInstance(capName, this));
    }
    let capGroup = this.browserMap[capName];
    this.browserMap[capName] = capGroup ? capGroup.concat(instances) : instances.slice();
    let vacancyGroup = this.vacancyMap[capName];
    this.vacancyMap[capName] = vacancyGroup ? vacancyGroup.concat(instances): instances.slice();
    if (!this.pendingTaskMap[capName]) {
      this.pendingTaskMap[capName] = [];
    }
  }

  /**
   * Dispatch task if there is vacant browser
   * Otherwise, push to the pendingTaskMap for free browsers to pick up
   * @param {Task} task 
   */
  dispatchTask(task) {
    const candidateBrowsers = this.vacancyMap[task.capName];
    if (candidateBrowsers && candidateBrowsers.length > 0) {
      const selectedBrowser = candidateBrowsers[0];
      this.setBusy(task.capName, candidateBrowsers[0]);
      selectedBrowser.runTask(task);
      return;
    }
    // Task not ready
    this.pendingTaskMap[task.capName].push(task);
  }

  /**
   * Kill all browsers
   */
  async cleanup() {
    for (let capName in this.browserMap) {
      console.log(`Shutting down ${capName}...`);
      this.browserMap[capName].forEach(async instance => await instance.quit());
    }
  }
}

module.exports = {
  BrowserInstance,
  BrowserGroups,
};
