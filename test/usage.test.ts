import test from "node:test";
import assert from "node:assert/strict";
import { Ledger, summarizeUsage } from "../src/index.ts";

test("counts unmetered and zero-token turns separately in a suffix", () => {
  const ledger = new Ledger();
  ledger.append("a", [
    { role: "system", text: "setup", usage: { input: 10, output: 0 } },
    { role: "user", text: "hi" },
    { role: "assistant", text: "", usage: { input: 0, output: 0 } },
    { role: "assistant", text: "hey", usage: { input: 3, output: 1 } },
  ]);
  const result = summarizeUsage(ledger.read("a", 1));
  assert.equal(result.revision, 4);
  assert.deepEqual(result.totals, { turns: 3, metered: 2, input: 3, output: 1 });
  assert.equal(result.byRole.assistant.turns, 2);
  assert.equal(result.byRole.system.turns, 0);
});

test("rejects a total that exceeds safe integer precision", () => {
  const ledger = new Ledger();
  for (const input of [Number.MAX_SAFE_INTEGER, 1]) {
    ledger.append("a", [{ role: "user", text: "", usage: { input, output: 0 } }]);
  }
  assert.throws(() => summarizeUsage(ledger.read("a")), RangeError);
});
