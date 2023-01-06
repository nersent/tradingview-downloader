export const filterNullable = <T>(items: (T | null | undefined)[]): T[] => {
  return items.filter((item) => item != null) as T[];
};

export const filterForObjects = <T extends Record<string, any>>(
  items: (T | null | undefined | false)[],
): T[] => {
  return items.filter(
    (item) => item != null && item !== false && typeof item === "object",
  ) as T[];
};

export const filterDuplicates = <T>(items: (T | null | undefined)[]): T[] => {
  return [...new Set(items)] as T[];
};

export const disjointSet = <T>(a: T[], b: T[]): T[] => {
  return a.filter((item) => !b.includes(item));
};

export const groupItemsByKey = <T, K extends number | string>(
  items: T[],
  getKeyDelegate: (item: T) => K,
): Map<K, T[]> => {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = getKeyDelegate(item);
    const list = map.get(key);
    if (list != null) {
      list.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
};

export const arrayToMap = <T extends Record<string, any>, K extends keyof T>(
  items: T[],
  getKeyDelegate: K,
): Map<T[K], T> => {
  const map = new Map<T[K], T>();
  for (const item of items) {
    const key = item[getKeyDelegate];
    map.set(key, item);
  }
  return map;
};

export const arrayToMapByKeys = <A extends Record<string, any>, B>(
  keys: A[],
  delegate: (key: A) => B,
): Map<A, B> => {
  const map = new Map<A, B>();
  for (const key of keys) {
    const value = delegate(key);
    if (value == null) {
      throw new Error("Delegate returned null or undefined");
    }
    map.set(key, value);
  }
  return map;
};

export const splitArrayIntoChunks = <T>(arr: T[], size: number): T[][] => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    const chunk = arr.slice(i, i + size);
    chunks.push(chunk);
  }
  return chunks;
};
