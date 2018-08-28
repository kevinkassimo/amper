/**
 * Add your capabilities here
 * Could also specify if they are on mobile platform
 * Use key as the driver selected to run in each spec file
 */
module.exports = {
  /**
   * Warning: too much browsers might actually turn out to be slower...
   * Also, a bunch of timeout listeners would also result in Node warning the listener amount
   * if many tests run concurrently.
   * It is suggested that max browsers to spawn should be 10 in total at a time (maxListener count for setTimeout)
   */
  capabilities: {
    'chrome': {
      browserName: 'chrome',
      platform: 'MAC',
      // mobileEmulation: {
      //   deviceName: 'Nexus 5',
      // },
      instances: 1,
    },
    // 'firefox': {
    //   browserName: 'firefox',
    //   platform: 'MAC',
    //   instances: 1,
    // },
    // 'safari': {
    //   browserName: 'safari',
    //   platform: 'MAC',
    //   instances: 10,
    // }
  },
  timeouts: {
    // See https://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_Options.html#setTimeouts
  },
  // headless: true,
  retries: 2,
};
