const fs = require('fs');

// drivers.for(['chrome', /* 'firefox', 'safari', */ 'chrome1', 'chrome2', 'chrome3', 'chrome4', 'chrome5', 'chrome6', 'chrome7', 'chrome8', 'chrome9', 'chrome10']).run((type, driver, done) => {
//   describe('amp-carousel[type=slides]', () => {
//     beforeEach(async () => {
//       console.log('WTF');
//     });
//     after(() => {
//       done();
//     });
//     it('should run', async () => {
//       await driver.get('http://www.google.com/ncr');
//       fs.writeFileSync(`screenshots/test${Date.now()}.png`, await driver.takeScreenshot(), 'base64');
//     }).timeout(10000);
//   });
// });

describe('amp-carousel[type=slides]', () => {
  beforeEach(async () => {
    console.log('WTF');
  });
  it('should run', async () => {
    await driver.get('http://www.google.com/ncr');
    // fs.writeFileSync(`screenshots/test${Date.now()}.png`, await driver.takeScreenshot(), 'base64');
  });
});
