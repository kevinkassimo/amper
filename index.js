const fs = require('fs');
const glob = require('glob');
const argv = require('minimist')(process.argv.slice(2));
const {capabilities} = require('./config');
const {registerTestFile} = require('./lib/describe');
const {Reporter} = require('./lib/taskReport');
const {BrowserGroups} = require('./lib/browser');

let filesToTest;
if ('spec' in argv) {
  filesToTest = argv.spec.split(',');
} else {
  filesToTest = glob.sync('./spec/**/*.js');
}

let capsToTest;
if ('cap' in argv) {
  capsToTest = argv.cap.split(',');
} else {
  capsToTest = Object.keys(capabilities);
}

const tasks = [];

const browserGroups = new BrowserGroups();
const reporter = new Reporter();

console.log(capsToTest);

capsToTest.forEach(cap => {
  if (!(cap in capabilities)) {
    throw new Error(`Capability ${cap} is not registered in config.js`);
  }
  filesToTest.forEach(filename => {
    if (!fs.existsSync(filename)) {
      throw new Error(`File ${filename} does not exist`);
    }
    const generatedTasks = registerTestFile(cap, `../${filename}`, reporter);
    console.log(cap, generatedTasks.length);
    tasks.push(...generatedTasks);
  });
  // Default 1 instance per browser
  browserGroups.addBrowserInstances(cap, capabilities[cap].instances || 1);
});

console.log(browserGroups)
console.log(tasks);

const taskPromises = tasks.map(task => task.completePromise);

tasks.forEach(task => browserGroups.dispatchTask(task));

Promise.all(taskPromises).then(async () => {
  // Submit a final report of the tests
  reporter.finalReport();
  // Kill all spawned browsers
  await browserGroups.cleanup();
});
