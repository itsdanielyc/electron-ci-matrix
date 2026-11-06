# Verification ledger

Append-only. Each row says what was proven, where, and by which run. "Built"
is never rounded up to "tested"; anything not listed here is unverified.

| Date | Level | Claim | Platforms | Evidence |
|---|---|---|---|---|
| 2026-11-06 | L1/L2 | Mock backend conforms to `contracts/greet.ts` (3 of 3) | windows x64 (local) | `npm run test:unit` locally |
| 2026-11-06 | L4/L5 | Playwright chromium against the mock: greet and clear journeys, ARIA and geometry baselines captured (first run fails by design, second green 4 of 4, tier 3 skipped with no local baseline) | windows x64 (local) | `npm run test:ui` twice locally |
| 2026-11-06 | L6 real shell | Built app launched with `_electron.launch`: title from index.html, badge native, renderer has no `require`/`process`, greeting round-trips through main and matches the contract, platform from main equals the bridge's answer, no console errors, screenshot `win32-x64.png`; seen red twice first (main greeting changed: `Expected "...from the main process!" Received "...from main!"`; preload exposing a different name: badge `Expected "native" Received "mock"`) | windows x64 (local, Electron 45.2.3) | `npm run build && npm run test:e2e` locally |
| 2026-11-06 | L7 installers | NSIS per-user silent install, launch, 6 s alive, silent uninstall, exe removed | windows x64 (local) | `npx electron-builder --publish never` then `scripts/installer-test.ps1` locally, exit 0 |
