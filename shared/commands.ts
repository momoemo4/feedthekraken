import type { PlayerId } from "./types";

export type OfficerRole = "LIEUTENANT" | "NAVIGATOR";

export type ClientGameCommand =
  | { type: "ASSIGN_OFFICER"; role: OfficerRole; targetPlayerId: PlayerId }
  | { type: "CONFIRM_TEAM" }
  | { type: "SET_MUTINY_GUNS"; guns: number }
  | { type: "LOCK_MUTINY" }
  | { type: "REACTION_PASS" };

export type GameCommand = ClientGameCommand & {
  actorId: PlayerId;
  commandId: string;
  expectedStateVersion: number;
  receivedAt: string;
};

export class CommandValidationError extends Error {
  readonly code: string;

  constructor(code: string, message = code) {
    super(message);
    this.name = "CommandValidationError";
    this.code = code;
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new CommandValidationError("INVALID_COMMAND", "Command must be an object.");
  }
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 128) {
    throw new CommandValidationError("INVALID_COMMAND", `${field} must be a non-empty string.`);
  }
  return value;
}

export function parseClientCommand(value: unknown): ClientGameCommand {
  const input = record(value);
  const type = requiredString(input.type, "type");

  switch (type) {
    case "ASSIGN_OFFICER": {
      const role = requiredString(input.role, "role");
      if (role !== "LIEUTENANT" && role !== "NAVIGATOR") {
        throw new CommandValidationError("INVALID_COMMAND", "Unknown officer role.");
      }
      return { type, role, targetPlayerId: requiredString(input.targetPlayerId, "targetPlayerId") };
    }
    case "CONFIRM_TEAM":
      return { type };
    case "SET_MUTINY_GUNS":
      if (!Number.isSafeInteger(input.guns) || (input.guns as number) < 0) {
        throw new CommandValidationError("INVALID_COMMAND", "guns must be a non-negative integer.");
      }
      return { type, guns: input.guns as number };
    case "LOCK_MUTINY":
    case "REACTION_PASS":
      return { type };
    default:
      throw new CommandValidationError("UNKNOWN_COMMAND", `Unsupported command: ${type}`);
  }
}

