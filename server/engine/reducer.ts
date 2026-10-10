import type { GameState } from "../../shared/types";
import type { Rng } from "./rng";

export interface GameCommand {
  type: string;
  actorId: string;
  commandId: string;
  expectedStateVersion: number;
  payload?: unknown;
}

export function reduceGame(state: GameState, command: GameCommand, _rng: Rng): GameState {
  if (command.expectedStateVersion !== state.stateVersion) {
    throw new Error("STALE_STATE_VERSION");
  }

  // Milestone 0 deliberately exposes the server-authoritative reducer boundary
  // without inventing rules scheduled for later milestones.
  throw new Error(`COMMAND_NOT_IMPLEMENTED:${command.type}`);
}
