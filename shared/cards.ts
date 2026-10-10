import type { Direction, GameState } from "./types";

export type NavigationEffectId =
  | "CULT_UPRISING"
  | "DRUNK"
  | "DISARMED"
  | "MERMAID"
  | "TELESCOPE"
  | "ARMED";

export type NavigationCardKey =
  | "yellow_cult_uprising"
  | "blue_drunk"
  | "blue_disarmed"
  | "red_drunk"
  | "red_mermaid"
  | "red_telescope"
  | "red_armed";

export interface NavigationCardDefinition {
  key: NavigationCardKey;
  name: string;
  direction: Direction;
  effect: NavigationEffectId;
  publicPrompt: string;
  privatePrompt: string | null;
  automatic: boolean;
  implemented: boolean;
}

export interface NavigationCardInstance extends NavigationCardDefinition {
  id: string;
}

export const NAVIGATION_CARD_DEFINITIONS: Readonly<Record<NavigationCardKey, NavigationCardDefinition>> = Object.freeze({
  yellow_cult_uprising: {
    key: "yellow_cult_uprising",
    name: "Cult Uprising",
    direction: "yellow",
    effect: "CULT_UPRISING",
    publicPrompt: "CULT UPRISING — draw and resolve one remaining Cult Ritual after the Navigation action.",
    privatePrompt: null,
    automatic: true,
    implemented: false,
  },
  blue_drunk: {
    key: "blue_drunk",
    name: "Drunk",
    direction: "blue",
    effect: "DRUNK",
    publicPrompt: "DRUNK — the server transfers Captain clockwise to the eligible player with the fewest résumé cards.",
    privatePrompt: null,
    automatic: true,
    implemented: false,
  },
  blue_disarmed: {
    key: "blue_disarmed",
    name: "Disarmed",
    direction: "blue",
    effect: "DISARMED",
    publicPrompt: "DISARMED — the Navigator loses 1 Gun if they have one.",
    privatePrompt: null,
    automatic: true,
    implemented: false,
  },
  red_drunk: {
    key: "red_drunk",
    name: "Drunk",
    direction: "red",
    effect: "DRUNK",
    publicPrompt: "DRUNK — the server transfers Captain clockwise to the eligible player with the fewest résumé cards.",
    privatePrompt: null,
    automatic: true,
    implemented: false,
  },
  red_mermaid: {
    key: "red_mermaid",
    name: "Mermaid",
    direction: "red",
    effect: "MERMAID",
    publicPrompt: "MERMAID — waiting for the Captain to choose another player.",
    privatePrompt: "Choose another player. They will privately inspect the last 3 discarded Navigation Cards.",
    automatic: false,
    implemented: false,
  },
  red_telescope: {
    key: "red_telescope",
    name: "Telescope",
    direction: "red",
    effect: "TELESCOPE",
    publicPrompt: "TELESCOPE — waiting for the Captain to choose another player.",
    privatePrompt: "Choose another player. They will privately inspect the top Navigation Card and choose KEEP ON TOP or DISCARD.",
    automatic: false,
    implemented: false,
  },
  red_armed: {
    key: "red_armed",
    name: "Armed",
    direction: "red",
    effect: "ARMED",
    publicPrompt: "ARMED — the Navigator gains 1 Gun.",
    privatePrompt: null,
    automatic: true,
    implemented: false,
  },
});

export const NAVIGATION_DECK_SPECS: Readonly<Record<GameState["mapId"], Readonly<Partial<Record<NavigationCardKey, number>>>>> = Object.freeze({
  LONG_JOURNEY: Object.freeze({
    yellow_cult_uprising: 6,
    blue_drunk: 4,
    blue_disarmed: 2,
    red_drunk: 5,
    red_mermaid: 2,
    red_telescope: 2,
    red_armed: 2,
  }),
  QUICK_JOURNEY: Object.freeze({
    yellow_cult_uprising: 5,
    blue_drunk: 3,
    blue_disarmed: 2,
    red_drunk: 5,
    red_mermaid: 2,
    red_telescope: 2,
  }),
});

export function createNavigationDeck(mapId: GameState["mapId"]): NavigationCardInstance[] {
  let sequence = 0;
  return Object.entries(NAVIGATION_DECK_SPECS[mapId]).flatMap(([rawKey, count]) => {
    const key = rawKey as NavigationCardKey;
    const definition = NAVIGATION_CARD_DEFINITIONS[key];
    return Array.from({ length: count ?? 0 }, () => {
      sequence += 1;
      return { ...definition, id: `NAV-${String(sequence).padStart(2, "0")}` };
    });
  });
}

export type RitualCardId = "CONVERSION" | "CULT_GUNS_STASH" | "CULT_CABIN_SEARCH";

export interface RitualCardDefinition {
  id: RitualCardId;
  name: string;
  count: number;
  publicPrompt: string;
  cultLeaderPrompt: string;
  automatic: boolean;
  implemented: boolean;
}

export const RITUAL_CARD_DEFINITIONS: Readonly<Record<RitualCardId, RitualCardDefinition>> = Object.freeze({
  CONVERSION: {
    id: "CONVERSION",
    name: "Conversion to Cult",
    count: 3,
    publicPrompt: "CONVERSION IS BEING RESOLVED — waiting for the Cult Leader. The target remains secret.",
    cultLeaderPrompt: "Choose 1 convertible player. Cabin-Searched or Flogged players are not legal targets. Confirming is final and the public table will not reveal the target.",
    automatic: false,
    implemented: false,
  },
  CULT_GUNS_STASH: {
    id: "CULT_GUNS_STASH",
    name: "Cult's Guns Stash",
    count: 1,
    publicPrompt: "CULT'S GUNS STASH — waiting for the Cult Leader to distribute exactly 3 Guns.",
    cultLeaderPrompt: "Distribute exactly 3 Guns. You may choose yourself, any player, and place multiple Guns on the same player. Review the total before confirming.",
    automatic: false,
    implemented: false,
  },
  CULT_CABIN_SEARCH: {
    id: "CULT_CABIN_SEARCH",
    name: "Cult Cabin Search",
    count: 1,
    publicPrompt: "CULT CABIN SEARCH HAS RESOLVED — its result is private to the Cult Leader.",
    cultLeaderPrompt: "Privately inspect the current factions of the Captain, Lieutenant, and Navigator. Close this panel when ready.",
    automatic: true,
    implemented: false,
  },
});

export function createRitualDeck(): RitualCardId[] {
  return Object.values(RITUAL_CARD_DEFINITIONS).flatMap((definition) =>
    Array.from({ length: definition.count }, () => definition.id),
  );
}
