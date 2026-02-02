# @juanibiapina/pi-lib

A core library for building [pi](https://github.com/badlogic/pi-mono) extensions.

## Installation

```bash
npm install @juanibiapina/pi-lib
```

## Features

### Configuration Loading

Extensions often need user-configurable settings. This library provides a standardized way to load configuration from global and project locations, with automatic merging.

```typescript
import { loadConfig } from "@juanibiapina/pi-lib";

interface MyExtensionConfig {
  timeout?: number;
  debug?: boolean;
  apiKey?: string;
}

export default function (pi: ExtensionAPI) {
  const config = loadConfig<MyExtensionConfig>("my-extension");
  
  // Users can now configure your extension via:
  // - ~/.pi/agent/my-extension.json (global defaults)
  // - <project>/.pi/my-extension.json (project overrides)
}
```

Project config takes precedence. Nested objects are deep-merged.

## Config Locations

| Scope | Path |
|-------|------|
| Global | `~/.pi/agent/<name>.json` |
| Project | `<cwd>/.pi/<name>.json` |

## License

MIT
