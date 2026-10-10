import type { Direction, Edge, HexCell, HexExit, MapDefinition } from "../../../shared/types";

type ExitInput = [edge: Edge, to: string, crossesSupplyLine?: boolean, verified?: boolean];

function exits(input: Partial<Record<Direction, ExitInput>>): HexCell["exits"] {
  return Object.fromEntries(
    Object.entries(input).map(([direction, [edge, to, crossesSupplyLine = false, verified = true]]) => [
      direction,
      {
        edge,
        to,
        crossesSupplyLine,
        verified,
        note: verified ? "Visually audited against the supplied Long Journey reference." : "Needs user sign-off.",
      } satisfies HexExit,
    ]),
  );
}

function cell(
  id: string,
  q: number,
  r: number,
  options: Partial<Pick<HexCell, "type" | "action" | "exits" | "verified" | "note">> = {},
): HexCell {
  return {
    id,
    q,
    r,
    type: options.type ?? "normal",
    action: options.action ?? null,
    exits: options.exits ?? {},
    verified: options.verified ?? true,
    note: options.note ?? "Cell and visible exits audited against the supplied reference photo.",
  };
}

// Edge labels follow the brief's clockwise convention:
// NW = physical upper-left, NE = physical top, E = physical upper-right.
// Multiple colors may share one physical edge where the printed route converges.
const cells: HexCell[] = [
  cell("H01", 0, -3, { type: "cult_victory", note: "Kraken victory destination." }),
  cell("H02", 1, -3, { type: "sailor_victory", verified: false, note: "Sailor victory region; part of the printed banner obscures the cell." }),
  cell("H03", 2, -3, { type: "sailor_victory", note: "Sailor victory destination." }),
  cell("H04", 3, -3, { type: "sailor_victory", note: "Outer Sailor victory destination." }),
  cell("H05", -1, -2, { type: "pirate_victory", verified: false, note: "Pirate victory region; part of the printed banner obscures the cell." }),
  cell("H06", 0, -2, {
    action: "FEED_THE_KRAKEN",
    exits: exits({ red: ["NW", "H05"], yellow: ["NE", "H01"], blue: ["E", "H02"] }),
  }),
  cell("H07", 1, -2, {
    action: "FEED_THE_KRAKEN",
    exits: exits({ red: ["NW", "H06"], yellow: ["NE", "H02"], blue: ["E", "H03"] }),
    note: "Pixel-crop recheck: one exit on each forward edge; red H06, yellow H02, blue H03.",
  }),
  cell("H08", 2, -2, {
    exits: exits({ red: ["NW", "H07"], yellow: ["NW", "H07"], blue: ["NE", "H03"] }),
    note: "Red and yellow share the upper-left edge; blue uses the top edge.",
  }),
  cell("H09", 3, -2, {
    exits: exits({ red: ["NW", "H08"], yellow: ["NW", "H08"], blue: ["NE", "H04"] }),
    note: "Red and yellow share the upper-left edge; blue uses the top edge.",
  }),
  cell("H10", -2, -1, { type: "pirate_victory", note: "Pirate victory destination." }),
  cell("H11", -1, -1, {
    action: "FEED_THE_KRAKEN",
    exits: exits({ red: ["NW", "H10"], yellow: ["NE", "H05"], blue: ["E", "H06"] }),
  }),
  cell("H12", 0, -1, {
    exits: exits({ red: ["NW", "H11"], yellow: ["NE", "H06"], blue: ["E", "H07"] }),
  }),
  cell("H13", 1, -1, {
    action: "FLOGGING",
    exits: exits({ red: ["NW", "H12"], yellow: ["NE", "H07"], blue: ["E", "H08"] }),
  }),
  cell("H14", 2, -1, {
    exits: exits({ red: ["NW", "H13"], yellow: ["NE", "H08"], blue: ["E", "H09"] }),
  }),
  cell("H15", -3, 0, { type: "pirate_victory", note: "Outer Pirate victory destination." }),
  cell("H16", -2, 0, {
    exits: exits({ red: ["NE", "H10"], yellow: ["E", "H11"], blue: ["E", "H11"] }),
    note: "Red uses the top edge; yellow and blue share the upper-right edge.",
  }),
  cell("H17", -1, 0, {
    action: "FLOGGING",
    exits: exits({ red: ["NW", "H16"], yellow: ["NE", "H11"], blue: ["E", "H12"] }),
  }),
  cell("H18", 0, 0, {
    action: "OFF_WITH_THE_TONGUE",
    exits: exits({
      red: ["NW", "H17", true],
      yellow: ["NE", "H12", true],
      blue: ["E", "H13", true],
    }),
    note: "Off With The Tongue; its three forward edges cross the dashed Supply Line.",
  }),
  cell("H19", 1, 0, {
    exits: exits({ red: ["NW", "H18"], yellow: ["NE", "H13", true], blue: ["E", "H14", true] }),
  }),
  cell("H31", 2, 0, {
    exits: exits({ red: ["NW", "H19", true], yellow: ["NE", "H14", true], blue: ["NE", "H14", true] }),
    note: "Red uses the upper-left edge; yellow and blue share the top edge beside the cannon.",
  }),
  cell("H20", -3, 1, {
    exits: exits({ red: ["NE", "H15"], yellow: ["E", "H16"], blue: ["E", "H16"] }),
    note: "Red uses the top edge; yellow and blue share the upper-right edge.",
  }),
  cell("H21", -2, 1, {
    exits: exits({ red: ["NW", "H20"], yellow: ["NE", "H16"], blue: ["E", "H17"] }),
  }),
  cell("H22", -1, 1, {
    exits: exits({ red: ["NW", "H21", true], yellow: ["NE", "H17", true], blue: ["E", "H18"] }),
  }),
  cell("H23", 0, 1, {
    action: "CABIN_SEARCH",
    exits: exits({ red: ["NW", "H22"], yellow: ["NW", "H22"], blue: ["E", "H19"] }),
    note: "Red and yellow share the upper-left edge; blue uses the upper-right edge.",
  }),
  cell("H24", 1, 1, {
    action: "CABIN_SEARCH",
    exits: exits({ red: ["NW", "H23"], yellow: ["NE", "H19", true], blue: ["E", "H31"] }),
    note: "Right-side Cabin Search cell below the Supply Line.",
  }),
  cell("H25", -2, 2, {
    action: "CABIN_SEARCH",
    exits: exits({ red: ["NE", "H21", true], yellow: ["NE", "H21", true], blue: ["E", "H22"] }),
    note: "Red and yellow share the top Supply Line edge; blue uses the upper-right edge.",
  }),
  cell("H26", -1, 2, {
    action: "CABIN_SEARCH",
    exits: exits({ red: ["NW", "H25"], yellow: ["NE", "H22"], blue: ["E", "H23"] }),
  }),
  cell("H27", 0, 2, {
    exits: exits({ red: ["NW", "H26"], yellow: ["NE", "H23"], blue: ["E", "H24"] }),
  }),
  cell("H28", 1, 2, {
    exits: exits({ red: ["NW", "H27"], yellow: ["NE", "H24"], blue: ["NE", "H24"] }),
    note: "Lower-right convergence; yellow and blue share the top edge.",
  }),
  cell("H29", -1, 3, {
    exits: exits({ red: ["NE", "H26"], yellow: ["NE", "H26"], blue: ["E", "H27"] }),
    note: "Lower-left convergence; red and yellow share the top edge.",
  }),
  cell("H30", 0, 3, {
    exits: exits({ red: ["NW", "H29"], yellow: ["NE", "H27"], blue: ["E", "H28"] }),
    note: "Starting ship cell.",
  }),
];

export const longJourney: MapDefinition = {
  id: "LONG_JOURNEY",
  name: "Long Journey",
  verified: false,
  sourceReferenceIncluded: true,
  cells,
};
