import type { AgentId, Launcher } from '../../contracts/native';
import { msg, type Phrase } from '../../i18n/msg';
import { AGENT_LABEL } from '../native/present';

/**
 * Who makes each tool the Console knows and starts. Any other tool is added by the owner
 * (Personalization › Distributors › Add), with the commands that open and update it.
 */
export const DISTRIBUTORS = [
  { id: 'anthropic', name: 'Anthropic', agent: 'claude_code' },
  { id: 'openai', name: 'OpenAI', agent: 'codex' },
  { id: 'opencode', name: 'OpenCode', agent: 'opencode' },
] as const satisfies readonly {
  id: string;
  name: string;
  agent: AgentId;
}[];

/**
 * The command that updates each known tool, typed in a terminal where it is seen. Only the ones
 * checked against the tool's own help: OpenCode's is not, so it has no Update.
 */
export const UPDATE_COMMAND: Partial<Record<AgentId, string>> = {
  claude_code: 'claude update',
  codex: 'codex update',
};

/**
 * Tools suggested under Add: their name and the command that opens them, nothing else. The
 * update command is the owner's to write: it depends on how the tool was installed.
 */
export const SUGGESTED = [
  { name: 'Kimi CLI', maker: 'Moonshot AI', open: 'kimi' },
  { name: 'Gemini CLI', maker: 'Google', open: 'gemini' },
  { name: 'Aider', maker: 'Aider', open: 'aider' },
] as const;

/** The distributor of an agent, by name; the agent's own name when it has none here. */
export function distributorOf(agent: AgentId): string {
  return (
    DISTRIBUTORS.find((d) => d.agent === agent)?.name ?? AGENT_LABEL[agent]
  );
}

export interface DistributorCard {
  id: (typeof DISTRIBUTORS)[number]['id'];
  name: string;
  status: Phrase;
  /** Only an installed tool is drawn in the ok tone. */
  installed: boolean;
  tool: string;
  agent: AgentId;
  /** Typed in a new terminal by Update; null when the Console has none checked for the tool. */
  update: string | null;
}

/** The version number a tool reported (`2.1.325 (Claude Code)`, `codex-cli 0.169.0`); as it came when it has none. */
export function versionNumber(raw: string): string {
  return /\d+\.\d+(?:\.\d+)?(?:[-+][\w.]+)?/.exec(raw)?.[0] ?? raw.trim();
}

/** Installed or not as `native_launcher` answered; unknown when it did not, or did not name it. */
function statusOf(
  launcher: Launcher | null,
  agent: AgentId,
): { status: Phrase; installed: boolean } {
  const entry = launcher?.agents.find((a) => a.agent_id === agent);
  if (!entry) return { status: { text: msg('Unknown') }, installed: false };
  if (!entry.installed)
    return { status: { text: msg('Tool not installed') }, installed: false };
  return {
    status: entry.version
      ? { text: '{version}', values: { version: versionNumber(entry.version) } }
      : { text: msg('Installed') },
    installed: true,
  };
}

/**
 * The three known tools. Every status is one the desktop answered: `launcher` is null when
 * `native_launcher` did not answer, and then nothing is said to be installed or missing.
 */
export function distributorCards(launcher: Launcher | null): DistributorCard[] {
  return DISTRIBUTORS.map((d): DistributorCard => {
    return {
      id: d.id,
      name: d.name,
      ...statusOf(launcher, d.agent),
      tool: AGENT_LABEL[d.agent],
      agent: d.agent,
      update: UPDATE_COMMAND[d.agent] ?? null,
    };
  });
}
