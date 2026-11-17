import { afterEach, expect, it } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import Sidebar from '../src/lib/shell/Sidebar.svelte';
import { parseAuthorityView } from '../src/lib/contracts/authority';
import { setLanguage, t, tJoin } from '../src/lib/i18n/index.svelte';
import { summarizeAgent } from '../src/lib/shell/authority';
import { lifecycleNotice, summarizeLink } from '../src/lib/shell/lifecycle';
import { NAV_ITEMS, moreItems } from '../src/lib/shell/nav';
import views from './fixtures/authority-view-v1.json';
import { lifecycle } from './lifecycle-harness';

let component: ReturnType<typeof mount> | undefined;
afterEach(async () => {
  if (component) await unmount(component);
  component = undefined;
  setLanguage('en');
});

const absent = {
  state: 'observed' as const,
  view: parseAuthorityView(views.waiting_absent),
};

it.each([
  [
    'socket_unavailable',
    'Not answering',
    'The Wyss authority is not answering',
    'Sin respuesta',
    'La autoridad Wyss no responde',
  ],
  [
    'socket_unsafe',
    'Unsafe',
    'The Wyss authority connection is unsafe',
    'No segura',
    'La conexión con la autoridad Wyss no es segura',
  ],
] as const)(
  'describes %s without claiming startup failed',
  (failure, label, title, esLabel, esTitle) => {
    const failed = {
      state: 'observed' as const,
      view: lifecycle({ phase: 'failed', failure }),
    };
    const summary = summarizeLink(absent, failed);
    const notice = lifecycleNotice(failed, absent)!;
    expect(summary).toMatchObject({ label, tone: 'error' });
    expect(notice).toMatchObject({ title, retry: true, tone: 'error' });
    setLanguage('es');
    expect(t(summary.label)).toBe(esLabel);
    expect(t(notice.title)).toBe(esTitle);
  },
);

it.each(['running', 'stopped'] as const)(
  'translates the desired agent state %s',
  (desired) => {
    const view = parseAuthorityView(views.connected);
    view.agent = { ...view.agent!, desired };
    const summary = summarizeAgent({ state: 'observed', view });
    expect(tJoin(summary.detail)).toContain(`desired ${desired}`);
    setLanguage('es');
    expect(tJoin(summary.detail)).toContain(
      `deseado ${desired === 'running' ? 'en curso' : 'detenido'}`,
    );
    expect(tJoin(summary.detail)).not.toContain(desired);
  },
);

it('exposes the More disclosure as a named group', async () => {
  setLanguage('es');
  component = mount(Sidebar, {
    target: document.body,
    props: { active: 'console', onselect: () => undefined },
  });
  flushSync();
  document.querySelector<HTMLButtonElement>('.rail-more')!.click();
  await tick();
  const group = document.querySelector<HTMLElement>('#rail-more-list')!;
  expect(group.hidden).toBe(false);
  expect(group.getAttribute('role')).toBe('group');
  expect(group.getAttribute('aria-label')).toBe('Más');
});

it('renders the promised translated tooltips for More views', async () => {
  setLanguage('es');
  component = mount(Sidebar, {
    target: document.body,
    props: { active: 'console', onselect: () => undefined },
  });
  flushSync();
  document.querySelector<HTMLButtonElement>('.rail-more')!.click();
  await tick();
  const buttons = [...document.querySelectorAll('#rail-more-list button')];
  expect(buttons.map((button) => button.getAttribute('title'))).toEqual(
    moreItems(NAV_ITEMS).map((item) => t(item.subtitle)),
  );
  expect(buttons[0].getAttribute('title')).toBe(
    'Sesiones de agentes administradas',
  );
});

it.each(['failed', 'incompatible'] as const)(
  'hides a stale %s notice while the authority synchronizes',
  (phase) => {
    const synchronizing = {
      state: 'observed' as const,
      view: parseAuthorityView({
        ...views.waiting_absent,
        connection: 'synchronizing',
        reason: null,
      }),
    };
    const old = {
      state: 'observed' as const,
      view: lifecycle({
        phase,
        failure: phase === 'failed' ? 'stopped' : null,
      }),
    };
    expect(summarizeLink(synchronizing, old).label).toBe('Syncing');
    expect(lifecycleNotice(old, synchronizing)).toBeNull();
    // While still waiting, the same failure remains visible.
    expect(lifecycleNotice(old, absent)).not.toBeNull();
  },
);
