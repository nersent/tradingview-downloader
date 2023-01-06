import { Thread } from "@nersent/lambda-fun";
import { BrowserContext, Page } from "playwright";

export interface TradingViewClientThreadOptions {
  sessionId: string;
}

export class TradingViewClientThread<T> extends Thread<T> {
  private page: Page | undefined = undefined;

  constructor(
    id: string,
    private readonly browserCtx: BrowserContext,
    private readonly options: TradingViewClientThreadOptions,
  ) {
    super(id);
  }

  public override async init(): Promise<void> {
    super.init();
  }

  public async createPage(): Promise<Page> {
    if (this.page != null && !this.page.isClosed()) {
      await this.page.close();
    }
    this.page = await this.browserCtx.newPage();
    await this.page.setViewportSize({
      width: 1024,
      height: 1024,
    });
    await this.page.context().addCookies([
      {
        name: "sessionid",
        value: this.options.sessionId,
        domain: ".tradingview.com",
        path: "/",
      },
    ]);
    return this.page;
  }

  public getBrowserContext(): BrowserContext {
    return this.browserCtx;
  }

  public async getPage(): Promise<Page> {
    if (this.page != null) return this.page;
    return await this.createPage();
  }

  public getPageOrFail(): Page {
    if (this.page == null) throw new Error("Page is not initialized");
    return this.page;
  }

  public override canRun(): boolean {
    return super.canRun();
  }
}
