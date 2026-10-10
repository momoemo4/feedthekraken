# Feed the Kraken Online — Engine, Map & Tabletop Prototype

Server-authoritative multiplayer foundation, Long Journey map-audit workbench and an interactive 11-seat assisted-tabletop prototype.

The current tabletop screen is a **functional UX/rules prototype**, not final production art. It intentionally exposes extra explanatory copy and Correction controls while the complete round flow is being validated. The production pass will replace most persistent labels with physical-looking icons, counters and contextual tooltips.

## Windows

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`. The API and Socket.IO server run on `http://localhost:3001`.

## Validation

```powershell
npm test
npm run build
```

The current repository contains a locally supplied Long Journey board image for private map-audit work only. It is not final game artwork and must be removed or replaced before any public release.

## Prototype design prompt

The reusable implementation/design brief is in [`docs/PROTOTYPE_PROMPT.md`](docs/PROTOTYPE_PROMPT.md).
