import { randomInt } from "node:crypto";

export interface Rng {
  int(maxExclusive: number): number;
}

export const secureRng: Rng = {
  int(maxExclusive) {
    if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0) {
      throw new RangeError("maxExclusive must be a positive safe integer");
    }
    return randomInt(maxExclusive);
  },
};

export function createSeededRng(seed: number): Rng {
  let state = seed >>> 0;
  return {
    int(maxExclusive) {
      if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0) {
        throw new RangeError("maxExclusive must be a positive safe integer");
      }
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return Math.floor((((value ^ (value >>> 14)) >>> 0) / 4294967296) * maxExclusive);
    },
  };
}

export function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = rng.int(index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}
