import { TradingviewChartTimeframe } from "./tradingview-types";

export const stringifyTradingviewChartTimeFrame = (
  timeframe: TradingviewChartTimeframe,
): string => {
  switch (timeframe) {
    case TradingviewChartTimeframe.ONE_DAY:
      return "day";
    case TradingviewChartTimeframe.FOUR_HOURS:
      return "four_hours";
    case TradingviewChartTimeframe.ONE_HOUR:
      return "one_hour";
    case TradingviewChartTimeframe.ONE_MONTH:
      return "one_month";
    case TradingviewChartTimeframe.ONE_WEEK:
      return "one_week";
    default:
      throw new Error(`Incorrect timeframe ${timeframe}`);
  }
};
