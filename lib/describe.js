const chai = require('chai');
const importFresh = require('import-fresh');
const {Task, Reporter} = require('./taskReport');
const {domOf} = require('./browserExpect')

/**
 * Create a basic test suite
 */
class TestSuite {
  /**
   * Create a new test suite.
   * @param {string} name Name of the test suite
   * @param {string} capName Name of capability
   * @param {Reporter} reporter Reporter to report success and failure
   */
  constructor(name, capName, reporter = null) {
    this.name = name;
    this.capName = capName;
    this.beforeEach = null;
    this.afterEach = null;
    this.reporter = reporter;
    this.timeout = 10000; // default 10 seconds

    this.setBeforeEach = this.setBeforeEach.bind(this);
    this.setAfterEach = this.setAfterEach.bind(this);
  }

  /**
   * Set beforeEach of the suite
   * @param {function(ThenableBrowser, ?Object)} cb beforeEach callback
   */
  setBeforeEach(cb) {
    this.beforeEach = async (browser, env) => {
      return new Promise(async (resolve, reject) => {
        const timeoutHandle = setTimeout(() => {
          reject(new Error(`<beforeEach>: Timeout ${this.timeout} reached.`));
        }, this.timeout);
        try {
          await cb(browser, env);
          clearTimeout(timeoutHandle);
          resolve();
        } catch (e) {
          clearTimeout(timeoutHandle);
          reject(e);
        }
      });
    };
  }

  /**
   * Set afterEach of the suite
   * @param {function(ThenableBrowser, ?Object)} cb afterEach callback 
   */
  setAfterEach(cb) {
    this.afterEach = async (browser, env) => {
      return new Promise(async (resolve, reject) => {
        const timeoutHandle = setTimeout(() => {
          reject(new Error(`<afterEach>: Timeout ${this.timeout} reached.`));
        }, this.timeout);
        try {
          await cb(browser, env);
          clearTimeout(timeoutHandle);
          resolve();
        } catch (e) {
          clearTimeout(timeoutHandle);
          reject(e);
        }
      });
    };
  }
}

class TestUnit {
  /**
   * Create a test unit
   * @param {string} name name of this unit
   * @param {*} callback 
   * @param {TestSuite} suite suite this test belongs to
   */
  constructor(name, callback, suite) {
    this.name = name;
    this.suite = suite;
    this.callback = async (browser, env) => {
      return new Promise(async (resolve, reject) => {
        const timeoutHandle = setTimeout(() => {
          reject(new Error(`${name}: Timeout ${this.suite.timeout} reached.`));
        }, this.suite.timeout);
        try {
          await callback(browser, env);
          clearTimeout(timeoutHandle);
          resolve();
        } catch (e) {
          clearTimeout(timeoutHandle);
          reject(e);
        }
      });
    };
  }

  /**
   * Set TestSuite of current test
   * @param {TestSuite} suite TestSuite for this test
   */
  setSuite(suite) {
    this.suite = suite;
  }

  /**
   * Translate test unit into a task that could be scheduled
   */
  createTaskCallback() {
    if (!this.suite) {
      throw new Error('Currently, cannot create it() outside of describe()');
    }
    return browser => {
      const env = { capability: this.suite.capName };
      return Promise.resolve().then(() => {
        if (this.suite && this.suite.beforeEach) {
          return this.suite.beforeEach(browser, env);
        }
      }).then(() => {
        return this.callback(browser, env);
      }).then(() => {
        if (this.suite && this.suite.afterEach) {
          return this.suite.afterEach(browser, env);
        }
      });
    };
  }

  toTask() {
    if (!this.suite) {
      throw new Error('Suite is needed to convert a test to a task');
    }
    return new Task(this.suite.capName, this.createTaskCallback(), this.suite.reporter, `${this.suite.name} > ${this.name} @ ${this.suite.capName}`);
  }
}

/**
 * Convert a test file into schedulable tasks
 * @param {string} capName name of intended capacity
 * @param {string} filename name of the file to run
 * @param {Reporter} reporter Reporter for the test
 */
function registerTestFile(capName, filename, reporter) {
  let newSuite = null;
  let tasks = [];
  let onlyTask = null;

  global.expect = chai.expect;

  global.domOf = domOf;

  global.describe = (name, envCallback) => {
    // Suite is initialized here!
    newSuite = new TestSuite('[TEST]', capName, reporter);
    newSuite.name = name;
    envCallback(newSuite.env);
    // Return a setTimeout handle
    return {
      timeout: (ms) => {
        newSuite.timeout = ms;
      },
    };
  };

  global.describe.skip = (name, envCallback) => {
    newSuite = null;
    console.log(`Skipped suite [${name}]`);
    return {
      // Keep a dummy
      timeout: () => {},
    };
  };

  global.it = (name, browserEnvCallback) => {
    if (!newSuite) {
      return;
    }
    const newUnit = new TestUnit(name, browserEnvCallback, newSuite);
    tasks.push(newUnit.toTask());
  };

  global.it.skip = (name, browserEnvCallback) => {
    if (!newSuite) {
      return;
    }
    console.log(`Skipped test [${newSuite.name} > ${name}]`);
  };

  global.it.only = (name, browserEnvCallback) => {
    if (!newSuite) {
      return;
    }
    console.log(`Only running [${name}] in [${newSuite.name}]`);
    const newUnit = new TestUnit(name, browserEnvCallback, newSuite);
    onlyTask = newUnit;
  };

  global.beforeEach = (cb) => {
    if (!newSuite) {
      return;
    }
    newSuite.setBeforeEach(cb);
  };

  global.afterEach = (cb) => {
    if (!newSuite) {
      return;
    }
    newSuite.setAfterEach(cb);
  };

  // Make the same file required multiple times: we want to test on different browsers
  importFresh(filename);

  if (onlyTask) {
    return [onlyTask];
  }
  return tasks;
}

module.exports = {
  registerTestFile,
};
