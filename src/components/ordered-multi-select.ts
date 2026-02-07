/**
 * Ordered multi-select component.
 *
 * Displays a list of options that can be toggled on/off and reordered.
 * Selected items appear at the top with their position number.
 * Value is stored as a comma-separated string of selected IDs in order.
 */

import { type Component, getEditorKeybindings, matchesKey, truncateToWidth } from "@mariozechner/pi-tui";
import type { OrderedListOption } from "../settings/types.js";
import type { SettingsListTheme } from "./settings-list.js";

interface DisplayItem {
	option: OrderedListOption;
	selected: boolean;
	/** 1-based position within selected items, or 0 if not selected */
	position: number;
}

export class OrderedMultiSelect implements Component {
	private options: OrderedListOption[];
	private selected: string[];
	private cursorIndex = 0;
	private theme: SettingsListTheme;
	private done: (selectedValue?: string) => void;

	constructor(
		options: OrderedListOption[],
		currentValue: string,
		theme: SettingsListTheme,
		done: (selectedValue?: string) => void,
	) {
		this.options = options;
		this.selected = currentValue
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
		this.theme = theme;
		this.done = done;
	}

	invalidate(): void {}

	render(width: number): string[] {
		const lines: string[] = [];
		const items = this.buildDisplayItems();

		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const isCursor = i === this.cursorIndex;
			const prefix = isCursor ? this.theme.cursor : "  ";

			let marker: string;
			if (item.selected) {
				marker = this.theme.value(`✓ ${String(item.position).padStart(2)}`, isCursor);
			} else {
				marker = this.theme.label("     ", isCursor);
			}

			const label = this.theme.label(item.option.label, isCursor);
			const line = `${prefix}${marker}  ${label}`;
			lines.push(truncateToWidth(line, width, "…"));
		}

		// Scroll indicator
		if (items.length > 0) {
			const scrollText = `  (${this.cursorIndex + 1}/${items.length})`;
			lines.push(this.theme.hint(scrollText));
		}

		// Hint line
		lines.push("");
		lines.push(this.theme.hint("  Space toggle · Shift+↑/↓ reorder · Enter confirm · Esc cancel"));

		return lines;
	}

	handleInput(data: string): void {
		const kb = getEditorKeybindings();
		const items = this.buildDisplayItems();
		if (items.length === 0) {
			if (kb.matches(data, "selectCancel")) {
				this.done(undefined);
			}
			return;
		}

		if (kb.matches(data, "selectUp") || matchesKey(data, "up")) {
			this.cursorIndex = this.cursorIndex === 0 ? items.length - 1 : this.cursorIndex - 1;
		} else if (kb.matches(data, "selectDown") || matchesKey(data, "down")) {
			this.cursorIndex = this.cursorIndex === items.length - 1 ? 0 : this.cursorIndex + 1;
		} else if (data === " " || matchesKey(data, "space")) {
			this.toggleCurrent(items);
		} else if (matchesKey(data, "shift+up")) {
			this.moveUp(items);
		} else if (matchesKey(data, "shift+down")) {
			this.moveDown(items);
		} else if (kb.matches(data, "selectConfirm")) {
			this.done(this.selected.join(","));
		} else if (kb.matches(data, "selectCancel")) {
			this.done(undefined);
		}
	}

	private buildDisplayItems(): DisplayItem[] {
		const items: DisplayItem[] = [];

		// Selected items first, in order
		for (let i = 0; i < this.selected.length; i++) {
			const id = this.selected[i];
			const option = this.options.find((o) => o.id === id);
			if (option) {
				items.push({ option, selected: true, position: i + 1 });
			}
		}

		// Unselected items, in original options order
		for (const option of this.options) {
			if (!this.selected.includes(option.id)) {
				items.push({ option, selected: false, position: 0 });
			}
		}

		return items;
	}

	private toggleCurrent(items: DisplayItem[]): void {
		const item = items[this.cursorIndex];
		if (!item) return;

		const id = item.option.id;
		if (item.selected) {
			// Remove from selected
			this.selected = this.selected.filter((s) => s !== id);
		} else {
			// Add to end of selected
			this.selected.push(id);
		}
	}

	private moveUp(items: DisplayItem[]): void {
		const item = items[this.cursorIndex];
		if (!item?.selected) return;

		const idx = this.selected.indexOf(item.option.id);
		if (idx <= 0) return;

		// Swap with previous in selected array
		[this.selected[idx - 1], this.selected[idx]] = [this.selected[idx], this.selected[idx - 1]];
		// Move cursor up to follow the item
		this.cursorIndex--;
	}

	private moveDown(items: DisplayItem[]): void {
		const item = items[this.cursorIndex];
		if (!item?.selected) return;

		const idx = this.selected.indexOf(item.option.id);
		if (idx < 0 || idx >= this.selected.length - 1) return;

		// Swap with next in selected array
		[this.selected[idx], this.selected[idx + 1]] = [this.selected[idx + 1], this.selected[idx]];
		// Move cursor down to follow the item
		this.cursorIndex++;
	}
}
