# Browser end-to-end tests

Playwright tests exercise the actual Vite application with only the native Tauri/service boundary simulated. Coverage includes authentication, navigation, localization catalogs, settings, local-server configuration, sync, transfer queues, accessibility, previews, and storage workflows.

Run with `cd app && npm ci && npx playwright install --with-deps chromium && npm test`. These tests do not prove behavior of Telegram's real service, platform credential stores, production packages, or Android. Those boundaries require platform and integration acceptance tests; never claim those checks passed without evidence.
