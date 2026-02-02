import { getAgentDir } from "@mariozechner/pi-coding-agent";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

/**
 * Deep merge two objects. Values from `overrides` take precedence.
 * Arrays are replaced, not merged.
 */
function deepMerge<T extends Record<string, unknown>>(base: T, overrides: Partial<T>): T {
	const result = { ...base } as T;

	for (const key of Object.keys(overrides) as (keyof T)[]) {
		const overrideValue = overrides[key];
		const baseValue = base[key];

		if (overrideValue === undefined) {
			continue;
		}

		if (
			typeof overrideValue === "object" &&
			overrideValue !== null &&
			!Array.isArray(overrideValue) &&
			typeof baseValue === "object" &&
			baseValue !== null &&
			!Array.isArray(baseValue)
		) {
			(result as Record<string, unknown>)[key as string] = deepMerge(
				baseValue as Record<string, unknown>,
				overrideValue as Record<string, unknown>,
			);
		} else {
			(result as Record<string, unknown>)[key as string] = overrideValue;
		}
	}

	return result;
}

const CONFIG_DIR_NAME = ".pi";

/**
 * Load a single JSON config file. Returns empty object if file doesn't exist or is invalid.
 */
function loadConfigFile<T extends Record<string, unknown>>(path: string): Partial<T> {
	if (!existsSync(path)) {
		return {};
	}
	try {
		const content = readFileSync(path, "utf-8");
		return JSON.parse(content) as Partial<T>;
	} catch {
		return {};
	}
}

/**
 * Load extension config from global and project locations, with project taking precedence.
 *
 * Config file locations:
 * - Global: ~/.pi/agent/<name>.json
 * - Project: <cwd>/.pi/<name>.json
 *
 * @param name - Extension name (used as filename without .json)
 * @returns Merged config with project values taking precedence
 *
 * @example
 * ```typescript
 * interface MyConfig {
 *   timeout?: number;
 *   debug?: boolean;
 * }
 *
 * const config = loadConfig<MyConfig>("my-extension");
 * ```
 */
export function loadConfig<T extends Record<string, unknown>>(name: string): T {
	const globalPath = join(getAgentDir(), `${name}.json`);
	const projectPath = join(process.cwd(), CONFIG_DIR_NAME, `${name}.json`);

	const globalConfig = loadConfigFile<T>(globalPath);
	const projectConfig = loadConfigFile<T>(projectPath);

	return deepMerge(globalConfig as T, projectConfig) as T;
}
