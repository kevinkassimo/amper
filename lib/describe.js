const chai = require('chai');
const importFresh = require('import-fresh');
const {Task, Reporter} = require('./taskReport');
const {domOf} = require('./browserExpect')
const {warning, info} = require('./log');

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
   * @param {function(ThenableWebDriver, ?Object)} cb beforeEach callback
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
   * @param {function(ThenableWebDriver, ?Object)} cb afterEach callback 
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
          reject(new Error(`${name}: Timeout ${this.timeout || this.suite.timeout} reached.`));
        }, this.timeout || this.suite.timeout);
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
    this.timeout = null;
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

  /**
   * Convert a TestUnit to a Task (which could be scheduled)
   */
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
  // Current suite we are looking at
  let currSuite = null;
  // The only suite that we are supposed to execute
  let onlySuite = null;
  // Map test suite to containing units
  const testUnitsMap = new Map();
  // Map test suite to the .only test it contains
  const onlyTestUnitMap = new Map();

  // Attach chai's expect as global (though not really used in tests)
  global.expect = chai.expect;

  // Attach custom expect asserts as domOf global (not used in tests. See lib/browserExpect.js for detailss)
  global.domOf = domOf;

  /**
   * Create a new test suite
   * @param {string} name
   * @param {function()} callback
   */
  global.describe = (name, callback) => {
    // Suite is initialized here!
    currSuite = new TestSuite('[TEST]', capName, reporter);
    currSuite.name = name;
    testUnitsMap.set(currSuite, []); // set empty task array for suite
    onlyTestUnitMap.set(currSuite, null); // always init with null
    callback(); // initialize contained test units
    // Return a timeout handle
    return {
      /**
       * Set timeout for each of test suite unit to complete.
       * This would affect beforeEach/afterEach/it (each getting such value as timeout)
       * (This value would be overwritten on it() if specified)
       * 
       * @param {number} ms
       */
      timeout: (ms) => {
        currSuite.timeout = ms;
      },
    };
  };

  /**
   * Run only this test suite
   * @param {string} name
   * @param {function()} callback
   */
  global.describe.only = (name, callback) => {
    // Suite is initialized here!
    currSuite = new TestSuite('[TEST]', capName, reporter);
    currSuite.name = name;
    // Make this suite the only suite that we will be running
    onlySuite = currSuite;
    info(`Only running suite [${name}]`);
    testUnitsMap.set(currSuite, []); // set empty task array for suite
    onlyTestUnitMap.set(currSuite, null); // always init with null
    callback(); // initialize contained test units
    // Return a timeout handle
    return {
      /**
       * Set timeout for each of test suite unit to complete.
       * This would affect beforeEach/afterEach/it (each getting such value as timeout)
       * (This value would be overwritten on it() if specified)
       * 
       * @param {number} ms
       */
      timeout: (ms) => {
        currSuite.timeout = ms;
      },
    };
  };

  /**
   * Skip this test suite
   * @param {string} name
   * @param {function()} callback
   */
  global.describe.skip = (name, callback) => {
    currSuite = null;
    info(`Skipped suite [${name}] for capability ${capName}`);
    // Not running anything here!
    return {
      // Keep a dummy
      timeout: () => {},
    };
  };

  /**
   * Create a new test suite that would only run under certain capabilities
   * @param {string[]} caps
   * @param {string} name
   * @param {function()} callback
   */
  global.describe.withCapabilities = (caps, name, callback) => {
    // If current import (with capName) not in allowed caps, skip
    if (caps.indexOf(capName) < 0) {
      return global.describe.skip(name, callback);
    }
    return global.describe(name, callback);
  };

  /**
   * Create a new test suite that would only run under capabilities not mentioned here
   * @param {string[]} exceptCaps
   * @param {string} name
   * @param {function()} callback
   */
  global.describe.exceptForCapabilities = (exceptCaps, name, callback) => {
    // If current import (with capName) not in allowed caps, run
    if (exceptCaps.indexOf(capName) < 0) {
      return global.describe(name, callback);
    }
    // Otherwise, skip
    return global.describe.skip(name, callback);
  };

  /**
   * Create a new test suite that would only run under certain capabilities, and will be the only suite to run
   * @param {string[]} caps
   * @param {string} name
   * @param {function()} callback
   */
  global.describe.onlyWithCapabilities = (caps, name, callback) => {
    // If current import (with capName) not in allowed caps, skip
    if (caps.indexOf(capName) < 0) {
      // HACK!
      // Make currSuite null (so outside it() would have no effect)
      // while also initialize test unit map entries to empty/null
      currSuite = null;
      onlySuite = new TestSuite(name, capName, reporter);
      testUnitsMap.set(onlySuite, []);
      onlyTestUnitMap.set(onlySuite, null);
      return {
        // Keep a dummy
        timeout: () => {},
      };
    }
    return global.describe.only(name, callback);
  };

  /**
   * Create a new test suite that would only run under capabilities not mentioned here, and will be the only suite to run
   * @param {string[]} exceptCaps
   * @param {string} name
   * @param {function()} callback
   */
  global.describe.onlyExceptForCapabilities = (exceptCaps, name, callback) => {
    // If current import (with capName) not in allowed caps, run
    if (exceptCaps.indexOf(capName) < 0) {
      return global.describe.only(name, callback);
    }
    // HACK!
    // Make currSuite null (so outside it() would have no effect)
    // while also initialize test unit map entries to empty/null
    currSuite = null;
    onlySuite = new TestSuite(name, capName, reporter);
    testUnitsMap.set(onlySuite, []);
    onlyTestUnitMap.set(onlySuite, null);
    return {
      // Keep a dummy
      timeout: () => {},
    };
  };

  /**
   * Create a new test unit
   * @param {string} name
   * @param {function(ThenableWebDriver, Object?)} browserEnvCallback
   */
  global.it = (name, browserEnvCallback) => {
    if (!currSuite) {
      // No suite found. Either: it() outside describe(), or describe() is skipped for some reason
      return {
        // Keep a dummy
        timeout: () => {},
      };
    }
    const newUnit = new TestUnit(name, browserEnvCallback, currSuite);
    testUnitsMap.get(currSuite).push(newUnit);
    return {
      /**
       * Set timeout for this individual it() block.
       * It does not affect beforeEach/afterEach.
       * Therefore, total MAX timeout for one test would be 2 * (suite timeout || 0 if no such hooks) + (it timeout)
       * @param {number} ms
       */
      timeout: (ms) => {
        newUnit.timeout = ms;
      },
    };
  };

  /**
   * Skip current test unit
   * @param {string} name
   * @param {function(ThenableWebDriver, Object?)} browserEnvCallback
   */
  global.it.skip = (name, browserEnvCallback) => {
    if (!currSuite) {
      // No suite found. Either: it() outside describe(), or describe() is skipped for some reason
      return {
        // Keep a dummy
        timeout: () => {},
      };
    }
    info(`Skipped test [${currSuite.name} > ${name}]`);
    return {
      // Dummy
      timeout: () => {},
    };
  };

  /**
   * Run only this test unit in current suite
   * @param {string} name
   * @param {function(ThenableWebDriver, Object?)} browserEnvCallback
   */
  global.it.only = (name, browserEnvCallback) => {
    if (!currSuite) {
      // No suite found. Either: it() outside describe(), or describe() is skipped for some reason
      return {
        // Keep a dummy
        timeout: () => {},
      };
    }
    info(`Only running test [${name}] in suite [${currSuite.name}]`);
    const newUnit = new TestUnit(name, browserEnvCallback, currSuite);
    onlyTestUnitMap.set(currSuite, newUnit);
    return {
      /**
       * Set timeout for this individual it() block.
       * It does not affect beforeEach/afterEach.
       * Therefore, total MAX timeout for one test would be 2 * (suite timeout || 0 if no such hooks) + (it timeout)
       * @param {number} ms
       */
      timeout: (ms) => {
        newUnit.timeout = ms;
      },
    };
  };

  /**
   * Invoke the callback before each test unit runs
   * @param {function(ThenableWebDriver, Object?)} cb
   */
  global.beforeEach = (cb) => {
    if (!currSuite) {
      return;
    }
    currSuite.setBeforeEach(cb);
  };

  /**
   * Invoke the callback after each test unit runs
   * @param {function(ThenableWebDriver, Object?)} cb
   */
  global.afterEach = (cb) => {
    if (!currSuite) {
      return;
    }
    currSuite.setAfterEach(cb);
  };

  // Make the same file required multiple times: we want to test on different browsers
  importFresh(filename);

  let tasks = [];

  // There is one suite marked as "only"
  if (onlySuite) {
    let maybeOnlyTestUnit = onlyTestUnitMap.get(onlySuite);
    // If the only test exists for suite, push only itself
    // Transform unit to tasks only here
    // (so that we are sure that beforeEach and afterEach will always work no matter where they are placed)
    if (!!maybeOnlyTestUnit) {
      tasks = [maybeOnlyTestUnit.toTask()];
    } else {
      // Could be empty, if unexpectedly created an empty describe block
      tasks = (testUnitsMap.get(onlySuite) || []).map((u) => u.toTask());
    }
    // return here
    return {
      // Contains some suite that should exclude all other suites
      hasOnly: true,
      onlySuiteName: onlySuite.name, // This will be treated as "id", such that this "only" suite would also be run for other devices
      tasks,
    };
  }

  for (let suite of testUnitsMap.keys()) {
    // Get possible only test
    let maybeOnlyTestUnit = onlyTestUnitMap.get(suite);
    // If the only test exists for suite, push only itself
    // Transform unit to tasks only here
    // (so that we are sure that beforeEach and afterEach will always work no matter where they are placed)
    if (!!maybeOnlyTestUnit) {
      tasks.push(maybeOnlyTestUnit.toTask());
    } else {
      // Could be empty, if unexpectedly created an empty describe block
      tasks = tasks.concat((testUnitsMap.get(suite) || []).map((u) => u.toTask()));
    }
  }

  return {
    // None of the suites are exclusive
    hasOnly: false,
    onlySuiteName: null,
    tasks,
  };
}

module.exports = {
  registerTestFile,
};
