import { expect, it } from 'vitest';
import type { Plan } from '../src/lib/contracts/configuration';
import { ChangesController } from '../src/lib/features/configuration/changes-controller';
import { ConfigurationCallError } from '../src/lib/desktop/configuration-client';
import { FakeChanges, fixture } from './configuration-changes-harness';

function deferred() {
  let resolve!: (plan: Plan) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<Plan>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const settle = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

it.each(['draft', 'author', 'undo'] as const)(
  'cancels a pending %s without allowing its reply to replace the next plan',
  async (method) => {
    const pending = deferred();
    const client = new FakeChanges().client();
    const controller = new ChangesController(
      () => undefined,
      () => undefined,
      { ...client, plan: () => pending.promise, undo: () => pending.promise },
    );
    try {
      if (method === 'draft') controller.draft('park_hook', 'old');
      else if (method === 'undo') controller.undo('old');
      else controller.author(() => pending.promise);
      controller.cancel();
      expect(controller.state().planning).toBe(false);
      const next = { ...fixture.parkPlan(), id: 'b'.repeat(32) };
      controller.author(async () => next);
      await settle();
      expect(controller.state().plan?.id).toBe(next.id);
      pending.resolve(fixture.parkPlan());
      await settle();
      expect(controller.state().plan?.id).toBe(next.id);
    } finally {
      controller.dispose();
    }
  },
);

it.each(['draft', 'author', 'undo'] as const)(
  'ignores a cancelled %s failure after a newer request',
  async (method) => {
    const pending = deferred();
    const client = new FakeChanges().client();
    const controller = new ChangesController(
      () => undefined,
      () => undefined,
      { ...client, plan: () => pending.promise, undo: () => pending.promise },
    );
    try {
      if (method === 'draft') controller.draft('park_hook', 'old');
      else if (method === 'undo') controller.undo('old');
      else controller.author(() => pending.promise);
      controller.cancel();
      controller.author(async () => fixture.parkPlan());
      await settle();
      pending.reject(new ConfigurationCallError('internal'));
      await settle();
      expect(controller.state().failure).toBeNull();
      expect(controller.state().plan).not.toBeNull();
    } finally {
      controller.dispose();
    }
  },
);

it('clears a failed record read when retrying it', async () => {
  const fake = new FakeChanges();
  fake.failNext = 'internal';
  const controller = new ChangesController(
    () => undefined,
    () => undefined,
    fake.client(),
  );
  try {
    controller.loadRecords();
    await settle();
    expect(controller.state().failure).toBe('internal');
    controller.loadRecords();
    expect(controller.state().failure).toBeNull();
    await settle();
    expect(controller.state().records).not.toBeNull();
  } finally {
    controller.dispose();
  }
});
