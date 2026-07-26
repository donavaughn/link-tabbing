import { App, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";

interface LinkTabbingSettings {
	wrapAround: boolean;
	includeTags: boolean;
}

const DEFAULT_SETTINGS: LinkTabbingSettings = {
	wrapAround: true,
	includeTags: false,
};

const FOCUS_CLASS = "link-tabbing-focused";

interface ViewState {
	links: HTMLAnchorElement[];
	index: number;
}

export default class LinkTabbingPlugin extends Plugin {
	settings!: LinkTabbingSettings;

	// Keyed by the reading-view container rather than the MarkdownView, since a
	// view's previewMode/containerEl is recreated when the file or mode changes.
	private viewStates = new WeakMap<HTMLElement, ViewState>();

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "next-link",
			name: "Tab to next link",
			checkCallback: (checking) => this.handleTab(checking, 1),
			hotkeys: [{ modifiers: [], key: "Tab" }],
		});

		this.addCommand({
			id: "previous-link",
			name: "Tab to previous link",
			checkCallback: (checking) => this.handleTab(checking, -1),
			hotkeys: [{ modifiers: ["Shift"], key: "Tab" }],
		});

		this.addSettingTab(new LinkTabbingSettingTab(this.app, this));

		this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.clearFocusHighlight()));
		this.registerDomEvent(document, "keydown", this.handleEnterKey);
	}

	onunload() {
		this.clearFocusHighlight();
	}

	private getReadingContainer(): HTMLElement | null {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view || view.getMode() !== "preview") return null;
		return view.previewMode?.containerEl ?? null;
	}

	private collectLinks(container: HTMLElement): HTMLAnchorElement[] {
		// Queried fresh on every keypress (not cached from file-open) so that links
		// Dataview injects asynchronously after its query resolves are picked up too.
		const selector = this.settings.includeTags
			? "a.internal-link, a.external-link, a.tag"
			: "a.internal-link, a.external-link";
		return Array.from(container.querySelectorAll<HTMLAnchorElement>(selector)).filter(
			(el) => el.offsetParent !== null
		);
	}

	private handleTab(checking: boolean, direction: 1 | -1): boolean {
		const container = this.getReadingContainer();
		if (!container) return false;
		if (checking) return true;

		const links = this.collectLinks(container);
		if (links.length === 0) {
			new Notice("Link Tabbing: no links found in this note");
			return true;
		}

		const currentIndex = this.resolveCurrentIndex(container, links);
		let nextIndex = currentIndex + direction;
		if (nextIndex >= links.length) {
			nextIndex = this.settings.wrapAround ? 0 : links.length - 1;
		} else if (nextIndex < 0) {
			nextIndex = this.settings.wrapAround ? links.length - 1 : 0;
		}

		this.clearFocusHighlight();
		const target = links[nextIndex];
		target.classList.add(FOCUS_CLASS);
		target.focus({ preventScroll: true });
		target.scrollIntoView({ block: "center", behavior: "smooth" });

		this.viewStates.set(container, { links, index: nextIndex });
		return true;
	}

	private resolveCurrentIndex(container: HTMLElement, links: HTMLAnchorElement[]): number {
		const active = document.activeElement;
		if (active instanceof HTMLAnchorElement) {
			const activeIndex = links.indexOf(active);
			if (activeIndex !== -1) return activeIndex;
		}

		const state = this.viewStates.get(container);
		if (state) {
			const previousTarget = state.links[state.index];
			const carriedIndex = previousTarget ? links.indexOf(previousTarget) : -1;
			if (carriedIndex !== -1) return carriedIndex;
		}

		return -1;
	}

	// Native Enter-on-focused-anchor behavior is a plain click, which replaces the
	// current pane. For links reached via Tab/Shift+Tab we open them in a new tab
	// instead, so cycling through search-style results doesn't lose your place.
	private handleEnterKey = (evt: KeyboardEvent) => {
		if (evt.key !== "Enter") return;
		const active = document.activeElement;
		if (!(active instanceof HTMLAnchorElement) || !active.classList.contains(FOCUS_CLASS)) return;

		if (active.classList.contains("internal-link")) {
			evt.preventDefault();
			const linktext = active.dataset.href ?? active.getAttribute("href") ?? "";
			if (!linktext) return;
			const sourcePath = this.app.workspace.getActiveFile()?.path ?? "";
			this.app.workspace.openLinkText(linktext, sourcePath, "tab");
		} else if (active.classList.contains("external-link")) {
			evt.preventDefault();
			const href = active.getAttribute("href");
			if (href) window.open(href, "_blank");
		}
		// Tags fall through to their native (in-app search) behavior.
	};

	private clearFocusHighlight() {
		document.querySelectorAll(`.${FOCUS_CLASS}`).forEach((el) => el.classList.remove(FOCUS_CLASS));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class LinkTabbingSettingTab extends PluginSettingTab {
	plugin: LinkTabbingPlugin;

	constructor(app: App, plugin: LinkTabbingPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Wrap around")
			.setDesc("Jump back to the first link after tabbing past the last one, and vice versa.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.wrapAround).onChange(async (value) => {
					this.plugin.settings.wrapAround = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Include tags")
			.setDesc("Also stop on #tags when tabbing through a note, not just links.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.includeTags).onChange(async (value) => {
					this.plugin.settings.includeTags = value;
					await this.plugin.saveSettings();
				})
			);

		containerEl.createEl("p", {
			cls: "setting-item-description",
			text: "Default hotkeys are Tab (next link) and Shift+Tab (previous link) while a note is in Reading view. Rebind them under Settings → Hotkeys if they conflict with anything.",
		});
	}
}
