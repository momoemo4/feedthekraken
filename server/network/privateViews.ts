import type { GameState, PrivateGameView, PublicPlayer, SecretPlayer } from "../../shared/types";
import { hydrateCharacterCard } from "../../shared/characters";

function identity(player: SecretPlayer): Pick<PublicPlayer, "id" | "name" | "seat"> {
  return { id: player.id, name: player.name, seat: player.seat };
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
    legalActions: [],
  };
}
