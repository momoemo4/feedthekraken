export type GamePromptId =
  | "APPOINT_TEAM"
  | "MUTINY_COMMIT"
  | "CAPTAIN_NAVIGATION_HAND"
  | "LIEUTENANT_NAVIGATION_HAND"
  | "NAVIGATOR_LOGBOOK"
  | "EMERGENCY_NAVIGATOR"
  | "SELECT_ACTION_TARGET"
  | "TELESCOPE_DECISION"
  | "RITUAL_CONVERSION"
  | "RITUAL_GUNS_STASH"
  | "PRIVATE_INFORMATION";

export type UndoBoundary = "LOCAL_DRAFT" | "UNTIL_ALL_LOCKED" | "NEVER_AFTER_CONFIRM";

export interface GamePromptDefinition {
  id: GamePromptId;
  title: string;
  instruction: string;
  primaryAction: string;
  secondaryAction: string | null;
  utilityActions: readonly string[];
  undoBoundary: UndoBoundary;
  closeKeepsDraft: boolean;
  confirmationCreatesNewInformation: boolean;
}

export const GAME_PROMPTS: Readonly<Record<GamePromptId, GamePromptDefinition>> = Object.freeze({
  APPOINT_TEAM: {
    id: "APPOINT_TEAM",
    title: "Appoint the Navigation Team",
    instruction: "Choose one eligible Lieutenant and one different eligible Navigator.",
    primaryAction: "CONFIRM TEAM",
    secondaryAction: null,
    utilityActions: ["UNDO LAST", "RESET PICKS", "CLOSE"],
    undoBoundary: "LOCAL_DRAFT",
    closeKeepsDraft: true,
    confirmationCreatesNewInformation: false,
  },
  MUTINY_COMMIT: {
    id: "MUTINY_COMMIT",
    title: "Secret Mutiny Contribution",
    instruction: "Choose 0 up to your current Gun count. Other players see only READY / NOT READY.",
    primaryAction: "LOCK GUNS",
    secondaryAction: "CHANGE BEFORE REVEAL",
    utilityActions: ["−1", "+1", "SET 0", "CLOSE"],
    undoBoundary: "UNTIL_ALL_LOCKED",
    closeKeepsDraft: true,
    confirmationCreatesNewInformation: false,
  },
  CAPTAIN_NAVIGATION_HAND: {
    id: "CAPTAIN_NAVIGATION_HAND",
    title: "Captain's Navigation Cards",
    instruction: "Choose exactly 1 card to place facedown into the Captain's Logbook. The other card is discarded facedown.",
    primaryAction: "CONFIRM CARD",
    secondaryAction: null,
    utilityActions: ["UNDO PICK", "CLOSE"],
    undoBoundary: "NEVER_AFTER_CONFIRM",
    closeKeepsDraft: true,
    confirmationCreatesNewInformation: true,
  },
  LIEUTENANT_NAVIGATION_HAND: {
    id: "LIEUTENANT_NAVIGATION_HAND",
    title: "Lieutenant's Navigation Cards",
    instruction: "Choose exactly 1 card to place facedown into the Captain's Logbook. The other card is discarded facedown.",
    primaryAction: "CONFIRM CARD",
    secondaryAction: null,
    utilityActions: ["UNDO PICK", "CLOSE"],
    undoBoundary: "NEVER_AFTER_CONFIRM",
    closeKeepsDraft: true,
    confirmationCreatesNewInformation: true,
  },
  NAVIGATOR_LOGBOOK: {
    id: "NAVIGATOR_LOGBOOK",
    title: "Captain's Logbook",
    instruction: "The server shuffled these cards. Choose one to discard, leaving the other for the Captain to reveal—or jump overboard.",
    primaryAction: "CONFIRM CARD",
    secondaryAction: "JUMP OVERBOARD",
    utilityActions: ["UNDO PICK", "CLOSE"],
    undoBoundary: "NEVER_AFTER_CONFIRM",
    closeKeepsDraft: true,
    confirmationCreatesNewInformation: true,
  },
  EMERGENCY_NAVIGATOR: {
    id: "EMERGENCY_NAVIGATOR",
    title: "Choose an Emergency Navigator",
    instruction: "Choose a living player. Off-Duty players are eligible; the Lieutenant remains unchanged and Navigation restarts without a Mutiny.",
    primaryAction: "CONFIRM NAVIGATOR",
    secondaryAction: null,
    utilityActions: ["UNDO PICK", "CLOSE"],
    undoBoundary: "LOCAL_DRAFT",
    closeKeepsDraft: true,
    confirmationCreatesNewInformation: false,
  },
  SELECT_ACTION_TARGET: {
    id: "SELECT_ACTION_TARGET",
    title: "Choose a Target",
    instruction: "Only legal targets are enabled. Select one player and review the action before confirming.",
    primaryAction: "CONFIRM TARGET",
    secondaryAction: null,
    utilityActions: ["UNDO PICK", "CLOSE"],
    undoBoundary: "NEVER_AFTER_CONFIRM",
    closeKeepsDraft: true,
    confirmationCreatesNewInformation: true,
  },
  TELESCOPE_DECISION: {
    id: "TELESCOPE_DECISION",
    title: "Telescope",
    instruction: "Privately inspect the top Navigation Card, then decide where it goes.",
    primaryAction: "KEEP ON TOP",
    secondaryAction: "DISCARD FACEDOWN",
    utilityActions: ["CLOSE"],
    undoBoundary: "NEVER_AFTER_CONFIRM",
    closeKeepsDraft: false,
    confirmationCreatesNewInformation: true,
  },
  RITUAL_CONVERSION: {
    id: "RITUAL_CONVERSION",
    title: "Conversion to Cult",
    instruction: "Choose one convertible player. Their identity will remain hidden from the public table.",
    primaryAction: "CONFIRM CONVERSION",
    secondaryAction: null,
    utilityActions: ["UNDO PICK", "CLOSE"],
    undoBoundary: "NEVER_AFTER_CONFIRM",
    closeKeepsDraft: true,
    confirmationCreatesNewInformation: true,
  },
  RITUAL_GUNS_STASH: {
    id: "RITUAL_GUNS_STASH",
    title: "Cult's Guns Stash",
    instruction: "Allocate exactly 3 Guns. Use +/− on player rows; multiple Guns may go to the same player.",
    primaryAction: "DISTRIBUTE 3 GUNS",
    secondaryAction: null,
    utilityActions: ["UNDO LAST", "RESET", "CLOSE"],
    undoBoundary: "LOCAL_DRAFT",
    closeKeepsDraft: true,
    confirmationCreatesNewInformation: false,
  },
  PRIVATE_INFORMATION: {
    id: "PRIVATE_INFORMATION",
    title: "Private Information",
    instruction: "Only you can see this information. Closing the panel does not change game state.",
    primaryAction: "I'M DONE",
    secondaryAction: null,
    utilityActions: ["CLOSE"],
    undoBoundary: "NEVER_AFTER_CONFIRM",
    closeKeepsDraft: false,
    confirmationCreatesNewInformation: false,
  },
});
