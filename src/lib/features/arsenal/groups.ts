import { msg } from '../../i18n/msg';
/**
 * The basic categories, in screen order: five sections, then Other. Corrections stay local to a
 * machine. The owner can add categories of their own (`u_…`), placed in one of the sections.
 */
export const GROUPS = [
  'rules',
  'models',
  'research',
  'decide',
  'planning',
  'build',
  'design',
  'motion',
  'content',
  'docs',
  'review',
  'debug',
  'security',
  'system',
  'study',
  'integrations',
  'automations',
  'other',
] as const;
export type Group = (typeof GROUPS)[number];

/** Each category's name on screen. */
export const GROUP_LABEL: Record<Group, string> = {
  rules: msg('Rules'),
  models: msg('Models'),
  integrations: msg('Integrations'),
  automations: msg('Automations'),
  security: msg('Security'),
  debug: msg('Fixing bugs'),
  content: msg('Content and SEO'),
  motion: msg('Animation and video'),
  design: msg('Design and interface'),
  study: msg('Study and knowledge'),
  decide: msg('Decisions'),
  research: msg('Research'),
  review: msg('Review and testing'),
  docs: msg('Docs and writing'),
  planning: msg('Planning and method'),
  build: msg('Building'),
  system: msg('System and setup'),
  other: msg('Other'),
};

/** What each category is for, in one phrase. */
export const GROUP_HELP: Record<Group, string> = {
  rules: msg(
    'Rules the agent always follows: standing instructions read when every session starts.',
  ),
  models: msg(
    'Model profiles (astra, luna, sol) that choose which model and effort a task runs with.',
  ),
  integrations: msg(
    'MCP servers: connections to outside tools such as Notion, a browser or library docs.',
  ),
  automations: msg(
    'Hooks that run by themselves at moments of the session and are not about security.',
  ),
  security: msg(
    'Checks for security problems: audits, threat reviews and guards against dangerous commands.',
  ),
  debug: msg(
    'Finding why something fails: method to chase a bug down to its cause.',
  ),
  content: msg(
    'Writing for the web and social media, and search ranking (SEO).',
  ),
  motion: msg('Animation, 3D and video.'),
  design: msg(
    'Designing screens: visual direction, components, accessibility and turning a mockup into code.',
  ),
  study: msg(
    'Learning and notes: tutors, quizzes, second brain and saved links.',
  ),
  decide: msg(
    'Making a decision: arguing against an idea before you commit to it.',
  ),
  research: msg(
    'Looking things up: documentation, the web and mapping a codebase.',
  ),
  review: msg(
    'Checking work: code review, tests, verification and quality checks.',
  ),
  docs: msg(
    'Writing and converting documents: docs, reports, prompts and PDFs.',
  ),
  planning: msg(
    'Planning the work: specs, roadmaps, plans and the method that orders them.',
  ),
  build: msg(
    'Writing the code: executing plans, fixing findings and shipping.',
  ),
  system: msg(
    'This computer and the tools themselves: setup, health checks and upgrades.',
  ),
  other: msg(
    'What no rule placed. Use Move to group… to put it where it belongs.',
  ),
};
/** The five sections the categories are ordered in. Other goes last, outside them. */
export const SECTIONS = ['how', 'before', 'build', 'after', 'env'] as const;
export type Section = (typeof SECTIONS)[number];

/** Which section each basic category belongs to; `null` for Other. */
export const SECTION_OF: Record<Group, Section | null> = {
  rules: 'how',
  models: 'how',
  research: 'before',
  decide: 'before',
  planning: 'before',
  build: 'build',
  design: 'build',
  motion: 'build',
  content: 'build',
  docs: 'build',
  review: 'after',
  debug: 'after',
  security: 'after',
  system: 'env',
  study: 'env',
  integrations: 'env',
  automations: 'env',
  other: null,
};
export type Family = 'GSD' | 'gstack' | 'SEO' | 'HyperFrames' | null;

const rules: ReadonlyArray<readonly [Group, readonly string[]]> = [
  ['security', ['security', 'cso', 'guard', 'careful', 'freeze']],
  ['debug', ['debug', 'investigate']],
  ['content', ['content-strategy', 'social-media']],
  [
    'motion',
    [
      'gsap',
      'anime',
      'animation',
      'lottie',
      'three',
      'typegpu',
      'waapi',
      'hyperframes',
      'remotion',
      'contribute-catalog',
    ],
  ],
  [
    'design',
    [
      'design',
      '-ui',
      'ui-',
      'ux',
      'frontend',
      'tailwind',
      'shadcn',
      'accessibility',
      'image-to-code',
      'taste',
      'dashboard',
    ],
  ],
  ['study', ['tutor', 'quiz', 'cursos', 'second-brain', 'inbox', 'learn']],
  [
    'decide',
    ['devils-advocate', 'fool', 'junta', 'council', 'ceo-review', 'advisor'],
  ],
  [
    'research',
    [
      'research',
      'mapper',
      'graphify',
      'scrape',
      'discovery',
      'analyzer',
      'intel',
      'profiler',
    ],
  ],
  [
    'review',
    [
      'review',
      'verif',
      'checker',
      'auditor',
      'qa',
      'test',
      'eval',
      'health',
      'benchmark',
      'canary',
      'playwright',
    ],
  ],
  [
    'docs',
    [
      'doc-',
      'document',
      'markdown',
      'humanizer',
      'pdf',
      'prompt',
      'skill-creator',
      'skillify',
      'retro',
      'report',
    ],
  ],
  [
    'planning',
    [
      'plan',
      'roadmap',
      'spec',
      'office-hours',
      'framework-selector',
      'synthesizer',
      'curator',
    ],
  ],
  [
    'build',
    [
      'executor',
      'fixer',
      'ship',
      'deploy',
      'fastapi',
      'solid',
      'typescript',
      'react',
      'vite',
      'pair-agent',
    ],
  ],
  [
    'system',
    [
      'cachyos',
      'workstation',
      'doctor',
      'setup',
      'upgrade',
      'ios-',
      'context-',
      'sync-',
      'browser',
    ],
  ],
];

export function groupFor(
  item: { name: string; kind: string; description: string },
  correction?: string,
): string {
  if (correction !== undefined) {
    // Before 2026-11-12 rules and models shared one group; a rule moved there is a rule.
    if (correction === 'models' && item.kind === 'rule') return 'rules';
    return correction;
  }
  const name = item.name.toLowerCase();
  if (item.kind === 'rule') return 'rules';
  if (item.kind === 'agent' && /^(astra|luna|sol)_/.test(name)) return 'models';
  if (item.kind === 'mcp_server') return 'integrations';
  for (const [group, words] of rules) {
    if (group === 'content' && name.startsWith('seo-')) return group;
    if (
      group === 'planning' &&
      ['arsenal', 'combo', 'loops', 'orient'].includes(name)
    )
      return group;
    if (words.some((word) => name.includes(word))) return group;
    if (
      group === 'build' &&
      ['implement', 'build', 'scaffold'].some((word) =>
        item.description.toLowerCase().includes(word),
      )
    )
      return group;
  }
  if (item.kind === 'hook') return 'automations';
  if (item.kind === 'plugin') return 'system';
  return 'other';
}

/** The category a stored correction names, if this screen knows it; otherwise Other. */
export function knownGroup(group: string, custom: readonly string[]): string {
  return (GROUPS as readonly string[]).includes(group) || custom.includes(group)
    ? group
    : 'other';
}

export function familyFor(name: string): Family {
  const lower = name.toLowerCase();
  if (lower.startsWith('gsd-')) return 'GSD';
  if (lower.startsWith('gstack-')) return 'gstack';
  if (lower.startsWith('seo-')) return 'SEO';
  if (lower.startsWith('hyperframes')) return 'HyperFrames';
  return null;
}
