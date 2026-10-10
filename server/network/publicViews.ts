import type { GameState, PublicGameView, PublicPlayer } from "../../shared/types";

function toPublicPlayer(player: GameState["players"][number]): PublicPlayer {
  return {
    id: player.id,
    name: player.name,
    seat: player.seat,
    guns: player.guns,
    connected: player.connected,
    eliminated: player.eliminated,
    silenced: player.silenced,
    offDuty: player.offDuty,
    searched: player.searched,
    floggedEvidence: player.floggedEvidence,
    publicCharacterId: player.publicCharacterId,
  };
}

export function getPublicView(gameState: GameState): PublicGameView {
  const contributionsVisible = gameState.phase === "MUTINY_REACTION"
    || gameState.phase === "MUTINY_RESOLUTION"
    || gameState.phase === "CAPTAIN_TRANSFER";
  return {
    roomId: gameState.roomId,
    roomCode: gameState.roomCode,
    stateVersion: gameState.stateVersion,
    phase: gameState.phase,
    round: gameState.round,
    players: gameState.players.map(toPublicPlayer),
    captainId: gameState.captainId,
    lieutenantId: gameState.lieutenantId,
    navigatorId: gameState.navigatorId,
    pendingCaptainId: gameState.pendingCaptainId,
    mapId: gameState.mapId,
    shipHexId: gameState.shipHexId,
    drawPileCount: gameState.drawPile.length,
    discardPileCount: gameState.discardPile.length,
    ritualCardsRemaining: gameState.ritualDeck.length,
    events: gameState.publicEvents.map((event) => ({ ...event })),
    mutinyReadyPlayerIds: [...gameState.mutinyLockedPlayerIds],
    reactionPassedPlayerIds: [...gameState.reactionPassedPlayerIds],
    mutinyContributions: contributionsVisible ? { ...gameState.mutinyCommitments } : null,
  };
}
