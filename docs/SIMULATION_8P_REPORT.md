# Eight-player gameplay simulation report

Status date: 2026-10-09

## What was run

`npm run simulate:8p` runs a deterministic server-side design harness with eight bots, eight unique sample Characters, and the intended eight-player faction mix:

- 4 Sailors
- 3 Pirates
- 1 Cult Leader

The simulator deliberately keeps Character abilities disabled. Their exact card text and timing windows have not been verified, so guessed abilities must not enter the production reducer.

This harness is separate from the production game engine. It exists to exercise the complete round shape, expose missing state/UI, and audit the public/private information boundary before gameplay rules are implemented.

## Result for seed `0xfeed8`

- 9 rounds completed.
- Final position: H06.
- Winner: Cult, after the Cult Leader was selected by Feed the Kraken.
- 116 authoritative public events/state transitions.
- Public-secret leak audit: PASS.
- Reconnect state restoration: PASS.
- Stale-version command rejection: PASS.

The run exercised:

- lobby, private faction assignment, Pirate teammate knowledge, and private Character assignment;
- Captain appointment of Lieutenant and Navigator;
- hidden Mutiny commitments, reveal, failure, success, tied-highest commitment, Captain replacement, and appointment restart;
- private Captain/Lieutenant draws, facedown submissions, server shuffle, private Navigator choice, public reveal, and facedown discard recycling;
- legal movement through the current 31-cell Long Journey topology;
- first Supply Line crossing and gun refill;
- Cabin Search, Flogging, Off With The Tongue, and Feed the Kraken;
- Drunk, Disarmed, Mermaid, Telescope, and Cult Uprising;
- secret Conversion and the split between its public announcement and private target notification;
- off-duty assignment, disconnect/reconnect, stale command rejection, and terminal victory.

## Required game components discovered

### Authoritative server state

The server needs explicit state for room seats and sessions, original/current faction, Character, public status markers, gun count, Captain resume, off-duty status, ship location, decks/discards, Supply Line status, pending choices, state version, processed command IDs, winner, and a chronological event queue.

Every pending choice needs a legal-actor list and a deadline/disconnect policy. A single broad `phase` string is insufficient for nested choices such as a successful Mutiny restarting appointment or a Cult Ritual asking the Cult Leader for a private target.

### Commands and validation

At minimum, the production protocol needs commands for:

- join, reclaim seat, ready, start game;
- appoint Lieutenant/Navigator;
- commit Mutiny guns and mark ready;
- submit Captain/Lieutenant navigation cards;
- choose the Navigator card;
- select targets for map actions and card effects;
- resolve Cult Leader choices;
- acknowledge queued reveals/animations where pacing requires it.

Every command needs `commandId`, `expectedStateVersion`, authenticated player/session identity, phase validation, legal-target validation, and an idempotent stored result. `stateVersion` rejects stale ordering but cannot safely answer a retried command by itself.

### Public table UI

The shared table needs:

- ship and route animation driven by an ordered server event queue;
- eight-seat player rail with Captain/Lieutenant/Navigator, ready, disconnected, eliminated, silenced, off-duty, searched, public evidence, guns, and resume count;
- current phase, active player, progress, timer, and contextual instruction;
- Mutiny readiness without exposing amounts, followed by a simultaneous reveal and winner/tie-break presentation;
- two facedown navigation submissions, shuffle animation, selected-card reveal, discard/draw counts, and reshuffle notice;
- map-action and card-effect result presentation;
- public Conversion announcement without target leakage;
- victory screen and replayable public event log.

### Private player UI

The authenticated private panel needs:

- faction/Character reveal and Pirate teammate view;
- Mutiny gun selector plus locked/ready state;
- Captain and Lieutenant two-card hand and submit interaction;
- Navigator's anonymously shuffled two-card logbook;
- target selectors for Cabin Search, Flogging, sacrifice, Mermaid, Telescope, and Cult Rituals;
- private search/evidence/top-card/discard information;
- Cult Leader conversion and ritual controls;
- reconnect recovery that restores the same unresolved private choice.

The server must build recipient-specific payloads. A hidden DOM element or client-side filter is not an acceptable secrecy boundary.

### Animation and pacing

GIF files are not required for gameplay animation. Movement, card dealing, reveal, Mutiny guns, status tokens, and map effects should be animated with CSS/SVG or a canvas timeline from server events. Art assets can remain static PNG/WebP layers; the animation state must never decide game rules.

## Rules still requiring verified references

The simulation exposed these rule questions rather than silently inventing answers:

1. Exact text and timing windows for all 22 Character abilities.
2. Complete official Mutiny tie-break and elimination chain. The harness temporarily uses clockwise seat order.
3. Mermaid's exact inspected-discard ordering and visibility wording.
4. Telescope's exact timing around draw-pile reshuffles and its available choices.
5. Denial of Command and repeated Emergency Navigation behavior.
6. Exact fallback when fewer than two normal appointment candidates remain because of off-duty/elimination.
7. Timer, AFK, disconnect, host-transfer, and bot-takeover policy.
8. Quick Journey topology and any mode-specific deck/rule changes.

## Recommended implementation order

1. Lobby, seats, reconnect tokens, ready/start, and faction/Character setup.
2. Production phase controller plus command idempotency and recipient-specific views.
3. One vanilla round: appointment, navigation draw/submit/shuffle/choose/reveal, movement, and off-duty.
4. Mutiny commit/reveal/resolve and Captain succession.
5. All four map actions and Supply Line.
6. Navigation card effects and draw/discard lifecycle.
7. Cult Ritual deck and private Cult Leader choices.
8. Victory resolution, event replay, timers/AFK policy, then verified Character abilities.

The deterministic audit harness should stay alongside the engine. As each production subsystem is implemented, its temporary simulator branch should be replaced by reducer-level integration tests using the same seed and expected public/private outcomes.
