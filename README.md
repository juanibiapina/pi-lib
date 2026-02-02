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
  maxRetries?: number;
}

export default function (pi: ExtensionAPI) {
  const config = loadConfig<MyExtensionConfig>("my-extension");
  
  // Users can now configure your extension via:
  // - ~/.pi/agent/settings-extensions.json (global defaults)
  // - <project>/.pi/settings-extensions.json (project overrides)
}
```

Project config takes precedence. Nested objects are deep-merged.

## Config Locations

| Scope | Path |
|-------|------|
| Global | `~/.pi/agent/settings-extensions.json` |
| Project | `<cwd>/.pi/settings-extensions.json` |

## Config File Format

All extension settings are stored in a single file with one key per extension:

```json
{
  "my-extension": {
    "timeout": 30,
    "debug": true
  },
  "another-extension": {
    "maxRetries": 3
  }
}
```

## License

MIT
