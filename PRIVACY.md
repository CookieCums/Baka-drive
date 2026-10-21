# Baka Drive Privacy Policy

Baka Drive is a local-first client for Telegram. It does not operate a cloud account service, file-storage relay, advertising service, supporter/payment service, crash-reporting endpoint, or automatic updater in this fork.

## Telegram connections

You provide your own Telegram API ID and API hash. Baka Drive uses these credentials to authenticate to Telegram and perform the actions you request. Telegram receives the account, request, file, and transport metadata needed to provide the service. Telegram's terms, limits, and privacy policy apply to data stored there.

The API hash and Telegram session are credentials. The application stores them locally using platform credential storage/session storage and does not intentionally print them to logs. Do not share them in screenshots, bug reports, or chat messages.

## Local data

Configuration, session state, transfer queues, search/sync metadata, previews, and caches are stored locally. Optional encryption protects selected file content according to the chosen workflow; standard uploads are not automatically encrypted by the application. Lost encryption passphrases or recovery material may make protected data unrecoverable.

## Connections you initiate

- File uploads/downloads and account actions connect directly to Telegram.
- Remote URL upload contacts the source URL you explicitly enter; that source server can observe the request and the network address making it.
- Optional REST, WebDAV, media-streaming, and share-link services are hosted by the running application. They should bind only to loopback and be enabled only when needed. Their generated API keys, capability URLs, and passwords are credentials.
- Opening links in a browser or using platform integrations makes a request to the destination you choose.

Baka Drive does not send advertising impressions, purchase or donation events, usage analytics, or crash reports from this fork. No external updater manifest is configured.

## Retention and controls

You can sign out, clear local caches, disable optional local servers, revoke share links, lock the encryption vault, and remove the app's local data through the operating system. Removing local state does not remove files already stored in Telegram; remove those through Telegram/Baka Drive as appropriate.

## Limitations

This project has not received a complete independent security or cryptographic audit. This policy describes the intended behavior of the fork, not a guarantee that software or third-party services are free of defects. Report suspected privacy or security issues without including credentials, session files, private file names, contents, or recovery material.
