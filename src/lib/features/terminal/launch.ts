import {
  permissionProfileId,
  type AgentId,
  type Preview,
  type StartReply,
} from '../../contracts/native';
import type { Selection, TerminalPlan } from '../../contracts/arsenal';
import type { ArsenalStart } from '../../desktop/native-client';
import type { BeforeOutcome, Launch } from '../../desktop/launch-client';
import { msg } from '../../i18n/msg';
import { HOME_FOLDER_REFUSED } from '../native/present';

/** The part of an Arsenal selection a launch needs to find its preset. */
export type SelectionName = Pick<Selection, 'id' | 'name' | 'provider'>;

/** What opening a launch needs; the desktop's functions in the window, fakes in tests. */
export interface LaunchDeps {
  getLaunch(id: string): Promise<Launch>;
  runBefore(id: string): Promise<BeforeOutcome[]>;
  /** The Arsenal selections of every provider; a launch finds its preset among them by name. */
  selections(): Promise<SelectionName[]>;
  /** The Arsenal selection the folder's last terminal of this agent started with. */
  remembered(project: string, agent: AgentId): Promise<string | null>;
  plan(
    selection: string,
    agent: AgentId,
    project: string,
  ): Promise<TerminalPlan>;
  /** `profile` is the fixed template the launch's permission is sent as. */
  preview(
    agent: AgentId,
    profile: string | null,
    arsenal: ArsenalStart | null,
  ): Promise<Preview>;
  start(
    agent: AgentId,
    project: string,
    profile: string | null,
    preview: Pick<Preview, 'plan_token' | 'provider_version'> | null,
    arsenal: ArsenalStart | null,
  ): Promise<StartReply>;
  bind(
    session: string,
    selection: string,
    configHash: string,
  ): Promise<{ state: 'applied' | 'not_applied'; selection_name: string }>;
  /** The owner's home folder as the desktop lists it; null or absent when it is not known. */
  ownerHome?(): Promise<string | null>;
  /** Whether a Claude Code preset gives the launch a folder of its own. */
  ownsHome?(selection: string): Promise<boolean>;
  /** A new tab in `cwd` titled `title`, with `input` typed once its shell runs. */
  openTerminal(title: string, cwd: string, input: string): void;
  /** A tab for the agent the desktop started. */
  openNative(reply: StartReply): void;
}

/** Said wherever a Codex preset's environment cannot be read. */
export const ENVIRONMENT_UNREADABLE = msg(
  'The file of Codex launch environments (environment-codex.json) cannot be read, so what a preset leaves out is not known. Launches with a Codex preset do not start until the file is fixed or removed. It was not changed.',
);

export interface LaunchNote {
  text: string;
  values?: Record<string, string | number>;
}

/**
 * A launch that cannot start: the window's own sentence and its values, so the view can draw it
 * through t() in the language in force. The message is the English sentence with the values in.
 */
export class LaunchRefusal extends Error {
  constructor(
    readonly template: string,
    readonly values: Record<string, string> = {},
  ) {
    super(
      Object.entries(values).reduce(
        (text, [name, value]) => text.replace(`{${name}}`, value),
        template,
      ),
    );
  }
}

export interface Opened {
  /** Said to the owner after opening: a `before` command that did not succeed, for instance. */
  notes: LaunchNote[];
}

/** Whether a session launch gives full access: the permission its file names. */
export function isFullAccess(launch: Launch): boolean {
  return launch.kind === 'session' && launch.permission === 'bypass';
}

/** The selections of a provider named like a launch's preset: exactly one, none, or several. */
export type PresetMatch =
  { state: 'one'; id: string } | { state: 'none' } | { state: 'several' };

export function presetMatch(
  selections: readonly SelectionName[],
  name: string,
  agent: AgentId,
): PresetMatch {
  const named = selections.filter(
    (s) => s.name === name && s.provider === agent,
  );
  if (named.length === 0) return { state: 'none' };
  if (named.length > 1) return { state: 'several' };
  return { state: 'one', id: named[0].id };
}

/**
 * Why a launch cannot start, from what the desktop holds: a commands launch always can; a session
 * launch needs its preset to name exactly one selection of its agent. The reason is a sentence the view draws through t(); null when the launch may start.
 */
export function launchBlock(
  launch: Launch,
  selections: readonly SelectionName[],
): LaunchRefusal | null {
  if (launch.kind !== 'session') return null;
  if (launch.preset) {
    const match = presetMatch(selections, launch.preset, launch.agent);
    if (match.state === 'none')
      return new LaunchRefusal(
        msg(
          'No preset named “{name}” for this agent. Create it in Arsenal, or change the launch file.',
        ),
        { name: launch.preset },
      );
    if (match.state === 'several')
      return new LaunchRefusal(
        msg(
          'More than one preset is named “{name}” for this agent. Delete the extra ones in Arsenal, then start again.',
        ),
        { name: launch.preset },
      );
  }
  return null;
}

/**
 * Whether an applied plan gives the launch a folder of its own and `directory` is the owner's
 * home. What cannot be read counts as no: the host checks again and has the last word.
 */
async function ownFolderInHome(
  plan: TerminalPlan,
  agent: AgentId,
  directory: string,
  deps: LaunchDeps,
): Promise<boolean> {
  const home = await deps.ownerHome?.().catch(() => null);
  if (!home || directory !== home) return false;
  if (plan.codex_environment) return true;
  if (agent !== 'claude_code') return false;
  return (await deps.ownsHome?.(plan.selection).catch(() => false)) ?? false;
}

/**
 * Opens a launch by its id: re-read from its file, then a terminal with its commands typed, or
 * its `before` commands run and its agent started with the permission it names and the Arsenal
 * selection its folder remembers, exactly as a start from the Agents view.
 */
export async function openLaunch(
  id: string,
  deps: LaunchDeps,
): Promise<Opened> {
  const launch = await deps.getLaunch(id);
  if (launch.kind === 'commands') {
    if (launch.commands.length === 0)
      throw new LaunchRefusal(
        msg(
          'This launch has no commands for this distribution. Add one in Workspace.',
        ),
      );
    deps.openTerminal(
      launch.name,
      launch.directory,
      launch.commands.map((c) => `${c}\r`).join(''),
    );
    return { notes: [] };
  }
  const { agent, directory } = launch;
  // A preset the desktop does not hold, or a preset name held twice, stops the launch before
  // anything runs, with the reason.
  const selections = launch.preset ? await deps.selections() : [];
  const refusal = launchBlock(launch, selections);
  if (refusal) throw refusal;
  const profileId = permissionProfileId(launch.permission);
  // The preset the launch names wins over the one its folder remembers.
  let selection: string | null;
  if (launch.preset) {
    const match = presetMatch(selections, launch.preset, agent);
    selection = match.state === 'one' ? match.id : null;
  } else {
    selection = await deps.remembered(directory, agent);
  }
  // The selection is planned before anything runs, so a plan that fails stops the launch whole.
  const plan = selection
    ? await deps.plan(selection, agent, directory).catch((error: unknown) => {
        // What the preset leaves out cannot be told: nothing starts, and the owner reads why.
        const code = (error as { code?: unknown }).code;
        if (code === 'environment_unreadable')
          throw new LaunchRefusal(ENVIRONMENT_UNREADABLE);
        if (code === 'environment_stale')
          throw new LaunchRefusal(
            msg(
              'The launch “{name}” leaves out a hook that is no longer in hooks.json: it was edited or removed. Nothing was started. Open the launch in Workspace, check its hooks and save.',
            ),
            { name: launch.name },
          );
        throw error;
      })
    : null;
  const arsenal: ArsenalStart | null = plan
    ? {
        selection: plan.selection,
        config_hash: plan.config_hash,
        project: directory,
      }
    : null;
  const apply = !!plan?.can_apply;
  // A preset that leaves a Codex hook or AGENTS.md out starts with that applied or not at all:
  // started without it, the hook the owner switched off would run.
  if (plan?.codex_environment && !apply)
    throw new LaunchRefusal(
      msg(
        'The preset “{name}” leaves a Codex hook or AGENTS.md out, and it cannot be applied now: {reason} Nothing was started.',
      ),
      { name: plan.selection_name, reason: plan.enforcement.reason },
    );
  // A launch with a folder of its own never starts in the owner's home, where the agent would
  // read the owner's configuration again as the project's. Said before any `before` command runs;
  // what the window cannot tell (another name of the same folder) the host refuses.
  if (apply && plan && (await ownFolderInHome(plan, agent, directory, deps)))
    throw new LaunchRefusal(HOME_FOLDER_REFUSED);
  const notes: LaunchNote[] = (await deps.runBefore(launch.id))
    .filter((o) => o.result !== 'ok')
    .map((o) => ({
      text: msg(
        'A command before the start did not succeed ({result}); the agent started anyway.',
      ),
      values: { result: o.result },
    }));
  const preview = await deps.preview(agent, profileId, apply ? arsenal : null);
  if (apply && !preview.can_start)
    throw new Error(
      `The Arsenal selection ${plan!.selection_name} cannot be applied with this permission now; start it from Agents to choose.`,
    );
  const reply = await deps
    .start(agent, directory, profileId, preview, apply ? arsenal : null)
    .catch((error: unknown) => {
      // The host's own refusal of the same thing, in the same words.
      const failure = (error as { failure?: { code?: unknown } }).failure;
      if (failure?.code === 'arsenal_home_cwd_is_home')
        throw new LaunchRefusal(HOME_FOLDER_REFUSED);
      throw error;
    });
  deps.openNative(reply);
  if (plan) {
    try {
      const binding = await deps.bind(
        reply.session.id,
        plan.selection,
        plan.config_hash,
      );
      notes.push(
        binding.state === 'applied'
          ? {
              text: msg('Started with {selection} applied.'),
              values: { selection: binding.selection_name },
            }
          : {
              text: msg(
                'Started without applying {selection}; the selection is recorded.',
              ),
              values: { selection: binding.selection_name },
            },
      );
    } catch {
      notes.push({
        text: msg(
          'The terminal started, but Arsenal could not record its selection.',
        ),
      });
    }
  }
  return { notes };
}
