import { app } from 'electron'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'

const isWin = process.platform === 'win32'

export const NULL_DEVICE = isWin ? 'NUL' : '/dev/null'

export interface AppPaths {
  root: string
  gitconfig: string
  fakeHome: string
  fakeHomeGitconfig: string
  xdgConfigHome: string
  sshDir: string
  sshKey: string
  sshPubKey: string
  knownHosts: string
  reposDb: string
  askpassSocket: string
}

let cached: AppPaths | null = null

export function getPaths(): AppPaths {
  if (cached) return cached
  const root = app.getPath('userData')
  const fakeHome = join(root, 'fakehome')
  const xdgConfigHome = join(root, 'xdg')
  const sshDir = join(root, 'ssh')

  for (const d of [root, fakeHome, xdgConfigHome, sshDir, join(xdgConfigHome, 'git')]) {
    mkdirSync(d, { recursive: true })
  }

  cached = {
    root,
    gitconfig: join(root, 'gitconfig'),
    fakeHome,
    fakeHomeGitconfig: join(fakeHome, '.gitconfig'),
    xdgConfigHome,
    sshDir,
    sshKey: join(sshDir, 'id_ed25519'),
    sshPubKey: join(sshDir, 'id_ed25519.pub'),
    knownHosts: join(sshDir, 'known_hosts'),
    reposDb: join(root, 'repos.db'),
    askpassSocket: isWin
      ? `\\\\.\\pipe\\bvild-askpass-${process.pid}`
      : join(root, `askpass-${process.pid}.sock`)
  }
  return cached
}
