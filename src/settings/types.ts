/**
 * Type definitions for extension settings.
 */

export interface OrderedListOption {
	/** Value stored in the comma-separated setting */
	id: string;
	/** Display label in the menu */
	label: string;
}

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
	 * Mutually exclusive with `options`.
	 */
	values?: string[];
	/**
	 * Available options for ordered multi-select.
	 * When present, Enter opens an ordered list submenu where items can be
	 * toggled on/off and reordered. Value is stored as comma-separated IDs.
	 * Mutually exclusive with `values`.
	 */
	options?: OrderedListOption[];
}
