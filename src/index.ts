import { resolve } from "path";

import chalk from "chalk";

import { downloadList } from "./app";
import { getConfig } from "./config/get-config";
import { TradingviewClient } from "./tradingview/tradingview-client";

process.on("uncaughtException", (e) => {
  console.log(`uncaughtException at ${new Date().toLocaleString()}`);
  console.log(e);
});

process.on("unhandledRejection", (e) => {
  console.log(`unhandledRejection at ${new Date().toLocaleString()}`);
  console.log(e);
});

process.on("exit", () => {
  console.log(`Process exited at ${new Date().toLocaleString()}`);
});

const main = async (): Promise<void> => {
  const config = getConfig();
  const runtimeDataPath = resolve(".runtime");
  const tradingviewClient = new TradingviewClient({
    sessionId: config.sessionId,
    headless: config.headless,
    cachePath: resolve(runtimeDataPath, "cache"),
    userDataPath: resolve(runtimeDataPath, "userdata"),
    threads: config.threads,
    skipIfExists: config.skipIfExists,
  });

  console.log(
    chalk.blue(
      `⚡ Initializing | Threads: ${config.threads} | Headless: ${config.headless}`,
    ),
  );
  await tradingviewClient.init();
  console.log(chalk.blueBright("✔️  Initialized"));

  await downloadList(tradingviewClient);

  await tradingviewClient.close();
};

main();
