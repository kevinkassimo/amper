const fs = require('fs');
const {By, until} = require('selenium-webdriver');

describe('test suite 1', () => {
  beforeEach(async (browser, env) => {
    env.a = 1;
  });

  afterEach(async (browser, env) => {

  });

  it('should throw error', async (browser, env) => {
    throw new Error('THIS IS A TEST ERROR');
  });

  it('should failed to find element', async (browser, env) => {
    await browser.get('https://google.com/ncr');
    await browser.wait(until.elementLocated(By.name("lolololol")));
  });
}).timeout(10000);
