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
### Sample1
```ts
import { PuppeteerPool } from "../index";
import fs from "fs-extra";

(async () => {
  const pool = new PuppeteerPool({
    instanceCount: 5,
    userDataDir: ".profile",
    headless: true,
    waitPeriod: 1000,
    cloneProfileDir: "/tmp/",
  });
  fs.mkdirsSync("tmp");
  pool.on("task", async ({ browser, data, done }) => {
    const page = await browser.newPage();
    await page.goto(data);
    const uri = new URL(data);

    await page.screenshot({ path: `tmp/${uri.hostname}.png` });
    done(browser);
  });

  pool.addJob("http://google.com");
  pool.addJob("http://yahoo.com");
  pool.addJob("http://bing.com");
  await pool.waitUntiEmpty();
  await pool.close();
  console.log("finished");
})();

```
