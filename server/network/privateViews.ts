import type { GameState, PrivateGameView, PublicPlayer, SecretPlayer } from "../../shared/types";
import { hydrateCharacterCard } from "../../shared/characters";

function identity(player: SecretPlayer): Pick<PublicPlayer, "id" | "name" | "seat"> {
  return { id: player.id, name: player.name, seat: player.seat };
}

function legalActions(gameState: GameState, player: SecretPlayer): string[] {
  if (player.eliminated) return [];
  if (gameState.phase === "ROUND_APPOINT_TEAM" && gameState.captainId === player.id) {
    return gameState.lieutenantId && gameState.navigatorId
      ? ["ASSIGN_OFFICER", "CONFIRM_TEAM"]
      : ["ASSIGN_OFFICER"];
  }
  if (gameState.phase === "MUTINY_COMMIT" && gameState.captainId !== player.id) {
    return Object.hasOwn(gameState.mutinyCommitments, player.id) && !gameState.mutinyLockedPlayerIds.includes(player.id)
      ? ["SET_MUTINY_GUNS", "LOCK_MUTINY"]
      : ["SET_MUTINY_GUNS"];
  }
  if (gameState.phase === "MUTINY_REACTION" && !gameState.reactionPassedPlayerIds.includes(player.id)) {
    return ["REACTION_PASS"];
  }
  return [];
}

export function getPrivateView(gameState: GameState, playerId: string): PrivateGameView {
  const player = gameState.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new Error("PLAYER_NOT_FOUND");

  const pirateTeammates =
    player.originalFaction === "PIRATE"
      ? gameState.players
          .filter((candidate) => candidate.id !== playerId && candidate.originalFaction === "PIRATE")
          .map(identity)
      : [];

  const wasConverted = player.currentFaction === "CULTIST" && player.originalFaction !== "CULTIST";
  const leader = wasConverted
    ? gameState.players.find((candidate) => candidate.currentFaction === "CULT_LEADER") ?? null
    : null;

  return {
    playerId,
    originalFaction: player.originalFaction,
    currentFaction: player.currentFaction,
    character: player.characterState ? hydrateCharacterCard(player.characterState) : null,
    navigationCards: [...player.navigationCards],
    pirateTeammates,
    cultLeader: leader ? identity(leader) : null,
    mutinyCommitment: Object.hasOwn(gameState.mutinyCommitments, player.id) ? gameState.mutinyCommitments[player.id] : null,
    mutinyLocked: gameState.mutinyLockedPlayerIds.includes(player.id),
    legalActions: legalActions(gameState, player),
  };
}
