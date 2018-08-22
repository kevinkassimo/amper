const argv = require('minimist')(process.argv.slice(2));

if (argv.multi) {
  
}

const {writeFileSync} = require('fs');
const {execFileSync} = require('child_process');
const path = require('path');
const defaultCapabilities = require('./capabilities');
const argv = require('minimist')(process.argv.slice(2));

let capabilitiesToRun;
if ('cap' in argv) {
  capabilitiesToRun = argv.cap.split(',');
} else {
  capabilitiesToRun = Object.keys(defaultCapabilities);
}

let passedFilesToRun = argv.spec;

const instancePromises = [];
let overallReport = '';

capabilitiesToRun.forEach((cap) => {
  instancePromises.push(Promise.resolve().then(() => {
    console.log(`>>> Running ${cap}...`);
    const instanceArgv = ['./lib/instance.js'];
    instanceArgv.push(`--cap=${cap}`);
    if (passedFilesToRun) {
      instanceArgv.push(`--spec=${passedFilesToRun}`);
    }
    return execFileSync('node', instanceArgv);
  }).then(report => {
    const capReport = `
>>> Report for ${cap}:
${report}
`;
    console.log(capReport);
    overallReport += capReport;
  }));
});

Promise.all(instancePromises).then(() => {
  const reportName = `./log/report_${Date.now()}.txt`;
  console.log(`>>> Report saved at ${reportName}`);
  writeFileSync(reportName, overallReport);
}).catch((e) => {
  console.log(e.stack);
});


// const glob = require('glob');
// const Mocha = require('mocha');
// const argv = require('minimist')(process.argv.slice(2));

// let filesToTest;
// if ('spec' in argv)  {
//   // Delimited by comma
//   filesToTest = argv.spec.split(',');
// } else {
//   filesToTest = glob.sync('./spec/**/*.js');
// }

// function setupGlobals() {
//   global.expect = require('chai').expect;
//   // global.drivers = new (require('./lib/drivers').Drivers)();
//   global.drivers = new (require('./lib/multidrivers').MultiDrivers)();
// }

// setupGlobals();

// function runTest(files) {
//   const mocha = new Mocha({
//     ui: 'bdd',
//     reporter: 'dot'
//   });
//   files.forEach(file => {
//     mocha.addFile(file);
//   })
//   mocha.timeout(10000);
//   mocha.asyncOnly();
//   mocha.run(() => {
//     global.drivers.cleanup();
//   });
// }

// runTest(filesToTest);
