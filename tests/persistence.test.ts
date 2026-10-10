import { describe, expect, it } from "vitest";
import { RoomRepository } from "../server/persistence/roomRepository";
import { gameState } from "./fixtures";

describe("RoomRepository", () => {
  it("round-trips an authoritative state snapshot", () => {
    const repository = new RoomRepository(":memory:");
    const state = gameState();
    repository.save(state);
    expect(repository.findByCode(state.roomCode)).toEqual(state);
    repository.close();
  });

  it("does not overwrite a newer snapshot with a stale version", () => {
    const repository = new RoomRepository(":memory:");
    const newest = { ...gameState(), stateVersion: 10, phase: "GAME_OVER" as const };
    repository.save(newest);
    repository.save({ ...gameState(), stateVersion: 9 });
    expect(repository.findByCode(newest.roomCode)?.stateVersion).toBe(10);
    repository.close();
  });
});
