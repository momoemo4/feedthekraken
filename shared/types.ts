import type { CharacterCard, CharacterId, CharacterRuntimeState } from "./characters";

export type PlayerId = string;
export type RoomId = string;

export type Faction = "SAILOR" | "PIRATE" | "CULT_LEADER" | "CULTIST";
export type Phase =
  | "LOBBY"
  | "SETUP_FACTIONS"
  | "PIRATE_GATHERING"
  | "SETUP_CHARACTERS"
  | "ROUND_APPOINT_TEAM"
  | "MUTINY_COMMIT"
  | "MUTINY_REACTION"
  | "MUTINY_RESOLUTION"
  | "CAPTAIN_TRANSFER"
  | "DISCUSSION"
  | "NAV_CAPTAIN_DRAW"
  | "NAV_LIEUTENANT_DRAW"
  | "NAVIGATOR_CHOOSE"
  | "EMERGENCY_NAVIGATOR"
  | "MAP_ACTION"
  | "NAVIGATION_EFFECT"
  | "RITUAL"
  | "ROUND_END"
  | "GAME_OVER";

export interface PublicPlayer {
  id: PlayerId;
  name: string;
  seat: number;
  guns: number;
  connected: boolean;
  eliminated: boolean;
  silenced: boolean;
  offDuty: boolean;
  searched: boolean;
  floggedEvidence: Exclude<Faction, "CULTIST"> | null;
  publicCharacterId: CharacterId | null;
}

export interface SecretPlayer extends PublicPlayer {
  sessionToken: string;
  originalFaction: Faction;
  currentFaction: Faction;
  characterState: CharacterRuntimeState | null;
  navigationCards: string[];
  convertible: boolean;
}

export interface PublicEvent {
  id: string;
  timestamp: string;
  phase: Phase;
  actorId: PlayerId | null;
  action: string;
  message: string;
}

export interface InternalEvent extends PublicEvent {
  privateDebug?: Record<string, unknown>;
}

export interface GameState {
  roomId: RoomId;
  roomCode: string;
  stateVersion: number;
  phase: Phase;
  round: number;
  hostPlayerId: PlayerId | null;
  players: SecretPlayer[];
  captainId: PlayerId | null;
  lieutenantId: PlayerId | null;
  navigatorId: PlayerId | null;
  pendingCaptainId: PlayerId | null;
  mapId: "LONG_JOURNEY" | "QUICK_JOURNEY";
  shipHexId: string | null;
  drawPile: string[];
  discardPile: string[];
  ritualDeck: string[];
  publicEvents: PublicEvent[];
  internalEvents: InternalEvent[];
  pendingConversionTargetId: PlayerId | null;
  mutinyCommitments: Record<PlayerId, number>;
  mutinyLockedPlayerIds: PlayerId[];
  reactionPassedPlayerIds: PlayerId[];
  mutinyThreshold: number;
  processedCommandIds: string[];
  rngSeedAudit: string;
}

export interface PublicGameView {
  roomId: RoomId;
  roomCode: string;
  stateVersion: number;
  phase: Phase;
  round: number;
  players: PublicPlayer[];
  captainId: PlayerId | null;
  lieutenantId: PlayerId | null;
  navigatorId: PlayerId | null;
  pendingCaptainId: PlayerId | null;
  mapId: GameState["mapId"];
  shipHexId: string | null;
  drawPileCount: number;
  discardPileCount: number;
  ritualCardsRemaining: number;
  events: PublicEvent[];
  mutinyReadyPlayerIds: PlayerId[];
  reactionPassedPlayerIds: PlayerId[];
  mutinyContributions: Record<PlayerId, number> | null;
}

export interface PrivateGameView {
  playerId: PlayerId;
  originalFaction: Faction;
  currentFaction: Faction;
  character: CharacterCard | null;
  navigationCards: string[];
  pirateTeammates: Array<Pick<PublicPlayer, "id" | "name" | "seat">>;
  cultLeader: Pick<PublicPlayer, "id" | "name" | "seat"> | null;
  mutinyCommitment: number | null;
  mutinyLocked: boolean;
  legalActions: string[];
}

export type Edge = "NW" | "NE" | "E" | "SE" | "SW" | "W";
export type Direction = "red" | "blue" | "yellow";

export interface HexExit {
  edge: Edge;
  to: string;
  crossesSupplyLine?: boolean;
  verified: boolean;
  note?: string;
}

export interface HexCell {
  id: string;
  q: number;
  r: number;
  type: "normal" | "sailor_victory" | "pirate_victory" | "cult_victory";
  action: "CABIN_SEARCH" | "FLOGGING" | "OFF_WITH_THE_TONGUE" | "FEED_THE_KRAKEN" | null;
  exits: Partial<Record<Direction, HexExit>>;
  verified: boolean;
  note?: string;
}

export interface MapDefinition {
  id: "LONG_JOURNEY" | "QUICK_JOURNEY";
  name: string;
  verified: boolean;
  sourceReferenceIncluded: boolean;
  cells: HexCell[];
}
