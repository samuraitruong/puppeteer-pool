/// <reference types="node" />
import { IPuppeteerPoolOptions } from "./interface";
import { Browser } from "puppeteer";
import { EventEmitter } from "events";
export declare class PuppeteerPool extends EventEmitter {
  private options;
  private initialized;
  private pending;
  private queue;
  duplicatedHash: {};
  running: number;
  constructor(options: IPuppeteerPoolOptions);
  addJob(data: any): void;
  finish(browser: Browser): void;
  waitUntiEmpty(): Promise<void>;
  close(): Promise<void>;
  private getBrowser;
}
