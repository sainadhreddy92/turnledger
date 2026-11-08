import test from "node:test";
import assert from "node:assert/strict";
import { ArchiveError, Ledger, RevisionConflict, decodeTurns, encodeTurns } from "../src/index.ts";

test("revisions are local to a conversation", () => {
  const ledger = new Ledger();
  ledger.append("a", [{ role: "user", text: "hi" }], 0);
  assert.equal(ledger.revision("b"), 0);
  assert.throws(() => ledger.append("a", [], 0), RevisionConflict);
  assert.deepEqual(ledger.read("a", 1).turns, []);
});

test("rejects an invalid batch atomically", () => {
  const ledger = new Ledger();
  assert.throws(() => ledger.append("a", [
    { role: "user", text: "accepted alone" },
    { role: "assistant", text: "oops", usage: { input: -1, output: 2 } },
  ]));
  assert.equal(ledger.revision("a"), 0);
});

test("ownership of usage counters is isolated", () => {
  const ledger = new Ledger();
  const usage = { input: 4, output: 2 };
  ledger.append("a", [{ role: "assistant", text: "yes", usage }]);
  usage.input = 20;
  const turn = ledger.read("a").turns[0];
  assert.deepEqual(turn.usage, { input: 4, output: 2 });
  assert.notEqual(turn.usage, ledger.read("a").turns[0].usage);
});

test("archives omit internal sequence and preserve user text", () => {
  const ledger = new Ledger();
  const draft = { role: "user", text: "café\nhello" } as const;
  ledger.append("a", [draft]);
  assert.deepEqual(decodeTurns(encodeTurns(ledger.read("a").turns)), [draft]);
});

test("malformed records report physical line numbers", () => {
  assert.throws(() => decodeTurns("\n\nnull"), (e: unknown) =>
    e instanceof ArchiveError && e.line === 3);
});
