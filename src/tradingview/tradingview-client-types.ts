export interface TradingviewMarketEntry {
  id: string;
  exchange: string;
  fullExchange: string;
  screener: string;
  symbol: string;
  description: string;
  type: string;
  getTA: any;
}

export interface TradingviewIndicator {
  id: string;
  version: string;
  name: string;
  author: TradingviewIndicatorAuthor;
  image: string;
  access: string;
  source: string;
  type: string;
  get: (...args: any[]) => any;
}

export interface TradingviewIndicatorAuthor {
  id: number;
  username: string;
}
