/**
 * Create a promise that could be resolved from outside
 */
function Deferred() {
  this.promise = new Promise((resolve, reject) => {
    this.resolve = resolve;
    this.reject = reject;
  });
}

module.exports = {
  Deferred,
};
