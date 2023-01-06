export type TradingviewAssetType =
  | "all"
  | "crypto"
  | "stocks"
  | "forex"
  | "indices"
  | "bonds"
  | "economy";

export enum TradingviewChartTimeframe {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ONE_DAY = "1D",
  // eslint-disable-next-line @typescript-eslint/naming-convention
  FOUR_HOURS = "240",
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ONE_HOUR = "60",
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ONE_MONTH = "1M",
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ONE_WEEK = "1W",
}
