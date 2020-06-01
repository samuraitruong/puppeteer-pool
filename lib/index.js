"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.PuppeteerPool = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const events_1 = require("events");
class PuppeteerPool extends events_1.EventEmitter {
  constructor(options) {
    super();
    this.options = options;
    this.queue = [];
    this.duplicatedHash = {};
    this.running = 0;
    this.initialized = [];
    this.queue = [];
    this.pending = [];
    this.duplicatedHash = {};
  }
  addJob(data) {
    if (this.options.skipDuplicate && this.duplicatedHash[data]) {
      return;
    }
    this.duplicatedHash[data] = true;
    this.queue.push(data);
  }
  finish(browser) {
    this.pending.push(browser);
  }
  waitUntiEmpty() {
    return __awaiter(this, void 0, void 0, function* () {
      while (this.running > 0 || this.queue.length > 0) {
        console.log(
          "Status Queue length : %d , running %d, browser initialized %d",
          this.queue.length,
          this.running,
          this.initialized.length
        );
        if (this.queue.length > 0) {
          const data = this.queue.splice(0, 1)[0];
          const browser = yield this.getBrowser();
          if (browser == null) {
            process.exit(1);
          }
          const me = this;
          this.emit("task", {
            browser,
            data,
            done: (b) => {
              me.running--;
              me.pending.push(b);
            },
          });
          this.running++;
        } else {
          yield new Promise((r) =>
            setTimeout(r, this.options.jobDelay || 1000)
          );
        }
      }
    });
  }
  close() {
    return __awaiter(this, void 0, void 0, function* () {
      yield Promise.all(this.initialized.map((x) => x.close()));
    });
  }
  getBrowser() {
    return __awaiter(this, void 0, void 0, function* () {
      if (this.pending.length > 0) {
        const browser = this.pending.splice(0, 1)[0];
        return browser;
      }
      if (this.initialized.length <= this.options.instanceCount) {
        const browser = yield puppeteer_1.default.launch(
          Object.assign({}, this.options)
        );
        this.initialized.push(browser);
        return browser;
      }
      while (true) {
        yield new Promise((r) =>
          setTimeout(r, this.options.pollingTime || 1000)
        );
        if (this.pending.length > 0) {
          const browser = this.pending.splice(0, 1)[0];
          return browser;
        }
      }
    });
  }
}
exports.PuppeteerPool = PuppeteerPool;
//# sourceMappingURL=index.js.map
