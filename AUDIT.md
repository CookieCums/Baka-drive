# Baka Drive Repository Audit

**Source baseline:** `CookieCums/Baka-drive` commit `cdf799ab82473bcdfbd3e0d7195654420951d1d5` (2026-10-15).  
**Purpose:** identify inherited release/deployment paths, external data transfers, updater configuration, advertising/payment systems, permissions, and identity that must not carry into Baka Drive.

## Confirmed high-risk paths in the source baseline

### Workflows
- `.github/workflows/release.yml`: builds signed/release artifacts, uploads packages/SBOMs and publishes GitHub releases; also dispatches Pages deployment. Do not reuse as CI.
- `.github/workflows/pages.yml`: deploys GitHub Pages and fetches an updater manifest.
- `.github/workflows/supporter-service.yml`: can deploy a Cloudflare Worker and apply remote D1 migrations.
- `.github/workflows/supporter-backup.yml`: exports supporter database data and uploads backup archives to Cloudflare R2 using secrets.
- `.github/workflows/arch-package.yml`: downloads a prebuilt Debian package from the original project as an Arch packaging input.
- `.github/workflows/quality-assurance.yml` and `dependency-assurance.yml`: include supporter-service test/assurance steps.
- `.github/workflows/desktop-sync-ci.yml`, `i18n.yml`, and `visual-regression.yml`: CI/test workflows; review their dependencies before reusing.
- The Baka Drive working tree replaces these workflows with a single CI-only workflow. It does not intentionally publish releases, deploy Pages/Workers, or perform remote backups.

### Updater, permissions, and identity
- `app/src-tauri/tauri.conf.json:9-11`: original updater endpoints referenced the original GitHub releases and `telegram-drive.com`; the same config contained an updater verification public key. The public key is not a private signing secret.
- `app/src-tauri/tauri.conf.json:14,16`: original product name and bundle identifier.
- `app/src-tauri/capabilities/default.json`: updater permission, shell-open permission, broad external HTTP(S) opener scope, and filesystem access.
- `app/src-tauri/capabilities/mobile.json`: mobile filesystem scopes and broad external URL opener.
- The working tree removes updater configuration and updater permissions, changes the product/bundle identifier, and tightens the webview frame policy. URL-opening and filesystem permissions still require feature-by-feature review.

### Network, telemetry, and advertising
- `app/src-tauri/src/commands/crash_reporting.rs:56-94` and `app/src/services/crashTelemetry.ts:47+`: consent-gated crash report transport and metadata submission.
- `app/src/services/sponsorLinks.ts:3,11-34`: hardcoded advertising destination, placement label, and external navigation.
- `app/src-tauri/src/sponsor_link_bridge.rs:23,35,46-48`: advertising-specific webview bridge and wildcard-origin message forwarding.
- Telegram API requests and the local REST/WebDAV/media services are core product behavior and are intentionally retained. Do not log Telegram API hashes, session material, or credentials.

### Payment/supporter system
- Frontend: `app/src/context/SupporterContext.tsx`, `app/src/components/shared/SupporterOfferDialog.tsx`, `app/src/components/mobile/MobileSupporterCard.tsx`, `app/src/components/desktop/dashboard/settings/SupporterSettingsSection.tsx`, and `app/src/services/supporter*.ts`.
- Native: `app/src-tauri/src/commands/supporter.rs`.
- Service/deployment: `supporter-service/src/*`, `supporter-service/wrangler.jsonc`, migrations, and supporter workflow files.
- Funding/donation/docs: `.github/FUNDING.yml`, `app/public/donation/*`, `SUPPORTER_*.md`, and `SUPPORTER_SERVICE.md`.
- This is a cross-layer feature, not merely a UI panel. The working tree removes the supporter service, related workflows, payment UI/services, donation assets, and related docs/settings. The root `LICENSE` is not intentionally modified.

## Validation and remaining review

- A repository guard script now checks Baka Drive identity, updater absence, selected inherited ad/payment/updater endpoints, SHA-pinned workflow actions, absence of deployment permissions/commands, and retired service directory.
- The full frontend build/bundle verification and localization check passed in the Termux working copy. Rust Clippy passed in a prior local run. Playwright cannot run directly on Android because its browser runtime reports `Unsupported platform: android`; it must run in Linux CI.
- Android APK generation, emulator installation/launch, and screen/logcat confirmation have **not** yet been completed.
- The initial review was not a fully exhaustive line-by-line inventory of every network call, shell download, dynamic evaluation, and secret-like value across all source files. The guard checks known inherited endpoints and obvious secret formats; it is not a substitute for a complete independent security review.
- Do not claim the application is release-ready until GitHub Actions passes, Android runtime evidence exists, and remaining permission/network review is completed.
