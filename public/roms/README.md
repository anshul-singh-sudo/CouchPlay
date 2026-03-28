# Local ROMs Directory

This folder is configured to be the core repository for all CoachPlay game files.
By hosting ROMs locally instead of via an external CDN, CoachPlay ensures zero-latency loading and maximizes WebAssembly performance via cross-origin isolation.

## Supported Formats
- Nintendo 64: `.z64`, `.n64`
- GameBoy Advance: `.gba`, `.zip`
- Super Nintendo: `.smc`, `.sfc`, `.zip`
- PlayStation 1: `.iso`, `.bin`, `.cue`

## Instructions
1. Drop your ROM files into this directory.
2. Update the `GAMES` list inside `src/app/page.tsx` and `src/app/play/[gameSlug]/page.tsx` with the exact filename.
3. Example: `romUrl: "/roms/mario64.z64"`
