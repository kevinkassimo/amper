const glob = require('glob');
const Mocha = require('mocha');
const argv = require('minimist')(process.argv.slice(2));
const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const safari = require('selenium-webdriver/safari');

const capabilities = require('../capabilities');

const chromeOptions = new chrome.Options();
chromeOptions.addArguments('--headless')
const firefoxOptions = new firefox.Options();
firefoxOptions.addArguments('--headless');
const safariOptions = new safari.Options();

let filesToTest;
if ('spec' in argv)  {
  // Delimited by comma
  filesToTest = argv.spec.split(',');
} else {
  filesToTest = glob.sync('./spec/**/*.js');
}

let cap = argv.cap;

function setupGlobals() {
  global.expect = require('chai').expect;
  global.driver = new webdriver.Builder()
      .withCapabilities(capabilities[cap])
      .setChromeOptions(chromeOptions)
      .setFirefoxOptions(firefoxOptions)
      .setSafariOptions(safariOptions)
      .build();
}

setupGlobals();

function runTest(files) {
  const mocha = new Mocha({
    ui: 'bdd',
    reporter: 'dot',
  });
  files.forEach(file => {
    mocha.addFile(file);
  });
  mocha.asyncOnly();
  // mocha.timeout(10000);
  mocha.run(() => {
    global.driver.quit();
  });
}

runTest(filesToTest);
