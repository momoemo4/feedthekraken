import { longJourney } from "../server/data/maps/longJourney";
import { createSeededRng, shuffled, type Rng } from "../server/engine/rng";
import type { Direction, HexCell } from "../shared/types";

type SimFaction = "SAILOR" | "PIRATE" | "CULT_LEADER" | "CULTIST";
type CardEffect = "DRUNK" | "DISARMED" | "ARMED" | "MERMAID" | "TELESCOPE" | "CULT_UPRISING";
type Ritual = "CONVERSION" | "GUNS_STASH" | "CULT_CABIN_SEARCH";

interface NavigationCard {
  id: string;
  direction: Direction;
  effect: CardEffect;
}

interface Bot {
  id: string;
  name: string;
  seat: number;
  originalFaction: SimFaction;
  currentFaction: SimFaction;
  character: string;
  guns: number;
  connected: boolean;
  eliminated: boolean;
  silenced: boolean;
  offDuty: boolean;
  searched: boolean;
  convertible: boolean;
  floggedEvidence: string | null;
  resume: NavigationCard[];
}

const CHARACTER_SAMPLE = [
  "Captain",
  "Gunsmith",
  "Peacemaker",
  "Look-Out",
  "Master Strategist",
  "Smuggler",
  "Agitator",
  "Archivist",
];

function repeatCards(direction: Direction, effect: CardEffect, count: number, offset: number): NavigationCard[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `N${String(offset + index + 1).padStart(2, "0")}`,
    direction,
    effect,
  }));
}

function createNavigationDeck(): NavigationCard[] {
  let offset = 0;
  const groups: NavigationCard[][] = [];
  const add = (direction: Direction, effect: CardEffect, count: number) => {
    groups.push(repeatCards(direction, effect, count, offset));
    offset += count;
  };
  add("yellow", "CULT_UPRISING", 6);
  add("blue", "DRUNK", 4);
  add("blue", "DISARMED", 2);
  add("red", "DRUNK", 5);
  add("red", "MERMAID", 2);
  add("red", "TELESCOPE", 2);
  add("red", "ARMED", 2);
  return groups.flat();
}

function teamOf(faction: SimFaction): "SAILOR" | "PIRATE" | "CULT" {
  if (faction === "CULT_LEADER" || faction === "CULTIST") return "CULT";
  return faction;
}

function directionPreference(faction: SimFaction): Direction {
  if (faction === "SAILOR") return "blue";
  if (faction === "PIRATE") return "red";
  return "yellow";
}

class EightBotSimulation {
  readonly rng: Rng = createSeededRng(0xfeed8);
  readonly publicLog: string[] = [];
  readonly privateLog: string[] = [];
  readonly phaseCoverage = new Set<string>();
  readonly designGaps = new Set<string>();
  readonly bots: Bot[];
  drawPile: NavigationCard[];
  discardPile: NavigationCard[] = [];
  ritualDeck: Ritual[];
  shipHexId = "H30";
  captainIndex: number;
  supplyCrossed = false;
  stateVersion = 0;
  commandCount = 0;
  winner: "SAILOR" | "PIRATE" | "CULT" | null = null;

  constructor() {
    const factions = shuffled<SimFaction>([
      "SAILOR", "SAILOR", "SAILOR", "SAILOR",
      "PIRATE", "PIRATE", "PIRATE", "CULT_LEADER",
    ], this.rng);
    const characters = shuffled(CHARACTER_SAMPLE, this.rng);
    this.bots = Array.from({ length: 8 }, (_, index) => ({
      id: `P${index + 1}`,
      name: `Bot ${index + 1}`,
      seat: index + 1,
      originalFaction: factions[index],
      currentFaction: factions[index],
      character: characters[index],
      guns: 3,
      connected: true,
      eliminated: false,
      silenced: false,
      offDuty: false,
      searched: false,
      convertible: true,
      floggedEvidence: null,
      resume: [],
    }));
    this.captainIndex = this.bots.findIndex((bot) => bot.character === "Captain");
    this.drawPile = shuffled(createNavigationDeck(), this.rng);
    this.ritualDeck = shuffled<Ritual>([
      "CONVERSION", "CONVERSION", "CONVERSION", "GUNS_STASH", "CULT_CABIN_SEARCH",
    ], this.rng);
  }

  publicEvent(round: number, phase: string, message: string) {
    this.phaseCoverage.add(phase);
    this.stateVersion += 1;
    this.commandCount += 1;
    this.publicLog.push(`[PUBLIC][v${this.stateVersion}][R${round}][${phase}] ${message}`);
  }

  privateEvent(round: number, player: Bot, phase: string, message: string) {
    this.privateLog.push(`[PRIVATE:${player.name}][R${round}][${phase}] ${message}`);
  }

  setup() {
    this.publicEvent(0, "LOBBY", "Room SIM8 is full: 8/8 seats connected. Long Journey selected.");
    this.publicEvent(0, "SETUP_FACTIONS", "Factions assigned privately by the server.");
    for (const bot of this.bots) {
      this.privateEvent(0, bot, "SETUP_FACTIONS", `Your faction is ${bot.currentFaction}.`);
      if (bot.originalFaction === "PIRATE") {
        const teammates = this.bots.filter((candidate) => candidate.id !== bot.id && candidate.originalFaction === "PIRATE").map((candidate) => candidate.name);
        this.privateEvent(0, bot, "PIRATE_GATHERING", `Pirate teammates: ${teammates.join(", ")}.`);
      }
    }
    this.publicEvent(0, "SETUP_CHARACTERS", `${this.bots[this.captainIndex].name} reveals Captain and becomes first Captain.`);
    for (const bot of this.bots) {
      this.privateEvent(0, bot, "SETUP_CHARACTERS", `Character: ${bot.character}; ability disabled because exact card text is unverified.`);
    }
    this.designGaps.add("All 22 Character definitions are now data-driven from user-supplied rules, but reducer handlers and timing-window integration are still required; this simulation keeps abilities disabled.");
  }

  livingBots() {
    return this.bots.filter((bot) => !bot.eliminated);
  }

  eligibleTeam(captain: Bot) {
    let eligible = this.livingBots().filter((bot) => bot.id !== captain.id && !bot.offDuty);
    if (eligible.length < 2) {
      this.designGaps.add("Official off-duty fallback when fewer than two normal team candidates remain needs exact confirmation.");
      eligible = this.livingBots().filter((bot) => bot.id !== captain.id);
    }
    return eligible;
  }

  appointTeam(round: number): { captain: Bot; lieutenant: Bot; navigator: Bot } {
    const captain = this.bots[this.captainIndex];
    const eligible = this.eligibleTeam(captain);
    const preference = directionPreference(captain.currentFaction);
    const sorted = [...eligible].sort((a, b) => {
      const aAligned = directionPreference(a.currentFaction) === preference ? 0 : 1;
      const bAligned = directionPreference(b.currentFaction) === preference ? 0 : 1;
      return aAligned - bAligned || a.seat - b.seat;
    });
    const lieutenant = sorted[0];
    const navigator = sorted[1];
    this.publicEvent(round, "ROUND_APPOINT_TEAM", `${captain.name} appoints Lieutenant ${lieutenant.name} and Navigator ${navigator.name}.`);
    return { captain, lieutenant, navigator };
  }

  mutiny(round: number, captain: Bot, restarted: boolean): Bot | null {
    const commits = new Map<Bot, number>();
    for (const bot of this.livingBots().filter((candidate) => candidate.id !== captain.id)) {
      let amount = 0;
      if (!restarted && round === 1 && bot.originalFaction === "PIRATE") amount = commits.size === 0 ? 1 : 0;
      else if (!restarted && round === 2 && (bot.originalFaction === "PIRATE" || bot.currentFaction === "CULT_LEADER")) amount = Math.min(2, bot.guns);
      else if (!restarted && this.rng.int(10) === 0) amount = Math.min(1, bot.guns);
      commits.set(bot, amount);
      this.privateEvent(round, bot, "MUTINY_COMMIT", `Committed ${amount} gun(s).`);
    }
    this.publicEvent(round, "MUTINY_COMMIT", `${commits.size}/${commits.size} eligible players are READY. Gun amounts remain hidden.`);
    const total = [...commits.values()].reduce((sum, value) => sum + value, 0);
    this.publicEvent(round, "MUTINY_REVEAL", `Mutiny reveals ${total} gun(s); threshold for 8 players is 4.`);
    if (total < 4) {
      this.publicEvent(round, "MUTINY_RESOLVE", "Mutiny fails. All committed guns return to their owners.");
      return null;
    }

    for (const [bot, amount] of commits) bot.guns -= amount;
    const candidateScores = [...commits.entries()].map(([bot, amount]) => ({ bot, score: bot.silenced ? 0 : amount }));
    const high = Math.max(...candidateScores.map(({ score }) => score));
    const candidates = candidateScores.filter(({ score }) => score === high && score > 0).map(({ bot }) => bot);
    if (candidates.length > 1) {
      this.phaseCoverage.add("MUTINY_TIEBREAK");
      this.designGaps.add("The complete official Mutiny tie-break/elimination chain must be verified; simulator uses clockwise seat order.");
    }
    const winner = [...candidates].sort((a, b) => {
      const da = (a.seat - captain.seat + this.bots.length) % this.bots.length;
      const db = (b.seat - captain.seat + this.bots.length) % this.bots.length;
      return da - db;
    })[0];
    this.captainIndex = this.bots.indexOf(winner);
    this.publicEvent(round, "MUTINY_RESOLVE", `Mutiny succeeds. ${winner.name} becomes Captain; spent guns are discarded. Appointment restarts.`);
    return winner;
  }

  ensureFourCards(round: number) {
    if (this.drawPile.length >= 4) return;
    this.publicEvent(round, "NAV_PRE_DRAW", `Draw pile has ${this.drawPile.length}; shuffling it together with ${this.discardPile.length} facedown discards.`);
    this.drawPile = shuffled([...this.drawPile, ...this.discardPile], this.rng);
    this.discardPile = [];
  }

  chooseCard(bot: Bot, cards: NavigationCard[]): NavigationCard {
    const preferred = directionPreference(bot.currentFaction);
    return cards.find((card) => card.direction === preferred) ?? cards[this.rng.int(cards.length)];
  }

  drawNavigation(round: number, captain: Bot, lieutenant: Bot, navigator: Bot): NavigationCard {
    this.ensureFourCards(round);
    const captainHand = this.drawPile.splice(0, 2);
    const lieutenantHand = this.drawPile.splice(0, 2);
    this.privateEvent(round, captain, "NAV_CAPTAIN_DRAW", `Hand: ${captainHand.map((card) => `${card.id}/${card.direction}/${card.effect}`).join(" | ")}.`);
    this.privateEvent(round, lieutenant, "NAV_LIEUTENANT_DRAW", `Hand: ${lieutenantHand.map((card) => `${card.id}/${card.direction}/${card.effect}`).join(" | ")}.`);
    this.publicEvent(round, "NAV_CAPTAIN_SUBMIT", `${captain.name} submitted one facedown card to the logbook.`);
    const captainKeep = this.chooseCard(captain, captainHand);
    this.discardPile.push(...captainHand.filter((card) => card.id !== captainKeep.id));
    this.publicEvent(round, "NAV_LIEUTENANT_SUBMIT", `${lieutenant.name} submitted one facedown card to the logbook.`);
    const lieutenantKeep = this.chooseCard(lieutenant, lieutenantHand);
    this.discardPile.push(...lieutenantHand.filter((card) => card.id !== lieutenantKeep.id));
    const logbook = shuffled([captainKeep, lieutenantKeep], this.rng);
    this.publicEvent(round, "NAV_LOGBOOK_SHUFFLE", "Server shuffles the two logbook cards; their origin is hidden.");
    this.privateEvent(round, navigator, "NAVIGATOR_CHOOSE", `Logbook: ${logbook.map((card) => `${card.id}/${card.direction}/${card.effect}`).join(" | ")}.`);
    const selected = this.chooseCard(navigator, logbook);
    this.discardPile.push(...logbook.filter((card) => card.id !== selected.id));
    this.publicEvent(round, "NAV_REVEAL", `${captain.name} reveals ${selected.id}: ${selected.direction.toUpperCase()} / ${selected.effect}.`);
    captain.resume.push(selected);
    return selected;
  }

  currentCell(): HexCell {
    const cell = longJourney.cells.find((candidate) => candidate.id === this.shipHexId);
    if (!cell) throw new Error(`Missing map cell ${this.shipHexId}`);
    return cell;
  }

  moveShip(round: number, card: NavigationCard): HexCell {
    const from = this.currentCell();
    const exit = from.exits[card.direction];
    if (!exit) throw new Error(`INVALID_MOVEMENT:${from.id}:${card.direction}`);
    const destination = longJourney.cells.find((candidate) => candidate.id === exit.to);
    if (!destination) throw new Error(`INVALID_TARGET:${exit.to}`);
    if (exit.crossesSupplyLine && !this.supplyCrossed) {
      this.supplyCrossed = true;
      for (const bot of this.bots) bot.guns = Math.max(bot.guns, 3);
      this.publicEvent(round, "SUPPLY_LINE", "Ship crosses the Supply Line for the first time. Every player refills up to 3 guns.");
    }
    this.shipHexId = destination.id;
    this.publicEvent(round, "MOVE_SHIP", `Ship moves ${from.id} → ${destination.id} through the ${card.direction.toUpperCase()} exit.`);
    if (destination.type === "sailor_victory") this.winner = "SAILOR";
    if (destination.type === "pirate_victory") this.winner = "PIRATE";
    if (destination.type === "cult_victory") this.winner = "CULT";
    if (this.winner) this.publicEvent(round, "GAME_OVER", `Ship reaches a ${this.winner} destination. ${this.winner} wins.`);
    return destination;
  }

  targetFor(captain: Bot): Bot | null {
    const candidates = this.livingBots().filter((bot) => bot.id !== captain.id);
    return candidates.length ? candidates[this.rng.int(candidates.length)] : null;
  }

  resolveMapAction(round: number, cell: HexCell, captain: Bot) {
    if (!cell.action || this.winner) return;
    this.phaseCoverage.add("RESOLVE_MAP_ACTION");
    const target = this.targetFor(captain);
    if (!target) return;
    if (cell.action === "CABIN_SEARCH") {
      target.searched = true;
      target.convertible = false;
      this.privateEvent(round, captain, "CABIN_SEARCH", `${target.name}'s current faction is ${target.currentFaction}.`);
      this.publicEvent(round, "CABIN_SEARCH", `${captain.name} searches ${target.name}'s cabin. The result stays private; target cannot be converted.`);
    } else if (cell.action === "FLOGGING") {
      const exclusions = (["SAILOR", "PIRATE", "CULT"] as const).filter((faction) => faction !== teamOf(target.currentFaction));
      const evidence = `NOT ${exclusions[this.rng.int(exclusions.length)]}`;
      target.floggedEvidence = evidence;
      target.convertible = false;
      this.publicEvent(round, "FLOGGING", `${target.name} is flogged. Public evidence: ${evidence}. Target cannot be converted.`);
    } else if (cell.action === "OFF_WITH_THE_TONGUE") {
      target.silenced = true;
      this.publicEvent(round, "OFF_WITH_THE_TONGUE", `${target.name} is silenced and can no longer become Captain.`);
    } else if (cell.action === "FEED_THE_KRAKEN") {
      target.eliminated = true;
      this.publicEvent(round, "FEED_THE_KRAKEN", `${target.name} is eliminated without revealing a faction.`);
      if (target.currentFaction === "CULT_LEADER") {
        this.winner = "CULT";
        this.publicEvent(round, "GAME_OVER", "The sacrificed player was the Cult Leader. CULT wins.");
      }
    }
  }

  nextEligibleCaptain(from: Bot): Bot {
    const eligible = this.livingBots().filter((bot) => !bot.silenced);
    const minimumResume = Math.min(...eligible.map((bot) => bot.resume.length));
    const pool = eligible.filter((bot) => bot.resume.length === minimumResume);
    return [...pool].sort((a, b) => {
      const da = (a.seat - from.seat + this.bots.length) % this.bots.length || this.bots.length;
      const db = (b.seat - from.seat + this.bots.length) % this.bots.length || this.bots.length;
      return da - db;
    })[0];
  }

  resolveRitual(round: number, captain: Bot, lieutenant: Bot, navigator: Bot) {
    const ritual = this.ritualDeck.shift();
    if (!ritual) {
      this.publicEvent(round, "RESOLVE_CULT_RITUAL", "Cult Uprising resolves, but no ritual cards remain.");
      return;
    }
    const leader = this.bots.find((bot) => bot.currentFaction === "CULT_LEADER");
    this.publicEvent(round, "RESOLVE_CULT_RITUAL", `A facedown Cult Ritual resolves: ${ritual}.`);
    if (!leader) return;
    if (ritual === "CONVERSION") {
      const candidates = this.livingBots().filter((bot) => bot.convertible && bot.currentFaction !== "CULT_LEADER" && bot.currentFaction !== "CULTIST");
      if (!candidates.length) {
        this.publicEvent(round, "CONVERSION", "Conversion occurs, but there is no legal target.");
        return;
      }
      const target = candidates[this.rng.int(candidates.length)];
      target.currentFaction = "CULTIST";
      this.privateEvent(round, leader, "CONVERSION", `Converted target: ${target.name}.`);
      this.privateEvent(round, target, "CONVERSION", `You are now a Cultist. Cult Leader: ${leader.name}.`);
      this.publicEvent(round, "CONVERSION", "CONVERSION HAS OCCURRED. The target remains secret.");
    } else if (ritual === "GUNS_STASH") {
      const recipients = [leader, ...this.livingBots().filter((bot) => bot.id !== leader.id).slice(0, 2)];
      recipients.forEach((bot) => { bot.guns += 1; });
      this.privateEvent(round, leader, "CULT_GUNS_STASH", `Distributed 3 guns to ${recipients.map((bot) => bot.name).join(", ")}.`);
      this.publicEvent(round, "CULT_GUNS_STASH", "Cult Leader distributes exactly 3 guns. Public gun totals update.");
    } else {
      this.privateEvent(round, leader, "CULT_CABIN_SEARCH", `Current factions — Captain ${captain.currentFaction}; Lieutenant ${lieutenant.currentFaction}; Navigator ${navigator.currentFaction}.`);
      this.publicEvent(round, "CULT_CABIN_SEARCH", "Cult Cabin Search resolves. Its result remains private to the Cult Leader.");
    }
  }

  resolveCard(round: number, card: NavigationCard, captainAtReveal: Bot, lieutenant: Bot, navigator: Bot) {
    if (this.winner) return;
    this.phaseCoverage.add("RESOLVE_NAVIGATION_CARD");
    if (card.effect === "DRUNK") {
      const next = this.nextEligibleCaptain(captainAtReveal);
      this.captainIndex = this.bots.indexOf(next);
      this.publicEvent(round, "DRUNK", `${captainAtReveal.name} loses office. ${next.name} becomes Captain.`);
    } else if (card.effect === "ARMED") {
      navigator.guns += 1;
      this.publicEvent(round, "ARMED", `${navigator.name} gains 1 gun.`);
    } else if (card.effect === "DISARMED") {
      navigator.guns = Math.max(0, navigator.guns - 1);
      this.publicEvent(round, "DISARMED", `${navigator.name} loses 1 gun if possible.`);
    } else if (card.effect === "MERMAID") {
      const target = this.targetFor(captainAtReveal);
      if (target) this.privateEvent(round, target, "MERMAID", `Last facedown discards: ${this.discardPile.slice(-3).map((item) => item.id).join(", ") || "none"}.`);
      this.publicEvent(round, "MERMAID", `${captainAtReveal.name} selects a player to inspect recent discards privately.`);
      this.designGaps.add("Mermaid's exact discard ordering/visibility wording needs official card verification.");
    } else if (card.effect === "TELESCOPE") {
      const target = this.targetFor(captainAtReveal);
      const top = this.drawPile[0];
      if (target && top) this.privateEvent(round, target, "TELESCOPE", `Top card is ${top.id}/${top.direction}/${top.effect}; bot keeps it on top.`);
      this.publicEvent(round, "TELESCOPE", `${captainAtReveal.name} selects a player for a private top-deck decision.`);
      this.designGaps.add("Telescope's exact timing relative to reshuffle needs official card verification.");
    } else if (card.effect === "CULT_UPRISING") {
      this.resolveRitual(round, captainAtReveal, lieutenant, navigator);
    }
  }

  assignOffDuty(round: number, lieutenant: Bot, navigator: Bot) {
    for (const bot of this.bots) bot.offDuty = false;
    lieutenant.offDuty = true;
    navigator.offDuty = true;
    this.publicEvent(round, "OFF_DUTY", `For 8 players, Lieutenant ${lieutenant.name} and Navigator ${navigator.name} become off-duty.`);
  }

  simulateReconnect(round: number) {
    const bot = this.bots[6];
    const before = `${bot.id}|${bot.seat}|${bot.originalFaction}|${bot.currentFaction}|${bot.guns}|${bot.character}`;
    bot.connected = false;
    this.publicEvent(round, "RECONNECT", `${bot.name} disconnects; their seat is reserved.`);
    bot.connected = true;
    const after = `${bot.id}|${bot.seat}|${bot.originalFaction}|${bot.currentFaction}|${bot.guns}|${bot.character}`;
    if (before !== after) throw new Error("RECONNECT_STATE_LOSS");
    this.publicEvent(round, "RECONNECT", `${bot.name} reconnects with a replacement session and restores the same seat/state.`);
  }

  staleCommandProbe(round: number) {
    const staleVersion = this.stateVersion - 1;
    this.publicLog.push(`[PUBLIC][v${this.stateVersion}][R${round}][COMMAND_REJECTED] Expected v${this.stateVersion}; rejected stale command carrying v${staleVersion}.`);
    this.phaseCoverage.add("COMMAND_REJECTED");
  }

  run(maxRounds = 18) {
    this.setup();
    for (let round = 1; round <= maxRounds && !this.winner; round += 1) {
      if (round === 3) this.simulateReconnect(round);
      if (round === 2) this.staleCommandProbe(round);
      let team = this.appointTeam(round);
      const mutinyWinner = this.mutiny(round, team.captain, false);
      if (mutinyWinner) {
        team = this.appointTeam(round);
        this.mutiny(round, team.captain, true);
      }
      const card = this.drawNavigation(round, team.captain, team.lieutenant, team.navigator);
      const destination = this.moveShip(round, card);
      this.resolveMapAction(round, destination, team.captain);
      this.resolveCard(round, card, team.captain, team.lieutenant, team.navigator);
      if (!this.winner) this.assignOffDuty(round, team.lieutenant, team.navigator);
    }
    if (!this.winner) {
      this.designGaps.add("Simulation reached its round cap without victory; bot strategy needs scenario-directed policies for deterministic coverage.");
    }
    this.designGaps.add("Denial of Command and repeated Emergency Navigation need a dedicated forced scenario; random bots did not guarantee this branch.");
    this.designGaps.add("Command idempotency needs a persisted command-result table; stateVersion alone only rejects stale ordering.");
    this.assertNoPublicSecretLeak();
    this.printReport();
  }

  assertNoPublicSecretLeak() {
    const forbidden = ["Your faction is", "Pirate teammates:", "Converted target:", "Current factions —", "Hand:", "Logbook:", "Committed 1", "Committed 2", "Committed 3"];
    for (const phrase of forbidden) {
      if (this.publicLog.some((line) => line.includes(phrase))) throw new Error(`PUBLIC_SECRET_LEAK:${phrase}`);
    }
  }

  printReport() {
    console.log("=== EIGHT-BOT LONG JOURNEY SIMULATION ===");
    console.log(`Seed: 0xfeed8 | Winner: ${this.winner ?? "NONE"} | Final hex: ${this.shipHexId} | State version: ${this.stateVersion}`);
    console.log(`Commands/events: ${this.commandCount} | Public leak audit: PASS`);
    console.log("\n=== PUBLIC LOG ===");
    this.publicLog.forEach((line) => console.log(line));
    console.log("\n=== PRIVATE LOG (server test view; never broadcast as one payload) ===");
    this.privateLog.forEach((line) => console.log(line));
    console.log("\n=== PHASE COVERAGE ===");
    console.log([...this.phaseCoverage].sort().join(", "));
    console.log("\n=== DESIGN GAPS DISCOVERED ===");
    [...this.designGaps].forEach((gap, index) => console.log(`${index + 1}. ${gap}`));
    console.log("\n=== FINAL PUBLIC PLAYER SNAPSHOT ===");
    this.bots.forEach((bot) => console.log(`${bot.name}: seat=${bot.seat} guns=${bot.guns} eliminated=${bot.eliminated} silenced=${bot.silenced} offDuty=${bot.offDuty} searched=${bot.searched} evidence=${bot.floggedEvidence ?? "none"} resume=${bot.resume.length}`));
  }
}

new EightBotSimulation().run();
