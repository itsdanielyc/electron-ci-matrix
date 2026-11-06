# spike

A minimal Electron app whose only purpose is to prove a cross-platform testing
loop on free GitHub-hosted runners: Windows (x64, arm64), macOS (arm64, Intel)
and Linux (x64, arm64). It is the `electron-web` profile template for Keel.
`VERIFICATION.md` is the ledger of what has actually been proven, by which run.

## Layout

| Path | What |
|---|---|
| `electron/` | main process (`main.ts`), sandboxed preload (`preload.ts`), the typed bridge (`bridge.ts`) |
| `src/`, `index.html` | the renderer; `src/api.ts` uses `window.electronBridge` when the preload exposed it, a labelled mock otherwise |
| `contracts/` | shared contract modules, imported by the mock, the unit suite and the real-shell suite |
| `tests/unit` | Vitest (L1/L2) |
| `tests/ui` | Playwright on chromium against `vite` and the mock (L4/L5, three visual tiers) |
| `tests/e2e` | Playwright `_electron.launch` against the built app (L6) |
| `scripts/` | installer round trips, CI triage, contact sheet |

## Layers

| Layer | What | Where it runs |
|---|---|---|
| L0-L2 | `tsc` over renderer, main and suites; Vitest: the mock conforms to `contracts/greet.ts` | `unit` job, one Linux runner |
| L4/L5 | Playwright (chromium) against the Vite dev server and the mock. ARIA snapshot and layout geometry (one baseline each, shared by every OS), per-OS pixels | `ui` job on ubuntu, windows, macos |
| L6 | The built app (`out/`) launched by Playwright's Electron support: badge reads native, the greeting round-trips through the main process, the platform comes from the main process, screenshot `artifacts/e2e/<os>-<arch>.png` | `e2e` job on all six runners (Linux under `xvfb-run`) |
| L7 | electron-builder bundles installed and launched the way a user would: NSIS silent install/uninstall, dmg mount and copy, deb install/remove, AppImage | `installers` workflow, on main and on demand |
| sheet | Every E2E screenshot stitched into one HTML page | `contact sheet` job after `e2e` |

Pixel baselines are captured by the `snapshots` workflow on the runners,
never on a developer machine. Dispatched on a working branch it commits the
baselines to that branch; dispatched on main it opens a pull request.

## Commands

```bash
npm ci
npm run dev             # electron-vite dev: the app with hot reload
npm run dev:web         # the renderer alone in a browser, mock backend
npm run test:unit       # Vitest
npm run test:ui         # Playwright, chromium, starts the dev server itself
npm run build           # type-check + electron-vite build into out/
npm run test:e2e        # launches the built app and runs tests/e2e
npm run package         # build + electron-builder into release/ (unsigned)
npm run triage [run-id] # short digest of a CI run: failed jobs, first errors, artifacts
npm run contact-sheet <dir> <out.html>
```

## License

MIT.
