# Amper

[![asciicast](https://asciinema.org/a/pfnvgFMe1jUtniBhwlLHgUkQy.png)](https://asciinema.org/a/pfnvgFMe1jUtniBhwlLHgUkQy)
Run with retries:
[![asciicast](https://asciinema.org/a/200215.png)](https://asciinema.org/a/200215)

This is an experiment of testing with concurrent multiple webdriver instances running.  
A mocha-like test framework is created to run the tests. However, it differs from Mocha in that all `it()` are treated as individual tasks and scheduled as soon as possible. Therefore, local variables inside `describe` would not work in our case. We only allow passing information from `beforeEach()` to `it()` and then to `afterEach()` through `env` object. Furthermore, nested `describe` is not currently supported...

## How to run
Put your tests in `spec/**/*.js`.
```bash
yarn install-drivers # install drivers. Just run once at the very beginning
yarn # install packages (express, etc.)
yarn server # start server at localhost:8080, allowing accessing pages in pages/ folder
yarn start [--spec="file1,file2"] [--cap="firefox,chrome,safari"] # run tests, with given files and capabilities. Separate with comma
```
Tests should look like this:
```javascript
const fs = require('fs');

describe('Test suite', () => {
  beforeEach((browser, env) => {
    env.data = 1;
  });

  afterEach((browser, env) => {
    expect(env.data).to.equal(1);
  });

  it('should take screenshot', async (browser, env) => {
    await browser.get('http://www.google.com/ncr');
    // save screenshot
    fs.writeFileSync(`screenshots.png`, await browser.takeScreenshot(), 'base64');
  });
});
```
To change the capability available (which browsers, how many), go to `config.js` and change there.

## Custom Test Suite API
```javascript
// Create a new suite. Suite name MUST be unique!
describe('suite name', () => {
  beforeEach((browser, env) => {}); // OPTIONAL Runs before each test unit. `env` is passed across beforeEach, it and afterEach
  afterEach((browser, env) => {}); // OPTIONAL Runs after each test unit. `env` is passed across beforeEach, it and afterEach
  it('test name', (browser, env) => {}) // A single test unit. `env` is passed across beforeEach, it and afterEach
    .timeout(1000) // OPTIONAL Set timeout for this single test (beforeEach and afterEach has their own timeout, inherited from suite)
  it.skip('skipped', (browser, env) => {}); // This test is skipped
  it.only('only', (browser, env) => {}); // Only run this test in the suite
}) // create a test suite
.timeout(1000) // OPTIONAL Set timeout for suite (will be applied to beforeEach, afterEach, and by default on all it() test units)

describe.skip('suite name', () => {}); // This suite is skipped
describe.only('suite name', () => {}); // This suite will be the only one to be run
describe.withCapabilities(['chrome'], 'suite name', () => {}); // This suite will only run under the specified capabilities (edit config.js for new ones)
describe.exceptForCapabilities(['mobile-chrome'], 'suite name', () => {}); // This suite will only run if current capabilities is not in specified capabilities
describe.onlyWithCapabilities(['chrome'], 'suite name', () => {}); // .only version of withCapabilities
describe.onlyExceptForCapabilities(['mobile-chrome'], 'suite name', () => {}); // .only version of exceptForCapabilities
```

## Known issues
`setTimeout` would block process from ever exist or more... AVOID using it.
