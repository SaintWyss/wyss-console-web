import { getLaunch, runBefore } from '../../desktop/launch-client';
import {
  previewStart,
  readLauncher,
  startNative,
} from '../../desktop/native-client';
import { arsenalClient } from '../../desktop/arsenal-client';
import { isDefault } from '../arsenal/environment';
import type { LaunchDeps } from './launch';

/**
 * What a launch is opened with in this window: the desktop's functions, and the terminals and
 * tabs the caller shows the result in. Launch ▾ and Workspace both open a launch through it.
 */
export function desktopLaunchDeps(
  open: Pick<LaunchDeps, 'openTerminal' | 'openNative'>,
): LaunchDeps {
  return {
    getLaunch,
    runBefore,
    remembered: (project, agent) =>
      arsenalClient.projectSelection(project, agent).catch(() => null),
    selections: () => arsenalClient.selections(),
    ownerHome: async () =>
      (await readLauncher()).projects.find((p) => p.home)?.path ?? null,
    ownsHome: async (selection) =>
      !isDefault(await arsenalClient.environment(selection)),
    plan: (selection, agent, project) =>
      arsenalClient.terminalPlan(selection, agent, project),
    preview: (agent, profile, arsenal) => previewStart(agent, profile, arsenal),
    start: (agent, project, profile, preview, arsenal) =>
      startNative(
        agent,
        project,
        profile,
        { rows: 24, cols: 80 },
        null,
        preview,
        arsenal,
      ),
    bind: (session, selection, hash) =>
      arsenalClient.bindTerminal(session, selection, hash),
    ...open,
  };
}
