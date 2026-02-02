/**
 * Read/write extension settings to JSON files.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { getAgentDir } from "@mariozechner/pi-coding-agent";

const SETTINGS_FILE_NAME = "settings-extensions.json";

type SettingsFile = Record<string, Record<string, string>>;

/**
 * Get the global settings file path.
 */
function getGlobalSettingsPath(): string {
	return join(getAgentDir(), SETTINGS_FILE_NAME);
}

/**
 * Load the settings file. Returns empty object if file doesn't exist or is invalid.
 */
function loadSettingsFile(path: string): SettingsFile {
	if (!existsSync(path)) {
		return {};
	}
	try {
		const content = readFileSync(path, "utf-8");
		return JSON.parse(content) as SettingsFile;
	} catch {
		return {};
	}
}

/**
 * Save settings to the global file.
 */
function saveSettingsFile(path: string, settings: SettingsFile): void {
	const dir = dirname(path);
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
	writeFileSync(path, JSON.stringify(settings, null, "\t"));
}

/**
 * Get a setting value for an extension.
 * Returns the stored value, or the provided default, or undefined.
 *
 * @param extensionName - Extension name
 * @param settingId - Setting ID within the extension
 * @param defaultValue - Default value if setting is not found
 * @returns The setting value
 */
export function getSetting(extensionName: string, settingId: string, defaultValue?: string): string | undefined {
	const globalPath = getGlobalSettingsPath();
	const settings = loadSettingsFile(globalPath);

	// Check if value exists in file
	const extSettings = settings[extensionName];
	if (extSettings && settingId in extSettings) {
		return extSettings[settingId];
	}

	return defaultValue;
}

/**
 * Set a setting value for an extension.
 * Always writes to the global settings file.
 *
 * @param extensionName - Extension name
 * @param settingId - Setting ID within the extension
 * @param value - Value to set
 */
export function setSetting(extensionName: string, settingId: string, value: string): void {
	const globalPath = getGlobalSettingsPath();
	const settings = loadSettingsFile(globalPath);

	if (!settings[extensionName]) {
		settings[extensionName] = {};
	}
	settings[extensionName][settingId] = value;

	saveSettingsFile(globalPath, settings);
}
