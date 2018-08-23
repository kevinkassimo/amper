/**
 * Create a promise that could be resolved from outside
 */
function Deferred() {
  this.promise = new Promise((resolve, reject) => {
    this.resolve = resolve;
    this.reject = reject;
  });
}

/**
 * Return a promise that resolves after a while
 * @param {number} ms time to wait
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  Deferred,
  sleep,
};
