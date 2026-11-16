import type {
  Availability,
  ErrorCode,
  SafetyProfile,
  SessionKind,
  SessionView,
} from '../../contracts/projects';
import { msg } from '../../i18n/msg';

export const SESSION_KIND: Record<SessionKind, string> = {
  native: msg('Agent'),
  shell: msg('Shell'),
  managed: msg('Managed'),
};

export const SESSION_AVAILABILITY: Record<Availability, string> = {
  live: msg('live'),
  ended: msg('ended'),
  unknown: msg('unknown'),
};

export const SESSION_STATE: Record<SessionView['state'], string> = {
  attached: msg('attached'),
  detached: msg('detached'),
  unavailable: msg('unavailable'),
  ambiguous: msg('ambiguous'),
};

export const SAFETY_PROFILE_LABEL: Readonly<Record<SafetyProfile, string>> = {
  inference: msg('inference'),
  local_tools: msg('local_tools'),
};

export const SESSION_REASON: Readonly<Record<string, string>> = {
  host_offline: msg('host offline'),
  host_changed: msg('host changed'),
  host_unsupported: msg('host unsupported'),
  owner_offline: msg('owner offline'),
  not_listed: msg('not listed'),
};

export const PROJECT_ERROR_CODE: Readonly<Record<ErrorCode, string>> = {
  unsupported_schema: msg('unsupported schema'),
  invalid_record: msg('invalid record'),
  capacity_exceeded: msg('capacity exceeded'),
  revision_conflict: msg('revision conflict'),
  context_stale: msg('context stale'),
  leaf_busy: msg('leaf busy'),
  root_missing: msg('root missing'),
  root_identity_changed: msg('root identity changed'),
  root_ineligible: msg('root ineligible'),
  host_offline: msg('host offline'),
  host_changed: msg('host changed'),
  unsupported_capability: msg('unsupported capability'),
  profile_unavailable: msg('profile unavailable'),
  owner_refused: msg('owner refused'),
  effect_ambiguous: msg('effect ambiguous'),
  io_failure: msg('io failure'),
};
