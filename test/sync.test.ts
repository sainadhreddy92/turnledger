import test from "node:test";
import assert from "node:assert/strict";
import { Ledger, syncHistory } from "../src/index.ts";

test("fetches the suffix following an existing turn", async () => {
  const ledger = new Ledger();
  ledger.append("a", [{ role: "system", text: "ready" }]);
  const offsets: number[] = [];
  const result = await syncHistory(ledger, "a", async (_, from) => {
    offsets.push(from);
    return { from, turns: [{ role: "user", text: String(from) }], more: from < 2 };
  });
  assert.deepEqual(offsets, [1, 2]);
  assert.deepEqual(result, { previous: 1, current: 3, pages: 2 });
});

test("a late fetch failure leaves the ledger intact", async () => {
  const ledger = new Ledger();
  await assert.rejects(syncHistory(ledger, "a", async (_, from) => {
    if (from) throw new Error("connection lost");
    return { from, turns: [{ role: "user", text: "start" }], more: true };
  }), /connection lost/);
  assert.equal(ledger.revision("a"), 0);
});

test("rejects stalled remote cursors", async () => {
  await assert.rejects(syncHistory(new Ledger(), "a", async () => ({
    from: 0, turns: [], more: true,
  })), /empty intermediate/);
});
