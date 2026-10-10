# Feed the Kraken assisted tabletop — playable prototype walkthrough

Status date: 2026-10-09

## Purpose of this prototype

The default local page is now an eleven-seat assisted tabletop. It demonstrates how one shared board and eleven private phones can coordinate a voyage without turning the board game into an automatic video game.

The top `Private phone` selector emulates opening the app on a different player's device. It exists only for local testing; production clients will be bound to one authenticated seat.

## Setup

The prototype creates eleven named seats with the supplied eleven-player faction mix: five Sailors, four Pirates, one Cult Leader, and one starting Cultist. Each seat receives three Guns and one text-only Character. Anne begins with the Captain hat.

Each private phone sees its own faction and Character. The public seat cards show Guns, Beer, public status markers, role badges, Mutiny readiness, and revealed public contributions. They do not display hidden factions.

## Appointment

The Captain drags or selects the Lieutenant and Navigator badges, then places each on an eligible seat. The same player cannot hold both badges, the Captain cannot appoint themself, and Off-Duty seats are excluded in the normal flow. `CONFIRM TEAM` closes appointment and opens the Mutiny.

## Mutiny

Every living player except the Captain privately selects `0..current Guns` and presses `LOCK GUNS`. Public UI exposes only the locked count. A player may unlock and change their amount before the last required lock.

The last lock opens the reveal barrier. All contributions appear simultaneously and the table enters the reaction window. Players may reveal their text Character and manually correct a contribution. Every living player must press `PASS / CONFIRM` before resolution.

At eleven players the threshold is five Guns. A failed Mutiny returns all Guns and opens table discussion. A successful Mutiny removes committed Guns, identifies the highest eligible contributor, and asks the old Captain to pass the hat. Navigation badges return to the tray, the new Captain appoints a new team, and a fresh Mutiny begins without advancing Off-Duty.

The prototype uses seat order for tied highest contributions. The complete official tie-break chain remains a production rule gap.

## Discussion and Navigation

After a failed Mutiny, token and Character interaction remains available while the table talks. Only the Captain can press `START NAVIGATION`.

Before the Captain draws, the app checks whether the deck contains at least four cards. If not, the remaining deck and facedown Deep Sea pile are shuffled together. Captain draws two privately, sends one to the Logbook, and the other falls facedown into Deep Sea. Lieutenant then draws the next two and does the same.

Only after both submissions does the server shuffle the two Logbook cards. Navigator receives both without source information, chooses one to play, and the other falls facedown into Deep Sea. The played card enters the current Captain's public résumé.

## Movement and actions

The ship automatically follows the current hex's exit matching the revealed red, blue, or yellow direction. A first Supply Line crossing refills every player up to three Guns. Reaching a victory destination ends the game.

When the destination contains a wooden action token, the game pauses before resolving the Navigation Card. The Captain selects a target and opens the crate. Feed the Kraken eliminates the target in the prototype and immediately awards a Cult victory when the target is the Cult Leader. Other action results are represented as private/manual tabletop resolution pending their production handlers.

## Navigation effects

- Drunk adds a Beer marker and automatically passes the Captain hat to the eligible clockwise player with the fewest résumé cards.
- Armed gives the Navigator one Gun.
- Disarmed removes one Gun from the Navigator when possible.
- Mermaid asks the Captain to choose a player and records a private last-three-discards view.
- Telescope asks the Captain to choose a player and records a private top-card decision.
- Cult Uprising draws one remaining Ritual and enters the Ritual phase.

## Rituals

Conversion requires the Cult Leader's private phone to select a target; public history records only that a conversion occurred. Cult's Guns Stash is resolved using the tabletop Gun controls. Cult Cabin Search records a private view for the Cult Leader. Used Rituals leave the deck permanently.

## Round end

After successful Navigation, Captain, Lieutenant, and Navigator receive Off-Duty markers in an eleven-player game. Their role badges return to the tray, the round counter advances, and the Captain appoints the next team.

## Manual correction

Gun and Beer counters remain interactive throughout the game. `CORRECTION ON` also allows the selected ship hex to become the ship's corrected location. Corrections enter the public table log instead of rewinding secret information.

`RESET DEMO` starts a clean local game. The separate Map Audit workbench remains accessible from the header.

## Implemented versus pending

Implemented in the browser prototype:

- eleven seats and private-phone emulation;
- role badge assignment;
- hidden Mutiny lock barrier, reveal, reaction confirmation, failure/success, and Captain transfer;
- text-only Character reveal/used state;
- Navigation deck, private hands, Deep Sea, Logbook shuffle, Navigator play, and résumé;
- map movement, Supply Line, simple destination-action gating, core Navigation effects, Ritual draw/use, Off-Duty, victory, correction controls, and event log.

Still pending before this becomes a real multiplayer game:

- Socket.IO room creation, authenticated seat binding, and per-room serialized command processing;
- persistent command idempotency, reconnect, AFK/force-pass, and server-restart restoration;
- exact Character effect handlers and timing validation;
- complete map-action privacy/results and knowledge-memory ledger;
- official Mutiny tie-break chain, Denial of Command, Emergency Navigation, and low-player fallbacks;
- recipient-specific Mermaid/Telescope/Ritual payloads rather than prototype log messages;
- production host checkpoints and correction permissions;
- Quick Journey topology.
