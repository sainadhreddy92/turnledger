import type { Role, Snapshot, Usage } from "./model.ts";

export interface RoleUsage extends Usage {
  readonly turns: number;
  readonly metered: number;
}

export interface UsageSummary {
  readonly revision: number;
  readonly totals: RoleUsage;
  readonly byRole: Readonly<Record<Role, RoleUsage>>;
}

function empty(): RoleUsage {
  return { turns: 0, metered: 0, input: 0, output: 0 };
}

function add(current: RoleUsage, usage?: Usage): RoleUsage {
  const input = current.input + (usage?.input ?? 0);
  const output = current.output + (usage?.output ?? 0);
  if (!Number.isSafeInteger(input) || !Number.isSafeInteger(output)) {
    throw new RangeError("usage exceeds safe integer range");
  }
  return {
    turns: current.turns + 1,
    metered: current.metered + (usage === undefined ? 0 : 1),
    input,
    output,
  };
}

export function summarizeUsage(snapshot: Snapshot): UsageSummary {
  const byRole = { assistant: empty(), user: empty(), system: empty() };
  let totals = empty();
  for (const turn of snapshot.turns) {
    totals = add(totals, turn.usage);
    byRole[turn.role] = add(byRole[turn.role], turn.usage);
  }
  return { revision: snapshot.revision, totals, byRole };
}
