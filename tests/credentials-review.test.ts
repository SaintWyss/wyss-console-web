import { afterEach, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import {
  CredentialsController,
  type CredentialsClient,
} from '../src/lib/features/credentials/controller';
import { CredentialCallError } from '../src/lib/desktop/credentials-client';
import CredentialsView from '../src/lib/features/credentials/CredentialsView.svelte';
import Harness from './CredentialsReviewHarness.svelte';
import { setLanguage } from '../src/lib/i18n/index.svelte';
import type {
  Credential,
  CredentialFailure,
} from '../src/lib/contracts/api-keys';

const item: Credential = {
  id: 'a'.repeat(32),
  name: 'Work',
  provider: 'anthropic',
  fingerprint: 'abcdef012345',
  created_at: 1_700_000_000,
  updated_at: 1_700_000_000,
};
const client = (over: Partial<CredentialsClient> = {}): CredentialsClient => ({
  list: vi.fn(async () => [item]),
  add: vi.fn(async () => item),
  replace: vi.fn(async () => item),
  rename: vi.fn(async () => item),
  remove: vi.fn(async () => true),
  verify: vi.fn(async () => true),
  ...over,
});
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const settle = async () => {
  for (let i = 0; i < 40; i++) await Promise.resolve();
  flushSync();
};
let component: ReturnType<typeof mount> | undefined;
afterEach(async () => {
  if (component) await unmount(component);
  component = undefined;
  setLanguage('en');
});
const text = () => document.body.textContent ?? '';
const click = (label: string) => {
  const button = [...document.querySelectorAll('button')].find(
    (b) => b.textContent?.trim() === label,
  );
  expect(button).toBeDefined();
  button!.click();
};

it('does not claim there are no keys when reading them failed', async () => {
  component = mount(Harness, {
    target: document.body,
    props: { client: client({ list: vi.fn().mockRejectedValue(new Error()) }) },
  });
  await settle();
  expect(document.querySelector('[role="alert"]')).not.toBeNull();
  expect(text()).not.toContain('No keys yet');
  expect(text()).not.toContain('Add one above.');
});

it('clears a read failure when a later read succeeds', async () => {
  const c = client({
    list: vi
      .fn()
      .mockRejectedValueOnce(new CredentialCallError('store_unavailable'))
      .mockResolvedValue([item]),
  });
  const controller = new CredentialsController(() => undefined, c);
  await controller.refresh();
  expect(controller.state().phase).toBe('failed');
  await controller.refresh();
  expect(controller.state()).toMatchObject({
    phase: 'ready',
    failure: null,
    items: [item],
  });
});

it.each(['resolve', 'reject'] as const)(
  'ignores a stale read that will %s after a mutation',
  async (outcome) => {
    const old = deferred<Credential[]>();
    const c = client({
      list: vi.fn().mockReturnValueOnce(old.promise).mockResolvedValue([item]),
    });
    const controller = new CredentialsController(() => undefined, c);
    const reading = controller.refresh();
    await controller.add('Work', 'anthropic');
    if (outcome === 'resolve') old.resolve([]);
    else old.reject(new CredentialCallError('store_unavailable'));
    await reading;
    expect(controller.state()).toMatchObject({
      phase: 'ready',
      failure: null,
      items: [item],
    });
  },
);

it('ignores an older refresh that finishes after the newest one', async () => {
  const old = deferred<Credential[]>();
  const c = client({
    list: vi.fn().mockReturnValueOnce(old.promise).mockResolvedValue([item]),
  });
  const controller = new CredentialsController(() => undefined, c);
  const first = controller.refresh();
  await controller.refresh();
  old.resolve([]);
  await first;
  expect(controller.state().items).toEqual([item]);
});

it('does not start a refresh during an action and publishes a recovered list as ready', async () => {
  const adding = deferred<Credential | null>();
  const c = client({ add: () => adding.promise });
  const controller = new CredentialsController(() => undefined, c);
  const action = controller.add('Work', 'anthropic');
  await controller.refresh();
  expect(c.list).not.toHaveBeenCalled();
  adding.resolve(item);
  await action;
  expect(controller.state().phase).toBe('ready');
});

it('marks a post-action read failure as failed instead of presenting an empty store', async () => {
  const c = client({
    list: vi
      .fn()
      .mockRejectedValue(new CredentialCallError('store_unavailable')),
  });
  const controller = new CredentialsController(() => undefined, c);
  await controller.add('Work', 'anthropic');
  expect(controller.state()).toMatchObject({
    phase: 'failed',
    failure: 'store_unavailable',
    notice: 'Key kept, sealed.',
  });
});

it('preserves the entered name when the native add dialog is cancelled', async () => {
  component = mount(Harness, {
    target: document.body,
    props: { client: client({ add: async () => null }) },
  });
  await settle();
  const input = document.querySelector<HTMLInputElement>('#cred-name')!;
  input.value = 'Home';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await settle();
  document.querySelector('form')!.requestSubmit();
  await settle();
  expect(input.value).toBe('Home');
});

it('keeps an unsuccessful rename open with its draft so it can be corrected', async () => {
  component = mount(Harness, {
    target: document.body,
    props: {
      client: client({
        rename: vi
          .fn()
          .mockRejectedValue(new CredentialCallError('name_invalid')),
      }),
    },
  });
  await settle();
  click('Rename');
  await settle();
  const input = document.querySelector<HTMLInputElement>(
    'input[aria-label="New name"]',
  )!;
  input.value = 'New name';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await settle();
  click('Save name');
  await settle();
  expect(
    document.querySelector<HTMLInputElement>('input[aria-label="New name"]')
      ?.value,
  ).toBe('New name');
  expect(document.querySelector('[role="alert"]')).not.toBeNull();
});

it.each([
  [
    'name_invalid',
    'El nombre debe tener entre 1 y 60 caracteres, no estar en blanco ni contener caracteres de control.',
  ],
  [
    'secret_invalid',
    'La clave no puede estar vacía, contener espacios en blanco o caracteres de control, ni superar los 4096 bytes.',
  ],
  [
    'store_unavailable',
    'El almacén de claves de Wyss Console no está disponible.',
  ],
  ['internal', 'Algo salió mal en Wyss Console.'],
] as const)('explains %s accurately in Spanish', async (failure, expected) => {
  setLanguage('es');
  const controller = new CredentialsController(() => undefined);
  component = mount(CredentialsView, {
    target: document.body,
    props: {
      controller,
      visible: true,
      credentials: {
        ...controller.state(),
        phase: 'failed',
        failure: failure as CredentialFailure,
      },
    },
  });
  await settle();
  expect(document.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
    expected,
  );
});

it('does not assert damage when verification only reports a mismatch', async () => {
  const controller = new CredentialsController(
    () => undefined,
    client({ verify: async () => false }),
  );
  await controller.verify(item.id);
  expect(controller.state().notice).toBe(
    'The key could not be verified. Replace the key.',
  );
});

it('reports a completed add even if reloading the list fails, avoiding a duplicate retry', async () => {
  const c = client({
    list: vi
      .fn()
      .mockRejectedValue(new CredentialCallError('store_unavailable')),
  });
  const controller = new CredentialsController(() => undefined, c);
  expect(await controller.add('Work', 'anthropic')).toBe(true);
  expect(controller.state().notice).toBe('Key kept, sealed.');
  expect(controller.state().failure).toBe('store_unavailable');
});

it('clears the name after an add is confirmed', async () => {
  component = mount(Harness, {
    target: document.body,
    props: { client: client() },
  });
  await settle();
  const input = document.querySelector<HTMLInputElement>('#cred-name')!;
  input.value = 'Home';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await settle();
  document.querySelector('form')!.requestSubmit();
  await settle();
  expect(input.value).toBe('');
  expect(text()).toContain('Key kept, sealed.');
});

it('finishes loading after a rejected action invalidates the initial read', async () => {
  const old = deferred<Credential[]>();
  const c = client({
    list: vi.fn().mockReturnValueOnce(old.promise).mockResolvedValue([item]),
    add: vi.fn().mockRejectedValue(new CredentialCallError('name_invalid')),
  });
  const controller = new CredentialsController(() => undefined, c);
  const reading = controller.refresh();
  expect(await controller.add('Work', 'anthropic')).toBe(false);
  expect(controller.state()).toMatchObject({
    phase: 'ready',
    items: [item],
    failure: 'name_invalid',
    busy: false,
  });
  old.resolve([]);
  await reading;
  expect(controller.state().items).toEqual([item]);
});

it('recovers a failed initial read after a completed action', async () => {
  const c = client({
    list: vi
      .fn()
      .mockRejectedValueOnce(new CredentialCallError('store_unavailable'))
      .mockResolvedValue([item]),
  });
  const controller = new CredentialsController(() => undefined, c);
  await controller.refresh();
  await controller.add('Work', 'anthropic');
  expect(controller.state()).toMatchObject({
    phase: 'ready',
    failure: null,
    items: [item],
  });
});
