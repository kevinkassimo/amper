const fs = require('fs');
const glob = require('glob');
const argv = require('minimist')(process.argv.slice(2));
const {capabilities, retries} = require('./config');
const {registerTestFile} = require('./lib/describe');
const {Reporter} = require('./lib/taskReport');
const {BrowserGroups} = require('./lib/browser');
const {warning, error} = require('./lib/log');

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

tasks.forEach(task => browserGroups.dispatchTask(task));

// if (!retries) {
//   // Wait for all tasks to complete
//   Promise.all(taskPromises).then(async () => {
//     // Submit a final report of the tests
//     reporter.finalReport();
//     // Kill all spawned browsers
//     await browserGroups.cleanup();
//   });
// } else {
//   (async () => {
//     let remainingRetries = retries;
//     while (remainingRetries > 0) {
//       warning(`>>> Remaining retries: ${remainingRetries}`)
//       tasks = tasks.filter(task => !!task.error);
//       tasks.forEach(task => {
//         task.reset();
//       });
//       reporter.reset();
//       tasks.forEach()
//       taskPromises = tasks.map(task => task.completePromise);
//       await taskPromises;
//       reporter.finalReport();
//       if (reporter.erroredTask.length === 0) {
//         await browserGroups.cleanup();
//         return;
//       } else {
//         remainingRetries--;
//       }
//     }
//     error(`Still errors after retries. Exiting...`);
//     await browserGroups.cleanup();
//   })();
// }

// Wait for all tasks to complete
Promise.all(taskPromises).then(async () => {
  // Submit a final report of the tests
  reporter.finalReport();
}).then(async () => {
  // console.log(retries);
  if (!!retries && reporter.erroredTask.length > 0) {
    let remainingRetries = retries;
    while (remainingRetries > 0) {
      warning(`>>> Remaining retries: ${remainingRetries}`)
      tasks = tasks.filter(task => !!task.error);
      // console.log(tasks);
      tasks.forEach(task => {
        task.reset();
      });
      reporter.reset();
      // console.log(tasks);
      // console.log(reporter);
      taskPromises = tasks.map(task => task.completePromise);
      // console.log(taskPromises);
      tasks.forEach(task => browserGroups.dispatchTask(task));
      await Promise.all(taskPromises);
      reporter.finalReport();
      if (reporter.erroredTask.length === 0) {
        await browserGroups.cleanup();
        return;
      } else {
        remainingRetries--;
      }
    }
    error(`Still errors after retries. Exiting...`);
    await browserGroups.cleanup();
  } else {
    // Kill all spawned browsers
    await browserGroups.cleanup();
  }
});
