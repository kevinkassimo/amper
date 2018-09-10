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
    'chrome': { // Be careful, in many test units, this name is accessed by env.capability. DO NOT change this name. For a new chrome instance, use another name
      browserName: 'chrome',
      platform: 'MAC',
      // mobileEmulation: { // uncomment this if you want to simulate mobile device (with specific screen size). Only available for Chrome
      //   deviceName: 'Nexus 5',
      //   // You may also want to add arguments
      // },
      instances: 2,
      args: [ // arguments to pass to the driver. Only available on Chrome and Firefox
        // '--user-agent="Mozilla/5.0 (Linux; Android 6.0.1; LGV33 Build/MXB48T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.84 Mobile Safari/537.36"'
      ],
    },
    'mobile-chrome': { // Be careful, in many test units, this name is accessed by env.capability. DO NOT change this name. For a new chrome instance, use another name
      browserName: 'chrome',
      platform: 'MAC',
      mobileEmulation: { // uncomment this if you want to simulate mobile device (with specific screen size). Only available for Chrome
        deviceName: 'Nexus 5',
        // You may also want to add arguments
      },
      instances: 1,
      args: [ // arguments to pass to the driver. Only available on Chrome and Firefox
        '--user-agent="Mozilla/5.0 (Linux; Android 6.0.1; LGV33 Build/MXB48T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.84 Mobile Safari/537.36"'
      ],
    },
    'firefox': {
      browserName: 'firefox',
      platform: 'MAC',
      instances: 2,
    },
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
