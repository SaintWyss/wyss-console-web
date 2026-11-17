import { getContext, setContext } from 'svelte';
import type { PlanItem } from '../../contracts/arsenal';
import type { Roles } from '../../desktop/arsenal-client';
import type { EstimateData } from './data';
import type { Estimate } from './estimate';
import type { Agent, LaunchDraft } from './plan';

/** What every Workspace tab reads and changes: one object, no prop chains. */
export interface WorkspaceContext {
  readonly draft: LaunchDraft;
  readonly data: EstimateData;
  readonly busy: boolean;
  readonly itemPlan: readonly PlanItem[];
  readonly itemPlanState: 'loading' | 'ready' | 'failed';
  readonly estimate: Estimate | null;
  readonly roles: Roles;
  readonly allRoles: readonly { id: string; name: string; basic: boolean }[];
  readonly saved: readonly string[];
  readonly used: readonly { path: string }[];
  setAgent(agent: Agent): void;
  setItem(id: string, on: boolean): void;
  browse(): Promise<void>;
  addRole(name: string): Promise<void>;
  removeRole(id: string): Promise<void>;
  reload(): Promise<void>;
}

const KEY = Symbol('workspace');

export const provideWorkspace = (context: WorkspaceContext) =>
  setContext(KEY, context);
export const workspace = () => getContext<WorkspaceContext>(KEY);
