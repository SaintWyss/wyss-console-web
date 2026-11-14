import { invoke } from '@tauri-apps/api/core';

/** A distributor the owner added (Personalization › Distributors), as its file says. */
export interface AddedDistributor {
  id: string;
  name: string;
  maker: string | null;
  /** Typed in a new terminal to open the tool. */
  open: string;
  update: string | null;
  note: string | null;
  /** The command name looked for: the first word of `open`. */
  executable: string;
  /** Where it was found; null when it was not. Nothing is run to find out. */
  found: string | null;
}
export interface DistributorList {
  folder: string;
  distributors: AddedDistributor[];
  refused: { id: string; error: string }[];
  home: string;
}
export interface SaveDistributorInput {
  /** The file it replaces; null for a new one. */
  id: string | null;
  name: string;
  maker: string | null;
  open: string;
  update: string | null;
  note: string | null;
}

export class DistributorError extends Error {
  constructor(
    readonly code: string,
    readonly reasons: string[] = [],
  ) {
    super(reasons[0] ?? code);
  }
}

async function call<T>(command: string, args?: Record<string, unknown>) {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    const e = error as { code?: unknown; reasons?: unknown };
    throw new DistributorError(
      typeof e?.code === 'string' ? e.code : 'internal',
      Array.isArray(e?.reasons)
        ? e.reasons.filter((r): r is string => typeof r === 'string')
        : [],
    );
  }
}

export const distributorsClient = {
  /** The desktop's answer is checked: anything else is an error, never a half list. */
  list: async () => {
    const list = await call<DistributorList | null>('distributor_list');
    if (
      !list ||
      !Array.isArray(list.distributors) ||
      !Array.isArray(list.refused) ||
      typeof list.home !== 'string'
    )
      throw new DistributorError('invalid_reply');
    return list;
  },
  /** Read again from its file: what is opened or updated is never the window's copy. */
  get: (id: string) =>
    call<AddedDistributor>('distributor_get', { request: { id } }),
  save: (input: SaveDistributorInput) =>
    call<AddedDistributor>('distributor_save', { request: input }),
  remove: (id: string) => call<void>('distributor_delete', { request: { id } }),
  /** Makes a Workspace launch that opens it; the launch's id. */
  makeLaunch: (id: string) =>
    call<string>('distributor_make_launch', { request: { id } }),
};
export type DistributorsClient = typeof distributorsClient;
