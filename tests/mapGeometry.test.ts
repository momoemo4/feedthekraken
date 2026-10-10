import { describe, expect, it } from "vitest";
import { axialToPixel, hexPoints, neighborCoordinate } from "../server/data/maps/hexGeometry";
import { longJourney } from "../server/data/maps/longJourney";

describe("flat-top map geometry", () => {
  it("uses the required axial center formula", () => {
    const point = axialToPixel(2, -1, 40, 100, 200);
    expect(point.x).toBe(220);
    expect(point.y).toBeCloseTo(200);
  });

  it("renders six vertices with horizontal top and bottom edges", () => {
    const points = hexPoints(0, 0, 10).split(" ").map((pair) => pair.split(",").map(Number));
    expect(points).toHaveLength(6);
    expect(points[1][1]).toBeCloseTo(points[2][1]);
    expect(points[4][1]).toBeCloseTo(points[5][1]);
  });

  it("keeps the map pending user sign-off while preserving the supplied reference", () => {
    expect(longJourney.verified).toBe(false);
    expect(longJourney.sourceReferenceIncluded).toBe(true);
    expect(longJourney.cells.some((cell) => !cell.verified)).toBe(true);
  });

  it("contains exactly the photographed Long Journey action counts", () => {
    const count = (action: string) => longJourney.cells.filter((cell) => cell.action === action).length;
    expect(longJourney.cells).toHaveLength(31);
    expect(count("CABIN_SEARCH")).toBe(4);
    expect(count("FLOGGING")).toBe(2);
    expect(count("OFF_WITH_THE_TONGUE")).toBe(1);
    expect(count("FEED_THE_KRAKEN")).toBe(3);
  });

  it("points every exit to an existing adjacent hex", () => {
    const byId = new Map(longJourney.cells.map((cell) => [cell.id, cell]));
    for (const cell of longJourney.cells) {
      for (const exit of Object.values(cell.exits)) {
        const target = byId.get(exit.to);
        expect(target, `${cell.id} -> ${exit.to}`).toBeDefined();
        const expected = neighborCoordinate(cell.q, cell.r, exit.edge);
        expect({ q: target!.q, r: target!.r }, `${cell.id} ${exit.edge} -> ${exit.to}`).toEqual(expected);
      }
    }
  });

  it("preserves printed multi-color exits that share one edge", () => {
    const byId = new Map(longJourney.cells.map((cell) => [cell.id, cell]));
    const sharedTargets = (id: string) => Object.values(byId.get(id)!.exits).map((exit) => `${exit.edge}:${exit.to}`);

    expect(sharedTargets("H29")).toEqual(["NE:H26", "NE:H26", "E:H27"]);
    expect(sharedTargets("H28")).toEqual(["NW:H27", "NE:H24", "NE:H24"]);
    expect(sharedTargets("H25")).toEqual(["NE:H21", "NE:H21", "E:H22"]);
    expect(sharedTargets("H31")).toEqual(["NW:H19", "NE:H14", "NE:H14"]);
    expect(sharedTargets("H08")).toEqual(["NW:H07", "NW:H07", "NE:H03"]);
    expect(sharedTargets("H09")).toEqual(["NW:H08", "NW:H08", "NE:H04"]);
    expect(sharedTargets("H16")).toEqual(["NE:H10", "E:H11", "E:H11"]);
    expect(sharedTargets("H20")).toEqual(["NE:H15", "E:H16", "E:H16"]);
    expect(sharedTargets("H23")).toEqual(["NW:H22", "NW:H22", "E:H19"]);
    expect(sharedTargets("H07")).toEqual(["NW:H06", "NE:H02", "E:H03"]);
  });
});
