import { LaunchOptions } from "puppeteer";
export interface IPuppeteerPoolOptions extends LaunchOptions {
  instanceCount: number;
  jobDelay?: number;
  pollingTime?: number;
  skipDuplicate?: boolean;
}
