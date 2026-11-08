# Turnledger

Turnledger is an in-memory journal for applications that record conversations. It orders turns within each conversation, tracks model usage, and supports optimistic concurrency when multiple callers edit the same history.

## Run locally

Use Node.js 24 or newer. The checkout runs TypeScript directly without a build step or external runtime dependencies. Run `npm test` for the test suite.

## Append and read turns

```ts
import { Ledger } from "./src/index.ts";

const ledger = new Ledger();
ledger.append("chat-17", [
  { role: "user", text: "Where is my order?" },
  { role: "assistant", text: "In transit.", usage: { input: 12, output: 3 } }
], 0);

const view = ledger.read("chat-17");
console.log(view.revision);       // 2
console.log(view.turns[1].text);  // In transit.
```

Revisions start at zero. Each appended turn advances the revision by one. Pass the revision you observed as the final argument to append. A stale writer receives a RevisionConflict. A failed batch leaves the conversation as it was.

## Exchange histories

Use `encodeTurns` and `decodeTurns` to exchange newline-delimited JSON records. Archives contain portable turn data. Importing into a new conversation assigns fresh sequence numbers. Archives preserve arbitrary Unicode text and embedded line breaks.

## Source layout

- `src/model.ts` validates and copies public input.
- `src/ledger.ts` owns ordering, revisions, and snapshots.
- `src/archive.ts` implements the portable text format.
- `src/index.ts` exposes the public API.
