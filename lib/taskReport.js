const {
  info, warning, error, ok,
  writeInfo, writeWarning, writeError, writeOk,
} = require('./log');
const {Deferred} = require('./utils');

/**
 * A task unit
 */
class Task {
  /**
   * Init a task
   * @param {string} capName 
   * @param {function(ThenableBrowser)} callback 
   * @param {Reporter} reporter 
   */
  constructor(capName, callback, reporter = null, taskName = '[DEFAULT TASK]') {
    this.capName = capName;
    this.callback = callback;
    this.reporter = reporter;
    this.taskName = taskName;
    this.completeDeferred = new Deferred();
    this.completePromise = this.completeDeferred.promise;
    this.error = null;
  }

  /**
   * Set reporter of a task
   * @param {Reporter} reporter 
   */
  setReporter(reporter) {
    this.reporter = reporter;
  }

  /**
   * Set task name
   */
  setTaskName(taskName) {
    this.taskName = taskName;
  }

  /**
   * Run the actual task callback
   * @param {ThenableBrowser} browser 
   */
  async run(browser) {
    try {
      await this.callback(browser);
      this.complete(true);
    } catch (e) {
      this.error = e;
      this.reportError();
      this.complete(false)
    }
  }

  /**
   * Complete the task
   * @param {boolean} success 
   */
  complete(success = true) {
    if (this.reporter) {
      if (success) {
        this.reporter.reportSuccess();
      } else {
        this.reporter.reportFailure();
      }
    }
    this.completeDeferred.resolve();
  }

  /**
   * Send error to reporter
   */
  reportError() {
    if (!this.reporter) {
      return;
    }
    this.reporter.saveErroredTask(this);
  }
}

/**
 * A Reporter of the task running status
 */
class Reporter {
  /**
   * Create a reporter
   */
  constructor() {
    this.successCount = 0;
    this.failureCount = 0;
    this.erroredTask = [];
  }

  /**
   * Make a task to be monitored by the reporter
   * @param {Task} task 
   */
  monitorTask(task) {
    task.setReporter(this);
  }

  /**
   * Report success status
   */
  reportSuccess() {
    this.successCount++;
    writeOk('.');
  }

  /**
   * Report failure status
   */
  reportFailure() {
    this.failureCount++;
    writeError('!');
  }

  /**
   * Extract error from run task and save to the reporter
   * @param {Task} task 
   */
  saveErroredTask(task) {
    this.erroredTask.push(task);
  }

  /**
   * Generate an overall report of test statistics
   */
  finalReport() {
    console.log(`
==============================
`);
    ok(`${this.successCount} passed`);
    if (this.failureCount !== 0) {
      error(`${this.failureCount} failed`);
    }
    console.log('==============================');
    this.erroredTask.forEach((task) => {
      error(`>>> In ${task.taskName}:`);
      error(task.error.stack);
    });
  }
}

module.exports = {
  Task,
  Reporter,
};
