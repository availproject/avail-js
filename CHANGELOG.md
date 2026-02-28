# Changelog

All notable changes to this package are documented in this file.

## [0.5.0-8] - 2026-02-28

### Changed

- Completed v2 cutover to single-source layout under `src/`.
- Renamed implementation path from `src-v2/` to `src/`.
- Updated build and package output metadata to use `build/src/index.*`.
- Kept temporary compatibility alias `avail-js-sdk/v2` pointing to the same entrypoint.

### Added

- Added JS counterparts for all canonical Rust examples in `examples/node/src`.
- Added Rust parity tracking docs under `docs/v2/` with current-state and next-steps artifacts.
- Added explicit compatibility policy in `COMPATIBILITY.md`.

### Removed

- Removed obsolete legacy source tree and stale legacy-only test harness files.

### Verification

- `npm run typecheck`
- `npm run build`
- `npm test -- --runInBand`
- `cd examples/node && npm install && npm run build`
