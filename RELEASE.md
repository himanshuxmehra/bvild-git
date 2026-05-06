# Release Process

This document explains how to ship new versions of bvild to users.

## Overview

Releases are **tag-driven**: pushing a git tag like `v0.1.1` triggers a GitHub Actions workflow that builds the app for macOS, Windows, and Linux, then publishes the installers to a GitHub Release. Existing users with the app installed receive the update automatically via `electron-updater`.

```
bump version → commit → tag → push tag → CI builds → GitHub Release → users auto-update
```

## How to cut a release

1. Make sure `main` is in a state you want to ship.

2. Bump the version in [package.json](package.json):
   ```json
   "version": "0.1.1"
   ```

3. Commit the bump:
   ```sh
   git add package.json package-lock.json
   git commit -m "bump version to 0.1.1"
   git push origin main
   ```

4. Create and push the tag:
   ```sh
   git tag v0.1.1
   git push origin v0.1.1
   ```

5. Watch the build at: https://github.com/himanshuxmehra/bvild-git/actions

6. When green, the release appears at: https://github.com/himanshuxmehra/bvild-git/releases

That's it. No manual upload, no manual release creation.

## Versioning

Follow [semver](https://semver.org/):

- `v0.1.0` → `v0.1.1` — bug fixes only
- `v0.1.0` → `v0.2.0` — new features (backwards compatible)
- `v0.1.0` → `v1.0.0` — breaking changes

The tag must start with `v` to trigger the workflow (see [.github/workflows/release.yml](.github/workflows/release.yml)).

## Where users download

- All releases: https://github.com/himanshuxmehra/bvild-git/releases
- Latest release (permalink): https://github.com/himanshuxmehra/bvild-git/releases/latest
- Specific version: https://github.com/himanshuxmehra/bvild-git/releases/tag/v0.1.1

Each release page lists installers per platform:
- **macOS**: `.dmg` (arm64 + x64)
- **Windows**: `.exe` (NSIS installer, x64)
- **Linux**: `.AppImage` and `.deb`

## Auto-updates for existing users

Already-installed apps check GitHub Releases on startup via `electron-updater`. If a newer version is available:
1. The update downloads silently in the background
2. The user is prompted to restart
3. On restart, the new version is installed

Configured in [src/main/index.ts](src/main/index.ts) — runs only in packaged builds, not in dev.

### Caveats

- **macOS auto-update requires code signing + notarization.** Without it, the updater can download but won't be allowed to install. Apple Developer Program: ~$99/year.
- **Windows auto-update works without signing**, but users see a SmartScreen warning on first install. Code signing certs: ~$200-400/year.
- **Linux AppImage** auto-updates work out of the box; `.deb` does not (users update via apt or manual download).

Until signing is set up, treat releases as manual-download for macOS users.

## Release notes

GitHub auto-generates release notes from commits/PRs since the last tag. To customize:

- Edit the release on the Releases page after the workflow finishes, or
- Add a `.github/release.yml` to categorize entries (Features, Fixes, etc.)

## Pre-release / draft mode

To review a build before users get it, change `--publish always` to `--publish onTagOrDraft` in [.github/workflows/release.yml](.github/workflows/release.yml). The workflow will create a **draft** release — invisible to users and to the auto-updater — until you click "Publish" on the Releases page.

For pre-releases (betas, RCs), tag with a suffix:
```sh
git tag v0.2.0-beta.1
```
Then mark the release as "pre-release" on GitHub. Auto-updater ignores pre-releases by default.

## Troubleshooting

**Workflow failed on macOS with a signing error.**
Expected if you haven't set up signing. The workflow currently builds unsigned — if it's failing on this, check that `electron-builder.yml` doesn't require signing (no `CSC_LINK` env var being checked).

**Tag pushed but no workflow ran.**
The tag must start with `v` (e.g. `v1.0.0`, not `1.0.0` or `release-1.0.0`). Check [.github/workflows/release.yml](.github/workflows/release.yml).

**Users on older versions aren't updating.**
- Confirm the release is **published** (not draft).
- Confirm the new version's `package.json` version is higher than what users have.
- Check the user's app logs — `electron-updater` logs the check result.

**Need to delete a bad release.**
Delete both the GitHub Release (Releases page → Edit → Delete) **and** the git tag:
```sh
git push origin :refs/tags/v0.1.1
git tag -d v0.1.1
```

## Costs

All free, assuming the repo stays public:
- GitHub Actions: unlimited minutes for public repos
- GitHub Releases: unlimited storage and bandwidth
- Auto-update server: GitHub Releases acts as the update feed — no infra needed

If the repo becomes private, Actions is limited to 2,000 minutes/month free, and macOS runners consume 10x. Plan accordingly.
