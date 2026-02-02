/**
 * Type definitions for extension settings.
 */

export interface SettingDefinition {
	/** Unique identifier for this setting within the extension */
	id: string;
	/** Display label */
	label: string;
	/** Optional description shown when selected */
	description?: string;
	/** Default value if not set in config file */
	defaultValue: string;
	/**
	 * Values to cycle through (Enter/Space cycles).
	 * If undefined or empty, the setting is treated as a free-form string input.
	 */
	values?: string[];
}
