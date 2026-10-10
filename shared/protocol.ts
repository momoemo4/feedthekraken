import type { PrivateGameView, PublicGameView } from "./types";
import type { ClientGameCommand } from "./commands";

export interface ClientToServerEvents {
  "room:subscribe": (payload: { roomCode: string; sessionToken: string }) => void;
  "room:command": (payload: {
    roomCode: string;
    sessionToken: string;
    commandId: string;
    expectedStateVersion: number;
    command: ClientGameCommand;
  }) => void;
}

export interface ServerToClientEvents {
  "room:public": (view: PublicGameView) => void;
  "room:private": (view: PrivateGameView) => void;
  "room:error": (error: { code: string; message: string }) => void;
}
