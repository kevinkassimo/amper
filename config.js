/**
 * Add your capabilities here
 * Could also specify if they are on mobile platform
 * Use key as the driver selected to run in each spec file
 */
module.exports = {
  capabilities: {
    'chrome': {
      browserName: 'chrome',
      platform: 'MAC',
      instances: 3,
    },
    'firefox': {
      browserName: 'firefox',
      platform: 'MAC',
      instances: 3,
    },
    // 'safari': {
    //   browserName: 'safari',
    //   platform: 'MAC',
    // }
  },
  retries: 2,
};
