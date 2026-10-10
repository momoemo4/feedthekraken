import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { GameState } from "../../shared/types";

export class RoomRepository {
  readonly #database: DatabaseSync;

  constructor(filename: string) {
    if (filename !== ":memory:") mkdirSync(dirname(filename), { recursive: true });
    this.#database = new DatabaseSync(filename);
    this.#database.exec(`
      CREATE TABLE IF NOT EXISTS rooms (
        room_id TEXT PRIMARY KEY,
        room_code TEXT NOT NULL UNIQUE,
        state_version INTEGER NOT NULL,
        state_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;
    `);
    this.#database.exec("PRAGMA optimize");
  }

  save(state: GameState): void {
    this.#database
      .prepare(`
        INSERT INTO rooms (room_id, room_code, state_version, state_json, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(room_id) DO UPDATE SET
          room_code = excluded.room_code,
          state_version = excluded.state_version,
          state_json = excluded.state_json,
          updated_at = excluded.updated_at
        WHERE excluded.state_version >= rooms.state_version
      `)
      .run(state.roomId, state.roomCode, state.stateVersion, JSON.stringify(state), new Date().toISOString());
  }

  findByCode(roomCode: string): GameState | null {
    const row = this.#database
      .prepare("SELECT state_json FROM rooms WHERE room_code = ?")
      .get(roomCode) as { state_json: string } | undefined;
    return row ? (JSON.parse(row.state_json) as GameState) : null;
  }

  close(): void {
    this.#database.close();
  }
}
