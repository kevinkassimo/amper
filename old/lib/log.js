const chalk = require('chalk');
const info = chalk.bold.blue;
const error = chalk.bold.red;
const warning = chalk.keyword('orange');

module.exports = {
  info: (...msg) => console.log(info(...msg)),
  error: (...msg) => console.log(error(...msg)),
  warning: (...msg) => console.log(warning(...msg)),
};
