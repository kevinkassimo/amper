# Amper

This is an experiment of testing with concurrent multiple webdriver instances running.  
A mocha-like test framework is created to run the tests. However, it differs from Mocha in that all `it()` are treated as individual tasks and scheduled as soon as possible. Therefore, local variables inside `describe` would not work in our case. We only allow passing information from `beforeEach()` to `it()` and then to `afterEach()` through `env` object. Furthermore, nested `describe` is not currently supported...

## How to run
Put your tests in `spec/**/*.js`.
```bash
yarn run install-drivers # install drivers
yarn run server # start server at localhost:8080, allowing accessing pages in pages/ folder
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

## Known issues
`setTimeout` would block process from ever exist or more... AVOID using it.
