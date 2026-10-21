# Change Log

## Baka Drive independence work

- Working baseline: `CookieCums/Baka-drive` at `cdf799ab82473bcdfbd3e0d7195654420951d1d5`.
- Replaced inherited release/publish, Pages deployment, Arch import, supporter-worker deployment, and supporter database-backup workflows with a CI-only workflow. The CI is configured for Linux/Windows/macOS bundles and Android debug APK/emulator smoke tests; it has not yet run on GitHub.
- Removed sponsor/ad components and bridge, supporter/payment UI and service, donation assets, crash-report transport/consent, and original-project updater integration/configuration.
- Renamed visible product identity and package metadata to Baka Drive; updated secure-store bridge naming and local app identity. Preserved Telegram login, transfer, media, encryption, and local REST/WebDAV/share functionality.
- Rewrote README, privacy/security docs, testing guidance, and added the baseline audit. The root `LICENSE` was not intentionally edited. No Telegram API hash or session values were added.
- Added repository policy checks for identity, updater removal, known inherited endpoints, action SHA pinning, and absence of deployment/release commands.

## Local validation (not GitHub Actions)

- `npm run build:verify`: **passed**; TypeScript/Vite production build and current bundle budgets passed in the Termux workspace.
- `npm run i18n:check`: **passed**.
- `cargo check --manifest-path app/src-tauri/Cargo.toml --locked`: **passed** in a prior local run.
- `cargo clippy --manifest-path app/src-tauri/Cargo.toml --locked --all-targets -- -D warnings`: **passed** in a prior local run.
- `npm test`: **not run successfully on this Android host**; Playwright exits with `Unsupported platform: android`. The workflow installs Chromium on Linux and must provide the real test result.
- Android APK build, emulator install/launch, and login-screen/logcat verification: **not yet verified**.
- Cross-platform desktop package builds and GitHub Actions run: **not yet verified**.
- No Actions run URL or green-run claim exists yet.
