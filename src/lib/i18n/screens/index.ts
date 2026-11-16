import * as shell from './shell';
import * as console_ from './console';
import * as workspace from './workspace';
import * as distributors from './distributors';
import * as arsenal from './arsenal';
import * as settings from './settings';
import * as activity from './activity';

const ALL = [
  shell,
  console_,
  workspace,
  distributors,
  arsenal,
  settings,
  activity,
];

/** Per-screen Spanish, merged last so a screen's correction wins over the shared dictionary. */
export const ES_SCREENS: Readonly<Record<string, string>> = Object.assign(
  {},
  ...ALL.map((s) => s.ES_SCREEN),
);
export const INCOMING_SCREENS: Readonly<Record<string, string>> = Object.assign(
  {},
  ...ALL.map((s) => s.INCOMING_SCREEN),
);
