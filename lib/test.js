const {BrowserGroups} = require('./browser');
const {Task, Reporter} = require('./taskReport');
const {registerTestFile} = require('./describe');
const chai = require('chai');
global.expect = chai.expect;

const group = new BrowserGroups();
group.addBrowserInstances('chrome', 10);
const reporter = new Reporter();

let tasks = registerTestFile('chrome', '../spec/test/test.js', reporter);
tasks = tasks.concat(registerTestFile('chrome', '../spec/test/test.1.js', reporter));
const taskPromises = [];

for (let task of tasks) {
  taskPromises.push(task.completePromise);
  group.dispatchTask(task);
}

const intervalHandle = setInterval(() => console.log(group), 1000);

Promise.all(taskPromises).then(async () => {
  clearInterval(intervalHandle);
  await group.cleanup();
  reporter.finalReport();
  process.exit(0);
});
