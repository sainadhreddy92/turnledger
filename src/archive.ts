import { readDraft } from "./model.ts";
import type { Draft } from "./model.ts";

export class ArchiveError extends Error {
  readonly line: number;

  constructor(line: number, cause: unknown) {
    super(`Invalid turn on line ${line}`, { cause });
    this.name = "ArchiveError";
    this.line = line;
  }
}

export function decodeLine(source: string, line: number): Draft | undefined {
  if (!source.trim()) return undefined;
  try {
    return readDraft(JSON.parse(source));
  } catch (cause) {
    throw new ArchiveError(line, cause);
  }
}

export function decodeTurns(archive: string): Draft[] {
  const turns: Draft[] = [];
  for (const [index, source] of archive.split("\n").entries()) {
    const turn = decodeLine(source, index + 1);
    if (turn) turns.push(turn);
  }
  return turns;
}

export function encodeTurns(turns: Iterable<Draft>): string {
  const lines = Array.from(turns, turn => JSON.stringify(readDraft(turn)));
  return lines.length ? lines.join("\n") + "\n" : "";
}
