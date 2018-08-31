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
  // Current suite we are looking at
  let currSuite = null;
  // The only suite that we are supposed to execute
  let onlySuite = null;
  const testUnitsMap = new Map();
  const onlyTestUnitMap = new Map();

  global.expect = chai.expect;

  global.domOf = domOf;

  global.describe = (name, envCallback) => {
    // Suite is initialized here!
    currSuite = new TestSuite('[TEST]', capName, reporter);
    currSuite.name = name;
    testUnitsMap.set(currSuite, []); // set empty task array for suite
    onlyTestUnitMap.set(currSuite, null); // always init with null
    envCallback(currSuite.env);
    // Return a setTimeout handle
    return {
      timeout: (ms) => {
        currSuite.timeout = ms;
      },
    };
  };

  // Run only this suite
  global.describe.only = (name, envCallback) => {
    // Suite is initialized here!
    currSuite = new TestSuite('[TEST]', capName, reporter);
    currSuite.name = name;
    // Make this suite the only suite that we will be running
    onlySuite = currSuite;
    console.log(`Only running suite [${name}]`);
    testUnitsMap.set(currSuite, []); // set empty task array for suite
    onlyTestUnitMap.set(currSuite, null); // always init with null
    envCallback(currSuite.env);
    // Return a setTimeout handle
    return {
      timeout: (ms) => {
        currSuite.timeout = ms;
      },
    };
  };

  global.describe.skip = (name, envCallback) => {
    currSuite = null;
    console.log(`Skipped suite [${name}]`);
    return {
      // Keep a dummy
      timeout: () => {},
    };
  };

  global.it = (name, browserEnvCallback) => {
    if (!currSuite) {
      return;
    }
    const newUnit = new TestUnit(name, browserEnvCallback, currSuite);
    testUnitsMap.get(currSuite).push(newUnit);
  };

  global.it.skip = (name, browserEnvCallback) => {
    if (!currSuite) {
      return;
    }
    console.log(`Skipped test [${currSuite.name} > ${name}]`);
  };

  global.it.only = (name, browserEnvCallback) => {
    if (!currSuite) {
      return;
    }
    console.log(`Only running [${name}] in [${currSuite.name}]`);
    const newUnit = new TestUnit(name, browserEnvCallback, currSuite);
    onlyTestUnitMap.set(currSuite, newUnit);
  };

  global.beforeEach = (cb) => {
    if (!currSuite) {
      return;
    }
    currSuite.setBeforeEach(cb);
  };

  global.afterEach = (cb) => {
    if (!currSuite) {
      return;
    }
    currSuite.setAfterEach(cb);
  };

  // Make the same file required multiple times: we want to test on different browsers
  importFresh(filename);

  let tasks = [];

  if (onlySuite) {
    let maybeOnlyTestUnit = onlyTestUnitMap.get(onlySuite);
    // If the only test exists for suite, push only itself
    // Transform unit to tasks only here
    // (so that we are sure that beforeEach and afterEach will always work no matter where they are placed)
    if (maybeOnlyTestUnit !== null) {
      tasks = [maybeOnlyTestUnit.toTask()];
    } else {
      tasks = testUnitsMap.get(onlySuite).map((u) => u.toTask());
    }
    // return here
    return {
      hasOnly: true,
      tasks,
    };
  }

  for (let suite of testUnitsMap.keys()) {
    // Get possible only test
    let maybeOnlyTestUnit = onlyTestUnitMap.get(suite);
    // If the only test exists for suite, push only itself
    // Transform unit to tasks only here
    // (so that we are sure that beforeEach and afterEach will always work no matter where they are placed)
    if (maybeOnlyTestUnit !== null) {
      tasks.push(maybeOnlyTestUnit.toTask());
    } else {
      tasks = tasks.concat(testUnitsMap.get(suite).map((u) => u.toTask()));
    }
  }

  return {
    hasOnly: false,
    tasks,
  };
}

module.exports = {
  registerTestFile,
};
