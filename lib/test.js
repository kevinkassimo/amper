const {BrowserGroups} = require('./browser');
const {Task, Reporter} = require('./taskReport');
const {registerTestFile} = require('./describe');
const chai = require('chai');
global.expect = chai.expect;

const group = new BrowserGroups();
group.addBrowserInstances('chrome', 20);
const reporter = new Reporter();

let tasks = registerTestFile('chrome', '../spec/test/test.js', reporter);
tasks = tasks.concat(registerTestFile('chrome', '../spec/test/test.1.js', reporter));
const taskPromises = [];

for (let task of tasks) {
  taskPromises.push(task.completePromise);
  group.dispatchTask(task);
}

Promise.all(taskPromises).then(async () => {
  await group.cleanup();
  reporter.finalReport();
});
