import { describe, expect, it } from "vitest";
import {
  createNavigationDeck,
  createRitualDeck,
  NAVIGATION_CARD_DEFINITIONS,
  RITUAL_CARD_DEFINITIONS,
} from "../shared/cards";
import { GAME_PROMPTS } from "../shared/actionPrompts";

describe("card data and action prompts", () => {
  it("builds the supplied 23-card Long Journey Navigation deck", () => {
    const deck = createNavigationDeck("LONG_JOURNEY");
    expect(deck).toHaveLength(23);
    expect(new Set(deck.map((card) => card.id)).size).toBe(23);
    expect(deck.filter((card) => card.effect === "CULT_UPRISING")).toHaveLength(6);
    expect(deck.filter((card) => card.effect === "ARMED")).toHaveLength(2);
  });

  it("builds the supplied 19-card Quick Journey deck without Armed", () => {
    const deck = createNavigationDeck("QUICK_JOURNEY");
    expect(deck).toHaveLength(19);
    expect(deck.some((card) => card.effect === "ARMED")).toBe(false);
  });

  it("builds the five-card single-use Ritual deck", () => {
    const deck = createRitualDeck();
    expect(deck).toHaveLength(5);
    expect(deck.filter((id) => id === "CONVERSION")).toHaveLength(3);
    expect(deck.filter((id) => id === "CULT_GUNS_STASH")).toHaveLength(1);
    expect(deck.filter((id) => id === "CULT_CABIN_SEARCH")).toHaveLength(1);
  });

  it("marks only choice-bearing navigation effects as manual", () => {
    expect(NAVIGATION_CARD_DEFINITIONS.red_mermaid.automatic).toBe(false);
    expect(NAVIGATION_CARD_DEFINITIONS.red_telescope.automatic).toBe(false);
    expect(NAVIGATION_CARD_DEFINITIONS.red_armed.automatic).toBe(true);
  });

  it("keeps Conversion secret and blocks undo after information is created", () => {
    expect(RITUAL_CARD_DEFINITIONS.CONVERSION.publicPrompt).not.toContain("targetId");
    expect(GAME_PROMPTS.RITUAL_CONVERSION.undoBoundary).toBe("NEVER_AFTER_CONFIRM");
    expect(GAME_PROMPTS.TELESCOPE_DECISION.undoBoundary).toBe("NEVER_AFTER_CONFIRM");
  });
});
