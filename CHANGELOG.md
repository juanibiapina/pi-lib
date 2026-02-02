# Changelog

## 0.2.0

### Changed

- **Breaking:** Settings now stored in a single `settings-extensions.json` file with one key per extension
  - Global: `~/.pi/agent/settings-extensions.json`
  - Project: `<cwd>/.pi/settings-extensions.json`
- Migration: Move settings from `<name>.json` to `settings-extensions.json` under the key `"<name>"`

## 0.1.0

Initial release.

- `loadConfig<T>(name)` - Load extension configuration from global and project locations
  - Global: `~/.pi/agent/<name>.json`
  - Project: `<cwd>/.pi/<name>.json`
- Deep merging of nested objects with project config taking precedence
