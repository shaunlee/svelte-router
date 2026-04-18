# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-04-18

### Changed

- Migrated the project and example app to `bun`.
- Updated the example app to Svelte 5 and modernized its app bootstrap.
- Updated package metadata and peer dependency ranges for current Svelte versions.

### Improved

- Optimized route matching by separating static and dynamic routes.
- Reduced repeated URL parsing in the router hot path.
- Improved link active-state matching so paths such as `/users-old` no longer match `/users`.

### Fixed

- `link` and `<Link>` now preserve native browser behavior for external URLs, `target="_blank"`, downloads, and modified clicks.
- README examples and API documentation now match the current implementation.

### Tests

- Added integration coverage for router initialization, navigation, hash mode, and external navigation.
- Added action coverage for `link`, including replace navigation and active-class behavior.

