import { mkdir, stat, unlink } from "fs/promises";

export type Offset = any;

export const pathExists = async (path: string): Promise<boolean> => {
  try {
    await stat(path);
  } catch (err) {
    return false;
  }

  return true;
};

export const removeFile = async (path: string): Promise<void> => {
  try {
    await unlink(path);
  } catch (err) {
    if ((err as any)?.code !== "ENOENT") {
      throw err;
    }
  }
};

export const ensureDir = async (...paths: string[]): Promise<void> => {
  await Promise.all(
    paths.map(async (path) => {
      if (!(await pathExists(path))) {
        await mkdir(path, { recursive: true });
      }
    }),
  );
};
