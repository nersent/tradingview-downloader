import {
  TradingviewAssetType,
  TradingviewChartTimeframe,
} from "./tradingview-types";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export type TradingviewDownloadRequest =
  | {
      name: string;
      chartId: string;
      timeframe: TradingviewChartTimeframe | TradingviewChartTimeframe[];
    } & {
      symbol: string;
    };

export type TradingviewDownloadFormat = "csv";
