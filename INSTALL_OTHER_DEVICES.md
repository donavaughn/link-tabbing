# Installing on Another Device

The setup used on this Mac (symlinking `.obsidian/plugins/link-tabbing` straight to the project folder) only works because the project and the vaults are on the same disk. On any other machine — a Windows PC, another Mac, a phone/tablet — there's nothing local to symlink to, so install from the published [GitHub Release](https://github.com/donavaughn/link-tabbing/releases/latest) instead, via BRAT.

These steps are the same on Windows, macOS, iOS, and Android — Obsidian's UI is identical across platforms. Substitute Ctrl for Cmd on Windows/Linux.

## Recommended: BRAT

BRAT (Beta Reviewer's Auto-update Tool) installs plugins directly from a GitHub repo, without needing a build step, Node, or git on the target machine — no dev tooling required at all.

1. **Install Obsidian**, if it isn't already, and open the vault you want the plugin in.
2. **Settings → Community plugins** → make sure they're enabled (there's a one-time "Turn on community plugins" prompt if not).
3. **Browse** → search **BRAT** → Install → Enable.
4. Open the command palette (**Ctrl/Cmd+P**) → **"BRAT: Add a beta plugin for testing"**.
5. Enter the repo: `donavaughn/link-tabbing`
6. BRAT downloads `manifest.json`, `main.js`, and `styles.css` from the latest release into `<vault>/.obsidian/plugins/link-tabbing/` automatically.
7. **Settings → Community plugins → Installed** → toggle **Link Tabbing** on.

No admin rights needed — plugin files live inside the vault folder, not a system directory, so this works even on locked-down managed machines as long as Obsidian and community plugins are permitted at all.

## Fallback: manual install (no BRAT)

If BRAT itself isn't allowed (e.g. by IT policy):

1. On the [latest release page](https://github.com/donavaughn/link-tabbing/releases/latest), download `manifest.json`, `main.js`, and `styles.css`.
2. Create the folder `<vault>/.obsidian/plugins/link-tabbing/` and place the three files directly inside it.
3. Restart Obsidian, then enable **Link Tabbing** under Settings → Community plugins → Installed.

## Note on vault content

This only covers getting the *plugin* onto another device. Whether that device has access to the same vault *content* as your Mac (iCloud, a different sync method, or a separate local vault entirely) is a separate concern this doesn't address.

## Future updates

When a new version is tagged and released, BRAT-installed copies pick it up automatically (or via BRAT's "Check for updates" command); manual installs need the three files re-downloaded from the newer release.
