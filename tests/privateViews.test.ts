import { describe, expect, it } from "vitest";
import { getPrivateView } from "../server/network/privateViews";
import { gameState } from "./fixtures";

describe("getPrivateView", () => {
  it("returns the owning player's structured private Character card", () => {
    expect(getPrivateView(gameState(), "p1").character).toMatchObject({
      id: "gunslinger",
      name: "Gunslinger",
      timing: ["ANYTIME"],
      type: "one_shot",
      revealed: false,
      used: false,
      active: false,
      status: "face_down",
    });
  });

  it("shows original Pirates their teammates", () => {
    expect(getPrivateView(gameState(), "p1").pirateTeammates.map((player) => player.id)).toEqual(["p2"]);
  });

  it("does not introduce the starting Cultist and Cult Leader", () => {
    expect(getPrivateView(gameState(), "p5").cultLeader).toBeNull();
    expect(getPrivateView(gameState(), "p4").cultLeader).toBeNull();
  });

  it("introduces a newly converted Cultist to the Cult Leader", () => {
    expect(getPrivateView(gameState(), "p3").cultLeader?.id).toBe("p4");
  });
});
