import { PuppeteerPool } from "../index";
import fs from "fs-extra";

(async () => {
  const pool = new PuppeteerPool({
    instanceCount: 5,
    userDataDir: ".profile",
    headless: true,
    waitPeriod: 1000,
    cloneProfileDir: "/tmp/",
    cleanDataDirs: true,
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
