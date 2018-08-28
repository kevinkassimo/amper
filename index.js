const fs = require('fs');
const glob = require('glob');
const argv = require('minimist')(process.argv.slice(2));
const {capabilities, retries} = require('./config');
const {registerTestFile} = require('./lib/describe');
const {Reporter} = require('./lib/taskReport');
const {BrowserGroups} = require('./lib/browser');
const {info, warning, error} = require('./lib/log');
const psTree = require('ps-tree');
const cp = require('child_process');

// Files to test
let filesToTest;
if ('spec' in argv) {
  // Delimited by comma
  filesToTest = argv.spec.split(',');
} else {
  filesToTest = glob.sync('./spec/**/*.js');
}

// Capabilities to test
let capsToTest;
if ('cap' in argv) {
  // Delimited by comma
  capsToTest = argv.cap.split(',');
} else {
  capsToTest = Object.keys(capabilities);
}

info(`>>> Selected capabilities: ${capsToTest.join(', ')}`);

let tasks = [];

const browserGroups = new BrowserGroups();
const reporter = new Reporter();

capsToTest.forEach(cap => {
  if (!(cap in capabilities)) {
    throw new Error(`Capability ${cap} is not registered in config.js`);
  }
  filesToTest.forEach(filename => {
    if (!fs.existsSync(filename)) {
      throw new Error(`File ${filename} does not exist`);
    }
    // Change relative path
    const generatedTasks = registerTestFile(cap, `../${filename}`, reporter);
    tasks.push(...generatedTasks);
  });
  // Default 1 instance per browser
  browserGroups.addBrowserInstances(cap, capabilities[cap].instances || 1);
});

let taskPromises = tasks.map(task => task.completePromise);

info('>>> Running tests...');

tasks.forEach(task => browserGroups.dispatchTask(task));

// Wait for all tasks to complete
Promise.all(taskPromises).then(async () => {
  // Submit a final report of the tests
  reporter.finalReport();
}).then(async () => {
  if (!!retries && reporter.erroredTask.length > 0) {
    let remainingRetries = retries;
    while (remainingRetries > 0) {
      warning(`>>> Remaining retries: ${remainingRetries}`);
      // Pick out tasks that errored out
      tasks = tasks.filter(task => !!task.error);
      // Reset tasks to prepare for new run
      tasks.forEach(task => {
        task.reset();
      });
      // Clear reporter info
      reporter.reset();
      taskPromises = tasks.map(task => task.completePromise);
      // Reschedule
      tasks.forEach(task => browserGroups.dispatchTask(task));
      await Promise.all(taskPromises);
      reporter.finalReport();
      if (reporter.erroredTask.length === 0) {
        // await browserGroups.cleanup();
        // Cannot trust driver.quit() any more.
        // Use psTree to explicitly kill off all children with ppid = process.pid
        // Must kill here: if we leave the job to an external shell script, the orphaned drivers would be adopted by init/systemd, lose track of them...
        psTree(process.pid, (err, children) => {
          cp.spawn('kill', ['-9'].concat(children.map(p => p.PID)));
          process.exit(0);
        });
        return;
      } else {
        remainingRetries--;
      }
    }
    // Too many failures...
    error(`Still errors after retries. Exiting...`);
    // await browserGroups.cleanup();
    // Cannot trust driver.quit() any more.
    // Use psTree to explicitly kill off all children with ppid = process.pid
    // Must kill here: if we leave the job to an external shell script, the orphaned drivers would be adopted by init/systemd, lose track of them...
    psTree(process.pid, (err, children) => {
      cp.spawn('kill', ['-9'].concat(children.map(function (p) { return p.PID })));
      process.exit(1);
    });
  } else {
    // await browserGroups.cleanup();
    // Cannot trust driver.quit() any more.
    // Use psTree to explicitly kill off all children with ppid = process.pid
    // Must kill here: if we leave the job to an external shell script, the orphaned drivers would be adopted by init/systemd, lose track of them...
    psTree(process.pid, (err, children) => {
      cp.spawn('kill', ['-9'].concat(children.map(p => p.PID)));
      process.exit(reporter.erroredTask.length > 0 ? 1 : 0);
    });
  }
});
