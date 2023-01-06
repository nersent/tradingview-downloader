import { TradingviewDownloadFormatPathContext } from "./tradingview/tradingview-client";
import { TradingviewDownloadRequest } from "./tradingview/tradingview-downloader-types";
import { TradingviewCharts } from "./tradingview/tradingview-public-charts";
import { TradingviewChartTimeframe } from "./tradingview/tradingview-types";
import { stringifyTradingviewChartTimeFrame } from "./tradingview/tradingview-utils";

export const formatTradingviewDownloadPath = (
  ctx: TradingviewDownloadFormatPathContext,
): string => {
  return `${ctx.name}/${stringifyTradingviewChartTimeFrame(ctx.timeframe)}.csv`;
};

export const TRADINGVIEW_DOWNLOAD_LIST: TradingviewDownloadRequest[] = [
  {
    name: "BTCUSDT",
    chartId: TradingviewCharts.OHLCV,
    symbol: "BITSTAMP%3ABTCUSD",
    timeframe: [TradingviewChartTimeframe.ONE_HOUR],
  },
  {
    name: "ETHUSDT",
    chartId: TradingviewCharts.OHLCV,
    symbol: "BITSTAMP%3AETHUSD",
    timeframe: [TradingviewChartTimeframe.FOUR_HOURS],
  },
];
