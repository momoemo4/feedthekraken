# Feed the Kraken — Assisted Tabletop Prototype Prompt

You are a senior multiplayer game engineer and board-game UX designer. Build an interactive browser prototype for **Feed the Kraken** that feels like a digital tabletop, not a dashboard and not an automated videogame that plays instead of the players.

## Product intent

The prototype is used to validate the complete table flow before production art and full server integration. It must keep the physical-board feeling: players manipulate badges, Guns, Beer, cards and status markers themselves, while contextual convenience actions automate slow or secret procedures.

The prototype may contain explanatory text for testing, but the production UI must become icon-first and visually quiet. Use short labels, object silhouettes, counters and tooltips. Long explanations should appear only when a player opens help or inspects a card.

## Table layout

Create one continuous tabletop with this composition:

1. A narrow header showing game name, round, current phase, development-only seat selector, Correction Mode, map audit and reset.
2. A shared object rack directly below the header containing:
   - Captain hat/badge
   - Lieutenant badge
   - Navigator badge
   - Gun supply
   - Beer barrel; Beer itself is the physical Off-Duty marker
3. Five opponent stations on the left of the map and five on the right.
4. A large illustrated Long Journey hex map in the center. The map must visually dominate.
5. The current player's private table/mat across the bottom.

Do not put a large generic control dashboard below the map. Contextual actions belong on the current player's mat or on the table object that performs the action.

## Player stations

Each opponent station should be compact and mostly visual. Show:

- avatar and player name
- connected state
- public Gun count
- public Beer count
- Captain/Lieutenant/Navigator badge if held
- Beer count as the visible Off-Duty state, plus Eliminated state when relevant
- face-down Character card, or the revealed Character name after activation
- small public résumé/portfolio of played Navigation cards
- READY/LOCKED/PASS state when relevant

The current player's bottom mat contains:

- player name and seat
- private faction reveal area
- private Character card as a text card
- public Gun and Beer/Off-Duty counters
- public résumé
- officer summary
- private hand or current phase action
- manual `+/- Gun` and `+/- Beer` correction controls
- collapsible event log

## Map and physical card zones

Place the following as visible table objects around the map:

### Navigation Deck

- visible facedown stack
- remaining-card counter
- contextual `DRAW 2` button
- optional `DRAW 1` only in Correction Mode
- automatically reshuffle the remaining deck with Deep Sea before a deal if fewer than four cards remain

### Deep Sea

- facedown discard pile
- discard counter
- manual `SHUFFLE NOW` in Correction Mode

### Captain's Logbook

- exactly two card slots
- cards remain anonymous about whether Captain or Lieutenant submitted them
- shuffle the two cards before Navigator sees them

### Ritual Deck

- facedown stack
- remaining-card counter
- manual `DRAW RITUAL` in Correction Mode

### Used Rituals

- separate public area listing/revealing resolved ritual cards

These zones must look like physical stacks, slots and discards, not text-only menu entries.

## Round and phase flow

Implement an explicit prototype state machine with contextual controls for:

1. **Appoint Team**
   - Captain drags or selects Lieutenant and Navigator badges and places them on players.
   - Captain confirms the team.

2. **Mutiny Commit**
   - every eligible non-Captain secretly chooses a Gun contribution
   - players may change it until they lock
   - do not reveal any amount early
   - the phase advances only after every eligible player locks

3. **Mutiny Reveal / Reaction**
   - reveal all committed Guns simultaneously
   - allow valid Character activation and manual correction
   - every living player must press Pass/Confirm before resolution

4. **Captain Transfer**
   - old Captain manually passes the hat to the Mutiny winner
   - Lieutenant and Navigator badges return to the shared rack
   - new Captain appoints a new team
   - Mutiny repeats before returning to discussion/navigation

5. **Discussion**
   - players freely talk and manipulate permitted objects
   - Captain starts Navigation

6. **Captain Draw**
   - Captain clicks `DRAW 2` on the physical Navigation Deck
   - two private cards appear on Captain's mat
   - Captain puts one into the Logbook; the unchosen card goes facedown to Deep Sea

7. **Lieutenant Draw**
   - same interaction for Lieutenant

8. **Navigator Choose**
   - Navigator receives the shuffled two-card Logbook privately
   - chooses one to play; the other goes to Deep Sea
   - may instead choose `JUMP OVERBOARD`

9. **Emergency Navigator**
   - when Navigator jumps, discard both Logbook cards and eliminate Navigator
   - Captain selects a living Emergency Navigator; Off-Duty is allowed
   - Lieutenant remains in office
   - restart Navigation without Mutiny

10. **Move Ship**
    - resolve the selected Navigation direction against explicit map exit data
    - animate the ship to the destination hex

11. **Destination Map Action**
    - resolve before the Navigation Card effect
    - support Cabin Search, Flogging, Off With the Tongue and Feed the Kraken
    - Captain chooses the required target
    - preserve private information; do not add persistent Silenced, Searched or Flogged UI tokens

12. **Navigation Card Effect**
    - support Drunk, Mermaid, Telescope, Armed, Disarmed and Cult Uprising
    - target selection appears only when required
    - private results appear only on the authorized player's mat

13. **Cult Ritual**
    - support Conversion, Cult Guns Stash and Cult Cabin Search
    - keep secret target/result private
    - move resolved ritual into Used Rituals

14. **Round End / Game Over**
    - give Beer to the roles that become Off-Duty
    - begin next round or show the winning faction

## Manual tabletop behavior

Automation must be helpful but reversible. Players should still be able to:

- take or return Guns and Beer
- move officer badges
- correct revealed Gun commitments
- move the ship to a selected hex in Correction Mode
- draw one Navigation card manually
- shuffle Deep Sea manually
- draw a Ritual manually
- reveal or activate a Character when legal
- reset the prototype

Automatic convenience behavior may include:

- `DRAW 2`
- discarding unchosen cards to Deep Sea
- delivering/shuffling Logbook cards
- moving the ship after Navigator confirms
- automatically resolving simple Armed/Disarmed/Drunk state changes
- opening the correct target selector for a map action
- automatically reshuffling before a deal when fewer than four cards remain

## Character cards

Characters are data-driven text cards. Use a structure similar to:

```ts
{
  id: "gunslinger",
  number: 6,
  name: "Gunslinger",
  timingLabel: "After Guns are revealed",
  description: "Verified character text goes here.",
  type: "one_shot",
  revealed: false,
  used: false
}
```

Do not invent unverified Character effects. A face-down Character is public; faction and unused card text are private. Once activated, the Character becomes public and remains visible as used.

## Visual direction

- dark pirate-era tabletop
- aged brass, weathered wood, navy blue, muted crimson and parchment
- illustrated sea map with readable flat-top hexes
- physical depth for decks, badges, Guns, Beer and markers
- subtle object motion, hover lift, dealing and token-slide animations
- avoid bright flat SaaS colors
- avoid large paragraphs on the main table
- use icons with short labels and tap/hover tooltips
- preserve text on actual cards because card rules must remain readable
- responsive desktop/tablet/mobile layout, but optimize the shared table for desktop first

The source board photo may be used only for layout and topology reference. Do not ship it as final public artwork.

## Technical constraints

- React + TypeScript + Vite
- server-authoritative architecture using Node, Express and Socket.IO
- shared/public state separated from player-private state
- never send hidden factions, private hands, ritual targets or secret Mutiny commitments in the public payload
- explicit phases and command validation
- stale-command protection through `stateVersion`
- deterministic seeded RNG in tests
- SVG flat-top hex map with explicit colored exits
- rules and card definitions must not live directly inside visual components

## Prototype acceptance criteria

The prototype is successful when a tester can simulate an 11-player table by switching the private-phone viewer, complete the whole round flow, use every deck and table object, correct accidental actions, and understand what remains private without seeing a screen full of permanent instructional text.

This is still a functional prototype. Do not claim the UI is production art, and do not remove testing controls until the complete game flow has been verified.
