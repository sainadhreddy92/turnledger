export type Role = "user" | "assistant" | "system";

export interface Usage {
  readonly input: number;
  readonly output: number;
}

export interface Draft {
  readonly role: Role;
  readonly text: string;
  readonly usage?: Usage;
}

export interface Turn extends Draft {
  readonly sequence: number;
}

export interface Snapshot {
  readonly conversation: string;
  readonly revision: number;
  readonly turns: readonly Turn[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function tokenCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new TypeError("token count must be a nonnegative safe integer");
  }
  return value;
}

function readUsage(value: unknown): Usage {
  if (!isObject(value)) throw new TypeError("expected usage counters");
  return { input: tokenCount(value.input), output: tokenCount(value.output) };
}

export function readDraft(value: unknown): Draft {
  if (!isObject(value)) throw new TypeError("expected a turn object");
  const { role, text, usage } = value;
  if (role !== "user" && role !== "assistant" && role !== "system") {
    throw new TypeError("unknown turn role");
  }
  if (typeof text !== "string") throw new TypeError("turn text must be a string");
  if (usage === undefined) return { role, text };
  return { role, text, usage: readUsage(usage) };
}

export function copyTurn(turn: Turn): Turn {
  return { ...readDraft(turn), sequence: turn.sequence };
}
