import { IPuppeteerPoolOptions } from "./interface";
import puppeteer, { Browser } from "puppeteer";
import { EventEmitter } from "events";
import { ncp } from "ncp";
import { promisify } from "util";
import fs from "fs-extra";
import path from "path";

const ncpPromise = promisify(ncp);
import hash from "object-hash";

const sleepAsync = (time: number) => {
  return new Promise((r) => setTimeout(r, time));
};
export class PuppeteerPool extends EventEmitter {
  private initialized: Browser[];
  private pending: Browser[];
  private queue: any[] = [];
  public duplicatedHash = {};
  public running = 0;
  private cleanupPaths = [];

  constructor(private options: IPuppeteerPoolOptions) {
    super();
    this.initialized = [];
    this.queue = [];
    this.pending = [];
    this.duplicatedHash = {};
  }

  public addJob<T>(data: T) {
    const objKey = hash(data);

    if (this.options.skipDuplicate && this.duplicatedHash[objKey]) {
      return;
    }
    this.duplicatedHash[objKey] = true;
    this.queue.push(data);
  }

  public finish(browser: Browser) {
    this.pending.push(browser);
  }

  public async waitUntiEmpty() {
    let loop = 1;
    while (loop <= 2) {
      while (this.running > 0 || this.queue.length > 0) {
        loop = 1; // reset loop if we have data
        console.log(
          "Pool Stats | Queue length : %d |  Running %d | Browser initialized :  %d",
          this.queue.length,
          this.running,
          this.initialized.length
        );
        if (this.queue.length > 0) {
          const data = this.queue.splice(0, 1)[0];
          const browser = await this.getBrowser();
          if (browser == null) {
            console.error("Error to create browser, exit");
            process.exit(1);
          }
          this.emit("task", {
            browser,
            data,
            done: async (b: Browser) => {
              this.running--;
              this.pending.push(b);
              if (this.options.closePageOnFinished ?? true) {
                const pages = await b.pages();
                await Promise.all(pages.map((page) => page.close()));
              }
            },
          });
          this.running++;
        } else {
          await sleepAsync(this.options.jobDelay ?? 3000);
        }
      }
      await sleepAsync(this.options.waitPeriod ?? 10000);
      if (this.queue.length === 0) {
        loop++;
      }
    }
  }

  public async close() {
    console.log("closing browsers....");
    await Promise.all(this.initialized.map((x) => x.close()));
    if (this.options.cleanDataDirs) {
      this.cleanupPaths.map((x) => fs.rmdirSync(x));
    }
  }
  private async getBrowser() {
    if (this.pending.length > 0) {
      const browser = this.pending.splice(0, 1)[0];
      return browser;
    }
    if (this.initialized.length <= this.options.instanceCount) {
      const browserOptions = { ...this.options };
      let userDataDir = browserOptions.userDataDir;
      if (browserOptions.cloneProfileDir && browserOptions.userDataDir) {
        userDataDir = path.join(
          browserOptions.cloneProfileDir,
          browserOptions.userDataDir + this.initialized.length
        );
        if (!fs.pathExistsSync(userDataDir)) {
          console.log(
            "Clone user data dir %s -> %s",
            browserOptions.userDataDir,
            userDataDir
          );
          this.cleanupPaths.push(userDataDir);
          await ncpPromise(browserOptions.userDataDir, userDataDir);
        }
      }
      const browser = await puppeteer.launch({
        ...browserOptions,
        userDataDir,
      });
      this.initialized.push(browser);
      return browser;
    }
    while (true) {
      await new Promise((r) => setTimeout(r, this.options.pollingTime || 1000));
      if (this.pending.length > 0) {
        const browser = this.pending.splice(0, 1)[0];
        return browser;
      }
    }
  }
}
