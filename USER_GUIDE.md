# User Guide — Link Tabbing

Link Tabbing lets you jump between the links on a note using the keyboard, while reading it — no mouse required. It works with ordinary links you've written, and with links that show up inside [Dataview](https://github.com/blacksmithgu/obsidian-dataview) query results (tables, lists, tasks).

## Requirements

- Obsidian, desktop or mobile.
- The note must be in **Reading view** (not Edit mode or Live Preview) — click the book icon in the top-right of a note, or use the "Toggle reading view" command.
- Dataview is optional. Link Tabbing works fine without it; it just also works *with* it.

## Installing

Link Tabbing isn't in the official Community Plugins directory yet. See **[INSTALL_OTHER_DEVICES.md](INSTALL_OTHER_DEVICES.md)** for the recommended way to install it on any vault or device (via [BRAT](https://github.com/TfTHacker/obsidian42-brat), pulling from the project's [GitHub Releases](https://github.com/donavaughn/link-tabbing/releases)) — that's the path to use on a new machine, including Windows.

If you're setting this up on the same computer the plugin's source code lives on, a symlink from `.obsidian/plugins/link-tabbing` to the project folder also works and picks up rebuilds automatically; ask whoever maintains the project for that path.

## Using it

With a note open in Reading view:

| Key | Action |
|---|---|
| **Tab** | Move to the next link on the page |
| **Shift+Tab** | Move to the previous link |
| **Enter** | Open the currently-highlighted link, in a new tab |

The link you're currently on gets a visible outline so you can always tell where you are. Pressing Tab past the last link wraps back around to the first (this is configurable — see Settings below).

**Enter opens in a new tab on purpose.** If it opened in the same pane, checking a link would replace the note you were tabbing through, and you'd lose your place in the list. Opening in a new tab keeps the original note (and your position in it) exactly where you left it, so you can keep tabbing through the rest of the results.

This applies to internal links (other notes), external links (opens your default browser), and — because it's a plain keyboard focus — to links inside Dataview `TABLE`, `LIST`, and `TASK` query results exactly the same way.

### A note on timing with Dataview

Dataview queries take a moment to run and render after you open a note. Link Tabbing always looks at whatever's currently on the page each time you press Tab, so if you tab through *immediately* after opening a note with a slow query, very recently-added results might not be included in that specific press — press Tab again a moment later and they will be.

## Settings

Under **Settings → Link Tabbing**:

- **Wrap around** (on by default) — when off, Tab stops at the last link instead of cycling back to the first (and Shift+Tab stops at the first instead of jumping to the last).
- **Include tags** (off by default) — when on, `#tags` are included as stops alongside links when tabbing through a note.

## Changing the hotkeys

The default keys are Tab and Shift+Tab, but they only do anything while you're in Reading view — they won't interfere with typing or editing. If you want different keys (or Tab is bound to something else you use), go to **Settings → Hotkeys**, search for "Link Tabbing," and rebind:

- **Link Tabbing: Tab to next link**
- **Link Tabbing: Tab to previous link**

## Troubleshooting

**Plugin doesn't appear in Settings → Community plugins.**
- Make sure `manifest.json`, `main.js`, and `styles.css` actually landed inside `.obsidian/plugins/link-tabbing/` at your vault's root — not a subfolder, and not just the source code without a build step run.
- Fully quit and reopen Obsidian. A live reload of the current note isn't enough; Obsidian scans the plugins folder at vault load.
- Check you're looking at **Installed plugins**, not the **Browse** community store tab — this plugin isn't published there.

**Tab/Shift+Tab does nothing.**
- Confirm the note is in Reading view, not Edit mode or Live Preview.
- Check Settings → Hotkeys in case something else has claimed Tab or Shift+Tab, or in case Link Tabbing's own hotkeys were accidentally cleared.

**"No links found in this note" notice.**
- The note genuinely has no `<a>` links in the rendered Reading view. If you expected Dataview results here, give the query a moment to finish rendering and try again.

**Enter opens the link in the same pane instead of a new tab.**
- This override only applies to a link you reached via Tab/Shift+Tab (it has the highlighted outline). A link you focused by clicking it directly keeps normal click-to-open behavior.

## FAQ

**Does this work in Edit mode or Live Preview?**
No, Reading view only. Those modes have their own meaning for Tab (indenting, list continuation) that this plugin intentionally doesn't touch.

**Does this work on Canvas or Kanban boards?**
No, Markdown notes in Reading view only.

**Will tabbing through links move my cursor or edit the note?**
No. Reading view is not editable; tabbing only moves focus and scrolls.
