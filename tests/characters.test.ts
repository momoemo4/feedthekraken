import { describe, expect, it } from "vitest";
import {
  CHARACTER_DECK,
  CHARACTER_IDS,
  createCharacterCard,
  createCharacterRuntimeState,
  hydrateCharacterCard,
} from "../shared/characters";

describe("Character catalog", () => {
  it("contains all 22 uniquely numbered Character cards", () => {
    expect(CHARACTER_DECK).toHaveLength(22);
    expect(new Set(CHARACTER_DECK.map((card) => card.id)).size).toBe(22);
    expect(CHARACTER_DECK.map((card) => card.number)).toEqual(Array.from({ length: 22 }, (_, index) => index + 1));
    expect(CHARACTER_IDS).toHaveLength(22);
  });

  it("creates independent face-down runtime cards", () => {
    const first = createCharacterCard("gunslinger");
    const second = createCharacterCard("gunslinger");

    first.revealed = true;
    first.used = true;
    first.status = "used";

    expect(second).toMatchObject({
      id: "gunslinger",
      name: "Gunslinger",
      type: "one_shot",
      revealed: false,
      used: false,
      active: false,
      status: "face_down",
    });
  });

  it("hydrates persistent state without treating it as a spent one-shot", () => {
    const state = createCharacterRuntimeState("gunsmith");
    state.revealed = true;
    state.active = true;
    state.status = "active";
    state.activationCount = 1;

    expect(hydrateCharacterCard(state)).toMatchObject({
      id: "gunsmith",
      type: "persistent",
      revealed: true,
      used: false,
      active: true,
      status: "active",
      activationCount: 1,
    });
  });

  it("keeps supplied rules data-only until reducer handlers exist", () => {
    expect(CHARACTER_DECK.every((card) => card.implemented === false)).toBe(true);
  });
});
