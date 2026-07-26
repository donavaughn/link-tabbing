# Link Tabbing

Tab through the links on a note while in Reading view, without needing the mouse. Works with links rendered by [Dataview](https://github.com/blacksmithgu/obsidian-dataview) query results (tables, lists, tasks), not just links written directly in the note.

- **[User Guide](USER_GUIDE.md)** — installing, using, and troubleshooting the plugin.
- **[Installing on Another Device](INSTALL_OTHER_DEVICES.md)** — getting it onto a new vault or machine (e.g. Windows) via BRAT.
- **[Design Document](DESIGN.md)** — architecture and the reasoning behind key decisions (especially the Dataview compatibility approach).

## Usage

- **Tab** — jump to the next link in the note.
- **Shift+Tab** — jump to the previous link.
- **Enter** — open the focused link in a new tab, so cycling through results doesn't replace the note you're tabbing through.

Both hotkeys only take effect while a note is in Reading view, so they won't interfere with anything in Edit mode or Live Preview. Rebind them under Settings → Hotkeys if they clash with something else in your setup.

The plugin re-scans the page for links every time you press Tab, rather than caching a list when the note first opens. That's what makes it Dataview-safe: Dataview renders its query results asynchronously after its own query engine resolves, so a cached list built at file-open time would miss them. Scanning fresh means whatever Dataview has rendered by the time you press the key gets included.

## Settings

- **Wrap around** (default on) — cycle back to the first/last link at the ends of the list.
- **Include tags** — also stop on `#tags`, not just links.

## Development

Requires Node.js 16+.

```bash
npm install
npm run dev
```

`npm run dev` watches and rebuilds `main.js` on change. `npm run build` type-checks and produces a production build.

### Testing in a vault

Obsidian loads plugins from `<vault>/.obsidian/plugins/<plugin-id>/`. Easiest path for development is a symlink from that location to this repo:

```bash
ln -s "$(pwd)" "/path/to/YourVault/.obsidian/plugins/link-tabbing"
```

Then enable "Link Tabbing" under Settings → Community plugins in that vault. After editing source, `npm run dev` rebuilds `main.js` in place; reload Obsidian (Cmd/Ctrl+R via the developer console, or the "Reload app without saving" command) to pick it up.

## License

MIT
