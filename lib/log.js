const chalk = require('chalk');
const info = chalk.bold.blue;
const error = chalk.bold.red;
const warning = chalk.keyword('orange');
const ok = chalk.bold.green;

/**
 * A bunch of color logs
 */
module.exports = {
  info: (...msg) => console.log(info(...msg)),
  error: (...msg) => console.log(error(...msg)),
  warning: (...msg) => console.log(warning(...msg)),
  ok: (...msg) => console.log(ok(...msg)),
  writeInfo: (...msg) => process.stdout.write(info(...msg)),
  writeError: (...msg) => process.stdout.write(error(...msg)),
  writeWarning: (...msg) => process.stdout.write(warning(...msg)),
  writeOk: (...msg) => process.stdout.write(ok(...msg)),
};
