const fs = require('fs');
const {By, until} = require('selenium-webdriver');

describe('test suite 1', () => {
  beforeEach(async (browser, env) => {
    env.a = 1;
  });

  afterEach(async (browser, env) => {
  });

  it('ok', () => {
    
  });
}).timeout(20000);
