import type { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "../../shared/protocol";
import type { GameState } from "../../shared/types";
import { getPrivateView } from "./privateViews";
import { getPublicView } from "./publicViews";

type GameSocketServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerSockets(io: GameSocketServer, loadRoom: (roomCode: string) => GameState | null): void {
  io.on("connection", (socket) => {
    socket.on("room:subscribe", ({ roomCode, sessionToken }) => {
      const state = loadRoom(roomCode);
      const player = state?.players.find((candidate) => candidate.sessionToken === sessionToken);
      if (!state || !player) {
        socket.emit("room:error", { code: "UNAUTHORIZED", message: "Room or session was not found." });
        return;
      }

      void socket.join(`room:${roomCode}`);
      socket.emit("room:public", getPublicView(state));
      socket.emit("room:private", getPrivateView(state, player.id));
    });

    socket.on("room:command", () => {
      socket.emit("room:error", {
        code: "MILESTONE_NOT_IMPLEMENTED",
        message: "Game commands begin in Milestone 2. The Milestone 0 boundary is intentionally closed.",
      });
    });
  });
}
