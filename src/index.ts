/**
 * Pi extension settings library.
 *
 * Provides helpers for reading/writing extension settings and a UI
 * for configuring all registered extension settings.
 *
 * ## For Extension Authors
 *
 * ### Register Settings (for the UI)
 *
 * Emit the `pi-extension-settings:register` event during extension load:
 *
 * ```typescript
 * import type { SettingDefinition } from "@juanibiapina/pi-extension-settings";
 *
 * export default function(pi: ExtensionAPI) {
 *   pi.events.emit("pi-extension-settings:register", {
 *     name: "my-extension",
 *     settings: [
 *       { id: "timeout", label: "Timeout", defaultValue: "30", values: ["10", "30", "60"] },
 *       { id: "projectName", label: "Project Name", defaultValue: "" },
 *     ] satisfies SettingDefinition[]
 *   });
 * }
 * ```
 *
 * ### Read/Write Settings
 *
 * ```typescript
 * import { getSetting, setSetting } from "@juanibiapina/pi-extension-settings";
 *
 * const timeout = getSetting("my-extension", "timeout", "30");
 * setSetting("my-extension", "timeout", "60");
 * ```
 */

// Extension entry point
export { default } from "./extension.js";
export type { TypedSettingsStore } from "./settings/storage.js";
// Settings helpers and typed store factory
export { createSettingsStoreFactory, getSetting, getSettingsForExtension, setSetting } from "./settings/storage.js";
// Type for documentation/type-safety when emitting events
export type { SettingDefinition } from "./settings/types.js";
