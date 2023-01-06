import { dirname, resolve } from "path";

import TradingviewApi from "@mathieuc/tradingview";
import { EventEmitter, EventRegistry } from "@nersent/event-emitter";
import {
  ThreadScheduler,
  ThreadManager,
  createThreadScheduler,
  createTask,
} from "@nersent/lambda-fun";
import chalk from "chalk";
import { Browser, BrowserContext, chromium, Page } from "playwright";

import { filterDuplicates } from "../utils/array";
import { throwIfNullish } from "../utils/assert";
import { ensureDir, pathExists } from "../utils/fs";

import { TradingViewClientThread } from "./tradingview-client-thread";
import {
  TradingviewIndicator,
  TradingviewMarketEntry,
} from "./tradingview-client-types";
import {
  TradingviewDownloadFormat,
  TradingviewDownloadRequest,
} from "./tradingview-downloader-types";
import { TradingviewChartTimeframe } from "./tradingview-types";
import { TradingviewUIController } from "./tradingview-ui-controller";

export interface TradingviewClientOptions {
  sessionId: string;
  cachePath: string;
  userDataPath: string;
  headless?: boolean;
  threads?: number;
  skipIfExists?: boolean;
}

export type TradingviewDownloadContext = {
  timeframe: TradingviewChartTimeframe;
  path: string;
} & Omit<TradingviewDownloadRequest, "timeframe">;

export type TradingviewDownloadFormatPathContext = Omit<
  TradingviewDownloadContext,
  "path"
>;

export interface TradingviewDownloadOptions {
  path: (ctx: TradingviewDownloadFormatPathContext) => string;
  format?: TradingviewDownloadFormat;
}

export type TradingviewClientEvents = {
  download(ctx: TradingviewDownloadContext): void;
  downloaded(ctx: TradingviewDownloadContext): void;
  skipDownload(ctx: TradingviewDownloadContext): void;
};

export class TradingviewClient extends EventRegistry<TradingviewClientEvents> {
  protected readonly emitter = new EventEmitter<TradingviewClientEvents>(this);

  private readonly threadPool: ThreadManager<any>;

  private readonly threadScheduler: ThreadScheduler;

  private readonly tradingviewApiClient: any;

  constructor(public readonly options: TradingviewClientOptions) {
    super();

    this.threadPool = new ThreadManager();
    this.threadScheduler = createThreadScheduler(this.threadPool);

    this.tradingviewApiClient = new TradingviewApi.Client({
      token: this.options.sessionId,
    });
    this.tradingviewApiClient.onError(this.handleApiClientError);
  }

  private handleApiClientError = (err: any): void => {
    this.tradingviewApiClient.end();
    throw new Error(err);
  };

  public async init(): Promise<void> {
    await Promise.all(
      Array.from({ length: this.options.threads ?? 1 }).map(
        async (r, index) => {
          const id = index.toString();
          const ctx = await this.createBrowserContext(id);
          const thread = new TradingViewClientThread(id, ctx, {
            sessionId: this.options.sessionId,
          });
          await thread.init();
          this.threadPool.add(thread);
        },
      ),
    );
  }

  public async close(): Promise<void> {
    await Promise.all(
      this.threadPool.getAll().map(async (t) => {
        const thread = t as TradingViewClientThread<any>;
        if (thread.isRunning()) {
          const page = thread.getPageOrFail();
          const url = page.url();
          console.log(
            chalk.redBright(
              `Warning: Thread ${thread.getId()} is still running | URL: ${url}`,
            ),
          );
        }
        await thread.getBrowserContext().close();
      }),
    );
  }

  private async createBrowserContext(id: string): Promise<BrowserContext> {
    const userDataPath = resolve(this.options.userDataPath, id);
    await ensureDir(userDataPath);
    return await chromium.launchPersistentContext(userDataPath, {
      headless: this.options.headless,
      chromiumSandbox: false,
      args: ["--use-gl=egl", "--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  public async download(
    req: TradingviewDownloadRequest,
    options: TradingviewDownloadOptions,
  ): Promise<void> {
    let timeframes = filterDuplicates(
      Array.isArray(req.timeframe) ? req.timeframe : [req.timeframe],
    );

    const timeFrameToCtx = new Map<
      TradingviewChartTimeframe,
      TradingviewDownloadContext
    >();

    for (const timeframe of timeframes) {
      const pathCtx: TradingviewDownloadFormatPathContext = {
        chartId: req.chartId,
        timeframe,
        name: req.name,
        symbol: req.symbol,
      };
      timeFrameToCtx.set(timeframe, {
        ...pathCtx,
        path: options.path(pathCtx),
      });
    }

    await ensureDir(
      ...[...timeFrameToCtx.values()].map((r) => dirname(r.path)),
    );

    if (this.options.skipIfExists) {
      timeframes = await Promise.all(
        timeframes.map(async (timeframe) => {
          const ctx = throwIfNullish(timeFrameToCtx.get(timeframe));
          if (!(await pathExists(ctx.path))) {
            return timeframe;
          }
          this.emitter.emit("skipDownload", ctx);
          return undefined;
        }),
      ).then((items) =>
        items.filter((r): r is TradingviewChartTimeframe => r != null),
      );
    }

    if (timeframes.length === 0) {
      return;
    }

    const task = createTask(async (xd) => {
      const thread = this.threadScheduler.getThreadByTask(
        task,
      ) as TradingViewClientThread<any>;
      const page = await thread.getPage();
      const url = `https://en.tradingview.com/chart/${req.chartId}/?symbol=${req.symbol}`;
      await page.goto(url);
      const uiController = new TradingviewUIController(page);
      await uiController.handlePopup();

      await uiController.iterateTimeframes(timeframes, async (timeframe) => {
        const ctx = throwIfNullish(timeFrameToCtx.get(timeframe));

        this.emitter.emit("download", ctx);

        await uiController.selectDateRange();
        await uiController.waitUntilLoaded();
        await uiController.waitUntilLegendLoaded();
        const downloadHandle = await uiController.export();

        await downloadHandle.saveAs(ctx.path);
        this.emitter.emit("downloaded", ctx);
      });
    });
    await this.threadScheduler.run(task);
  }

  public async queryIndicators(name: string): Promise<TradingviewIndicator[]> {
    return await TradingviewApi.searchIndicator(name);
  }

  public async queryMarket(name: string): Promise<TradingviewMarketEntry[]> {
    return await TradingviewApi.searchMarket(name);
  }

  public async getIndicator(id: string): Promise<TradingviewIndicator> {
    return await TradingviewApi.getIndicator(id);
  }
}
