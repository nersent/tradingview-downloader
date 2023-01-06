import { Download, ElementHandle, Page } from "playwright";

import { TradingviewChartTimeframe } from "./tradingview-types";

export class TradingviewUIController {
  constructor(public readonly page: Page) {}

  public async handlePopup(): Promise<void> {
    await this.page.waitForSelector("#header-toolbar-save-load");
    await this.page.waitForSelector(".chart-loading-screen-shield", {
      state: "hidden",
    });
    await this.page.waitForSelector(`div[data-role="toast-container"]`, {
      state: "attached",
    });
    // '#overlap-manager-root .tv-dialog.tv-dialog--popup .js-title-text'
    if (
      await this.page.isVisible(
        `div[data-role="toast-container"] button:last-child`,
      )
    ) {
      await this.page.click(
        'div[data-role="toast-container"] button:last-child',
        {
          force: true,
        },
      );
    }
  }

  public async waitUntilLoaded(): Promise<void> {
    await this.page.waitForSelector("#header-toolbar-save-load");
    await this.page.waitForSelector(".chart-loading-screen-shield", {
      state: "hidden",
    });
  }

  public async getIntervalButton(): Promise<ElementHandle<HTMLElement>> {
    const [button] = await this.page.$$(
      '#header-toolbar-intervals div[data-role="button"]',
    );
    return button as ElementHandle<HTMLElement>;
  }

  public async selectDateRange(range = "1950-01-01"): Promise<void> {
    await this.page.click(`div[data-name="go-to-date"]`, { force: true });
    await this.page.waitForSelector(
      'div[data-outside-boundary-for="go-to-date-dialog"] input[name="start-date-range"]',
      { state: "attached" },
    );
    await this.page.click(
      'div[data-outside-boundary-for="go-to-date-dialog"] input[name="start-date-range"]',
      { force: true },
    );

    const input = await this.page.$(
      'div[data-outside-boundary-for="go-to-date-dialog"] input[name="start-date-range"]',
    );
    if (input == null) {
      throw new Error(`[Date range]: Input is undefined`);
    }
    await input.click({ clickCount: 3 });
    await this.page.keyboard.press("Backspace", {});
    await input.type(range);

    await this.page.click(
      `div[data-outside-boundary-for="go-to-date-dialog"] button[name="submit"]`,
      { force: true },
    );

    await input.dispose();
  }

  public async getTimeframe(): Promise<TradingviewChartTimeframe> {
    const button = await this.getIntervalButton();
    const label = await this.page.evaluate(
      (el) => el.innerText?.trim?.(),
      button,
    );
    if (label == null) throw new Error("Check resolution: label is undefined");
    await button.dispose();
    switch (label) {
      case "D": {
        return TradingviewChartTimeframe.ONE_DAY;
      }
      case "4h": {
        return TradingviewChartTimeframe.FOUR_HOURS;
      }
      case "1h": {
        return TradingviewChartTimeframe.ONE_HOUR;
      }
      case "W": {
        return TradingviewChartTimeframe.ONE_WEEK;
      }
      case "M": {
        return TradingviewChartTimeframe.ONE_MONTH;
      }
      default:
        throw new Error(`Incorrect interval ${label}`);
    }
  }

  public async compareTimeframe(
    timeframe: TradingviewChartTimeframe,
  ): Promise<boolean> {
    const button = await this.getIntervalButton();
    const label = await this.page.evaluate(
      (el) => el.innerText?.trim?.(),
      button,
    );
    if (label == null) throw new Error("Check resolution: label is undefined");
    await button.dispose();
    return this.mapTimeframeToLabel(timeframe) === label;
  }

  public async assertTimeframe(
    timeframe: TradingviewChartTimeframe,
  ): Promise<void> {
    const isEqual = await this.compareTimeframe(timeframe);
    if (!isEqual) {
      throw new Error(`Timeframe is not equal to ${timeframe}`);
    }
  }

  public mapTimeframeToLabel(timeframe: TradingviewChartTimeframe): string {
    switch (timeframe) {
      case TradingviewChartTimeframe.ONE_DAY: {
        return "D";
      }
      case TradingviewChartTimeframe.FOUR_HOURS: {
        return "4h";
      }
      case TradingviewChartTimeframe.ONE_HOUR: {
        return "1h";
      }
      case TradingviewChartTimeframe.ONE_MONTH: {
        return "M";
      }
      case TradingviewChartTimeframe.ONE_WEEK: {
        return "W";
      }
    }
  }

  public async waitForMenu(): Promise<void> {
    await this.page.waitForSelector('div[data-name="menu-inner"]', {
      state: "attached",
    });
  }

  public async selectTimeframe(
    timeframe: TradingviewChartTimeframe,
  ): Promise<void> {
    const intervalButton = await this.getIntervalButton();
    await intervalButton.click({ force: true });
    await this.waitForMenu();

    const menuItemHandle = await this.page.$(
      `div[data-name="menu-inner"] div[data-value="${timeframe}"]`,
    );

    if (menuItemHandle == null) {
      throw new Error("Menu item handle is undefined");
    }

    const className = await menuItemHandle.getAttribute("class");
    if (className != null && className.includes("isDisabled")) {
      console.log(this.page.url());
      throw new Error(`Menu item ${timeframe} is disabled`);
    }

    await menuItemHandle.click({ force: true });
    await intervalButton.dispose();
    await menuItemHandle.dispose();

    await this.assertTimeframe(timeframe);
  }

  public async export(): Promise<Download> {
    await this.page.evaluate(() => {
      const menuButtonEl = document.getElementById("header-toolbar-save-load")!
        .parentElement!.children[1] as HTMLElement;
      menuButtonEl.click();
    });
    await this.waitForMenu();
    await this.page.evaluate(() => {
      const exportMenuItemEl = [
        ...document.querySelectorAll('div[data-name="menu-inner"]')[0].children,
      ].find((r) =>
        ((r as HTMLElement).innerText ?? "").toLowerCase().includes("export"),
      ) as HTMLElement;
      exportMenuItemEl.click();
    });
    await this.page.waitForSelector(
      'div[data-outside-boundary-for="chart-export-dialog"]',
      { state: "attached" },
    );

    const submitButton = await this.page.$(
      `div[data-outside-boundary-for="chart-export-dialog"] button[name="submit"]`,
    );

    if (submitButton == null) {
      throw new Error("[Export chart]: Submit button is undefined");
    }

    const [downloadHandle] = await Promise.all([
      this.page.waitForEvent("download"),
      submitButton.click({ force: true }),
    ]);

    await submitButton.dispose();

    return downloadHandle;
  }

  public async getSymbol(): Promise<string | undefined> {
    return await this.page.evaluate(() => {
      const el = document.querySelector(
        "#header-toolbar-symbol-search > div:nth-child(2)",
      );
      return el?.textContent?.trim();
    });
  }

  public async compareSymbol(symbol: string): Promise<boolean> {
    const currentSymbol = await this.getSymbol();
    return (
      currentSymbol?.trim()?.toLowerCase() === symbol?.trim()?.toLowerCase()
    );
  }

  public async assertSymbol(symbol: string): Promise<void> {
    const isEqual = await this.compareSymbol(symbol);
    if (!isEqual) {
      throw new Error(`Symbol is not equal to ${symbol}`);
    }
  }

  public async getTitle(): Promise<string | undefined> {
    const title = await this.page.evaluate(() => {
      const el = document.querySelector(
        `div[data-name="legend-source-title"]:first-child`,
      );
      return el?.textContent?.trim();
    });
    return title;
  }

  public async compareTitle(title: string): Promise<boolean> {
    const currentTitle = await this.getTitle();
    return currentTitle?.trim()?.toLowerCase() === title?.trim()?.toLowerCase();
  }

  public async assertTitle(title: string): Promise<void> {
    const isEqual = await this.compareTitle(title);
    if (!isEqual) {
      throw new Error(`Title is not equal to ${title}`);
    }
  }

  public async waitUntilLegendLoaded(): Promise<void> {
    await this.page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const check = (): void => {
          setTimeout(() => {
            const legendItems = [
              ...document.querySelectorAll(
                'div[data-name="legend-source-item"]',
              ),
            ] as HTMLElement[];
            for (const legendItem of legendItems) {
              if (
                [...legendItem.classList].find((r) =>
                  r.startsWith("eyeLoading"),
                )
              ) {
                return check();
              }
            }
            resolve();
          }, 100);
        };

        check();
      });
    });
  }

  public async iterateTimeframes(
    timeframes: TradingviewChartTimeframe[],
    delegate: (timeframe: TradingviewChartTimeframe) => Promise<void>,
  ): Promise<void> {
    let currentTimeframe = await this.getTimeframe();
    const currentTimeframeIndex = timeframes.findIndex(
      (r) => r === currentTimeframe,
    );

    const sortedIntervals =
      currentTimeframeIndex === -1
        ? timeframes
        : [
            timeframes[currentTimeframeIndex],
            ...timeframes.slice(0, currentTimeframeIndex),
            ...timeframes.slice(currentTimeframeIndex + 1),
          ];
    for (const timeframe of sortedIntervals) {
      currentTimeframe = await this.getTimeframe();

      if (currentTimeframe !== timeframe) {
        await this.selectTimeframe(timeframe);
        await this.waitUntilLoaded();
        await this.waitUntilLegendLoaded();
      }

      await delegate(timeframe);
    }
  }
}
