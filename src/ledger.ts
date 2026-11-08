import { copyTurn, readDraft } from "./model.ts";
import type { Draft, Snapshot, Turn } from "./model.ts";

export class RevisionConflict extends Error {
  readonly expected: number;
  readonly actual: number;

  constructor(expected: number, actual: number) {
    super(`expected revision ${expected}, found ${actual}`);
    this.name = "RevisionConflict";
    this.expected = expected;
    this.actual = actual;
  }
}

function checkConversation(conversation: string): void {
  if (typeof conversation !== "string" || !conversation.trim()) {
    throw new TypeError("conversation ID must be a nonempty string");
  }
}

function checkRevision(revision: number): void {
  if (!Number.isSafeInteger(revision) || revision < 0) {
    throw new RangeError("invalid revision");
  }
}

export class Ledger {
  readonly #histories = new Map<string, Turn[]>();

  revision(conversation: string): number {
    checkConversation(conversation);
    return this.#histories.get(conversation)?.length ?? 0;
  }

  read(conversation: string, after = 0): Snapshot {
    const revision = this.revision(conversation);
    checkRevision(after);
    if (after > revision) throw new RangeError("revision ahead of history");
    const history = this.#histories.get(conversation) ?? [];
    return { conversation, revision, turns: history.slice(after).map(copyTurn) };
  }

  append(conversation: string, drafts: readonly Draft[], expected?: number): number {
    const revision = this.revision(conversation);
    if (expected !== undefined) {
      checkRevision(expected);
      if (expected !== revision) throw new RevisionConflict(expected, revision);
    }
    const batch = drafts.map((draft, index) => ({
      ...readDraft(draft),
      sequence: revision + index + 1,
    }));
    if (batch.length > 0) {
      const history = this.#histories.get(conversation) ?? [];
      this.#histories.set(conversation, history.concat(batch));
    }
    return revision + batch.length;
  }
}
