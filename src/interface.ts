import { LaunchOptions } from "puppeteer";

export interface IPuppeteerPoolOptions extends LaunchOptions {
  instanceCount: number;
  jobDelay?: number;
  /**
   * time delay to check the item in the pool, use to delay the job start when it added to the pool
   * @default 1000
   */
  pollingTime?: number;
  skipDuplicate?: boolean;
  /**
   * Close all open pages when pool job finish
   */
  closePageOnFinished?: boolean;
  /*
   * Wait time before exit when queue is empty

   */
  waitPeriod?: number;
  /**
   * If userProfileDir set, Pool will close it in to tmp folder
   */
  cloneProfileDir?: string;

  cleanDataDirs?: boolean;
}
