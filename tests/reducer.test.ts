import { describe, expect, it } from "vitest";
import type { ClientGameCommand, GameCommand } from "../shared/commands";
import type { GameState } from "../shared/types";
import { reduceGame } from "../server/engine/reducer";
import { createSeededRng } from "../server/engine/rng";
import { getPrivateView } from "../server/network/privateViews";
import { getPublicView } from "../server/network/publicViews";
import { gameState } from "./fixtures";

const rng = createSeededRng(421);
let commandSequence = 0;

function appointmentState(): GameState {
  return {
    ...gameState(),
    stateVersion: 0,
    phase: "ROUND_APPOINT_TEAM",
    round: 1,
    captainId: "p1",
    lieutenantId: null,
    navigatorId: null,
    pendingCaptainId: null,
    mutinyCommitments: {},
    mutinyLockedPlayerIds: [],
    reactionPassedPlayerIds: [],
    processedCommandIds: [],
    publicEvents: [],
    internalEvents: [],
  };
}

function command(state: GameState, actorId: string, input: ClientGameCommand, id?: string): GameCommand {
  commandSequence += 1;
  return {
    ...input,
    actorId,
    commandId: id ?? `command-${commandSequence}`,
    expectedStateVersion: state.stateVersion,
    receivedAt: `2026-10-10T00:00:${String(commandSequence).padStart(2, "0")}.000Z`,
  };
}

function apply(state: GameState, actorId: string, input: ClientGameCommand): GameState {
  return reduceGame(state, command(state, actorId, input), rng);
}

function confirmedTeam(): GameState {
  let state = appointmentState();
  state = apply(state, "p1", { type: "ASSIGN_OFFICER", role: "LIEUTENANT", targetPlayerId: "p2" });
  state = apply(state, "p1", { type: "ASSIGN_OFFICER", role: "NAVIGATOR", targetPlayerId: "p3" });
  return apply(state, "p1", { type: "CONFIRM_TEAM" });
}

describe("authoritative early-round reducer", () => {
  it("rejects stale commands and derives Captain-only authority from actorId", () => {
    const state = appointmentState();
    const stale = { ...command(state, "p1", { type: "ASSIGN_OFFICER", role: "LIEUTENANT", targetPlayerId: "p2" }), expectedStateVersion: 99 };
    expect(() => reduceGame(state, stale, rng)).toThrowError("STALE_STATE_VERSION");
    expect(() => apply(state, "p2", { type: "ASSIGN_OFFICER", role: "LIEUTENANT", targetPlayerId: "p3" })).toThrowError("CAPTAIN_ONLY");
  });

  it("assigns distinct eligible officers and opens secret Mutiny commit", () => {
    const state = confirmedTeam();
    expect(state).toMatchObject({
      phase: "MUTINY_COMMIT",
      lieutenantId: "p2",
      navigatorId: "p3",
      stateVersion: 3,
      mutinyCommitments: {},
    });
    expect(appointmentState().lieutenantId).toBeNull();
  });

  it("is idempotent by commandId even when the retried envelope has an old version", () => {
    const state = appointmentState();
    const firstCommand = command(state, "p1", { type: "ASSIGN_OFFICER", role: "LIEUTENANT", targetPlayerId: "p2" }, "same-id");
    const next = reduceGame(state, firstCommand, rng);
    const retried = reduceGame(next, firstCommand, rng);
    expect(retried).toBe(next);
    expect(retried.stateVersion).toBe(1);
  });

  it("keeps commitments private until every eligible player locks, then reveals simultaneously", () => {
    let state = confirmedTeam();
    for (const [playerId, guns] of [["p2", 2], ["p3", 1], ["p4", 0], ["p5", 1]] as const) {
      state = apply(state, playerId, { type: "SET_MUTINY_GUNS", guns });
      expect(getPrivateView(state, playerId).mutinyCommitment).toBe(guns);
      expect(getPublicView(state).mutinyContributions).toBeNull();
      state = apply(state, playerId, { type: "LOCK_MUTINY" });
      if (playerId !== "p5") expect(getPublicView(state).mutinyContributions).toBeNull();
    }

    expect(state.phase).toBe("MUTINY_REACTION");
    expect(getPublicView(state).mutinyContributions).toEqual({ p2: 2, p3: 1, p4: 0, p5: 1 });
    expect(getPublicView(state).mutinyReadyPlayerIds).toEqual(["p2", "p3", "p4", "p5"]);
  });

  it("waits for every living player to pass before entering unresolved Mutiny resolution", () => {
    let state = confirmedTeam();
    for (const playerId of ["p2", "p3", "p4", "p5"]) {
      state = apply(state, playerId, { type: "SET_MUTINY_GUNS", guns: 0 });
      state = apply(state, playerId, { type: "LOCK_MUTINY" });
    }
    for (const playerId of ["p1", "p2", "p3", "p4"]) {
      state = apply(state, playerId, { type: "REACTION_PASS" });
      expect(state.phase).toBe("MUTINY_REACTION");
    }
    state = apply(state, "p5", { type: "REACTION_PASS" });
    expect(state.phase).toBe("MUTINY_RESOLUTION");
  });
});

