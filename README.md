# Baka Drive

Baka Drive is a desktop and Android file workspace built with Tauri 2, Rust, React, and TypeScript. It connects directly to Telegram using the API credentials you provide and helps you browse, upload, download, organize, preview, protect, and synchronize files held in your Telegram account.

> **Attribution:** Based on Telegram Drive by caamer20.
>
> **Licensing notice:** The source tree used for this private fork did not contain a `LICENSE` file, and its upstream packaging notice explicitly says it does not grant additional rights. No license has been invented or changed here. Keep this repository private and do not redistribute binaries or source until redistribution rights are clarified.

## What it does

- Connects directly to Telegram through its MTProto API with your own API ID and API hash.
- Organizes Telegram files and folders, with search, upload/download queues, sharing, previews, and media playback.
- Supports optional encryption workflows and local vault controls.
- Offers optional loopback-only REST and WebDAV services, which you enable and configure in the app.
- Stores account session data, configuration, caches, and local encryption state on the device. It does not provide a separate hosted file-storage service.
- Contains no sponsor advertisements, supporter purchases, donation addresses, crash-reporting service, or automatic updater endpoints in this fork.

Telegram remains a third-party service. Storage limits, file availability, account restrictions, and privacy practices are governed by Telegram. Baka Drive does not promise unlimited storage.

## Platforms

The application uses Tauri 2 and targets Windows, macOS, Linux, and Android. Android uses a minimum SDK of 24. Cross-platform builds and Android APK generation are configured in GitHub Actions; generated installers and the Android debug APK are uploaded as workflow artifacts, not published as releases.

## Build locally

Requirements: Node.js 22 or newer, npm, Rust stable, and the native platform prerequisites documented by Tauri 2. Android builds additionally require JDK 17 or newer, Android SDK command-line tools, the platform SDK, and NDK.

```sh
cd app
npm ci
npm run build:verify
npm test
npm run tauri dev
```

For native Rust static checks:

```sh
cargo clippy --manifest-path app/src-tauri/Cargo.toml --locked --all-targets -- -D warnings
```

For Android, initialize the generated Android project if it is not present, then build a debug APK:

```sh
cd app
npm run tauri android init
npm run tauri android build --apk --debug
```

The generated Android Gradle project stays out of Git. Do not check in Android signing keys, generated native Android project files, API hashes, Telegram sessions, app secrets, or any user data.

## CI artifacts

Open the **Actions** tab and select the latest successful **Baka Drive CI** run. Download platform installers/build outputs and the Android debug APK from its artifacts. This fork intentionally has no release publishing, Pages deployment, or production signing workflow.

## Data and security

Authentication and file transfers connect to Telegram. Remote URL upload, when used, necessarily contacts the URL the user supplies. Local REST/WebDAV/share/media endpoints are served by the app and should remain loopback-only; do not forward their ports to a LAN or the public Internet. Treat the Telegram API hash, login codes, session, generated API key, WebDAV URL, share password, proxy password, and vault recovery material as secrets.

See [PRIVACY.md](PRIVACY.md), [SECURITY.md](SECURITY.md), [WEBDAV_GUIDE.md](WEBDAV_GUIDE.md), and [REST_API_Documentation.md](REST_API_Documentation.md). The encryption implementation has not received an independent security audit; test with disposable data and maintain independent backups.
