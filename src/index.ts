import { IPuppeteerPoolOptions } from './interface';
import puppeteer, { Browser } from 'puppeteer';
import { EventEmitter } from 'events';

export class PuppeteerPool extends EventEmitter {
  private initialized: Browser[];
  private pending: Browser[];
  private queue: any[] = [];
  public duplicatedHash = {};
  public running = 0;

  constructor(private options: IPuppeteerPoolOptions) {
    super();
    this.initialized = [];
    this.queue = [];
    this.pending = [];
    this.duplicatedHash = {};
  }

  public addJob(data: any) {
    if (this.options.skipDuplicate && this.duplicatedHash[data]) {
      return;
    }
    this.duplicatedHash[data] = true;
    this.queue.push(data);
  }

  public finish(browser: Browser) {
    this.pending.push(browser);
  }

  public async waitUntiEmpty() {
    while (this.running > 0 || this.queue.length > 0) {
      console.log(
        'Status Queue length : %d , running %d, browser initialized %d',
        this.queue.length,
        this.running,
        this.initialized.length
      );
      if (this.queue.length > 0) {
        const data = this.queue.splice(0, 1)[0];
        const browser = await this.getBrowser();
        if (browser == null) {
          process.exit(1);
        }
        const me = this;
        this.emit('task', {
          browser,
          data,
          done: (b) => {
            me.running--;
            me.pending.push(b);
          },
        });
        this.running++;
      } else {
        await new Promise((r) => setTimeout(r, this.options.jobDelay || 1000));
      }
    }
  }

  public async close() {
    await Promise.all(this.initialized.map((x) => x.close()));
  }

  private async getBrowser() {
    if (this.pending.length > 0) {
      const browser = this.pending.splice(0, 1)[0];
      return browser;
    }
    if (this.initialized.length <= this.options.instanceCount) {
      const browser = await puppeteer.launch({ ...this.options });
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
