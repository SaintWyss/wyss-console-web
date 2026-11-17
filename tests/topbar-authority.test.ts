import { afterEach, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import TopBar from '../src/lib/shell/StatusList.svelte';
import { pendingAuthority } from '../src/lib/shell/authority';
import { pendingLifecycle } from '../src/lib/shell/lifecycle';

let component: ReturnType<typeof mount> | undefined;

afterEach(() => {
  if (component) void unmount(component);
  component = undefined;
  document.body.replaceChildren();
});

const base = {
  runtime: { label: 'Running', tone: 'ok' as const },
  authority: pendingAuthority,
  lifecycle: pendingLifecycle,
};

const authorityPill = () => document.querySelector('.pill.authority');

it('shows the protocol 1 authority status', () => {
  component = mount(TopBar, {
    target: document.body,
    props: base,
  });
  flushSync();
  const pill = authorityPill();
  expect(pill?.querySelector('.pill-key')?.textContent).toBe('Authority');
  expect(pill?.getAttribute('title')).toMatch(/^Protocol 1 authority · /);
});
