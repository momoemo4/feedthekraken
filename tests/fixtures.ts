import type { GameState, SecretPlayer } from "../shared/types";
import { createCharacterRuntimeState } from "../shared/characters";

export function player(overrides: Partial<SecretPlayer> & Pick<SecretPlayer, "id" | "name" | "seat" | "originalFaction" | "currentFaction">): SecretPlayer {
  return {
    sessionToken: `token-${overrides.id}`,
    characterState: createCharacterRuntimeState("gunslinger"),
    navigationCards: ["SECRET_NAV"],
    convertible: true,
    guns: 3,
    connected: true,
    eliminated: false,
    silenced: false,
    offDuty: false,
    searched: false,
    floggedEvidence: null,
    publicCharacterId: null,
    ...overrides,
  };
}

export function gameState(): GameState {
  return {
    roomId: "room-1",
    roomCode: "KRAKEN",
    stateVersion: 7,
    phase: "MUTINY_COMMIT",
    round: 1,
    hostPlayerId: "p1",
    mapId: "LONG_JOURNEY",
    shipHexId: "H19",
    players: [
      player({ id: "p1", name: "Anne", seat: 1, originalFaction: "PIRATE", currentFaction: "PIRATE" }),
      player({ id: "p2", name: "Rackham", seat: 2, originalFaction: "PIRATE", currentFaction: "PIRATE" }),
      player({ id: "p3", name: "Mara", seat: 3, originalFaction: "SAILOR", currentFaction: "CULTIST" }),
      player({ id: "p4", name: "Jonah", seat: 4, originalFaction: "CULT_LEADER", currentFaction: "CULT_LEADER" }),
      player({ id: "p5", name: "Bonny", seat: 5, originalFaction: "CULTIST", currentFaction: "CULTIST" }),
    ],
    captainId: "p5",
    lieutenantId: "p1",
    navigatorId: "p2",
    pendingCaptainId: null,
    drawPile: ["D1", "D2", "TOP_SECRET_CARD"],
    discardPile: ["X1"],
    ritualDeck: ["CONVERSION", "GUNS_STASH"],
    pendingConversionTargetId: "p2",
    mutinyCommitments: { p1: 3, p2: 1 },
    mutinyLockedPlayerIds: ["p1", "p2"],
    reactionPassedPlayerIds: [],
    mutinyThreshold: 3,
    processedCommandIds: ["earlier-command"],
    rngSeedAudit: "SERVER_ONLY_SEED",
    publicEvents: [{ id: "e1", timestamp: "2026-10-08T00:00:00.000Z", phase: "MUTINY_COMMIT", actorId: "p1", action: "READY", message: "Anne is ready." }],
    internalEvents: [{ id: "e2", timestamp: "2026-10-08T00:00:00.000Z", phase: "MUTINY_COMMIT", actorId: "p1", action: "COMMIT", message: "Anne committed.", privateDebug: { guns: 3 } }],
  };
}
