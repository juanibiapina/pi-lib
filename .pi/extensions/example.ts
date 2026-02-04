import type { ExtensionFactory } from "@mariozechner/pi-coding-agent";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { type } from "arktype";
import { createSettingsStoreFactory } from "../../src";

const ExampleSettingsSchema = type({
  theme: "'light' | 'dark'",
  username: "string",
}) satisfies StandardSchemaV1;

const createExampleSettingsStore = createSettingsStoreFactory(
  "example-extension",
  ExampleSettingsSchema,
);

const ExampleExtension: ExtensionFactory = async (pi) => {
  const store = createExampleSettingsStore(pi);
  const theme = await store.get("theme", "light");

  if (theme === "dark") {
    store.set("username", "dark-mode-user");
  }
};

export default ExampleExtension;
