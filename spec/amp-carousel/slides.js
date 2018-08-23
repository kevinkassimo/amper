const fs = require('fs');

describe('test suite 1', () => {
  beforeEach(async (browser, env) => {
    env.a = 1;
  });

  afterEach(async (browser, env) => {

  });

  it('should throw error', async (browser, env) => {
    throw new Error('THIS IS A TEST ERROR');
  });

  it('should throw error on timeout', async (browser, env) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 20000);
    });
  });
}).timeout(10000);
