export const CHARACTER_IDS = [
  "captain",
  "kleptomaniac",
  "troublemaker",
  "gunsmith",
  "peacemaker",
  "gunslinger",
  "minstrel",
  "bosun",
  "herbalist",
  "look_out",
  "master_strategist",
  "smuggler",
  "agitator",
  "consultant",
  "chief_cook",
  "rabble_rouser",
  "archivist",
  "mentor",
  "spiritualist",
  "debt_collector",
  "equalizer",
  "instigator",
] as const;

export type CharacterId = (typeof CHARACTER_IDS)[number];

export type CharacterTimingWindow =
  | "GAME_START"
  | "ANYTIME"
  | "BEFORE_APPOINT_TEAM"
  | "AFTER_APPOINT_TEAM"
  | "BEFORE_NAV_DRAW"
  | "NAVIGATION_DRAW_SELECTION"
  | "AFTER_MUTINY_GUNS_REVEALED"
  | "AFTER_MUTINY_RESOLVED"
  | "YELLOW_NAVIGATION_PLAYED";

export type CharacterAbilityType = "setup" | "one_shot" | "persistent";
export type CharacterCardStatus = "face_down" | "revealed" | "active" | "used" | "discarded";
export type CharacterUsePolicy =
  | "DISCARD_AFTER_SETUP"
  | "CONSUME_ON_SUCCESS"
  | "ACTIVATE_PERSISTENT"
  | "CONSUME_IF_TARGET_ACCEPTS";

export type CharacterTargetRule =
  | "NONE"
  | "OTHER_PLAYER_WITH_GUN"
  | "MUTINY_REVEALER"
  | "ANY_PLAYER"
  | "TWO_PLAYERS"
  | "OFF_DUTY_HOLDER_AND_OTHER_PLAYER"
  | "CAPTAIN_OR_LIEUTENANT"
  | "USED_CHARACTER_OWNER"
  | "TWO_DONORS_ONE_RECIPIENT"
  | "NAVIGATION_TEAM_MEMBER"
  | "NON_CAPTAIN_PLAYER";

export interface CharacterDefinition {
  id: CharacterId;
  number: number;
  name: string;
  timing: readonly CharacterTimingWindow[];
  timingLabel: string;
  description: string;
  type: CharacterAbilityType;
  effect: string;
  targetRule: CharacterTargetRule;
  usePolicy: CharacterUsePolicy;
  implemented: boolean;
  source: "USER_SUPPLIED";
  rules: readonly string[];
  interactions: readonly string[];
}

export interface CharacterRuntimeState {
  id: CharacterId;
  revealed: boolean;
  used: boolean;
  active: boolean;
  status: CharacterCardStatus;
  activationCount: number;
}

export interface CharacterCard extends CharacterDefinition, Omit<CharacterRuntimeState, "id"> {}

function define(definition: CharacterDefinition): CharacterDefinition {
  return Object.freeze({
    ...definition,
    timing: Object.freeze([...definition.timing]),
    rules: Object.freeze([...definition.rules]),
    interactions: Object.freeze([...definition.interactions]),
  });
}

export const CHARACTER_DEFINITIONS: Readonly<Record<CharacterId, CharacterDefinition>> = Object.freeze({
  captain: define({
    id: "captain",
    number: 1,
    name: "Captain",
    timing: ["GAME_START"],
    timingLabel: "Game setup only.",
    description: "Reveal during setup, become the first Captain, then receive another random Character.",
    type: "setup",
    effect: "BECOME_FIRST_CAPTAIN",
    targetRule: "NONE",
    usePolicy: "DISCARD_AFTER_SETUP",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["Captain is set aside, added to the reduced Character deck, shuffled, and dealt.", "The receiver reveals and discards Captain after the setup effect, then receives another random Character."],
    interactions: [],
  }),
  kleptomaniac: define({
    id: "kleptomaniac",
    number: 2,
    name: "Kleptomaniac",
    timing: ["ANYTIME"],
    timingLabel: "Anytime.",
    description: "Choose another player with at least 1 Gun and transfer 1 of their Guns to yourself.",
    type: "one_shot",
    effect: "STEAL_ONE_GUN",
    targetRule: "OTHER_PLAYER_WITH_GUN",
    usePolicy: "CONSUME_ON_SUCCESS",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["A player with no Guns is not a legal target.", "Mark used only after a successful transfer."],
    interactions: [],
  }),
  troublemaker: define({
    id: "troublemaker",
    number: 3,
    name: "Troublemaker",
    timing: ["AFTER_MUTINY_GUNS_REVEALED"],
    timingLabel: "After Guns are revealed in the current Mutiny.",
    description: "Choose a player who revealed Guns; double that player's contribution to this Mutiny.",
    type: "one_shot",
    effect: "DOUBLE_MUTINY_CONTRIBUTION",
    targetRule: "MUTINY_REVEALER",
    usePolicy: "CONSUME_ON_SUCCESS",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["May target self.", "Changes Mutiny strength only and creates no physical Guns."],
    interactions: [],
  }),
  gunsmith: define({
    id: "gunsmith",
    number: 4,
    name: "Gunsmith",
    timing: ["ANYTIME", "AFTER_MUTINY_RESOLVED"],
    timingLabel: "Activate by paying 1 Gun; ongoing after each successful Mutiny.",
    description: "After activation, regain 1 Gun after each successful Mutiny in which you used at least 1 Gun.",
    type: "persistent",
    effect: "REFUND_ONE_GUN_AFTER_SUCCESSFUL_MUTINY",
    targetRule: "NONE",
    usePolicy: "ACTIVATE_PERSISTENT",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["Activation costs 1 Gun returned to supply.", "No refund when contributing zero Guns or when the Mutiny fails.", "The Character remains ACTIVE rather than becoming a spent one-shot."],
    interactions: ["Mentor must not duplicate an already-active persistent effect."],
  }),
  peacemaker: define({
    id: "peacemaker",
    number: 5,
    name: "Peacemaker",
    timing: ["AFTER_MUTINY_GUNS_REVEALED"],
    timingLabel: "After Guns are revealed in the current Mutiny.",
    description: "Choose a player; return all Guns they just revealed and remove that contribution from this Mutiny.",
    type: "one_shot",
    effect: "CANCEL_MUTINY_CONTRIBUTION",
    targetRule: "MUTINY_REVEALER",
    usePolicy: "CONSUME_ON_SUCCESS",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["All affected Guns return to their owner.", "The affected Guns do not count toward current Mutiny strength."],
    interactions: [],
  }),
  gunslinger: define({
    id: "gunslinger",
    number: 6,
    name: "Gunslinger",
    timing: ["ANYTIME"],
    timingLabel: "Anytime.",
    description: "Take 2 Guns from the general supply.",
    type: "one_shot",
    effect: "TAKE_TWO_GUNS",
    targetRule: "NONE",
    usePolicy: "CONSUME_ON_SUCCESS",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["Mark used after resolving."],
    interactions: [],
  }),
  minstrel: define({
    id: "minstrel",
    number: 7,
    name: "Minstrel",
    timing: ["AFTER_APPOINT_TEAM"],
    timingLabel: "After the Captain appoints the Navigation Team.",
    description: "Choose 2 players; they cannot participate in the next Mutiny.",
    type: "one_shot",
    effect: "BLOCK_NEXT_MUTINY_PARTICIPATION",
    targetRule: "TWO_PLAYERS",
    usePolicy: "CONSUME_ON_SUCCESS",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["The restriction applies to the next Mutiny only and is then cleared."],
    interactions: ["Agitator cannot force a Minstrel-blocked player to reveal a Gun.", "Instigator may later offer a blocked player the post-reveal add-Guns choice."],
  }),
  bosun: define({
    id: "bosun",
    number: 8,
    name: "Bosun",
    timing: ["BEFORE_NAV_DRAW"],
    timingLabel: "Before Navigation Cards are drawn.",
    description: "Swap the current Lieutenant and Navigator role badges.",
    type: "one_shot",
    effect: "SWAP_LIEUTENANT_NAVIGATOR",
    targetRule: "NONE",
    usePolicy: "CONSUME_ON_SUCCESS",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["Only the two current role holders swap; no third player is selected."],
    interactions: [],
  }),
  herbalist: define({
    id: "herbalist",
    number: 9,
    name: "Herbalist",
    timing: ["BEFORE_APPOINT_TEAM"],
    timingLabel: "Before the Captain appoints the Navigation Team.",
    description: "Move one Off-Duty status from its current holder to another player.",
    type: "one_shot",
    effect: "MOVE_OFF_DUTY_STATUS",
    targetRule: "OFF_DUTY_HOLDER_AND_OTHER_PLAYER",
    usePolicy: "CONSUME_ON_SUCCESS",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["The old holder loses Off-Duty and the new holder gains it."],
    interactions: [],
  }),
  look_out: define({
    id: "look_out",
    number: 10,
    name: "Look-Out",
    timing: ["ANYTIME"],
    timingLabel: "Anytime.",
    description: "Privately inspect the top Navigation Card, then keep it on top or discard it facedown.",
    type: "one_shot",
    effect: "INSPECT_TOP_NAVIGATION_CARD",
    targetRule: "NONE",
    usePolicy: "CONSUME_ON_SUCCESS",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["Only the Look-Out player learns the card content.", "Public UI may show that an action occurred but must never reveal the card."],
    interactions: [],
  }),
  master_strategist: define({
    id: "master_strategist",
    number: 11,
    name: "Master Strategist",
    timing: ["AFTER_MUTINY_GUNS_REVEALED", "AFTER_MUTINY_RESOLVED"],
    timingLabel: "After Guns are revealed; refund after Mutiny resolution if you did not become Captain.",
    description: "Your revealed Guns still count, but are returned after resolution if you do not become Captain.",
    type: "one_shot",
    effect: "REFUND_OWN_MUTINY_GUNS_IF_NOT_CAPTAIN",
    targetRule: "NONE",
    usePolicy: "CONSUME_ON_SUCCESS",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["Refund does not reduce Mutiny strength or reverse its result."],
    interactions: [],
  }),
  smuggler: define({
    id: "smuggler",
    number: 12,
    name: "Smuggler",
    timing: ["BEFORE_NAV_DRAW"],
    timingLabel: "Before Navigation Cards are drawn.",
    description: "Choose the Captain or Lieutenant; that player draws 3 Navigation Cards instead of 2 this phase.",
    type: "one_shot",
    effect: "DRAW_THREE_NAVIGATION_CARDS",
    targetRule: "CAPTAIN_OR_LIEUTENANT",
    usePolicy: "CONSUME_ON_SUCCESS",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["The modifier lasts for the current Navigation Phase only."],
    interactions: [],
  }),
  agitator: define({
    id: "agitator",
    number: 13,
    name: "Agitator",
    timing: ["AFTER_APPOINT_TEAM"],
    timingLabel: "After the Captain appoints the Navigation Team.",
    description: "Choose 2 non-Captain players; each must initially reveal at least 1 Gun in the next Mutiny when able.",
    type: "one_shot",
    effect: "FORCE_NEXT_MUTINY_GUN",
    targetRule: "TWO_PLAYERS",
    usePolicy: "CONSUME_ON_SUCCESS",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["Cannot target the Captain.", "A target with no Gun or no permission to participate is not forced.", "Clear after the next Mutiny."],
    interactions: ["Minstrel's participation ban takes priority."],
  }),
  consultant: define({
    id: "consultant",
    number: 14,
    name: "Consultant",
    timing: ["BEFORE_APPOINT_TEAM"],
    timingLabel: "Before the Captain appoints the Navigation Team.",
    description: "The Consultant chooses this round's Lieutenant; the Captain then chooses only the Navigator.",
    type: "one_shot",
    effect: "CHOOSE_LIEUTENANT",
    targetRule: "ANY_PLAYER",
    usePolicy: "CONSUME_ON_SUCCESS",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["Must be integrated into the team-selection flow rather than resolving as a later replacement."],
    interactions: [],
  }),
  chief_cook: define({
    id: "chief_cook",
    number: 15,
    name: "Chief Cook",
    timing: ["AFTER_APPOINT_TEAM"],
    timingLabel: "Immediately after the Captain appoints the Navigation Team.",
    description: "Transfer Captain to the first clockwise player among those with the fewest Navigation Cards, then appoint a completely new team.",
    type: "one_shot",
    effect: "ROTATE_CAPTAIN_TO_LOWEST_RESUME",
    targetRule: "NONE",
    usePolicy: "CONSUME_ON_SUCCESS",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["Count Navigation Cards in front of every eligible player.", "Break the minimum-count tie clockwise from the current Captain.", "Cancel the old Navigation Team; the new Captain selects both roles again."],
    interactions: [],
  }),
  rabble_rouser: define({
    id: "rabble_rouser",
    number: 16,
    name: "Rabble-Rouser",
    timing: ["AFTER_MUTINY_GUNS_REVEALED"],
    timingLabel: "After Guns are revealed in the current Mutiny.",
    description: "Halve the current Mutiny requirement, rounding up.",
    type: "one_shot",
    effect: "HALVE_MUTINY_REQUIREMENT",
    targetRule: "NONE",
    usePolicy: "CONSUME_ON_SUCCESS",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["Requirement 5 becomes 3; requirement 6 becomes 3.", "Applies only to the current Mutiny."],
    interactions: [],
  }),
  archivist: define({
    id: "archivist",
    number: 17,
    name: "Archivist",
    timing: ["NAVIGATION_DRAW_SELECTION"],
    timingLabel: "During Navigation draw/selection, before final resolution.",
    description: "Choose the Captain or Lieutenant; they may discard their newly drawn hand and draw 2 replacement cards.",
    type: "one_shot",
    effect: "REDRAW_NAVIGATION_HAND",
    targetRule: "CAPTAIN_OR_LIEUTENANT",
    usePolicy: "CONSUME_ON_SUCCESS",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["Only the target sees the replacement cards under normal secret-hand rules."],
    interactions: [],
  }),
  mentor: define({
    id: "mentor",
    number: 18,
    name: "Mentor",
    timing: ["ANYTIME"],
    timingLabel: "Anytime.",
    description: "Reset another player's legally resettable used Character so it can be used again.",
    type: "one_shot",
    effect: "RESET_USED_CHARACTER",
    targetRule: "USED_CHARACTER_OWNER",
    usePolicy: "CONSUME_ON_SUCCESS",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["Cannot target the discarded setup Captain or an unused Character.", "Do not duplicate an ongoing persistent effect."],
    interactions: ["An active Gunsmith remains a single persistent effect."],
  }),
  spiritualist: define({
    id: "spiritualist",
    number: 19,
    name: "Spiritualist",
    timing: ["YELLOW_NAVIGATION_PLAYED"],
    timingLabel: "During a turn in which a Yellow Navigation Card is played.",
    description: "Choose 2 donors and 1 recipient; each donor gives up to 1 Gun to that same recipient.",
    type: "one_shot",
    effect: "TWO_DONORS_GIVE_ONE_GUN",
    targetRule: "TWO_DONORS_ONE_RECIPIENT",
    usePolicy: "CONSUME_ON_SUCCESS",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["Both transfers share one recipient.", "A donor with no Gun transfers zero."],
    interactions: [],
  }),
  debt_collector: define({
    id: "debt_collector",
    number: 20,
    name: "Debt Collector",
    timing: ["AFTER_APPOINT_TEAM"],
    timingLabel: "After the Captain appoints the Navigation Team.",
    description: "Choose a Navigation Team member; they give 1 Gun to each other team member as far as possible.",
    type: "one_shot",
    effect: "PAY_OTHER_NAVIGATION_TEAM_MEMBERS",
    targetRule: "NAVIGATION_TEAM_MEMBER",
    usePolicy: "CONSUME_ON_SUCCESS",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["If Guns are insufficient, the target chooses recipient order."],
    interactions: [],
  }),
  equalizer: define({
    id: "equalizer",
    number: 21,
    name: "Equalizer",
    timing: ["AFTER_APPOINT_TEAM"],
    timingLabel: "After the Captain appoints the Navigation Team; affects the next Mutiny.",
    description: "The next Mutiny succeeds with 1 Gun, and each player may reveal at most 1 Gun during the initial reveal.",
    type: "one_shot",
    effect: "EQUALIZE_NEXT_MUTINY",
    targetRule: "NONE",
    usePolicy: "CONSUME_ON_SUCCESS",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["The one-Gun cap applies only to initial reveal.", "Clear after that Mutiny."],
    interactions: ["Instigator may add multiple remaining Guns after the initial reveal."],
  }),
  instigator: define({
    id: "instigator",
    number: 22,
    name: "Instigator",
    timing: ["AFTER_MUTINY_GUNS_REVEALED"],
    timingLabel: "After the initial Gun reveal of the current Mutiny.",
    description: "Choose a non-Captain player; they may add all their remaining Guns to the current Mutiny.",
    type: "one_shot",
    effect: "OFFER_ALL_REMAINING_GUNS",
    targetRule: "NON_CAPTAIN_PLAYER",
    usePolicy: "CONSUME_IF_TARGET_ACCEPTS",
    implemented: false,
    source: "USER_SUPPLIED",
    rules: ["If accepted, add all remaining Guns and mark Instigator used.", "If refused, add nothing and return Instigator face-down and unused."],
    interactions: ["May target a player blocked from initial participation by Minstrel.", "Equalizer does not cap this post-reveal addition."],
  }),
});

export const CHARACTER_DECK: readonly CharacterDefinition[] = Object.freeze(
  CHARACTER_IDS.map((id) => CHARACTER_DEFINITIONS[id]),
);

export function getCharacterDefinition(id: CharacterId): CharacterDefinition {
  return CHARACTER_DEFINITIONS[id];
}

export function createCharacterRuntimeState(id: CharacterId): CharacterRuntimeState {
  return { id, revealed: false, used: false, active: false, status: "face_down", activationCount: 0 };
}

export function hydrateCharacterCard(state: CharacterRuntimeState): CharacterCard {
  const definition = getCharacterDefinition(state.id);
  return {
    ...definition,
    timing: [...definition.timing],
    rules: [...definition.rules],
    interactions: [...definition.interactions],
    revealed: state.revealed,
    used: state.used,
    active: state.active,
    status: state.status,
    activationCount: state.activationCount,
  };
}

export function createCharacterCard(id: CharacterId): CharacterCard {
  return hydrateCharacterCard(createCharacterRuntimeState(id));
}
