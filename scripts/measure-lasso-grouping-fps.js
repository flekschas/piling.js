/* eslint no-await-in-loop:0 */
const puppeteer = require('puppeteer');

const stepSize = 3;
const numItems = 5000;
const numColumns = 50;

(async () => {
  // launch puppeteer browser in headful mode
  const browser = await puppeteer.launch({
    headless: false,
    args: [`--window-size=${1024},${768}`],
    defaultViewport: null
  });

  for (let i = 0; i < 10; i++) {
    // start a page instance in the browser
    const page = await browser.newPage();

    // go to the page
    await page.goto('http://localhost:8080/?example=drawings');

    // or you can wait for div#piling-ready to appear:
    await page.waitForSelector('#piling-ready', { timeout: 90000 });
    await page.waitFor(500 * (numItems / 250));

    // start the profiling, with a path to the out file and screenshots collected
    await page.tracing.start({
      path: `logs/lasso-grouping-trace-${numItems}-${i}.json`
    });

    const bBox = await page.evaluate(() => {
      const canvas = document.querySelector('.pilingjs-scroll-container');
      return {
        top: canvas.getBoundingClientRect().top,
        left: canvas.getBoundingClientRect().left,
        width: canvas.getBoundingClientRect().width,
        height: canvas.getBoundingClientRect().height
      };
    });

    const columnSize = bBox.width / numColumns;
    const numRows = Math.floor(bBox.height / columnSize);
    const height = numRows * columnSize;
    const padding = columnSize;

    await page.mouse.move(bBox.left + padding, bBox.top + height - padding);
    await page.mouse.down();
    await page.mouse.up();
    await page.evaluate(
      async () => new Promise(resolve => window.requestAnimationFrame(resolve))
    );
    await page.waitFor(50);

    await page.mouse.down();
    await page.waitFor(50);

    // move down the rows
    const moveHeight = height - padding;
    const heightSteps = Math.floor(moveHeight / stepSize);

    // move up
    for (let j = heightSteps - 1; j >= 0; j -= stepSize) {
      await page.mouse.move(
        bBox.left + padding,
        bBox.top + padding + j * stepSize
      );
      await page.waitFor(10);
    }

    // move right
    const moveWidth = bBox.width - padding * 2;
    const widthSteps = Math.ceil(moveWidth / stepSize);
    for (let j = 0; j < widthSteps; j += stepSize) {
      await page.mouse.move(
        bBox.left + padding + j * stepSize,
        bBox.top + padding
      );
      await page.waitFor(10);
    }

    // move down
    for (let j = 0; j < heightSteps - 1; j += stepSize) {
      await page.mouse.move(
        bBox.width - padding,
        bBox.top + padding + j * stepSize
      );
      await page.waitFor(10);
    }

    await page.mouse.up();
    await page.waitFor(500 * Math.ceil(numItems / 250));

    // stop the tracing
    await page.tracing.stop();

    await page.close();

    await page.waitFor(500);
  }

  // close the browser
  await browser.close();
})();
