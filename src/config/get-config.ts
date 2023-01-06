import { cpus } from "os";

import { config } from "dotenv";

import { throwIfNullish } from "../utils/assert";

config();

export interface Config {
  threads: number;
  sessionId: string;
  skipIfExists: boolean;
  headless: boolean;
}

export const getConfig = (): Config => {
  return {
    threads:
      process.env["THREADS"] != null
        ? parseInt(process.env["THREADS"])
        : cpus().length,
    sessionId: throwIfNullish(process.env["SESSION_ID"]),
    skipIfExists:
      process.env["SKIP_IF_EXISTS"] != null
        ? process.env["SKIP_IF_EXISTS"] === "true"
        : true,
    headless:
      process.env["HEADLESS"] != null
        ? process.env["HEADLESS"] === "true"
        : false,
  };
};
