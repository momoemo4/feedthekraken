import { createServer } from "node:http";
import { resolve } from "node:path";
import express from "express";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "../shared/protocol";
import { longJourney } from "./data/maps/longJourney";
import { registerSockets } from "./network/sockets";
import { RoomRepository } from "./persistence/roomRepository";

const port = Number(process.env.PORT ?? 3001);
const databaseFile = process.env.DATABASE_FILE ?? resolve("data", "rooms.sqlite");
const repository = new RoomRepository(databaseFile);
const app = express();
const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: { origin: "http://localhost:5173" },
});

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.get("/api/health", (_request, response) => {
  response.json({ ok: true, milestone: 1, mapVerified: false });
});
app.get("/api/maps/long-journey", (_request, response) => {
  response.json(longJourney);
});

registerSockets(io, {
  loadRoom: (roomCode) => repository.findByCode(roomCode),
  saveRoom: (state) => repository.save(state),
});

const host = process.env.HOST ?? "127.0.0.1";

server.listen(port, host, () => {
  console.log(`Feed the Kraken server listening on http://${host}:${port}`);
});

const shutdown = () => {
  io.close();
  server.close(() => {
    repository.close();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
