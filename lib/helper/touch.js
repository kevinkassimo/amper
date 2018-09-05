const {Pointer, Button, Origin} = require('selenium-webdriver/lib/input');
const {LegacyTouchSequence} = require('selenium-webdriver/lib/actions');
const {By, ThenableWebDriver} = require('selenium-webdriver');

/**
 * WARNING: this is currently broken
 * Swipe from start to end points with duration
 * @param {Pointer} touch touch pointer
 * @param {Object} config config object, looks like {start: {x: number, y: number}, end: {x: number, y: number}, duration: number}
 */
async function swipe(browser, config, useLegacy = false) {
  const {
    start,
    end,
    duration,
  } = config;
  if (useLegacy) {
    // TODO: remove this ONCE chrome starts supporting Actions!
    const touchSeq = new LegacyTouchSequence(browser);

    touchSeq.tapAndHold({
      x: start.x,
      y: start.y,
    });

    touchSeq.move({
      x: end.x,
      y: end.y,
    });

    touchSeq.release({
      x: end.x,
      y: end.y,
    });

    await touchSeq.perform();
  } else {
    // This is supposed to be working on Firefox, but encountered some issue...
    const actions = browser.actions(); // a new actions is created.
    const touch = new Pointer('default touch', Pointer.Type.TOUCH);

    // Insert a series of actions
    actions.insert(touch, touch.move({
      x: start.x,
      y: start.y,
      origin: Origin.VIEWPORT,
      duration: 0,
    }));
  
    actions.insert(touch, touch.press(Button.LEFT));
  
    actions.insert(touch, touch.move({
      x: end.x,
      y: end.y,
      origin: Origin.VIEWPORT,
      duration,
    }));
  
    actions.insert(touch, touch.release(Button.LEFT));
  
    await actions.perform();
  }
};

/**
 * Scroll from element by offset
 * @param {ThenableWebDriver} browser driver
 * @param {string} selector CSS selector
 * @param {Object} offset {x: ..., y: ...}
 * @param {boolean|undefined} useLegacy Use legacy scroll operation
 */
async function scrollFromElement(browser, selector, offset, useLegacy = false) {
  if (useLegacy) {
    const touchSeq = new LegacyTouchSequence(browser);
    touchSeq.scrollFromElement(await browser.findElement(By.css(selector)), offset);
    await touchSeq.perform();
  } else {
    throw new Error('NOT IMPLEMENTED');
  }
}

module.exports = {
  swipe,
  scrollFromElement,
};
