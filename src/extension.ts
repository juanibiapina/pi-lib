/**
 * Pi extension that provides /extension-settings command.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { getSettingsListTheme } from "@mariozechner/pi-coding-agent";
import { Container, Text } from "@mariozechner/pi-tui";
import { type SettingItem, SettingsList } from "./components/settings-list.js";
import { getSetting, setSetting } from "./settings/storage.js";
import type { SettingDefinition } from "./settings/types.js";

interface RegistrationPayload {
	name: string;
	settings: SettingDefinition[];
}

export default function piLibExtension(pi: ExtensionAPI) {
	// Local registry - stores settings registered via events
	const registry = new Map<string, SettingDefinition[]>();

	// Listen for registration events from other extensions
	pi.events.on("pi-lib:register", (data) => {
		const { name, settings } = data as RegistrationPayload;
		registry.set(name, settings);
	});

	pi.registerCommand("extension-settings", {
		description: "Configure settings for all extensions",
		handler: async (_args, ctx) => {
			if (registry.size === 0) {
				ctx.ui.notify("No extensions have registered settings", "info");
				return;
			}

			// Sort extensions by name
			const sortedExtensions = Array.from(registry.entries()).sort(([a], [b]) => a.localeCompare(b));

			await ctx.ui.custom((tui, theme, _kb, done) => {
				const container = new Container();

				// Title
				container.addChild(new Text(theme.fg("accent", theme.bold("Extension Settings")), 1, 1));

				// Build items grouped by extension
				const items: SettingItem[] = [];

				for (const [extName, settings] of sortedExtensions) {
					// Add extension header as a non-interactive item
					items.push({
						id: `__header__${extName}`,
						label: theme.bold(extName),
						currentValue: "",
						values: undefined, // No cycling - acts as header
					});

					// Add each setting
					for (const setting of settings) {
						const currentValue = getSetting(extName, setting.id, setting.defaultValue) ?? setting.defaultValue;
						items.push({
							id: `${extName}::${setting.id}`,
							label: `  ${setting.label}`,
							description: setting.description,
							currentValue,
							values: setting.values,
						});
					}
				}

				const settingsList = new SettingsList(
					items,
					Math.min(items.length + 2, 20),
					getSettingsListTheme(),
					(id, newValue) => {
						// Skip headers
						if (id.startsWith("__header__")) return;

						// Parse extension::settingId
						const [extensionName, settingId] = id.split("::");
						if (extensionName && settingId) {
							setSetting(extensionName, settingId, newValue);
						}
					},
					() => {
						done(undefined);
					},
					{ enableSearch: true },
				);

				container.addChild(settingsList);

				return {
					render(width: number) {
						return container.render(width);
					},
					invalidate() {
						container.invalidate();
					},
					handleInput(data: string) {
						settingsList.handleInput?.(data);
						tui.requestRender();
					},
				};
			});
		},
	});
}
