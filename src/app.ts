import { resolve } from "path";

import { ETA } from "@nersent/lambda-fun";
import chalk from "chalk";

import { Config } from "./config/get-config";
import {
  TRADINGVIEW_DOWNLOAD_LIST,
  formatTradingviewDownloadPath,
} from "./list";
import { TradingviewClient } from "./tradingview/tradingview-client";
import { stringifyTradingviewChartTimeFrame } from "./tradingview/tradingview-utils";

export const downloadList = async (
  tradingviewClient: TradingviewClient,
): Promise<void> => {
  const downloadCount = TRADINGVIEW_DOWNLOAD_LIST.reduce((count, item) => {
    return count + (Array.isArray(item.timeframe) ? item.timeframe.length : 1);
  }, 0);
  console.log(chalk.yellowBright(`💸 Downloading ${downloadCount} items`));

  const startTime = Date.now();
  const downloadEta = new ETA().setTotal(downloadCount).setCurrent(0);
  downloadEta.start();

  tradingviewClient.on("skipDownload", (ctx) => {
    console.log(
      chalk.green(
        `✔️  Skipped ${ctx.name} | ${stringifyTradingviewChartTimeFrame(
          ctx.timeframe,
        )}`,
      ),
    );
  });

  tradingviewClient.on("download", (ctx) => {
    console.log(
      chalk.magentaBright(
        `⬇️  Downloading ${ctx.name} | ${stringifyTradingviewChartTimeFrame(
          ctx.timeframe,
        )} | ETA: ${downloadEta.getCurrent()}s`,
      ),
    );
  });

  tradingviewClient.on("downloaded", (ctx) => {
    console.log(
      chalk.greenBright(
        `✔️  Downloaded ${ctx.name} | ${stringifyTradingviewChartTimeFrame(
          ctx.timeframe,
        )} | ${ctx.path}`,
      ),
    );
    downloadEta.setCurrent(downloadEta.getCurrent() + 1);
  });

  await Promise.all(
    TRADINGVIEW_DOWNLOAD_LIST.map(async (item) => {
      await tradingviewClient.download(item, {
        path: (ctx) => resolve(".out", formatTradingviewDownloadPath(ctx)),
      });
    }),
  );

  const endTime = Date.now() - startTime;
  console.log(`✅ Done after ${endTime / 1000}s`);
};
