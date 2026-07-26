# Design Document — Link Tabbing

This document explains the internal design of the plugin and the reasoning behind it. For how to use the plugin, see [USER_GUIDE.md](USER_GUIDE.md). For build/dev setup, see [README.md](README.md).

## Problem

Obsidian's Reading view renders internal links, external links, and (via Dataview) query results as plain `<a>` elements. Native browser Tab already moves focus between them, but it does so across the *entire app* — ribbon icons, sidebars, the file explorer, other panes — not just the links inside the note you're reading. Reaching the Nth link in a long note, or in a Dataview-generated table of results, means holding Tab through dozens of unrelated UI elements first.

The goal: scope Tab/Shift+Tab to just the links inside the currently-open note in Reading view, cycle through them, and make sure that scan includes links Dataview renders — which happens *after* Obsidian's own initial render.

## Non-goals

- Edit mode / Live Preview support. Reading view only. Editable panes have their own Tab semantics (indentation, list continuation) that this plugin must not interfere with.
- A visual "link hint" overlay (à la Vimium). Out of scope for v1 — see Future considerations.
- Canvas, Kanban, or other non-Markdown views.

## Architecture

Single-file plugin (`main.ts`), consistent with the scope: one `Plugin` subclass registering two commands and a settings tab, no separate modules needed yet.

```
LinkTabbingPlugin (Plugin)
├── addCommand("next-link")      → handleTab(checking, +1)
├── addCommand("previous-link")  → handleTab(checking, -1)
├── registerDomEvent(keydown)    → handleEnterKey
├── registerEvent(active-leaf-change) → clearFocusHighlight
└── addSettingTab(LinkTabbingSettingTab)
```

State is a `WeakMap<HTMLElement, ViewState>`, keyed by the Reading view's `containerEl`, holding the last-computed link list and index. It's a `WeakMap` (not a `Map` on the view) so it doesn't need manual cleanup as leaves/views are destroyed.

## Key decisions

### Re-scan the DOM on every keypress, rather than caching per file-open

This is the decision that makes the plugin work with Dataview at all. Dataview registers a Markdown post-processor that runs its query engine and patches the DOM *asynchronously*, after Obsidian's initial render pass completes. A link list built once when the note opens (e.g. via `registerMarkdownPostProcessor` or a `file-open` handler) would systematically miss Dataview's results, because at that point they don't exist in the DOM yet.

Instead, `collectLinks()` runs `container.querySelectorAll(...)` fresh on every Tab/Shift+Tab press. Whatever has rendered by the time the user presses the key — including anything Dataview has since injected — is what gets included. No `MutationObserver`, no listening for Dataview's own render-complete events, no dependency on Dataview's API at all. The plugin doesn't know or care that Dataview exists; it only cares what's currently in the DOM.

**Trade-off accepted:** if a user presses Tab in the first tens-of-milliseconds after opening a note, before a slow Dataview query has resolved, that render's links won't be included yet. The next press (a moment later) will include them, since it re-scans. This was judged an acceptable edge case against the alternative complexity of a MutationObserver-based cache-invalidation scheme, which would need its own debouncing and lifecycle management for comparatively little benefit.

### State keyed by `containerEl`, not by `MarkdownView`

`MarkdownView.previewMode.containerEl` is not stable across the view's lifetime — it's recreated when the file changes or the view re-initializes. Keying state on the `MarkdownView` object risks holding onto a stale container reference. Keying on the container itself sidesteps that: if the container has been swapped out, the old state entry simply becomes unreachable and gets garbage collected (hence `WeakMap`).

### Resolving "current position" with a three-tier fallback

`resolveCurrentIndex()` decides where in the link list the cursor "is" before advancing:

1. If `document.activeElement` is one of the currently-collected links, use its index. This keeps the plugin in sync if the user manually clicked a link instead of tabbing to it.
2. Otherwise, if there's stored state for this container, try to find the previously-tabbed-to element in the *new* link list (`indexOf`). This survives a partial DOM re-render (e.g. Dataview re-querying) as long as the same anchor element is reused.
3. Otherwise, `-1`, so the first Tab press lands on index 0 and the first Shift+Tab lands on the last link.

### Visual highlight via CSS class, not just native focus

Anchor elements are natively focusable, so `.focus()` alone would work in principle — but many Obsidian themes suppress or barely style the default focus ring on links, making it hard to tell where you are. `link-tabbing-focused` (styles.css) adds an explicit, theme-aware outline (`var(--interactive-accent)`) on top of native focus, and is added/removed by the plugin rather than relying on `:focus-visible` CSS alone, since we also need a JS-readable marker: `handleEnterKey` uses this exact class to decide whether Enter should be intercepted at all (see below).

### Enter opens in a new tab, but only for tabbed-to links

Native behavior for a focused `<a>` is that Enter triggers a synthetic click, which — for internal links — replaces the current pane's content. That defeats the purpose of tabbing through a list of results: each link you check knocks you out of the list you were cycling through.

`handleEnterKey` intercepts `keydown` on `document` and checks two things before acting: the key is Enter, and `document.activeElement` carries the `link-tabbing-focused` class. That second check is deliberate — it scopes the override to links the *plugin* navigated you to, not every focused anchor in the app. A link you focused by clicking it manually (no highlight class) keeps its native single-click-to-navigate behavior; only the cycling workflow gets the "keep my place" treatment.

Given a match, it branches on link type:
- `a.internal-link` → `preventDefault()`, then `workspace.openLinkText(linktext, sourcePath, "tab")`, reading the target from `data-href` (falling back to `href`).
- `a.external-link` → `preventDefault()`, then `window.open(href, "_blank")`.
- Anything else (e.g. `a.tag`, when the "include tags" setting is on) — no `preventDefault()`, so native behavior (in-app tag search) proceeds untouched.

### Command scoping via `checkCallback`, not a global key capture

Both commands use `checkCallback` to report "unavailable" whenever the active view isn't a `MarkdownView` in preview mode. This is what lets default hotkeys of plain `Tab` / `Shift+Tab` be safe to ship: Obsidian only invokes the command (and only consumes the keypress) when the check passes, so Edit mode, Live Preview, the file explorer, and every other pane keep their normal Tab behavior untouched.

### Filtering to visible links only

`collectLinks()` filters on `el.offsetParent !== null`, excluding links inside collapsed callouts, folded headings, or hidden Dataview rows. Tabbing to an invisible link would be disorienting (`scrollIntoView` on a `display: none` ancestor does nothing useful) and there's no user-facing way to "see" you landed on it.

## Alternatives considered

- **MutationObserver watching the preview container**, rebuilding the link list on every DOM mutation, cached between keypresses. Rejected: strictly more moving parts (observer lifecycle, debouncing rapid Dataview re-renders, teardown on file switch) for no behavioral difference from re-scanning per keypress, since the plugin only ever needs the list at the moment of a keypress.
- **Vimium-style link-hint overlay** (show a letter/number badge on every link, type it to jump). More discoverable and faster for a specific known target, but a materially larger feature (overlay rendering, input capture mode, badge collision avoidance) than "sequential cycling," and not what was asked for. Worth considering as a v2 addition, not a v1 requirement.
- **Global `Tab` key capture via `registerDomEvent(document, "keydown")`** instead of `addCommand` + `checkCallback`. Rejected in favor of the command API specifically so the hotkey is user-rebindable through Settings → Hotkeys like any other Obsidian command, and so command-palette discovery works for free.

## Known limitations

- A link that appears only after a very slow Dataview query (network-backed `dv.io`/API calls, large vaults) may not be caught until the query resolves and you press Tab again.
- "Open in new tab" for external links opens the OS default browser, in a new browser tab — not a new Obsidian pane. That's the ceiling of what an external URL can do from inside Obsidian.
- No cross-file memory: switching notes and back does not restore the index you were previously on (state is best-effort, keyed to a container element that gets replaced on file switch anyway).

## Future considerations (not built)

- Optional link-hint overlay as an alternate navigation mode.
- A "jump to first/last link" command pair.
- Per-note persistence of last-tabbed-to link across file close/reopen.
