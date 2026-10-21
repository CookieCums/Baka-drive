# Security Policy

Baka Drive can handle Telegram session credentials, local file access, optional encryption, proxy credentials, and loopback REST/WebDAV/share services. Please report suspected issues privately to the repository owner and avoid putting sensitive details in public issues.

## Report a vulnerability

Use the repository's private vulnerability reporting feature if it is enabled for this private repository. Otherwise, contact the repository owner through a private channel before submitting technical details. Do not publish proof-of-concept material that exposes credentials or user data.

Provide only what is needed to understand the issue: affected commit/platform, the impact, concise reproduction steps using disposable data, and redacted logs.

Never include Telegram API hashes, login codes, session databases, phone numbers, private filenames or paths, file contents, proxy passwords, REST API keys, WebDAV capability URLs, share passwords, vault passphrases, recovery bundles, or signing keys.

## Safe testing

- Test only accounts, devices, systems, and services you own or have permission to test.
- Keep REST, WebDAV, streaming, and share ports loopback-only; do not expose them to a LAN or the public Internet.
- Use disposable files for encryption and recovery testing.
- Do not run production deployments or use live payment services; this fork has no payment backend.
- Do not treat a passing CI build as proof of security or as a substitute for a cryptographic review.

## License status

The inherited source tree did not include a `LICENSE` file. This repository has not added or changed a license. Keep the fork private and do not redistribute until rights are clarified.
