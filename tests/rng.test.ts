import { describe, expect, it } from "vitest";
import { createSeededRng, shuffled } from "../server/engine/rng";

describe("seeded RNG", () => {
  it("repeats exactly for deterministic engine tests", () => {
    expect(shuffled([1, 2, 3, 4, 5], createSeededRng(8472))).toEqual(shuffled([1, 2, 3, 4, 5], createSeededRng(8472)));
  });

  it("does not mutate the source array", () => {
    const source = [1, 2, 3];
    shuffled(source, createSeededRng(1));
    expect(source).toEqual([1, 2, 3]);
  });
});
