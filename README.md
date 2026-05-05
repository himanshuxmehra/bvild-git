# bvild

A cross-platform desktop git client with fully isolated git identity management.

## What it does

bvild is an Electron-based git GUI that keeps your git configuration, SSH keys, credentials, and known hosts completely separate from your system git setup. Every git operation runs inside a sandboxed environment — no leakage to or from `~/.gitconfig`, `~/.ssh`, or system credential helpers.

**Key features:**
- Stage, commit, and view diffs
- Browse branch history and manage branches
- Clone repos via HTTPS (GitHub OAuth) or SSH
- Manage remotes
- Per-app SSH key, isolated from your system SSH agent
- GitHub OAuth login stored securely in the OS keychain
- SQLite-backed repo list

## Tech stack

- **Electron** + **React** + **TypeScript**
- **electron-vite** for build/dev
- **dugite** for bundled git binary
- **better-sqlite3** for local repo database
- **keytar** for OS keychain access (GitHub tokens)
- **zustand** for frontend state

## Development

```bash
npm install
npm run dev
```

## Build

```bash
# macOS
npm run package:mac

# Windows
npm run package:win

# Linux
npm run package:linux
```

## How identity isolation works

All git operations run with a custom environment (`GIT_CONFIG_GLOBAL`, `GIT_CONFIG_SYSTEM`, `GIT_CONFIG_NOSYSTEM`, `HOME`, `GIT_SSH_COMMAND`) pointing to an app-managed directory instead of the user's home. This means:

- System `~/.gitconfig` is never read or modified
- System SSH keys and `ssh-agent` are never used
- A dedicated SSH keypair is generated and managed by the app
- Credentials are stored via the OS keychain, not git's credential helper

## License

MIT
