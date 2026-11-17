import { msg } from '../i18n/msg';

export type ViewId =
  | 'console'
  | 'launches'
  | 'distributors'
  | 'sessions'
  | 'agents'
  | 'approvals'
  | 'events'
  | 'arsenal'
  | 'arsenal-presets'
  | 'configuration'
  | 'models'
  | 'credentials'
  | 'settings';

export interface NavItem {
  id: ViewId;
  label: string;
  /** What the view is for: its tooltip under More. */
  subtitle: string;
  /** SVG path data on a 24×24 grid, stroke-only. */
  icon: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: 'console',
    label: msg('Console'),
    subtitle: msg('Local terminal workspace'),
    icon: 'M4 7l4 4-4 4M11 16h7',
  },
  {
    id: 'sessions',
    label: msg('Sessions'),
    subtitle: msg('Managed agent sessions'),
    icon: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5',
  },
  {
    id: 'agents',
    label: msg('Agents'),
    subtitle: msg('Work with Codex in a session'),
    icon: 'M5 8h14v11H5zM12 4v4M9.5 13h.01M14.5 13h.01',
  },
  {
    id: 'approvals',
    label: msg('Approvals'),
    subtitle: msg('Actions waiting for a decision'),
    icon: 'M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6L12 3zM8.8 12.2l2.2 2.2 4.2-4.4',
  },
  {
    id: 'events',
    label: msg('Events'),
    subtitle: msg('What the authority recorded'),
    icon: 'M3 12h4l2.5-6 4 12 2.5-6H21',
  },
  {
    id: 'arsenal',
    label: msg('Arsenal'),
    subtitle: msg('Installed capabilities'),
    icon: 'M4 5h16v14H4zM8 9h8M8 13h8M8 17h5',
  },
  {
    id: 'arsenal-presets',
    label: msg('Arsenal presets'),
    subtitle: msg('The earlier Arsenal screen: presets by provider'),
    icon: 'M4 5h16v14H4zM8 9h8M8 13h8M8 17h5',
  },
  {
    id: 'credentials',
    label: msg('Credentials'),
    subtitle: msg('API keys, kept sealed'),
    icon: 'M15 8a4 4 0 1 0-3.5 4H20v3h-2v2h-3v-2h-3.5',
  },
  {
    id: 'settings',
    label: msg('Settings'),
    subtitle: msg('Preferences and about'),
    icon: 'M4 7h9M17 7h3M4 17h3M11 17h9M13 7a2 2 0 1 0 4 0 2 2 0 1 0-4 0M7 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0',
  },
];

/** The rail: six entries. Each opens a view of its own; Activity shows two, Personalization six as tabs. */
export type RailId =
  | 'console'
  | 'workspace'
  | 'personalization'
  | 'activity'
  | 'settings'
  | 'more';

export interface RailItem {
  id: RailId;
  label: string;
  icon: string;
  /** The view it opens; `more` opens a menu instead. */
  view: ViewId | 'activity' | null;
}

export const RAIL_ITEMS: readonly RailItem[] = [
  {
    id: 'console',
    label: msg('Console'),
    icon: 'M4 7l4 4-4 4M11 16h7',
    view: 'console',
  },
  {
    id: 'workspace',
    label: msg('Workspace'),
    icon: 'M4 6h16M4 12h16M4 18h16M8 4v4M15 10v4M10 16v4',
    view: 'launches',
  },
  {
    id: 'personalization',
    label: msg('Personalization'),
    // A palette: how the agents look and start is yours to set.
    icon: 'M12 3a9 9 0 1 0 0 18c.9 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.4-1.1-.3-.3-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.4-4-7.9-9-7.9zM7.5 11.5h.01M10 7.5h.01M14.5 7.5h.01M17 11h.01',
    // The tab last visited opens; Distributors the first time.
    view: 'distributors',
  },
  {
    id: 'activity',
    label: msg('Activity'),
    icon: 'M3 12h4l2.5-6 4 12 2.5-6H21',
    view: 'activity',
  },
  {
    id: 'settings',
    label: msg('Settings'),
    icon: 'M4 7h9M17 7h3M4 17h3M11 17h9M13 7a2 2 0 1 0 4 0 2 2 0 1 0-4 0M7 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0',
    view: 'settings',
  },
  {
    id: 'more',
    label: msg('More'),
    icon: 'M4.5 12a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0M10.5 12a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0M16.5 12a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0',
    view: null,
  },
];

/** What the window shows: a view of its own, or Activity (Approvals over Events). */
export type ShownView = ViewId | 'activity';

/**
 * Personalization: how the agents start, in one place. Each tab is a view of its own, by its own
 * id (so a saved landing page or a link to one still opens it), listed one under another.
 */
export interface PersonalizationTab {
  id: ViewId;
  label: string;
  /** What the tab is for, shown on hover. */
  hint: string;
  /** A 24×24 stroke path, drawn next to the label (alone when the column is folded). */
  icon: string;
}
export const PERSONALIZATION: readonly PersonalizationTab[] = [
  {
    id: 'distributors',
    label: msg('Distributors'),
    icon: 'M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10',
    hint: msg(
      'Which agents are installed and their version, and how to open and update them.',
    ),
  },
  {
    id: 'arsenal',
    label: msg('Arsenal'),
    icon: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5',
    hint: msg(
      'Skills, agents, MCP servers and presets: what a session can load.',
    ),
  },
  {
    id: 'credentials',
    label: msg('Credentials'),
    icon: 'M15 7a4 4 0 1 1-3.9 4.9L4 19v-3h3v-3h3l1.1-1.1A4 4 0 0 1 15 7zM16 9h.01',
    hint: msg('The API keys each distributor needs, kept sealed.'),
  },
];
export const inPersonalization = (shown: ShownView) =>
  PERSONALIZATION.some((tab) => tab.id === shown);

/** The rail entry that is lit for what is shown. A view only reachable from More lights More. */
export function railOf(shown: ShownView): RailId {
  if (inPersonalization(shown)) return 'personalization';
  return RAIL_ITEMS.find((r) => r.view === shown)?.id ?? 'more';
}

/** Views offered under More: every view of `NAV_ITEMS` that the rail does not open itself,
 * plus Approvals, Events and Settings, which keep their own page there. The
 * rail's Workspace opens the launch editor. */
export function moreItems(items: readonly NavItem[]): readonly NavItem[] {
  const own = new Set<ViewId>([
    'console',
    'launches',
    ...PERSONALIZATION.map((tab) => tab.id),
  ]);
  return items.filter((item) => !own.has(item.id));
}
