import { CommandValidationError, type GameCommand } from "../../shared/commands";
import type { GameState, Phase, PublicEvent, SecretPlayer } from "../../shared/types";
import type { Rng } from "./rng";

const COMMAND_HISTORY_LIMIT = 256;

function fail(code: string, message = code): never {
  throw new CommandValidationError(code, message);
}

function copyState(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      characterState: player.characterState ? { ...player.characterState } : null,
      navigationCards: [...player.navigationCards],
    })),
    drawPile: [...state.drawPile],
    discardPile: [...state.discardPile],
    ritualDeck: [...state.ritualDeck],
    publicEvents: state.publicEvents.map((event) => ({ ...event })),
    internalEvents: state.internalEvents.map((event) => ({
      ...event,
      privateDebug: event.privateDebug ? { ...event.privateDebug } : undefined,
    })),
    mutinyCommitments: { ...state.mutinyCommitments },
    mutinyLockedPlayerIds: [...state.mutinyLockedPlayerIds],
    reactionPassedPlayerIds: [...state.reactionPassedPlayerIds],
    processedCommandIds: [...state.processedCommandIds],
  };
}

function requirePhase(state: GameState, phase: Phase): void {
  if (state.phase !== phase) fail("INVALID_PHASE", `${state.phase} does not accept this command.`);
}

function requireActor(state: GameState, actorId: string): SecretPlayer {
  const actor = state.players.find((player) => player.id === actorId);
  if (!actor) fail("ACTOR_NOT_FOUND");
  if (actor.eliminated) fail("ACTOR_ELIMINATED");
  return actor;
}

function requireCaptain(state: GameState, actorId: string): void {
  if (state.captainId !== actorId) fail("CAPTAIN_ONLY");
}

function livingPlayers(state: GameState): SecretPlayer[] {
  return state.players.filter((player) => !player.eliminated);
}

function mutinyEligiblePlayers(state: GameState): SecretPlayer[] {
  return livingPlayers(state).filter((player) => player.id !== state.captainId);
}

function appendCommandEvent(state: GameState, command: GameCommand, message: string, privateDebug?: Record<string, unknown>): void {
  const event: PublicEvent = {
    id: `evt:${command.commandId}`,
    timestamp: command.receivedAt,
    phase: state.phase,
    actorId: command.actorId,
    action: command.type,
    message,
  };
  state.publicEvents.push(event);
  state.internalEvents.push(privateDebug ? { ...event, privateDebug } : { ...event });
}

function finalize(state: GameState, command: GameCommand): GameState {
  state.stateVersion += 1;
  state.processedCommandIds = [...state.processedCommandIds, command.commandId].slice(-COMMAND_HISTORY_LIMIT);
  return state;
}

export function reduceGame(state: GameState, command: GameCommand, _rng: Rng): GameState {
  if (state.processedCommandIds.includes(command.commandId)) return state;
  if (command.expectedStateVersion !== state.stateVersion) fail("STALE_STATE_VERSION");
  if (!command.commandId || command.commandId.length > 128) fail("INVALID_COMMAND_ID");

  const actor = requireActor(state, command.actorId);
  const next = copyState(state);

  switch (command.type) {
    case "ASSIGN_OFFICER": {
      requirePhase(next, "ROUND_APPOINT_TEAM");
      requireCaptain(next, actor.id);
      const target = next.players.find((player) => player.id === command.targetPlayerId);
      if (!target || target.eliminated) fail("ILLEGAL_TARGET");
      if (target.id === next.captainId) fail("CAPTAIN_CANNOT_HOLD_OFFICER_BADGE");
      if (target.offDuty) fail("TARGET_OFF_DUTY");
      if (command.role === "LIEUTENANT") {
        if (next.navigatorId === target.id) fail("ROLE_CONFLICT");
        next.lieutenantId = target.id;
      } else {
        if (next.lieutenantId === target.id) fail("ROLE_CONFLICT");
        next.navigatorId = target.id;
      }
      appendCommandEvent(next, command, `${actor.name} assigns ${command.role.toLowerCase()} to ${target.name}.`);
      return finalize(next, command);
    }

    case "CONFIRM_TEAM": {
      requirePhase(next, "ROUND_APPOINT_TEAM");
      requireCaptain(next, actor.id);
      if (!next.lieutenantId || !next.navigatorId || next.lieutenantId === next.navigatorId) fail("TEAM_INCOMPLETE");
      next.phase = "MUTINY_COMMIT";
      next.mutinyCommitments = {};
      next.mutinyLockedPlayerIds = [];
      next.reactionPassedPlayerIds = [];
      appendCommandEvent(next, command, `${actor.name} confirms the Navigation Team. Secret Mutiny commitments open.`);
      return finalize(next, command);
    }

    case "SET_MUTINY_GUNS": {
      requirePhase(next, "MUTINY_COMMIT");
      if (actor.id === next.captainId) fail("CAPTAIN_CANNOT_JOIN_MUTINY");
      if (command.guns > actor.guns) fail("INSUFFICIENT_GUNS");
      next.mutinyCommitments[actor.id] = command.guns;
      next.mutinyLockedPlayerIds = next.mutinyLockedPlayerIds.filter((playerId) => playerId !== actor.id);
      appendCommandEvent(next, command, `${actor.name} updates a private Mutiny contribution.`, { guns: command.guns });
      return finalize(next, command);
    }

    case "LOCK_MUTINY": {
      requirePhase(next, "MUTINY_COMMIT");
      if (actor.id === next.captainId) fail("CAPTAIN_CANNOT_JOIN_MUTINY");
      if (!Object.hasOwn(next.mutinyCommitments, actor.id)) fail("MUTINY_CONTRIBUTION_REQUIRED");
      if (next.mutinyLockedPlayerIds.includes(actor.id)) fail("ACTION_ALREADY_DONE");
      next.mutinyLockedPlayerIds.push(actor.id);
      const eligible = mutinyEligiblePlayers(next);
      const reveal = eligible.every((player) => next.mutinyLockedPlayerIds.includes(player.id));
      if (reveal) {
        next.phase = "MUTINY_REACTION";
        next.reactionPassedPlayerIds = [];
      }
      appendCommandEvent(
        next,
        command,
        reveal ? "All eligible Mutiny contributions are locked. Guns reveal simultaneously." : `${actor.name} locks a secret Mutiny contribution.`,
      );
      return finalize(next, command);
    }

    case "REACTION_PASS": {
      requirePhase(next, "MUTINY_REACTION");
      if (next.reactionPassedPlayerIds.includes(actor.id)) fail("ACTION_ALREADY_DONE");
      next.reactionPassedPlayerIds.push(actor.id);
      const allPassed = livingPlayers(next).every((player) => next.reactionPassedPlayerIds.includes(player.id));
      if (allPassed) next.phase = "MUTINY_RESOLUTION";
      appendCommandEvent(
        next,
        command,
        allPassed ? "Every living player passed the reaction window. Mutiny is ready for authoritative resolution." : `${actor.name} passes the Mutiny reaction window.`,
      );
      return finalize(next, command);
    }
  }

  return next;
}
