import type { Server } from "socket.io";
import { CommandValidationError, parseClientCommand } from "../../shared/commands";
import type { ClientToServerEvents, ServerToClientEvents } from "../../shared/protocol";
import type { GameState } from "../../shared/types";
import { reduceGame } from "../engine/reducer";
import { secureRng, type Rng } from "../engine/rng";
import { getPrivateView } from "./privateViews";
import { getPublicView } from "./publicViews";

type GameSocketServer = Server<ClientToServerEvents, ServerToClientEvents>;

interface RoomStore {
  loadRoom(roomCode: string): GameState | null;
  saveRoom(state: GameState): void;
}

interface SocketBinding {
  roomCode: string;
  playerId: string;
}

export function registerSockets(io: GameSocketServer, store: RoomStore, rng: Rng = secureRng): void {
  const bindings = new Map<string, SocketBinding>();
  const roomQueues = new Map<string, Promise<void>>();

  const broadcastViews = (state: GameState) => {
    io.to(`room:${state.roomCode}`).emit("room:public", getPublicView(state));
    for (const connectedSocket of io.sockets.sockets.values()) {
      const binding = bindings.get(connectedSocket.id);
      if (binding?.roomCode === state.roomCode) {
        connectedSocket.emit("room:private", getPrivateView(state, binding.playerId));
      }
    }
  };

  const enqueueRoomCommand = (roomCode: string, task: () => void) => {
    const previous = roomQueues.get(roomCode) ?? Promise.resolve();
    const current = previous.then(task, task).finally(() => {
      if (roomQueues.get(roomCode) === current) roomQueues.delete(roomCode);
    });
    roomQueues.set(roomCode, current);
  };

  io.on("connection", (socket) => {
    socket.on("room:subscribe", async ({ roomCode, sessionToken }) => {
      const state = store.loadRoom(roomCode);
      const player = state?.players.find((candidate) => candidate.sessionToken === sessionToken);
      if (!state || !player) {
        socket.emit("room:error", { code: "UNAUTHORIZED", message: "Room or session was not found." });
        return;
      }

      await socket.join(`room:${roomCode}`);
      bindings.set(socket.id, { roomCode, playerId: player.id });
      socket.emit("room:public", getPublicView(state));
      socket.emit("room:private", getPrivateView(state, player.id));
    });

    socket.on("room:command", (payload) => {
      enqueueRoomCommand(payload.roomCode, () => {
        try {
          const state = store.loadRoom(payload.roomCode);
          const player = state?.players.find((candidate) => candidate.sessionToken === payload.sessionToken);
          if (!state || !player) throw new CommandValidationError("UNAUTHORIZED", "Room or session was not found.");

          const clientCommand = parseClientCommand(payload.command);
          const next = reduceGame(state, {
            ...clientCommand,
            actorId: player.id,
            commandId: payload.commandId,
            expectedStateVersion: payload.expectedStateVersion,
            receivedAt: new Date().toISOString(),
          }, rng);
          if (next !== state) store.saveRoom(next);
          broadcastViews(next);
        } catch (error) {
          const code = error instanceof CommandValidationError ? error.code : "COMMAND_FAILED";
          const message = error instanceof Error ? error.message : "Command failed.";
          socket.emit("room:error", { code, message });
        }
      });
    });

    socket.on("disconnect", () => {
      bindings.delete(socket.id);
    });
  });
}
