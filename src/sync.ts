import { Ledger } from "./ledger.ts";
import { readDraft } from "./model.ts";
import type { Draft } from "./model.ts";

export interface RemotePage {
  readonly from: number;
  readonly turns: readonly Draft[];
  readonly more: boolean;
}

export type FetchPage = (conversation: string, from: number) => Promise<RemotePage>;

export interface SyncResult {
  readonly previous: number;
  readonly current: number;
  readonly pages: number;
}

/** Fetch a complete suffix and apply it to a local conversation. */
export async function syncHistory(
  ledger: Ledger,
  conversation: string,
  fetchPage: FetchPage,
): Promise<SyncResult> {
  const previous = ledger.revision(conversation);
  const pending: Draft[] = [];
  let pages = 0;
  while (true) {
    const from = previous + pending.length;
    const page = await fetchPage(conversation, from);
    if (page.from !== from) throw new Error("noncontiguous remote history");
    if (page.more && !page.turns.length) throw new Error("empty intermediate page");
    for (const draft of page.turns) pending.push(readDraft(draft));
    pages++;
    if (!page.more) break;
  }
  const current = ledger.append(conversation, pending, ledger.revision(conversation));
  return { previous, current, pages };
}
