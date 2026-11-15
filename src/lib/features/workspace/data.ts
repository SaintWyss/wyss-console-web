import type { Item, LibraryItem, Selection } from '../../contracts/arsenal';
import type { Launch } from '../../desktop/launch-client';
import type { LaunchInstructions } from '../../desktop/arsenal-client';
import {
  DEFAULT_SPEC,
  type CodexEnvironmentOptions,
  type CodexHomeSpec,
  type EnvironmentOptions,
  type HomeSpec,
} from '../arsenal/environment';
import { estimate, type Estimate } from './estimate';
import type { Agent } from './plan';

/** What the Workspace editor and the launch menu read to show a launch's estimate. */
export interface EstimateData {
  library: readonly LibraryItem[];
  selections: readonly Selection[];
  options: EnvironmentOptions | null;
  /** Environment by selection id; a preset not listed keeps the owner's own (default). */
  environments: ReadonlyMap<string, HomeSpec>;
  /** Codex: the hooks and instructions a launch can leave out; `null` when not read. */
  codexOptions: CodexEnvironmentOptions | null;
  /** Codex environment by selection id; a preset not listed keeps the owner's own. */
  codexEnvironments: ReadonlyMap<string, CodexHomeSpec>;
  /** Codex: the environments file is there and cannot be read; what presets leave out is unknown. */
  codexUnreadable?: boolean;
  /** Claude: the same for `environment.json`. */
  claudeUnreadable?: boolean;
  /** Claude presets whose environment could not be read, for any reason: nothing is known. */
  claudeFailed?: ReadonlySet<string>;
  launchInstructions?: ReadonlyMap<string, LaunchInstructions>;
  instructionsFailed?: ReadonlySet<string>;
}

/** Skills and agents of a provider in the library: what a launch without a preset loads. */
export function libraryItems(
  library: readonly LibraryItem[],
  agent: Agent,
): LibraryItem[] {
  return library.filter(
    (item) =>
      item.provider === agent &&
      (item.kind === 'skill' || item.kind === 'agent'),
  );
}

export function allItemsOf(
  library: readonly LibraryItem[],
  agent: Agent,
): Item[] {
  return libraryItems(library, agent).map((item) => ({
    capability: item.id,
    revision: null,
  }));
}

/** The preset a launch names, for its agent. */
export function selectionOf(
  launch: { agent: Agent; preset: string | null },
  selections: readonly Selection[],
): Selection | null {
  if (!launch.preset) return null;
  return (
    selections.find(
      (s) => s.provider === launch.agent && s.name === launch.preset,
    ) ?? null
  );
}

/** The estimate of what a Claude Code session starts with; `null` for Codex or a command launch. */
export function estimateOf(
  agent: Agent,
  items: readonly Item[],
  spec: HomeSpec | null,
  data: EstimateData,
): Estimate | null {
  if (agent !== 'claude_code' || !data.options) return null;
  const chosen = new Set(items.map((i) => i.capability));
  const of = (kind: string) =>
    libraryItems(data.library, agent)
      .filter((item) => item.kind === kind && chosen.has(item.id))
      .map((item) => ({ name: item.name, description: item.description }));
  return estimate({
    spec: spec ?? DEFAULT_SPEC,
    sizes: data.options.sizes,
    rules: data.options.rules,
    accountSkills: data.options.account_skills,
    plugins: data.options.plugins,
    skills: of('skill'),
    agents: of('agent'),
  });
}

export function estimateLaunch(
  launch: Launch,
  data: EstimateData,
): Estimate | null {
  if (launch.kind !== 'session') return null;
  const selection = selectionOf(launch, data.selections);
  const items = selection
    ? selection.items
    : allItemsOf(data.library, launch.agent);
  // An environment that could not be read is not estimated from the defaults.
  if (
    launch.agent === 'claude_code' &&
    selection &&
    data.claudeFailed?.has(selection.id)
  )
    return null;
  const spec = selection ? (data.environments.get(selection.id) ?? null) : null;
  return estimateOf(launch.agent, items, spec, data);
}

/** Reads what an estimate needs. Never throws: what cannot be read leaves no estimate. */
export async function loadEstimateData(client: {
  capabilities: () => Promise<LibraryItem[]>;
  selections: () => Promise<Selection[]>;
  environmentOptions: () => Promise<EnvironmentOptions>;
  environment: (selection: string) => Promise<HomeSpec>;
  /** Absent in a client that knows nothing of Codex environments: nothing is read then. */
  codexEnvironmentOptions?: () => Promise<CodexEnvironmentOptions>;
  codexEnvironment?: (selection: string) => Promise<CodexHomeSpec>;
  launchInstructions?: (selection: string) => Promise<LaunchInstructions>;
}): Promise<EstimateData> {
  const readCodexOptions = client.codexEnvironmentOptions;
  const readCodex = client.codexEnvironment;
  const [library, selections, options, codexOptions] = await Promise.all([
    client.capabilities().catch(() => []),
    client.selections().catch(() => []),
    client.environmentOptions().catch(() => null),
    readCodexOptions
      ? readCodexOptions().catch(() => null)
      : Promise.resolve(null),
  ]);
  const environments = new Map<string, HomeSpec>();
  let claudeUnreadable = false;
  const claudeFailed = new Set<string>();
  await Promise.all(
    selections
      .filter((s) => s.provider === 'claude_code')
      .map((s) =>
        client.environment(s.id).then(
          (spec) => environments.set(s.id, spec),
          (error: unknown) => {
            claudeFailed.add(s.id);
            if ((error as { code?: unknown }).code === 'environment_unreadable')
              claudeUnreadable = true;
          },
        ),
      ),
  );
  const codexEnvironments = new Map<string, CodexHomeSpec>();
  const launchInstructions = new Map<string, LaunchInstructions>();
  const instructionsFailed = new Set<string>();
  if (client.launchInstructions) {
    const read = client.launchInstructions;
    await Promise.all(
      selections.map((s) =>
        read(s.id).then(
          (choice) => launchInstructions.set(s.id, choice),
          () => instructionsFailed.add(s.id),
        ),
      ),
    );
  }
  let codexUnreadable = false;
  if (readCodex)
    await Promise.all(
      selections
        .filter((s) => s.provider === 'codex')
        .map((s) =>
          readCodex(s.id).then(
            (spec) => codexEnvironments.set(s.id, spec),
            (error: unknown) => {
              if (
                (error as { code?: unknown }).code === 'environment_unreadable'
              )
                codexUnreadable = true;
            },
          ),
        ),
    );
  return {
    library,
    selections,
    options,
    environments,
    codexOptions,
    codexEnvironments,
    codexUnreadable,
    claudeUnreadable,
    claudeFailed,
    launchInstructions,
    instructionsFailed,
  };
}

/** Nothing read yet: no estimate. */
export const NO_DATA: EstimateData = {
  library: [],
  selections: [],
  options: null,
  environments: new Map(),
  codexOptions: null,
  codexEnvironments: new Map(),
};
