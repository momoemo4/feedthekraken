# Implementation Status

Status date: 2026-10-10. `TESTED` is added only after the command has actually passed.

| Subsystem | Status | Notes |
| --- | --- | --- |
| TypeScript workspace | IMPLEMENTED / TESTED | React/Vite client, Express/Socket.IO server, shared contracts; typecheck and production build passed. |
| Server-authoritative reducer boundary | IMPLEMENTED | Rejects stale versions; gameplay commands intentionally remain closed. |
| Secure and seeded RNG | IMPLEMENTED / TESTED | Cryptographic production RNG and deterministic test RNG. |
| Public/private selectors | IMPLEMENTED / TESTED | Explicit allowlist projections; hidden state is excluded from public output. |
| SQLite room persistence | IMPLEMENTED / TESTED | Versioned JSON snapshots behind a repository. No lobby writes yet. |
| Socket authorization shell | IMPLEMENTED | Session-token lookup before private view emission. |
| Long Journey flat-top renderer | IMPLEMENTED / TESTED | Axial-to-pixel formula and SVG polygons. |
| Reference-photo overlay | IMPLEMENTED | Supplied Long Journey photo is preloaded in the local audit build; replacements remain browser-local. |
| Hex audit editor/export | IMPLEMENTED | Edges, targets, action, region, notes, and per-cell audit state. |
| Official Long Journey topology | IMPLEMENTED / USER REVIEW | 31 cells, exits, actions, victory regions, and Supply Line crossings encoded from the supplied photo. H02/H05 remain banner-obscured. |
| Eight-player gameplay design simulator | IMPLEMENTED / TESTED | Deterministic 8-bot, 8-character harness with separate public/private logs. This is an audit tool, not the production reducer. |
| Movement engine | TODO | Deliberately not started before map review. |
| Lobby, setup, factions, characters | TODO | Milestone 2. |
| Full navigation/mutiny/actions/rituals | TODO | Milestones 3–8. |
| Character definitions | IMPLEMENTED / TESTED | Data-driven catalog for Characters 1–22 with separate immutable definitions and per-player runtime state. |
| Character ability resolvers | TODO | User-supplied rules are encoded, but server timing/target/resolve handlers are deliberately not marked implemented yet. |
| Navigation/Ritual card definitions | IMPLEMENTED / TESTED | Long Journey 23-card deck, Quick Journey 19-card deck, five Ritual cards, public/private prompt copy, and automatic/manual flags. |
| Player action/undo design | DESIGNED / TESTED DATA | Central prompt policies define draft, undo, close, lock, and information-reveal boundaries; React controls and reducer commands remain TODO. |
| 11-seat assisted tabletop prototype | IMPLEMENTED / LOCAL | Playable browser vertical slice for roles, Mutiny barriers, Navigation hands/Logbook, movement, card/Ritual phases, correction controls, and event history. Multiplayer server wiring remains TODO. |
| Prototype Navigation/Ritual art wiring | IMPLEMENTED / TESTED / LOCAL | Navigation face/back crops use atlas v3 in private hands, Logbook, reveal, deck and Deep Sea; Ritual face crops use atlas v3 for active/used cards. HTML owns labels/tooltips, and local seat switching hides private card faces from non-owners. |
| Quick Journey | TODO / UNVERIFIED | Requires a clear reference image. |

## Milestone boundary

This repository implements Milestone 0 and the audit tooling portion of Milestone 1. The map now contains 31 playable cells. Movement remains disabled until the user approves the two banner-obscured victory cells and the map-level flag is deliberately still false.

## Last validation

- `npm test`: 7 files, 25 tests passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- Browser flow QA: Captain/Lieutenant private hands, hidden non-owner views, shuffled Navigator Logbook, public reveal, active Ritual, used Ritual pile, and atlas crop loading verified.
- Local client: HTTP 200.
- Local API health: `{ "ok": true, "milestone": 1, "mapVerified": false }`.
- `npm run simulate:8p`: 9-round deterministic game completed; public-secret leak audit passed.
