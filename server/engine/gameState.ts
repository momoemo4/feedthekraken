import type { GameState } from "../../shared/types";

export function createEmptyGame(roomId: string, roomCode: string): GameState {
  return {
    roomId,
    roomCode,
    stateVersion: 0,
    phase: "LOBBY",
    round: 0,
    hostPlayerId: null,
    players: [],
    captainId: null,
    lieutenantId: null,
    navigatorId: null,
    pendingCaptainId: null,
    mapId: "LONG_JOURNEY",
    shipHexId: null,
    drawPile: [],
    discardPile: [],
    ritualDeck: [],
    publicEvents: [],
    internalEvents: [],
    pendingConversionTargetId: null,
    mutinyCommitments: {},
    mutinyLockedPlayerIds: [],
    reactionPassedPlayerIds: [],
    mutinyThreshold: 0,
    processedCommandIds: [],
    rngSeedAudit: "",
  };
}
