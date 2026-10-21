# Baka Drive Repository Instructions

## Product boundaries

- Keep the application free of ads, sponsorship placements, donation prompts, payment/supporter activation, crash-report transmission, and automatic update endpoints. Do not add an external endpoint or a service backend without reviewing `PRIVACY.md` and documenting the data flow.
- Never hardcode, print, or upload Telegram API hashes, login codes, session data, proxy passwords, API keys, share passwords, vault secrets, or recovery material. Test fixtures must use synthetic credentials only.
- REST, WebDAV, share, and media servers must bind to loopback only. Preserve per-request authorization and account isolation.
- Keep Telegram storage limits explicit; never describe it as unlimited storage.
- Preserve the existing `LICENSE` file byte-for-byte if one is ever added by the rightsholder; the inherited source did not include one, so this private fork does not invent a license.

## Build and test

- Front-end checks: `cd app && npm ci && npm run build:verify && npm test`.
- Native checks: `cargo clippy --manifest-path app/src-tauri/Cargo.toml --locked --all-targets -- -D warnings`.
- Check translations with `cd app && npm run i18n:check`.
- Android build and device checks are separate. Generated Android Gradle/Kotlin project files, signing keys, APKs, and AABs must not be committed; use GitHub Actions artifacts for test outputs. Never claim an Android install/launch/logcat test passed without actual device/emulator evidence.
- Update `CHANGES.md` for implementation changes and `AUDIT.md` when security/data flow/workflow conclusions change.

## GitHub workflows

- Work only against the private `CookieCums/Baka-Drive` repository. Never push to `CookieCums/Baka-drive` or `caamer20/Telegram-Drive`.
- CI may build/test and upload expiring workflow artifacts only. Do not publish releases, deploy GitHub Pages, deploy Cloudflare services, upload databases, or run live signing/payment actions.
- Keep action versions pinned to reviewed immutable commit SHAs. Do not place credentials or signing material in source or artifacts.
