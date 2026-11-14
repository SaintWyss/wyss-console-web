import { msg } from '../../i18n/index.svelte';
import type { Variant } from '../../desktop/launch-client';

/**
 * The system update's distributions: the lines each one runs and the switches that change them.
 * A line with `requires` appears only with that switch on; a switch's `flags` are appended to the
 * lines they name. The desktop keeps what the window composes; it never builds a script itself.
 */
export interface Line {
  key: string;
  text: string;
  requires?: string;
}
export interface Switch {
  id: string;
  label: string;
  /** What it does, shown on hover. */
  hint: string;
  flags?: Readonly<Record<string, string>>;
}
export interface Distro {
  id: string;
  label: string;
  /** Which computers it is for and what its script does, shown on hover and under its name. */
  hint: string;
  lines: readonly Line[];
  switches: readonly Switch[];
}

const FLATPAK: Line = {
  key: 'flatpak',
  text: 'flatpak update',
  requires: 'flatpak',
};
const FLATPAK_SWITCH: Switch = {
  id: 'flatpak',
  label: msg('Update Flatpak apps'),
  hint: msg(
    'Adds “flatpak update”: also updates the apps installed from Flathub, which the package manager does not touch.',
  ),
};
const YES_HINT = msg(
  'Adds -y: answers yes to every question, so the update runs to the end without stopping. Without it, it asks before installing.',
);
const AUTOREMOVE_HINT = msg(
  'Adds a line that removes packages nothing needs any more (left behind by earlier updates).',
);
const PACMAN: readonly Line[] = [
  { key: 'pacman', text: 'sudo pacman -Syu' },
  { key: 'paru', text: 'paru -Sua', requires: 'aur' },
  { key: 'clean', text: 'sudo paccache -rk2', requires: 'clean' },
  FLATPAK,
];
const pacmanSwitches: readonly Switch[] = [
  {
    id: 'noconfirm',
    label: msg('No confirmation (--noconfirm)'),
    hint: msg(
      'Adds --noconfirm to pacman and paru: they answer yes on their own and do not stop to ask. Without it, they show what changes and wait for you.',
    ),
    flags: { pacman: '--noconfirm', paru: '--noconfirm', flatpak: '-y' },
  },
  {
    id: 'aur',
    label: msg('Include AUR (paru)'),
    hint: msg(
      'Adds “paru -Sua”: after the official packages, updates the ones installed from the AUR (built by the community). Needs paru installed.',
    ),
  },
  {
    id: 'skipreview',
    label: msg('Skip AUR review (--skipreview)'),
    hint: msg(
      'Adds --skipreview to paru: it does not show each AUR package’s build script before building it. Faster, but you do not see what it runs.',
    ),
    flags: { paru: '--skipreview' },
  },
  {
    id: 'clean',
    label: msg('Clean the package cache (paccache -rk2)'),
    hint: msg(
      'Adds a line that deletes old downloaded packages and keeps the last 2 versions of each, to free disk space. Needs pacman-contrib.',
    ),
  },
  FLATPAK_SWITCH,
];

export const DISTROS: readonly Distro[] = [
  {
    id: 'cachyos',
    label: 'CachyOS',
    hint: msg(
      'For CachyOS. Same commands as Arch (pacman, and paru for the AUR), and pacman also updates CachyOS’s own optimized repositories. AUR comes switched on, since CachyOS ships paru.',
    ),
    lines: PACMAN,
    switches: pacmanSwitches,
  },
  {
    id: 'arch',
    label: 'Arch',
    hint: msg(
      'For Arch and the distributions based on it without their own variant (Manjaro, EndeavourOS…). Same commands as CachyOS; AUR comes off, since plain Arch has no paru.',
    ),
    lines: PACMAN,
    switches: pacmanSwitches,
  },
  {
    id: 'debian',
    label: 'Ubuntu / Debian',
    hint: msg(
      'For Debian, Ubuntu, Linux Mint, Pop!_OS and the rest based on Debian. apt update reads the lists of new versions; full-upgrade installs them.',
    ),
    lines: [
      { key: 'update', text: 'sudo apt update' },
      { key: 'upgrade', text: 'sudo apt full-upgrade' },
      {
        key: 'autoremove',
        text: 'sudo apt autoremove',
        requires: 'autoremove',
      },
      FLATPAK,
    ],
    switches: [
      {
        id: 'yes',
        label: msg('No confirmation (-y)'),
        hint: YES_HINT,
        flags: { upgrade: '-y', autoremove: '-y', flatpak: '-y' },
      },
      {
        id: 'autoremove',
        label: msg('Remove unused packages (autoremove)'),
        hint: AUTOREMOVE_HINT,
      },
      FLATPAK_SWITCH,
    ],
  },
  {
    id: 'fedora',
    label: 'Fedora',
    hint: msg(
      'For Fedora. dnf upgrade --refresh reads the repositories again and installs every update.',
    ),
    lines: [
      { key: 'dnf', text: 'sudo dnf upgrade --refresh' },
      {
        key: 'autoremove',
        text: 'sudo dnf autoremove',
        requires: 'autoremove',
      },
      FLATPAK,
    ],
    switches: [
      {
        id: 'yes',
        label: msg('No confirmation (-y)'),
        hint: YES_HINT,
        flags: { dnf: '-y', autoremove: '-y', flatpak: '-y' },
      },
      {
        id: 'autoremove',
        label: msg('Remove unused packages (autoremove)'),
        hint: AUTOREMOVE_HINT,
      },
      FLATPAK_SWITCH,
    ],
  },
  {
    id: 'opensuse',
    label: 'openSUSE',
    hint: msg(
      'For openSUSE Tumbleweed and Leap. zypper refresh reads the repositories; zypper dup brings the whole system to their versions.',
    ),
    lines: [
      { key: 'refresh', text: 'sudo zypper refresh' },
      { key: 'dup', text: 'sudo zypper dup' },
      FLATPAK,
    ],
    switches: [
      {
        id: 'yes',
        label: msg('No confirmation (-y)'),
        hint: YES_HINT,
        flags: { dup: '-y', flatpak: '-y' },
      },
      FLATPAK_SWITCH,
    ],
  },
];

export const distroOf = (id: string) => DISTROS.find((d) => d.id === id);

/** The commands a distribution's lines make with these switches on, in the lines' order. */
export function compose(distro: Distro, on: readonly string[]): string[] {
  const enabled = new Set(on);
  return distro.lines
    .filter((line) => !line.requires || enabled.has(line.requires))
    .map((line) => {
      const flags = distro.switches
        .filter((s) => enabled.has(s.id) && s.flags?.[line.key])
        .map((s) => s.flags![line.key]);
      return [line.text, ...flags].join(' ');
    });
}

/** A variant as its distribution's defaults make it: nothing switched on but AUR on CachyOS. */
export function fresh(distro: Distro): Variant {
  const options = distro.id === 'cachyos' ? ['aur'] : [];
  return {
    distro: distro.id,
    options,
    manual: false,
    commands: compose(distro, options),
  };
}

/** The script as typed in the editor: one command per non-empty line. */
export const linesOf = (script: string) =>
  script
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '');

/** An os-release ID: what a variant is saved under. */
export const distroIdOk = (id: string) => /^[a-z0-9_-]{1,64}$/.test(id);
