import { useMemo, useState } from "react";
import { longJourney } from "@server/data/maps/longJourney";
import {
  createNavigationDeck,
  createRitualDeck,
  NAVIGATION_CARD_DEFINITIONS,
  RITUAL_CARD_DEFINITIONS,
  type NavigationCardInstance,
  type RitualCardId,
} from "@shared/cards";
import { CHARACTER_DEFINITIONS, CHARACTER_IDS, type CharacterId } from "@shared/characters";
import type { Faction } from "@shared/types";
import { CleanMap } from "./CleanMap";

type PrototypePhase =
  | "APPOINT_TEAM"
  | "MUTINY_COMMIT"
  | "MUTINY_REACTION"
  | "CAPTAIN_TRANSFER"
  | "DISCUSSION"
  | "CAPTAIN_DRAW"
  | "LIEUTENANT_DRAW"
  | "NAVIGATOR_CHOOSE"
  | "EMERGENCY_NAVIGATOR"
  | "MAP_ACTION"
  | "CARD_EFFECT"
  | "RITUAL"
  | "ROUND_END"
  | "GAME_OVER";

type BadgeRole = "captain" | "lieutenant" | "navigator";

interface TablePlayer {
  id: string;
  name: string;
  seat: number;
  guns: number;
  beer: number;
  faction: Faction;
  characterId: CharacterId;
  characterRevealed: boolean;
  characterUsed: boolean;
  connected: boolean;
  eliminated: boolean;
  silenced: boolean;
  searched: boolean;
  flogged: boolean;
  offDuty: boolean;
  resume: NavigationCardInstance[];
}

interface TableEvent {
  id: number;
  tone: "system" | "action" | "secret" | "warn";
  text: string;
}

interface PrototypeState {
  round: number;
  phase: PrototypePhase;
  players: TablePlayer[];
  captainId: string;
  lieutenantId: string | null;
  navigatorId: string | null;
  pendingCaptainId: string | null;
  shipHexId: string;
  selectedHexId: string;
  commitments: Record<string, number>;
  mutinyLocked: Record<string, boolean>;
  reactionPassed: Record<string, boolean>;
  navigationDeck: NavigationCardInstance[];
  deepSea: NavigationCardInstance[];
  captainHand: NavigationCardInstance[];
  lieutenantHand: NavigationCardInstance[];
  captainLogbookCard: NavigationCardInstance | null;
  logbook: NavigationCardInstance[];
  revealedCard: NavigationCardInstance | null;
  ritualDeck: RitualCardId[];
  usedRituals: RitualCardId[];
  activeRitual: RitualCardId | null;
  actionTargetId: string | null;
  supplyCrossed: boolean;
  winner: "SAILOR" | "PIRATE" | "CULT" | null;
  events: TableEvent[];
}

const PHASE_LABELS: Record<PrototypePhase, string> = {
  APPOINT_TEAM: "Appoint Navigation Team",
  MUTINY_COMMIT: "Secret Mutiny Commit",
  MUTINY_REACTION: "Mutiny Reveal & Reactions",
  CAPTAIN_TRANSFER: "Transfer the Captain Hat",
  DISCUSSION: "Table Discussion",
  CAPTAIN_DRAW: "Captain Draw",
  LIEUTENANT_DRAW: "Lieutenant Draw",
  NAVIGATOR_CHOOSE: "Navigator's Logbook",
  EMERGENCY_NAVIGATOR: "Emergency Navigation",
  MAP_ACTION: "Destination Action",
  CARD_EFFECT: "Navigation Card Effect",
  RITUAL: "Cult Ritual",
  ROUND_END: "Round End",
  GAME_OVER: "Game Over",
};

const FACTIONS: Faction[] = [
  "SAILOR", "PIRATE", "SAILOR", "CULT_LEADER", "PIRATE", "SAILOR",
  "PIRATE", "SAILOR", "CULTIST", "PIRATE", "SAILOR",
];

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function deterministicShuffle<T extends { id?: string } | string>(items: T[], salt: string): T[] {
  return [...items].sort((left, right) => {
    const leftKey = typeof left === "string" ? left : left.id ?? "";
    const rightKey = typeof right === "string" ? right : right.id ?? "";
    return hash(`${salt}:${leftKey}`) - hash(`${salt}:${rightKey}`);
  });
}

function createPlayers(): TablePlayer[] {
  const playableCharacters = CHARACTER_IDS.slice(1, 12);
  return Array.from({ length: 11 }, (_, index) => ({
    id: `P${index + 1}`,
    name: ["Anne", "Rackham", "Mara", "Jonah", "Bonny", "Flint", "Nora", "Vane", "Iris", "Morgan", "Silas"][index],
    seat: index + 1,
    guns: 3,
    beer: 0,
    faction: FACTIONS[index],
    characterId: playableCharacters[index],
    characterRevealed: false,
    characterUsed: false,
    connected: true,
    eliminated: false,
    silenced: false,
    searched: false,
    flogged: false,
    offDuty: false,
    resume: [],
  }));
}

function createInitialState(): PrototypeState {
  return {
    round: 1,
    phase: "APPOINT_TEAM",
    players: createPlayers(),
    captainId: "P1",
    lieutenantId: null,
    navigatorId: null,
    pendingCaptainId: null,
    shipHexId: "H30",
    selectedHexId: "H30",
    commitments: {},
    mutinyLocked: {},
    reactionPassed: {},
    navigationDeck: deterministicShuffle(createNavigationDeck("LONG_JOURNEY"), "prototype-nav"),
    deepSea: [],
    captainHand: [],
    lieutenantHand: [],
    captainLogbookCard: null,
    logbook: [],
    revealedCard: null,
    ritualDeck: deterministicShuffle(createRitualDeck(), "prototype-ritual"),
    usedRituals: [],
    activeRitual: null,
    actionTargetId: null,
    supplyCrossed: false,
    winner: null,
    events: [
      { id: 1, tone: "system", text: "11-player assisted tabletop created. Anne holds the Captain hat." },
      { id: 2, tone: "secret", text: "Private factions and text-only Characters were dealt to each phone." },
    ],
  };
}

function copyState(state: PrototypeState): PrototypeState {
  return {
    ...state,
    players: state.players.map((player) => ({ ...player, resume: [...player.resume] })),
    commitments: { ...state.commitments },
    mutinyLocked: { ...state.mutinyLocked },
    reactionPassed: { ...state.reactionPassed },
    navigationDeck: [...state.navigationDeck],
    deepSea: [...state.deepSea],
    captainHand: [...state.captainHand],
    lieutenantHand: [...state.lieutenantHand],
    logbook: [...state.logbook],
    ritualDeck: [...state.ritualDeck],
    usedRituals: [...state.usedRituals],
    events: [...state.events],
  };
}

function addEvent(state: PrototypeState, text: string, tone: TableEvent["tone"] = "action") {
  state.events.unshift({ id: (state.events[0]?.id ?? 0) + 1, tone, text });
}

function playerName(state: PrototypeState, id: string | null) {
  return state.players.find((player) => player.id === id)?.name ?? "—";
}

function roleFor(state: PrototypeState, id: string): BadgeRole[] {
  const roles: BadgeRole[] = [];
  if (state.captainId === id) roles.push("captain");
  if (state.lieutenantId === id) roles.push("lieutenant");
  if (state.navigatorId === id) roles.push("navigator");
  return roles;
}

function Badge({ role, selected, onPick }: { role: BadgeRole; selected: boolean; onPick: (role: BadgeRole) => void }) {
  const labels: Record<BadgeRole, string> = { captain: "CAPTAIN", lieutenant: "LIEUTENANT", navigator: "NAVIGATOR" };
  const icons: Record<BadgeRole, string> = { captain: "♛", lieutenant: "◆", navigator: "✦" };
  return (
    <button
      className={`role-badge role-badge--${role} ${selected ? "is-selected" : ""}`}
      draggable
      onDragStart={(event) => event.dataTransfer.setData("text/role", role)}
      onClick={() => onPick(role)}
      type="button"
    >
      <span>{icons[role]}</span>{labels[role]}
    </button>
  );
}

function NavigationCard({ card, action, onAction }: { card: NavigationCardInstance; action?: string; onAction?: () => void }) {
  return (
    <article className={`nav-card nav-card--${card.direction}`}>
      <span className="nav-card__direction">{card.direction.toUpperCase()}</span>
      <strong>{card.name}</strong>
      <small>{card.publicPrompt}</small>
      {action && onAction && <button type="button" onClick={onAction}>{action}</button>}
    </article>
  );
}

export function GamePrototype({ onOpenWorkbench }: { onOpenWorkbench: () => void }) {
  const [game, setGame] = useState(createInitialState);
  const [viewerId, setViewerId] = useState("P1");
  const [selectedBadge, setSelectedBadge] = useState<BadgeRole | null>("lieutenant");
  const [correctionMode, setCorrectionMode] = useState(false);

  const viewer = game.players.find((player) => player.id === viewerId) ?? game.players[0];
  const captain = game.players.find((player) => player.id === game.captainId)!;
  const lieutenant = game.players.find((player) => player.id === game.lieutenantId) ?? null;
  const navigator = game.players.find((player) => player.id === game.navigatorId) ?? null;
  const shipCell = longJourney.cells.find((cell) => cell.id === game.shipHexId)!;
  const opponents = game.players.filter((player) => player.id !== viewerId);
  const leftPlayers = opponents.slice(0, 5);
  const rightPlayers = opponents.slice(5);
  const living = game.players.filter((player) => !player.eliminated);
  const mutinyEligible = living.filter((player) => player.id !== game.captainId);
  const lockedCount = mutinyEligible.filter((player) => game.mutinyLocked[player.id]).length;
  const reactionCount = living.filter((player) => game.reactionPassed[player.id]).length;

  const privateCharacter = CHARACTER_DEFINITIONS[viewer.characterId];
  const canControlViewer = viewer.connected && !viewer.eliminated;

  const assignBadge = (role: BadgeRole, targetId: string) => {
    setGame((current) => {
      const next = copyState(current);
      const target = next.players.find((player) => player.id === targetId);
      if (!target || target.eliminated) return current;

      if (role === "captain") {
        if (next.phase !== "CAPTAIN_TRANSFER" || viewerId !== next.captainId || targetId !== next.pendingCaptainId) return current;
        const previous = playerName(next, next.captainId);
        next.captainId = targetId;
        next.pendingCaptainId = null;
        next.lieutenantId = null;
        next.navigatorId = null;
        next.phase = "APPOINT_TEAM";
        addEvent(next, `${previous} passes the Captain hat to ${target.name}. Navigation badges return to the tray.`);
        return next;
      }

      if (next.phase !== "APPOINT_TEAM" || viewerId !== next.captainId || targetId === next.captainId || target.offDuty) return current;
      if (role === "lieutenant") {
        next.lieutenantId = targetId;
        if (next.navigatorId === targetId) next.navigatorId = null;
      } else {
        next.navigatorId = targetId;
        if (next.lieutenantId === targetId) next.lieutenantId = null;
      }
      addEvent(next, `${playerName(next, next.captainId)} places the ${role} badge on ${target.name}.`);
      return next;
    });
    setSelectedBadge(role === "lieutenant" ? "navigator" : null);
  };

  const confirmTeam = () => {
    setGame((current) => {
      if (current.phase !== "APPOINT_TEAM" || viewerId !== current.captainId || !current.lieutenantId || !current.navigatorId) return current;
      const next = copyState(current);
      next.phase = "MUTINY_COMMIT";
      next.commitments = Object.fromEntries(next.players.filter((player) => !player.eliminated && player.id !== next.captainId).map((player) => [player.id, 0]));
      next.mutinyLocked = {};
      next.reactionPassed = {};
      addEvent(next, `${playerName(next, next.captainId)} confirms ${playerName(next, next.lieutenantId)} as Lieutenant and ${playerName(next, next.navigatorId)} as Navigator.`);
      return next;
    });
  };

  const adjustPlayerCounter = (id: string, key: "guns" | "beer", delta: number) => {
    setGame((current) => {
      const next = copyState(current);
      const player = next.players.find((candidate) => candidate.id === id);
      if (!player) return current;
      player[key] = Math.max(0, player[key] + delta);
      addEvent(next, `${player.name} ${key} ${delta > 0 ? "+" : ""}${delta}${correctionMode ? " · correction" : ""}.`, correctionMode ? "warn" : "action");
      return next;
    });
  };

  const adjustCommitment = (delta: number) => {
    setGame((current) => {
      if (current.phase !== "MUTINY_COMMIT" || current.mutinyLocked[viewerId] || viewerId === current.captainId) return current;
      const next = copyState(current);
      const player = next.players.find((candidate) => candidate.id === viewerId)!;
      next.commitments[viewerId] = Math.max(0, Math.min(player.guns, (next.commitments[viewerId] ?? 0) + delta));
      return next;
    });
  };

  const lockMutiny = () => {
    setGame((current) => {
      if (current.phase !== "MUTINY_COMMIT" || viewerId === current.captainId || current.mutinyLocked[viewerId]) return current;
      const next = copyState(current);
      next.mutinyLocked[viewerId] = true;
      addEvent(next, `${playerName(next, viewerId)} locks a secret Mutiny contribution.`);
      const eligible = next.players.filter((player) => !player.eliminated && player.id !== next.captainId);
      if (eligible.every((player) => next.mutinyLocked[player.id])) {
        next.phase = "MUTINY_REACTION";
        next.reactionPassed = {};
        addEvent(next, `All ${eligible.length} contributions are locked. Guns reveal simultaneously.`, "system");
      }
      return next;
    });
  };

  const unlockMutiny = () => {
    setGame((current) => {
      if (current.phase !== "MUTINY_COMMIT" || !current.mutinyLocked[viewerId]) return current;
      const next = copyState(current);
      delete next.mutinyLocked[viewerId];
      addEvent(next, `${playerName(next, viewerId)} unlocks their contribution before the reveal barrier.`, "warn");
      return next;
    });
  };

  const lockRemainingBots = () => {
    setGame((current) => {
      if (current.phase !== "MUTINY_COMMIT") return current;
      const next = copyState(current);
      const eligible = next.players.filter((player) => !player.eliminated && player.id !== next.captainId);
      eligible.forEach((player, index) => {
        if (!(player.id in next.commitments)) next.commitments[player.id] = 0;
        if (!next.mutinyLocked[player.id]) {
          next.commitments[player.id] = index < 5 ? Math.min(1, player.guns) : 0;
          next.mutinyLocked[player.id] = true;
        }
      });
      next.phase = "MUTINY_REACTION";
      next.reactionPassed = {};
      addEvent(next, "Prototype helper locks the remaining seats. Guns reveal simultaneously.", "system");
      return next;
    });
  };

  const adjustRevealedContribution = (id: string, delta: number) => {
    setGame((current) => {
      if (current.phase !== "MUTINY_REACTION") return current;
      const next = copyState(current);
      const player = next.players.find((candidate) => candidate.id === id)!;
      next.commitments[id] = Math.max(0, Math.min(player.guns, (next.commitments[id] ?? 0) + delta));
      addEvent(next, `${player.name}'s revealed contribution corrected to ${next.commitments[id]}.`, "warn");
      return next;
    });
  };

  const resolveMutiny = (state: PrototypeState) => {
    const total = Object.values(state.commitments).reduce((sum, value) => sum + value, 0);
    const threshold = 5;
    if (total < threshold) {
      state.phase = "DISCUSSION";
      state.mutinyLocked = {};
      state.reactionPassed = {};
      addEvent(state, `Mutiny fails ${total}/${threshold}. Revealed Guns return to their owners.`, "system");
      return;
    }

    const candidates = state.players
      .filter((player) => !player.eliminated && player.id !== state.captainId && !player.silenced)
      .map((player) => ({ player, contribution: state.commitments[player.id] ?? 0 }))
      .sort((left, right) => right.contribution - left.contribution || left.player.seat - right.player.seat);
    const winner = candidates[0]?.player;
    state.players.forEach((player) => {
      player.guns = Math.max(0, player.guns - (state.commitments[player.id] ?? 0));
    });
    state.pendingCaptainId = winner?.id ?? null;
    state.phase = "CAPTAIN_TRANSFER";
    addEvent(state, `Mutiny succeeds ${total}/${threshold}. Committed Guns sink into the supply. ${winner?.name ?? "No candidate"} claims the hat.`, "system");
  };

  const passReaction = () => {
    setGame((current) => {
      if (current.phase !== "MUTINY_REACTION" || !canControlViewer) return current;
      const next = copyState(current);
      next.reactionPassed[viewerId] = true;
      addEvent(next, `${playerName(next, viewerId)} passes the Mutiny reaction window.`);
      const eligible = next.players.filter((player) => !player.eliminated);
      if (eligible.every((player) => next.reactionPassed[player.id])) resolveMutiny(next);
      return next;
    });
  };

  const passAllReactions = () => {
    setGame((current) => {
      if (current.phase !== "MUTINY_REACTION") return current;
      const next = copyState(current);
      next.players.filter((player) => !player.eliminated).forEach((player) => { next.reactionPassed[player.id] = true; });
      addEvent(next, "Prototype helper passes all remaining reaction windows.", "system");
      resolveMutiny(next);
      return next;
    });
  };

  const toggleCharacter = () => {
    setGame((current) => {
      const next = copyState(current);
      const player = next.players.find((candidate) => candidate.id === viewerId)!;
      if (player.characterUsed) return current;
      player.characterRevealed = true;
      player.characterUsed = true;
      addEvent(next, `${player.name} reveals ${CHARACTER_DEFINITIONS[player.characterId].name}. Effect is resolved manually in this tabletop prototype.`, "action");
      return next;
    });
  };

  const toggleViewerStatus = (key: "offDuty" | "silenced" | "searched" | "flogged") => {
    setGame((current) => {
      const next = copyState(current);
      const player = next.players.find((candidate) => candidate.id === viewerId)!;
      player[key] = !player[key];
      addEvent(next, `${player.name} ${player[key] ? "receives" : "removes"} ${key.toUpperCase()} marker.`, correctionMode ? "warn" : "action");
      return next;
    });
  };

  const startNavigation = () => {
    setGame((current) => {
      if (current.phase !== "DISCUSSION" || viewerId !== current.captainId) return current;
      const next = copyState(current);
      next.phase = "CAPTAIN_DRAW";
      addEvent(next, `${playerName(next, next.captainId)} closes discussion and starts Navigation.`);
      return next;
    });
  };

  const prepareDeck = (state: PrototypeState) => {
    if (state.navigationDeck.length >= 4) return;
    state.navigationDeck = deterministicShuffle([...state.navigationDeck, ...state.deepSea], `reshuffle-${state.round}-${state.events.length}`);
    state.deepSea = [];
    addEvent(state, "Fewer than 4 Navigation Cards remained. Deck and Deep Sea reshuffle before dealing.", "system");
  };

  const drawForRole = (role: "captain" | "lieutenant") => {
    setGame((current) => {
      const requiredPhase = role === "captain" ? "CAPTAIN_DRAW" : "LIEUTENANT_DRAW";
      const roleId = role === "captain" ? current.captainId : current.lieutenantId;
      const hand = role === "captain" ? current.captainHand : current.lieutenantHand;
      if (current.phase !== requiredPhase || viewerId !== roleId || hand.length) return current;
      const next = copyState(current);
      if (role === "captain") prepareDeck(next);
      const cards = next.navigationDeck.splice(0, 2);
      if (role === "captain") next.captainHand = cards;
      else next.lieutenantHand = cards;
      addEvent(next, `${playerName(next, roleId)} privately draws 2 Navigation Cards.`, "secret");
      return next;
    });
  };

  const drawOneCorrection = () => {
    setGame((current) => {
      if (!correctionMode || (current.phase !== "CAPTAIN_DRAW" && current.phase !== "LIEUTENANT_DRAW")) return current;
      const role = current.phase === "CAPTAIN_DRAW" ? "captain" : "lieutenant";
      const roleId = role === "captain" ? current.captainId : current.lieutenantId;
      if (viewerId !== roleId) return current;
      const next = copyState(current);
      if (!next.navigationDeck.length) prepareDeck(next);
      const card = next.navigationDeck.shift();
      if (!card) return current;
      if (role === "captain") next.captainHand.push(card);
      else next.lieutenantHand.push(card);
      addEvent(next, `${playerName(next, roleId)} correction-draws 1 Navigation Card.`, "warn");
      return next;
    });
  };

  const shuffleDeepSeaNow = () => {
    setGame((current) => {
      if (!correctionMode || !current.deepSea.length) return current;
      const next = copyState(current);
      next.navigationDeck = deterministicShuffle([...next.navigationDeck, ...next.deepSea], `manual-shuffle-${next.events.length}`);
      next.deepSea = [];
      addEvent(next, "Host correction shuffles Deep Sea into the Navigation Deck.", "warn");
      return next;
    });
  };

  const submitNavigationCard = (role: "captain" | "lieutenant", cardId: string) => {
    setGame((current) => {
      const hand = role === "captain" ? current.captainHand : current.lieutenantHand;
      const roleId = role === "captain" ? current.captainId : current.lieutenantId;
      if (viewerId !== roleId || !hand.some((card) => card.id === cardId)) return current;
      const next = copyState(current);
      const selected = hand.find((card) => card.id === cardId)!;
      next.deepSea.push(...hand.filter((card) => card.id !== cardId));
      if (role === "captain") {
        next.captainHand = [];
        next.captainLogbookCard = selected;
        next.phase = "LIEUTENANT_DRAW";
      } else {
        next.lieutenantHand = [];
        next.logbook = deterministicShuffle([next.captainLogbookCard!, selected], `logbook-${next.round}`);
        next.captainLogbookCard = null;
        next.phase = "NAVIGATOR_CHOOSE";
      }
      addEvent(next, `${playerName(next, roleId)} puts one card in the Logbook; remaining hand cards sink facedown into Deep Sea.`, "secret");
      if (role === "lieutenant") addEvent(next, "Two Logbook cards are shuffled and delivered privately to the Navigator.", "system");
      return next;
    });
  };

  const playNavigationCard = (cardId: string) => {
    setGame((current) => {
      if (current.phase !== "NAVIGATOR_CHOOSE" || viewerId !== current.navigatorId) return current;
      const selected = current.logbook.find((card) => card.id === cardId);
      if (!selected) return current;
      const next = copyState(current);
      next.deepSea.push(...next.logbook.filter((card) => card.id !== cardId));
      next.logbook = [];
      next.revealedCard = selected;
      const captainPlayer = next.players.find((player) => player.id === next.captainId)!;
      captainPlayer.resume.push(selected);

      const from = longJourney.cells.find((cell) => cell.id === next.shipHexId)!;
      const exit = from.exits[selected.direction];
      if (!exit) {
        addEvent(next, `No ${selected.direction} exit exists from ${from.id}. Correction required.`, "warn");
        return next;
      }
      const destination = longJourney.cells.find((cell) => cell.id === exit.to)!;
      next.shipHexId = destination.id;
      next.selectedHexId = destination.id;
      if (exit.crossesSupplyLine && !next.supplyCrossed) {
        next.supplyCrossed = true;
        next.players.forEach((player) => { player.guns = Math.max(player.guns, 3); });
        addEvent(next, "Supply Line crossed for the first time. Every player refills up to 3 Guns.", "system");
      }
      addEvent(next, `${playerName(next, next.navigatorId)} plays ${selected.direction.toUpperCase()} ${selected.name}. Ship sails ${from.id} → ${destination.id}.`, "action");

      if (destination.type !== "normal") {
        next.winner = destination.type === "sailor_victory" ? "SAILOR" : destination.type === "pirate_victory" ? "PIRATE" : "CULT";
        next.phase = "GAME_OVER";
        addEvent(next, `${next.winner} reaches its destination and wins the prototype voyage.`, "system");
      } else {
        next.phase = destination.action ? "MAP_ACTION" : "CARD_EFFECT";
      }
      return next;
    });
  };

  const jumpOverboard = () => {
    setGame((current) => {
      if (current.phase !== "NAVIGATOR_CHOOSE" || viewerId !== current.navigatorId) return current;
      const next = copyState(current);
      const jumper = next.players.find((player) => player.id === next.navigatorId)!;
      jumper.eliminated = true;
      next.deepSea.push(...next.logbook);
      next.logbook = [];
      next.actionTargetId = null;
      next.phase = "EMERGENCY_NAVIGATOR";
      addEvent(next, `${jumper.name} jumps overboard. Both Logbook cards sink facedown; Captain must choose an Emergency Navigator.`, "system");
      return next;
    });
  };

  const confirmEmergencyNavigator = () => {
    setGame((current) => {
      if (current.phase !== "EMERGENCY_NAVIGATOR" || viewerId !== current.captainId || !current.actionTargetId) return current;
      const next = copyState(current);
      next.navigatorId = next.actionTargetId;
      next.actionTargetId = null;
      next.captainHand = [];
      next.lieutenantHand = [];
      next.captainLogbookCard = null;
      next.phase = "CAPTAIN_DRAW";
      addEvent(next, `${playerName(next, next.captainId)} appoints ${playerName(next, next.navigatorId)} as Emergency Navigator. Navigation restarts without Mutiny.`, "system");
      return next;
    });
  };

  const drawRitualCorrection = () => {
    setGame((current) => {
      if (!correctionMode || !current.ritualDeck.length) return current;
      const next = copyState(current);
      next.activeRitual = next.ritualDeck.shift() ?? null;
      next.phase = next.activeRitual ? "RITUAL" : next.phase;
      addEvent(next, `Host correction draws ${next.activeRitual ? RITUAL_CARD_DEFINITIONS[next.activeRitual].name : "no Ritual"}.`, "warn");
      return next;
    });
  };

  const resolveMapAction = () => {
    setGame((current) => {
      if (current.phase !== "MAP_ACTION" || viewerId !== current.captainId || !current.actionTargetId) return current;
      const next = copyState(current);
      const cell = longJourney.cells.find((candidate) => candidate.id === next.shipHexId)!;
      addEvent(next, `${playerName(next, next.captainId)} resolves ${cell.action?.replaceAll("_", " ")} on ${playerName(next, next.actionTargetId)}. Secret result remains on the Captain's phone.`, "action");
      if (cell.action === "FEED_THE_KRAKEN") {
        const target = next.players.find((player) => player.id === next.actionTargetId)!;
        target.eliminated = true;
        if (target.faction === "CULT_LEADER") {
          next.winner = "CULT";
          next.phase = "GAME_OVER";
          addEvent(next, "The sacrificed player was the Cult Leader. CULT wins.", "system");
          return next;
        }
      } else if (cell.action === "CABIN_SEARCH") {
        const target = next.players.find((player) => player.id === next.actionTargetId)!;
        target.searched = true;
      } else if (cell.action === "FLOGGING") {
        const target = next.players.find((player) => player.id === next.actionTargetId)!;
        target.flogged = true;
      } else if (cell.action === "OFF_WITH_THE_TONGUE") {
        const target = next.players.find((player) => player.id === next.actionTargetId)!;
        target.silenced = true;
      }
      next.actionTargetId = null;
      next.phase = "CARD_EFFECT";
      return next;
    });
  };

  const finishCardEffect = (state: PrototypeState) => {
    state.actionTargetId = null;
    state.phase = "ROUND_END";
  };

  const resolveCardEffect = () => {
    setGame((current) => {
      if (current.phase !== "CARD_EFFECT" || !current.revealedCard) return current;
      const next = copyState(current);
      const card = next.revealedCard!;
      if (card.effect === "MERMAID" || card.effect === "TELESCOPE") {
        if (viewerId !== next.captainId || !next.actionTargetId) return current;
        addEvent(next, `${card.name}: ${playerName(next, next.actionTargetId)} receives the private card view.`, "secret");
        finishCardEffect(next);
      } else if (card.effect === "ARMED") {
        const target = next.players.find((player) => player.id === next.navigatorId)!;
        target.guns += 1;
        addEvent(next, `Armed gives ${target.name} +1 Gun.`);
        finishCardEffect(next);
      } else if (card.effect === "DISARMED") {
        const target = next.players.find((player) => player.id === next.navigatorId)!;
        target.guns = Math.max(0, target.guns - 1);
        addEvent(next, `Disarmed removes 1 Gun from ${target.name}.`);
        finishCardEffect(next);
      } else if (card.effect === "DRUNK") {
        const oldCaptain = next.players.find((player) => player.id === next.captainId)!;
        oldCaptain.beer += 1;
        const candidates = next.players.filter((player) => !player.eliminated && !player.silenced && player.id !== oldCaptain.id);
        const minimum = Math.min(...candidates.map((player) => player.resume.length));
        const newCaptain = candidates
          .filter((player) => player.resume.length === minimum)
          .sort((left, right) => ((left.seat - oldCaptain.seat + 11) % 11 || 11) - ((right.seat - oldCaptain.seat + 11) % 11 || 11))[0];
        next.captainId = newCaptain.id;
        addEvent(next, `Drunk places a Beer on ${oldCaptain.name} and automatically passes the Captain hat to ${newCaptain.name}.`, "system");
        finishCardEffect(next);
      } else if (card.effect === "CULT_UPRISING") {
        const ritual = next.ritualDeck.shift() ?? null;
        next.activeRitual = ritual;
        next.phase = ritual ? "RITUAL" : "ROUND_END";
        addEvent(next, ritual ? `Cult Uprising draws ${RITUAL_CARD_DEFINITIONS[ritual].name}.` : "Cult Uprising finds no Ritual cards remaining.", "system");
      } else {
        finishCardEffect(next);
      }
      return next;
    });
  };

  const resolveRitual = () => {
    setGame((current) => {
      if (current.phase !== "RITUAL" || !current.activeRitual) return current;
      const next = copyState(current);
      const ritual = next.activeRitual!;
      if (ritual === "CONVERSION") {
        if (!next.actionTargetId) return current;
        const target = next.players.find((player) => player.id === next.actionTargetId)!;
        target.faction = "CULTIST";
        addEvent(next, "CONVERSION HAS OCCURRED. The converted player remains secret.", "system");
      } else if (ritual === "CULT_GUNS_STASH") {
        addEvent(next, "Cult's Guns Stash is marked resolved. Use tabletop +/− controls to distribute exactly 3 Guns.", "action");
      } else {
        addEvent(next, "Cult Leader privately views the current factions of Captain, Lieutenant, and Navigator.", "secret");
      }
      next.usedRituals.push(ritual);
      next.activeRitual = null;
      next.actionTargetId = null;
      next.phase = "ROUND_END";
      return next;
    });
  };

  const endRound = () => {
    setGame((current) => {
      if (current.phase !== "ROUND_END") return current;
      const next = copyState(current);
      next.players.forEach((player) => { player.offDuty = false; });
      const lieutenantPlayer = next.players.find((player) => player.id === next.lieutenantId);
      const navigatorPlayer = next.players.find((player) => player.id === next.navigatorId);
      const captainPlayer = next.players.find((player) => player.id === next.captainId);
      if (captainPlayer) captainPlayer.offDuty = true;
      if (lieutenantPlayer) lieutenantPlayer.offDuty = true;
      if (navigatorPlayer) navigatorPlayer.offDuty = true;
      addEvent(next, `${captainPlayer?.name ?? "Captain"}, ${lieutenantPlayer?.name ?? "Lieutenant"}, and ${navigatorPlayer?.name ?? "Navigator"} receive Off-Duty markers for this 11-player game.`, "system");
      next.round += 1;
      next.phase = "APPOINT_TEAM";
      next.lieutenantId = null;
      next.navigatorId = null;
      next.commitments = {};
      next.mutinyLocked = {};
      next.reactionPassed = {};
      next.revealedCard = null;
      addEvent(next, `Round ${next.round} begins. Captain appoints a new team.`, "system");
      return next;
    });
  };

  const moveShipCorrection = () => {
    setGame((current) => {
      if (!correctionMode) return current;
      const next = copyState(current);
      next.shipHexId = next.selectedHexId;
      addEvent(next, `Host correction moves the ship to ${next.selectedHexId}.`, "warn");
      return next;
    });
  };

  const restartPrototype = () => {
    setGame(createInitialState());
    setViewerId("P1");
    setSelectedBadge("lieutenant");
    setCorrectionMode(false);
  };

  const roleTray = (
    <div className="role-tray">
      <Badge role="captain" selected={selectedBadge === "captain"} onPick={setSelectedBadge} />
      <Badge role="lieutenant" selected={selectedBadge === "lieutenant"} onPick={setSelectedBadge} />
      <Badge role="navigator" selected={selectedBadge === "navigator"} onPick={setSelectedBadge} />
    </div>
  );

  const renderPlayer = (player: TablePlayer) => {
    const roles = roleFor(game, player.id);
    const isViewer = player.id === viewerId;
    const commitmentVisible = game.phase === "MUTINY_REACTION" || game.phase === "CAPTAIN_TRANSFER";
    return (
      <article
        className={`player-seat ${isViewer ? "is-viewer" : ""} ${player.offDuty ? "is-off-duty" : ""} ${player.eliminated ? "is-eliminated" : ""}`}
        key={player.id}
        onClick={() => {
          if (selectedBadge) assignBadge(selectedBadge, player.id);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const role = event.dataTransfer.getData("text/role") as BadgeRole;
          if (role) assignBadge(role, player.id);
        }}
      >
        <header><span>Seat {player.seat}</span><b>{player.name}</b><i className={player.connected ? "is-online" : ""} /></header>
        <div className="seat-roles">{roles.map((role) => <span className={`mini-role mini-role--${role}`} key={role}>{role[0].toUpperCase()}</span>)}</div>
        <div className="seat-tokens">
          <span>Gun <b>{player.guns}</b></span>
          <button type="button" onClick={(event) => { event.stopPropagation(); adjustPlayerCounter(player.id, "guns", -1); }}>−</button>
          <button type="button" onClick={(event) => { event.stopPropagation(); adjustPlayerCounter(player.id, "guns", 1); }}>+</button>
          <span>Beer <b>{player.beer}</b></span>
        </div>
        <div className="seat-status">
          {player.offDuty && <span>OFF-DUTY</span>}
          {player.silenced && <span>SILENCED</span>}
          {player.searched && <span>SEARCHED</span>}
          {player.flogged && <span>FLOGGED</span>}
          {player.characterRevealed && <span>{CHARACTER_DEFINITIONS[player.characterId].name}</span>}
          {game.mutinyLocked[player.id] && <span className="status-locked">LOCKED</span>}
          {commitmentVisible && player.id !== game.captainId && <span className="status-reveal">{game.commitments[player.id] ?? 0} GUN</span>}
          {game.reactionPassed[player.id] && <span>PASS</span>}
        </div>
        <div className={`seat-character-card ${player.characterRevealed ? "is-revealed" : ""}`}>
          <small>CHARACTER</small>
          <b>{player.characterRevealed ? CHARACTER_DEFINITIONS[player.characterId].name : "FACE DOWN"}</b>
        </div>
        <div className="seat-resume" aria-label={`${player.name} public portfolio`}>
          {player.resume.length === 0 && <small>EMPTY PORTFOLIO</small>}
          {player.resume.slice(-6).map((card) => <span className={`resume-card resume-card--${card.direction.toLowerCase()}`} title={card.name} key={card.id}>{card.direction[0]}</span>)}
        </div>
      </article>
    );
  };

  const targetOptions = game.players.filter((player) => !player.eliminated && player.id !== game.captainId);

  const phaseControls = (() => {
    if (game.phase === "APPOINT_TEAM") return (
      <div className="phase-action-grid">
        <div><h3>Place the role badges</h3><p>Captain selects Lieutenant and Navigator. Drag a badge onto an eligible player, or tap the badge and then the seat.</p></div>
        <button className="prototype-primary" disabled={viewerId !== game.captainId || !game.lieutenantId || !game.navigatorId} onClick={confirmTeam}>CONFIRM TEAM</button>
      </div>
    );

    if (game.phase === "MUTINY_COMMIT") {
      const mine = game.commitments[viewerId] ?? 0;
      const locked = game.mutinyLocked[viewerId];
      return (
        <div className="phase-action-grid">
          <div><h3>Secret contribution · {lockedCount}/{mutinyEligible.length} locked</h3><p>Only this phone sees the amount. The final lock opens all Guns simultaneously.</p></div>
          {viewerId === game.captainId ? <div className="waiting-card">Captain cannot join this Mutiny.</div> : (
            <div className="mutiny-picker"><button onClick={() => adjustCommitment(-1)} disabled={locked}>−</button><strong>{locked ? "LOCKED" : mine}</strong><button onClick={() => adjustCommitment(1)} disabled={locked}>+</button>{locked ? <button onClick={unlockMutiny}>CHANGE</button> : <button onClick={lockMutiny}>LOCK GUNS</button>}</div>
          )}
          <button className="prototype-secondary" onClick={lockRemainingBots}>DEMO · LOCK REMAINING</button>
        </div>
      );
    }

    if (game.phase === "MUTINY_REACTION") return (
      <div className="phase-action-grid">
        <div><h3>Guns revealed · {reactionCount}/{living.length} passed</h3><p>Reveal a Character or correct a contribution. Resolution waits until every living player confirms.</p></div>
        <div className="revealed-contributions">{mutinyEligible.map((player) => <span key={player.id}>{player.name} <button onClick={() => adjustRevealedContribution(player.id, -1)}>−</button><b>{game.commitments[player.id] ?? 0}</b><button onClick={() => adjustRevealedContribution(player.id, 1)}>+</button></span>)}</div>
        <button className="prototype-primary" disabled={game.reactionPassed[viewerId]} onClick={passReaction}>PASS / CONFIRM</button>
        <button className="prototype-secondary" onClick={passAllReactions}>DEMO · PASS ALL</button>
      </div>
    );

    if (game.phase === "CAPTAIN_TRANSFER") return (
      <div className="phase-action-grid"><div><h3>{playerName(game, game.pendingCaptainId)} won the Mutiny</h3><p>The old Captain passes the hat. Navigation badges return to the tray.</p></div><Badge role="captain" selected={selectedBadge === "captain"} onPick={setSelectedBadge} /><button className="prototype-primary" disabled={viewerId !== game.captainId} onClick={() => game.pendingCaptainId && assignBadge("captain", game.pendingCaptainId)}>PASS CAPTAIN HAT</button></div>
    );

    if (game.phase === "DISCUSSION") return (
      <div className="phase-action-grid"><div><h3>Open table discussion</h3><p>Players may talk, move permitted tokens and reveal valid Characters. Captain decides when the voyage continues.</p></div><button className="prototype-primary" disabled={viewerId !== game.captainId} onClick={startNavigation}>START NAVIGATION</button></div>
    );

    if (game.phase === "CAPTAIN_DRAW" || game.phase === "LIEUTENANT_DRAW") {
      const role = game.phase === "CAPTAIN_DRAW" ? "captain" : "lieutenant";
      const hand = role === "captain" ? game.captainHand : game.lieutenantHand;
      const correctViewer = viewerId === (role === "captain" ? game.captainId : game.lieutenantId);
      return (
        <div className="phase-action-grid">
          <div><h3>{role === "captain" ? "Captain" : "Lieutenant"} private hand</h3><p>Draw two, then put exactly one in the Logbook. The rest sinks facedown into Deep Sea.</p></div>
          {!hand.length ? <div className="waiting-card">{correctViewer ? "Click DRAW 2 on the Navigation Deck beside the map." : `Waiting for ${playerName(game, role === "captain" ? game.captainId : game.lieutenantId)} to draw.`}</div> : <div className="card-hand">{hand.map((card) => <NavigationCard key={card.id} card={card} action="PUT IN LOGBOOK" onAction={() => submitNavigationCard(role, card.id)} />)}</div>}
        </div>
      );
    }

    if (game.phase === "NAVIGATOR_CHOOSE") return (
      <div className="phase-action-grid"><div><h3>Shuffled Captain's Logbook</h3><p>Navigator chooses one card to play without knowing its source—or refuses command and jumps overboard.</p></div><div className="card-hand">{game.logbook.map((card) => <NavigationCard key={card.id} card={card} action="PLAY THIS CARD" onAction={() => playNavigationCard(card.id)} />)}</div><button className="prototype-danger" disabled={viewerId !== game.navigatorId} onClick={jumpOverboard}>JUMP OVERBOARD</button></div>
    );

    if (game.phase === "EMERGENCY_NAVIGATOR") return (
      <div className="phase-action-grid"><div><h3>Choose an Emergency Navigator</h3><p>Off-Duty players are legal. Lieutenant stays in office; Navigation restarts immediately without another Mutiny.</p></div><select value={game.actionTargetId ?? ""} onChange={(event) => setGame((current) => ({ ...current, actionTargetId: event.target.value || null }))}><option value="">Choose living player…</option>{game.players.filter((player) => !player.eliminated && player.id !== game.captainId).map((player) => <option key={player.id} value={player.id}>{player.name}{player.offDuty ? " · off-duty allowed" : ""}</option>)}</select><button className="prototype-primary" disabled={viewerId !== game.captainId || !game.actionTargetId} onClick={confirmEmergencyNavigator}>CONFIRM EMERGENCY NAVIGATOR</button></div>
    );

    if (game.phase === "MAP_ACTION") return (
      <div className="phase-action-grid"><div><h3>Open the crate on {game.shipHexId}</h3><p>{shipCell.action?.replaceAll("_", " ")} resolves before the Navigation Card effect. Only Captain may confirm.</p></div><select value={game.actionTargetId ?? ""} onChange={(event) => setGame((current) => ({ ...current, actionTargetId: event.target.value || null }))}><option value="">Choose target…</option>{targetOptions.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select><button className="prototype-primary" disabled={viewerId !== game.captainId || !game.actionTargetId} onClick={resolveMapAction}>OPEN & RESOLVE CRATE</button></div>
    );

    if (game.phase === "CARD_EFFECT") {
      const needsTarget = game.revealedCard?.effect === "MERMAID" || game.revealedCard?.effect === "TELESCOPE";
      return (
        <div className="phase-action-grid"><div><h3>{game.revealedCard?.name}</h3><p>{game.revealedCard?.publicPrompt}</p></div>{needsTarget && <select value={game.actionTargetId ?? ""} onChange={(event) => setGame((current) => ({ ...current, actionTargetId: event.target.value || null }))}><option value="">Captain chooses a player…</option>{targetOptions.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select>}<button className="prototype-primary" disabled={needsTarget && (!game.actionTargetId || viewerId !== game.captainId)} onClick={resolveCardEffect}>RESOLVE CARD</button></div>
      );
    }

    if (game.phase === "RITUAL" && game.activeRitual) {
      const ritual = RITUAL_CARD_DEFINITIONS[game.activeRitual];
      return (
        <div className="phase-action-grid"><div><h3>{ritual.name}</h3><p>{ritual.publicPrompt}</p></div>{game.activeRitual === "CONVERSION" && viewer.faction === "CULT_LEADER" && <select value={game.actionTargetId ?? ""} onChange={(event) => setGame((current) => ({ ...current, actionTargetId: event.target.value || null }))}><option value="">Cult Leader chooses privately…</option>{game.players.filter((player) => !player.eliminated && player.faction !== "CULT_LEADER" && player.faction !== "CULTIST").map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select>}<button className="prototype-primary" disabled={game.activeRitual === "CONVERSION" && (viewer.faction !== "CULT_LEADER" || !game.actionTargetId)} onClick={resolveRitual}>MARK RITUAL RESOLVED</button></div>
      );
    }

    if (game.phase === "ROUND_END") return <div className="phase-action-grid"><div><h3>Navigation complete</h3><p>Apply Off-Duty markers, clear the table and begin the next appointment.</p></div><button className="prototype-primary" onClick={endRound}>END ROUND</button></div>;
    if (game.phase === "GAME_OVER") return <div className="phase-action-grid"><div><h3>{game.winner} VICTORY</h3><p>The voyage is over. Current factions determine winners; eliminated players still share their team's result.</p></div><button className="prototype-primary" onClick={restartPrototype}>START NEW GAME</button></div>;
    return null;
  })();

  const stats = useMemo(() => ({
    deck: game.navigationDeck.length,
    deepSea: game.deepSea.length,
    rituals: game.ritualDeck.length,
  }), [game.navigationDeck.length, game.deepSea.length, game.ritualDeck.length]);

  const activeDrawRole: "captain" | "lieutenant" | null = game.phase === "CAPTAIN_DRAW"
    ? "captain"
    : game.phase === "LIEUTENANT_DRAW"
      ? "lieutenant"
      : null;
  const activeDrawOwnerId = activeDrawRole === "captain" ? game.captainId : activeDrawRole === "lieutenant" ? game.lieutenantId : null;
  const activeDrawHand = activeDrawRole === "captain" ? game.captainHand : activeDrawRole === "lieutenant" ? game.lieutenantHand : [];
  const canDrawNavigation = Boolean(activeDrawRole && activeDrawOwnerId === viewerId && activeDrawHand.length === 0);

  return (
    <main className="prototype-shell">
      <header className="prototype-topbar">
        <div className="prototype-brand"><span>☠</span><div><small>Feed the Kraken</small><strong>Assisted Tabletop Prototype</strong></div></div>
        <div className="phase-readout"><small>Round {game.round}</small><strong>{PHASE_LABELS[game.phase]}</strong></div>
        <label className="viewer-switch"><span>Private phone</span><select value={viewerId} onChange={(event) => { setViewerId(event.target.value); setSelectedBadge(null); }}>{game.players.map((player) => <option value={player.id} key={player.id}>Seat {player.seat} · {player.name}</option>)}</select></label>
        <button type="button" className={`correction-toggle ${correctionMode ? "is-active" : ""}`} onClick={() => setCorrectionMode((value) => !value)}>CORRECTION {correctionMode ? "ON" : "OFF"}</button>
        <button type="button" className="prototype-ghost" onClick={onOpenWorkbench}>MAP AUDIT</button>
        <button type="button" className="prototype-ghost" onClick={restartPrototype}>RESET DEMO</button>
      </header>

      <section className="shared-object-rack" aria-label="Shared table objects">
        <div className="shared-object-rack__label"><small>SHARED TABLE</small><strong>Drag, take or return</strong></div>
        <div className="shared-role-slot"><span>OFFICER BADGES</span>{roleTray}</div>
        <button className="table-object table-object--gun" onClick={() => adjustPlayerCounter(viewer.id, "guns", 1)}><i>●</i><span>GUN SUPPLY</span><b>TAKE +1</b></button>
        <button className="table-object table-object--beer" onClick={() => adjustPlayerCounter(viewer.id, "beer", 1)}><i>◆</i><span>BEER BARREL</span><b>TAKE +1</b></button>
        <button className={`table-object ${viewer.offDuty ? "is-on-mat" : ""}`} onClick={() => toggleViewerStatus("offDuty")}><i>×</i><span>OFF-DUTY</span><b>{viewer.offDuty ? "RETURN" : "TAKE"}</b></button>
        <button className={`table-object ${viewer.silenced ? "is-on-mat" : ""}`} onClick={() => toggleViewerStatus("silenced")}><i>⌁</i><span>SILENCED</span><b>{viewer.silenced ? "RETURN" : "TAKE"}</b></button>
        <button className={`table-object ${viewer.searched ? "is-on-mat" : ""}`} onClick={() => toggleViewerStatus("searched")}><i>⌕</i><span>SEARCHED</span><b>{viewer.searched ? "RETURN" : "TAKE"}</b></button>
        <button className={`table-object ${viewer.flogged ? "is-on-mat" : ""}`} onClick={() => toggleViewerStatus("flogged")}><i>≋</i><span>FLOGGED</span><b>{viewer.flogged ? "RETURN" : "TAKE"}</b></button>
      </section>

      <section className="prototype-table">
        <aside className="player-rail player-rail--left">{leftPlayers.map(renderPlayer)}</aside>

        <section className="prototype-board">
          <div className="table-phase-strip">
            <span>ROUND {game.round}</span>
            <strong>{PHASE_LABELS[game.phase]}</strong>
            <small>{playerName(game, game.captainId)} controls phase advance · other objects remain manual</small>
          </div>
          <div className="prototype-map-frame">
            <CleanMap cells={longJourney.cells} activeId={game.selectedHexId} onSelect={(id) => setGame((current) => ({ ...current, selectedHexId: id }))} showArrows showLabels animate shipHexId={game.shipHexId} />
            {correctionMode && <button className="ship-correction" onClick={moveShipCorrection}>MOVE SHIP TO {game.selectedHexId}</button>}
            <section className="card-zone card-zone--navigation" aria-label="Navigation deck">
              <header><span>NAVIGATION</span><b>{stats.deck}</b></header>
              <div className="deck-stack deck-stack--navigation"><i /><i /><strong>N</strong></div>
              <button disabled={!canDrawNavigation} onClick={() => activeDrawRole && drawForRole(activeDrawRole)}>DRAW 2</button>
              {correctionMode && <button className="card-zone__minor" disabled={!activeDrawRole || activeDrawOwnerId !== viewerId} onClick={drawOneCorrection}>DRAW 1</button>}
            </section>

            <section className="card-zone card-zone--deepsea" aria-label="Deep Sea discard">
              <header><span>DEEP SEA</span><b>{stats.deepSea}</b></header>
              <div className="discard-fan"><i /><i /><i /></div>
              <small>FACE DOWN</small>
              {correctionMode && <button className="card-zone__minor" onClick={shuffleDeepSeaNow}>SHUFFLE NOW</button>}
            </section>

            <section className="card-zone card-zone--logbook" aria-label="Captain's Logbook">
              <header><span>CAPTAIN'S LOGBOOK</span><b>{game.logbook.length}/2</b></header>
              <div className="logbook-slots">
                {[0, 1].map((slot) => <i className={game.logbook[slot] ? "has-card" : ""} key={slot}>{game.logbook[slot] ? "?" : "+"}</i>)}
              </div>
              <small>SHUFFLED BEFORE NAVIGATOR SEES IT</small>
            </section>

            <section className="card-zone card-zone--ritual" aria-label="Ritual deck">
              <header><span>RITUAL DECK</span><b>{stats.rituals}</b></header>
              <div className="deck-stack deck-stack--ritual"><i /><i /><strong>☽</strong></div>
              <small>PRIVATE CEREMONY</small>
              {correctionMode && <button className="card-zone__minor" onClick={drawRitualCorrection}>DRAW RITUAL</button>}
            </section>

            <section className="card-zone card-zone--used" aria-label="Used ritual cards">
              <header><span>USED RITUALS</span><b>{game.usedRituals.length}</b></header>
              <div className="used-ritual-list">{game.usedRituals.length ? game.usedRituals.map((id) => <span key={id}>{RITUAL_CARD_DEFINITIONS[id].name}</span>) : <small>EMPTY</small>}</div>
            </section>
          </div>
        </section>

        <aside className="player-rail player-rail--right">
          {rightPlayers.map(renderPlayer)}
        </aside>
      </section>

      <section className="local-player-mat" aria-label={`${viewer.name} private player mat`}>
        <div className="local-player-mat__identity">
          <small>YOUR TABLE · SEAT {viewer.seat}</small>
          <strong>{viewer.name}</strong>
          <button className="private-peek" type="button">PRIVATE · {viewer.faction.replaceAll("_", " ")}</button>
          <div className="local-token-row"><span>GUNS <b>{viewer.guns}</b></span><span>BEER <b>{viewer.beer}</b></span>{viewer.offDuty && <i>OFF-DUTY</i>}{viewer.silenced && <i>SILENCED</i>}{viewer.searched && <i>SEARCHED</i>}{viewer.flogged && <i>FLOGGED</i>}</div>
        </div>

        <div className={`character-text-card ${viewer.characterUsed ? "is-used" : ""}`}>
          <span>Character #{privateCharacter.number}</span><strong>{privateCharacter.name}</strong><small>{privateCharacter.timingLabel}</small><p>{privateCharacter.description}</p>
          <button type="button" disabled={viewer.characterUsed || !canControlViewer} onClick={toggleCharacter}>{viewer.characterUsed ? "USED" : "REVEAL / ACTIVATE"}</button>
        </div>

        <div className="local-portfolio">
          <header><span>PUBLIC PORTFOLIO</span><b>{viewer.resume.length}</b></header>
          <div>{viewer.resume.length ? viewer.resume.map((card) => <span className={`resume-card resume-card--${card.direction.toLowerCase()}`} title={card.name} key={card.id}>{card.direction[0]}</span>) : <small>No played cards yet</small>}</div>
          <p>Captain <b>{captain.name}</b></p><p>Lieutenant <b>{lieutenant?.name ?? "Unassigned"}</b></p><p>Navigator <b>{navigator?.name ?? "Unassigned"}</b></p>
        </div>

        <section className="local-phase-panel">
          <header><span>CONTEXT ACTIONS</span><b>{PHASE_LABELS[game.phase]}</b></header>
          {phaseControls}
        </section>

        <div className="local-manual-tools">
          <header><span>MANUAL OVERRIDE</span><small>Undo table mistakes</small></header>
          <div className="manual-tokens"><button onClick={() => adjustPlayerCounter(viewer.id, "guns", -1)}>− GUN</button><button onClick={() => adjustPlayerCounter(viewer.id, "guns", 1)}>+ GUN</button><button onClick={() => adjustPlayerCounter(viewer.id, "beer", -1)}>− BEER</button><button onClick={() => adjustPlayerCounter(viewer.id, "beer", 1)}>+ BEER</button></div>
        </div>

        <section className="event-log"><header><span>TABLE LOG</span><b>{game.events.length}</b></header>{game.events.slice(0, 6).map((event) => <p className={`event--${event.tone}`} key={event.id}>{event.text}</p>)}</section>
      </section>
    </main>
  );
}
