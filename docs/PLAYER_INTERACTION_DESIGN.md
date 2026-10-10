# Player interaction and recovery design

Status date: 2026-10-09

## Interaction rule

Every choice opens in a stable private drawer over the shared board. Selecting a card, player, role, or Gun amount creates a local draft first. Nothing becomes authoritative until the player presses the primary confirm button.

The standard controls are:

- `UNDO LAST`: reverse the last local edit.
- `RESET PICKS`: clear the whole local draft.
- `CLOSE`: close the drawer without abandoning the phase; reopening restores the draft.
- `CONFIRM & LOCK`: validate and submit to the authoritative server.
- `CHANGE BEFORE REVEAL`: available only for simultaneous hidden commitments such as Mutiny, and only until the reveal barrier closes.

Undo must stop as soon as the action creates new private or public information. A player cannot undo after seeing replacement cards, shuffled Logbook cards, a searched faction, the top deck card, a Ritual target result, or a reveal. This prevents information fishing.

## What the server performs automatically

- deal factions, Characters, Navigation Cards, and Ritual Cards;
- filter illegal targets and reject stale/duplicate commands;
- shuffle decks and the two-card Logbook;
- hide card origin and all recipient-specific information;
- compute Mutiny strength and modifiers;
- move the ship, apply Supply Line once, and check victory;
- perform deterministic effects such as Armed, Disarmed, and Drunk;
- preserve the unresolved draft/phase across reconnects;
- publish an ordered event queue for animation and replay.

The client never calculates an authoritative result. It only edits a draft, submits a command, and renders the returned state/events.

## Manual decisions and buttons

| Decision | Primary controls | Undo boundary |
| --- | --- | --- |
| Appoint team | Select Lieutenant, select Navigator, `CONFIRM TEAM` | Until confirmed |
| Mutiny | `−1`, `+1`, `SET 0`, `LOCK GUNS`, `CHANGE BEFORE REVEAL` | Until everybody locks/reveal starts |
| Captain/Lieutenant hand | Select one card, `CONFIRM CARD` | Before confirmation only |
| Navigator Logbook | Select card, `CONFIRM CARD`, `JUMP OVERBOARD` | Before confirmation only |
| Emergency Navigator | Select player, `CONFIRM NAVIGATOR` | Until confirmed |
| Map/Card target | Select legal player, `CONFIRM TARGET` | Before result is generated |
| Telescope | `KEEP ON TOP`, `DISCARD FACEDOWN` | No undo after either choice |
| Cult Conversion | Select convertible player, `CONFIRM CONVERSION` | Before confirmation only |
| Cult Guns Stash | Per-player `−/+`, `UNDO LAST`, `RESET`, `DISTRIBUTE 3 GUNS` | Until exactly 3 are confirmed |
| Private result | `I'M DONE` / `CLOSE` | Closing changes no game state |
| Character ability | `USE CHARACTER`, target/amount controls, `CONFIRM` | Determined by whether activation has revealed new information |

## Exit, restart, and recovery

`CLOSE` means exit the panel, not exit the game. The current phase remains waiting and the draft is restored when reopened.

`LEAVE ROOM` disconnects the device but reserves the seat/session for reconnect. It must not reveal or discard the player's hidden information.

Host recovery controls live behind a separate `HOST TOOLS` panel:

- `PAUSE GAME`
- `RESUME GAME`
- `RESTART CURRENT ROUND`
- `RESET TO LOBBY`
- `END GAME`

Restarting a round or returning to the lobby requires a typed room-code confirmation. Production should retain an audit event and restore the last safe checkpoint; it must not attempt a partial reverse after secret information was exposed. A normal player cannot trigger these controls.

## Navigation card prompts and counts

Long Journey contains 23 Navigation Cards:

- Yellow/North: 6 Cult Uprising.
- Blue/East: 4 Drunk and 2 Disarmed.
- Red/West: 5 Drunk, 2 Mermaid, 2 Telescope, and 2 Armed.

Quick Journey's supplied deck specification contains 19 cards:

- Yellow: 5 Cult Uprising.
- Blue: 3 Drunk and 2 Disarmed.
- Red: 5 Drunk, 2 Mermaid, and 2 Telescope.
- No Armed cards.

The public reveal prompt uses the card's color/direction, name, movement destination, and public effect text. Secret prompts are recipient-specific: Mermaid reveals only the last three discards to its chosen player; Telescope reveals only the top card and its two decision buttons to its chosen player.

## Cult Ritual prompts and counts

The Ritual deck contains 5 cards, shuffled at setup and never recycled:

- 3 Conversion to Cult.
- 1 Cult's Guns Stash.
- 1 Cult Cabin Search.

Resolved Rituals remain face-up/used. Public UI shows the Ritual name and a safe waiting/result message. Only the Cult Leader receives target controls or private faction information. Conversion's target ID must never occur in a public payload.

All prompt copy and deck counts are centralized in `shared/actionPrompts.ts` and `shared/cards.ts`; React components render these definitions rather than embedding rule text.
