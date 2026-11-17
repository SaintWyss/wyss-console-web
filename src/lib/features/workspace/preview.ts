import type { Item, PlanItem } from '../../contracts/arsenal';
import type { ArsenalClient } from '../../desktop/arsenal-client';
import type { Agent } from './plan';

/** Only item availability can be combined: each batch has its own exclusions and conflicts. */
export async function previewItems(
  client: Pick<ArsenalClient, 'terminalPlan'>,
  agent: Agent,
  directory: string,
  items: Item[],
): Promise<PlanItem[]> {
  const result: PlanItem[] = [];
  // An empty library must still check the provider and project.
  for (let start = 0; start < Math.max(1, items.length); start += 512) {
    const plan = await client.terminalPlan(
      '',
      agent,
      directory,
      items.slice(start, start + 512),
    );
    result.push(...plan.items);
  }
  return result;
}
