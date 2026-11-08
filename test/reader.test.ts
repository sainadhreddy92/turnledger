import test from "node:test";
import assert from "node:assert/strict";
import { ArchiveError, readArchive } from "../src/index.ts";

async function* chunks(parts: string[]) {
  for (const part of parts) yield new TextEncoder().encode(part);
}

test("records spanning chunks and trailing records are emitted", async () => {
  const parts = ['{"role":"user",', '"text":"hello"}\n\n{"role":"system"', ',"text":"init"}'];
  const result = await Array.fromAsync(readArchive(chunks(parts)));
  assert.deepEqual(result.map(turn => turn.text), ["hello", "init"]);
});

test("a complete record is visible before the source ends", async () => {
  async function* input() {
    yield new TextEncoder().encode('{"role":"user","text":"hi"}\n');
    throw new Error("source failed");
  }
  const reader = readArchive(input());
  assert.equal((await reader.next()).value?.text, "hi");
  await assert.rejects(reader.next(), /source failed/);
});

test("line numbers include blank lines", async () => {
  const input = chunks(["\r\n", "false\n"]);
  await assert.rejects(Array.fromAsync(readArchive(input)), (err: unknown) =>
    err instanceof ArchiveError && err.line === 2);
});
