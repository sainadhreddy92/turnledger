import test from "node:test";
import assert from "node:assert/strict";
import { Ledger, RequestConflict, RevisionConflict } from "../src/index.ts";

const greeting = { role: "user", text: "hello" } as const;

test("returns the original receipt after unrelated writes", () => {
  const ledger = new Ledger();
  const first = ledger.appendOnce("a", "r1", [greeting]);
  ledger.append("a", [{ role: "assistant", text: "hi" }]);
  assert.equal(ledger.appendOnce("a", "r1", [{ ...greeting }]), first);
  assert.equal(ledger.read("a").turns.length, 2);
});

test("a request cannot be reused for another payload", () => {
  const ledger = new Ledger();
  ledger.appendOnce("a", "r1", [greeting]);
  assert.throws(() => ledger.appendOnce("a", "r1", []), RequestConflict);
  assert.equal(ledger.revision("a"), 1);
});

test("request identities are local to each conversation", () => {
  const ledger = new Ledger();
  ledger.appendOnce("a", "r1", [greeting], 0);
  assert.equal(ledger.appendOnce("b", "r1", [], 0), 0);
});

test("a rejected first attempt can be retried", () => {
  const ledger = new Ledger();
  assert.throws(() => ledger.appendOnce("a", "r1", [greeting], 5), RevisionConflict);
  assert.equal(ledger.appendOnce("a", "r1", [greeting], 0), 1);
});
