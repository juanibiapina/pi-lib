/**
 * Read/write extension settings to JSON files.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { type ExtensionAPI, getAgentDir } from "@mariozechner/pi-coding-agent";
import type { StandardJSONSchemaV1, StandardSchemaV1 } from "@standard-schema/spec";
import type { SettingDefinition } from "./types.js";

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
 * Get all settings for an extension.
 * Returns an empty object if the extension has no stored settings.
 *
 * __warning__: This function does not perform validation on the returned settings.
 * It is recommended to use a typed settings store with schema validation for safer access.
 *
 * @see createSettingsStoreFactory
 * @deprecated Use createSettingsStoreFactory for typed access
 * @param extensionName - Extension name
 * @returns Map of setting keys to stored string values
 */
export function getSettingsForExtension(extensionName: string): Record<string, string> {
	const globalPath = getGlobalSettingsPath();
	const settings = loadSettingsFile(globalPath);

	return settings[extensionName] ?? {};
}

/**
 * Get a setting value for an extension.
 * Returns the stored value, or the provided default, or undefined.
 *
 * __warning__: This function does not perform validation on the returned settings.
 * It is recommended to use a typed settings store with schema validation for safer access.
 *
 * @see createSettingsStoreFactory
 * @deprecated Use createSettingsStoreFactory for typed access
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
 * __warning__: This function does not perform validation on the provided value.
 * It is recommended to use a typed settings store with schema validation for safer access.
 *
 * @see createSettingsStoreFactory
 * @deprecated Use createSettingsStoreFactory for typed access
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

type JSONSchema = {
	type?: string | string[];
	title?: string;
	description?: string;
	default?: unknown;
	enum?: unknown[];
	const?: unknown;
	properties?: Record<string, JSONSchema>;
	anyOf?: JSONSchema[];
	oneOf?: JSONSchema[];
	allOf?: JSONSchema[];
};

function encodeSettingValue(value: unknown): string {
	if (typeof value === "string") {
		return value;
	}

	const encoded = JSON.stringify(value);
	return encoded ?? String(value);
}

function hasJsonSchema(
	schema: StandardSchemaV1<any, any>,
): schema is StandardSchemaV1<any, any> & StandardJSONSchemaV1<any, any> {
	const standard = schema["~standard"];

	if (!standard || typeof standard !== "object") {
		return false;
	}

	if (!("jsonSchema" in standard)) {
		return false;
	}

	if (!standard.jsonSchema || typeof standard.jsonSchema !== "object") {
		return false;
	}

	if (!("input" in standard.jsonSchema) || typeof standard.jsonSchema.input !== "function") {
		return false;
	}

	return true;
}

function getInputSchema(schema: StandardSchemaV1<any, any>): JSONSchema | null {
	if (!hasJsonSchema(schema)) {
		return null;
	}

	try {
		return schema["~standard"].jsonSchema.input({
			target: "draft-2020-12",
		}) as JSONSchema;
	} catch {
		try {
			return schema["~standard"].jsonSchema.input({
				target: "draft-07",
			}) as JSONSchema;
		} catch {
			return null;
		}
	}
}

function isBooleanSchema(schema: JSONSchema): boolean {
	if (schema.type === "boolean") {
		return true;
	}

	if (Array.isArray(schema.type)) {
		return schema.type.includes("boolean");
	}

	return false;
}

function extractEnumValues(schema: JSONSchema): unknown[] | undefined {
	if (Array.isArray(schema.enum) && schema.enum.length > 0) {
		return schema.enum;
	}

	if (schema.const !== undefined) {
		return [schema.const];
	}

	const variants = schema.anyOf ?? schema.oneOf;
	if (variants && variants.length > 0) {
		const collected: unknown[] = [];
		for (const variant of variants) {
			const values = extractEnumValues(variant);
			if (values) {
				collected.push(...values);
			}
		}

		if (collected.length > 0) {
			const seen = new Set<string>();
			return collected.filter((value) => {
				const encoded = encodeSettingValue(value);
				if (seen.has(encoded)) {
					return false;
				}
				seen.add(encoded);
				return true;
			});
		}
	}

	return undefined;
}

function deriveSettingValues(schema: JSONSchema): string[] | undefined {
	const enumValues = extractEnumValues(schema);
	if (enumValues && enumValues.length > 0) {
		return enumValues.map(encodeSettingValue);
	}

	if (isBooleanSchema(schema)) {
		return ["true", "false"];
	}

	return undefined;
}

function deriveDefaultValue(schema: JSONSchema): string {
	if (schema.default !== undefined) {
		return encodeSettingValue(schema.default);
	}

	if (schema.const !== undefined) {
		return encodeSettingValue(schema.const);
	}

	const enumValues = extractEnumValues(schema);
	if (enumValues && enumValues.length > 0) {
		return encodeSettingValue(enumValues[0]);
	}

	if (isBooleanSchema(schema)) {
		return "false";
	}

	return "";
}

function createSettingsDefinitionsFromSchema(schema: StandardSchemaV1<any, any>): SettingDefinition[] {
	const inputSchema = getInputSchema(schema);
	const properties = inputSchema?.properties;

	if (!properties || typeof properties !== "object") {
		return [];
	}

	return Object.entries(properties).map(([key, value]) => {
		const propertySchema = typeof value === "object" && value !== null ? (value as JSONSchema) : {};
		const values = deriveSettingValues(propertySchema);

		return {
			id: key,
			label: propertySchema.title ?? key,
			description: propertySchema.description,
			defaultValue: deriveDefaultValue(propertySchema),
			values: values && values.length > 0 ? values : undefined,
		};
	});
}

/**
 * Typed settings store for an extension.
 */
export interface TypedSettingsStore<Output> {
	/**
	 * Get a setting value by key.
	 * Returns the stored value, or the provided fallback, or undefined.
	 *
	 * @param key - Setting key
	 * @param fallback - Fallback value if setting is not found
	 * @returns The setting value
	 */
	get<K extends keyof Output>(key: K, fallback?: Output[K]): Promise<Output[K] | undefined>;

	/**
	 * Set a setting value by key.
	 * @param key - Setting key
	 * @param value - Value to set
	 */
	set<K extends keyof Output>(key: K, value: Output[K]): void;

	/**
	 * Get all settings for the extension.
	 * Merges with provided fallbacks if any.
	 * @param fallbacks - Partial settings to use as fallbacks
	 * @returns All settings
	 */
	getAll(fallbacks?: Partial<Output>): Promise<Output>;
}

/**
 * Create a typed settings store factory for an extension.
 *
 * @example
 *
 * ```typescript
 * import { createSettingsStoreFactory } from "@juanibiapina/pi-extension-settings";
 * import { type } from "arktype";
 *
 * const myExtensionSettingsSchema = type({
 *  timeout: type.number,
 *  enableFeatureX: type.boolean,
 *  projectName: type.string,
 *  options: type.array(type.string),
 * });
 *
 * const createMyExtensionSettingsStore = createSettingsStoreFactory(
 * "my-extension",
 *  myExtensionSettingsSchema,
 * );
 *
 * // Usage in extension code
 * const MyExtension:ExtensionFactory = (pi) => {
 *  const settingsStore = createMyExtensionSettingsStore(pi);
 *
 *  // Get a setting
 *  const timeout = await settingsStore.get("timeout", 30);
 *
 *  // Set a setting
 *  settingsStore.set("projectName", "My Project");
 * }
 * ```
 *
 * @param extensionName - Extension name
 * @param schema - Standard Schema v1 for validating settings
 * @returns Factory function that creates a TypedSettingsStore
 */
export function createSettingsStoreFactory<Schema extends StandardSchemaV1<any, any>>(
	extensionName: string,
	schema: Schema,
): (pi: ExtensionAPI) => TypedSettingsStore<StandardSchemaV1.InferOutput<Schema>> {
	type Output = StandardSchemaV1.InferOutput<Schema>;
	type Input = StandardSchemaV1.InferInput<Schema>;
	const settingsDefinitions = createSettingsDefinitionsFromSchema(schema);

	async function validateSettings(raw: Record<string, string>): Promise<{ value: Output } | { issues: unknown }> {
		return (await schema["~standard"].validate(raw as Input)) as { value: Output } | { issues: unknown };
	}

	return (pi) => {
		pi.events.emit("pi-extension-settings:register", {
			name: extensionName,
			settings: settingsDefinitions,
		});

		return {
			async get<K extends keyof Output>(key: K, fallback?: Output[K]): Promise<Output[K] | undefined> {
				const raw = getSettingsForExtension(extensionName);
				const result = await validateSettings(raw);

				if ("issues" in result) {
					return fallback;
				}

				const value = result.value[key];
				return value === undefined ? fallback : value;
			},

			set<K extends keyof Output>(key: K, value: Output[K]): void {
				setSetting(extensionName, key as string, encodeSettingValue(value));
			},

			async getAll(fallbacks?: Partial<Output>): Promise<Output> {
				const raw = getSettingsForExtension(extensionName);
				const result = await validateSettings(raw);

				if ("issues" in result) {
					return (fallbacks ?? {}) as Output;
				}

				return (fallbacks ? { ...fallbacks, ...result.value } : result.value) as Output;
			},
		};
	};
}
