# Network Privacy

## Projection boundary

The server emits two separate payloads:

- `getPublicView(gameState)` uses an allowlist and contains public board/player facts, public events, counts, and only Mutiny readiness IDs.
- `getPrivateView(gameState, playerId)` contains only the authorized player's secrets plus knowledge that the rules explicitly grant that player.

The public payload does not serialize the authoritative `players` records. This prevents accidental exposure of session tokens, factions, character identities, navigation hands, conversion eligibility, deck order, ritual order, conversion target, hidden gun amounts, and private debug events.

## Current private-knowledge rules

- An original Pirate sees the identities of the other original Pirates.
- A starting Cultist does not see the Cult Leader.
- The Cult Leader does not see a starting Cultist.
- A converted Cultist (`currentFaction` is Cultist and `originalFaction` is not) sees the Cult Leader.

## Socket boundary

A socket must present a room code and matching session token before either room view is emitted. Commands are closed during Milestone 0. Production logging must never print a full `GameState`.
