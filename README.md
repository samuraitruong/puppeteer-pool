# puppeteer-pool

The simple puppeteer browser pool

## Usage

```js
import { PuppeteerPool } from 'puppeteer-pool';

const pool = new PuppeteerPool({
  headless: false,
  instanceCount: 5,
  delayTime: 1000,
});

pool.on('task', async ({ browser, data, done }) => {
  try {
    // using browser
  } catch (ex) {
    // log error
  } finally {
    // this important to set return browser back to pool
    done(browser);
  }
});

pool.addJob('5427');

await pool.waitUntiEmpty();
await pool.close();
```
