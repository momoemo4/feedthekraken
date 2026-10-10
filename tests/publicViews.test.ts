import { describe, expect, it } from "vitest";
import { getPublicView } from "../server/network/publicViews";
import { gameState } from "./fixtures";

const forbiddenKeys = [
  "sessionToken", "originalFaction", "currentFaction", "characterState", "character", "navigationCards",
  "convertible", "pendingConversionTargetId", "mutinyCommitments", "rngSeedAudit", "internalEvents",
  "drawPile", "discardPile", "ritualDeck", "hostPlayerId",
];

function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((item) => collectKeys(item, keys));
  else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      keys.add(key);
      collectKeys(child, keys);
    }
  }
  return keys;
}

describe("getPublicView", () => {
  it("never exposes hidden fields or hidden values", () => {
    const view = getPublicView(gameState());
    const keys = collectKeys(view);
    forbiddenKeys.forEach((key) => expect(keys.has(key), key).toBe(false));

    const json = JSON.stringify(view);
    ["token-p1", "gunslinger", "Gunslinger", "SECRET_NAV", "TOP_SECRET_CARD", "SERVER_ONLY_SEED"].forEach((secret) => {
      expect(json).not.toContain(secret);
    });
  });

  it("publishes only mutiny readiness, never gun commitments", () => {
    const view = getPublicView(gameState());
    expect(view.mutinyReadyPlayerIds).toEqual(["p1", "p2"]);
    expect(JSON.stringify(view)).not.toContain('"p1":3');
  });
});
