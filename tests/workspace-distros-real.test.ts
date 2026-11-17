import { expect, it } from 'vitest';
import { compose, distroOf } from '../src/lib/features/workspace/distros';

// The owner's actualizar-sistema.toml (cachyos), as saved by Workspace.
const options = [
  'noconfirm',
  'aur',
  'skipreview',
  'devel',
  'clean',
  'flatpak',
  'cachy',
];
const commands = [
  'sudo pacman -Syu --noconfirm',
  'paru -Sua --noconfirm --skipreview --devel',
  'sudo paccache -rk2',
  'flatpak update -y',
  'cachy-update',
];

it('regression: commands saved from the options are not taken as edited by hand', () => {
  expect(compose(distroOf('cachyos')!, options)).toEqual(commands);
});
