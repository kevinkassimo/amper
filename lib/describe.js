const {Task, Reporter} = require('./taskReport');

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
    this.timeout = 2000; // default 2 seconds

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
        });
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
        });
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
  constructor(name, callback, suite = null) {
    this.name = name;
    this.callback = callback;
    this.suite = suite;
  }

  setSuite(suite) {
    this.suite = suite;
  }

  createTaskCallback() {
    if (!this.suite) {
      throw new Error('Currently, cannot create it() outside of describe()');
    }
    return async browser => {
      const env = {};
      if (this.suite && this.suite.beforeEach) {
        await this.suite.beforeEach(browser, env);
      }
      await this.callback(browser, env);
      if (this.suite && this.suite.afterEach) {
        await this.suite.afterEach(browser, env);
      }
    };
  }

  toTask() {
    if (!this.suite) {
      throw new Error('Suite is needed to convert a test to a task');
    }
    return new Task(this.suite.capName, this.createTaskCallback(), this.suite.reporter, `${this.name} on ${this.suite.capName}`);
  }
}

function registerTestFile(capName, filename, reporter) {
  const newSuite = new TestSuite('[TEST]', capName, reporter);
  const tasks = [];
  global.describe = (name, envCallback) => {
    newSuite.name = name;
    envCallback(newSuite.env);
    // Return a setTimeout handle
    return {
      timeout: (ms) => {
        newSuite.timeout = ms;
      },
    };
  };

  global.it = (name, browserEnvCallback) => {
    const newUnit = new TestUnit(name, browserEnvCallback, newSuite);
    tasks.push(newUnit.toTask());
  };

  global.beforeEach = (cb) => {
    newSuite.setBeforeEach(cb);
  };

  global.afterEach = (cb) => {
    newSuite.setAfterEach(cb);
  };

  require(filename);

  return tasks;
}

module.exports = {
  registerTestFile,
};