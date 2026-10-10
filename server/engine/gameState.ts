import type { GameState } from "../../shared/types";

export function createEmptyGame(roomId: string, roomCode: string): GameState {
  return {
    roomId,
    roomCode,
    stateVersion: 0,
    phase: "LOBBY",
    hostPlayerId: null,
    players: [],
    mapId: "LONG_JOURNEY",
    shipHexId: null,
    drawPile: [],
    discardPile: [],
    ritualDeck: [],
    publicEvents: [],
    internalEvents: [],
    pendingConversionTargetId: null,
    mutinyCommitments: {},
    rngSeedAudit: "",
  };
}
