import { writeFileSync, existsSync } from 'node:fs'
import { getPaths, NULL_DEVICE } from '../paths'
import { helperPath as askpassHelper } from '../auth/askpass'

const isWin = process.platform === 'win32'

function ensureGitconfig(): void {
  const { gitconfig, fakeHomeGitconfig } = getPaths()
  if (!existsSync(gitconfig)) {
    writeFileSync(
      gitconfig,
      `# bvild app gitconfig — fully isolated from system git\n` +
        `[init]\n\tdefaultBranch = main\n` +
        `[credential]\n\thelper =\n`,
      { mode: 0o600 }
    )
  }
  if (!existsSync(fakeHomeGitconfig)) {
    writeFileSync(fakeHomeGitconfig, '# bvild fakehome stub\n', { mode: 0o600 })
  }
}

function buildSshCommand(): string {
  const { sshKey, knownHosts } = getPaths()
  const q = (s: string) => `"${s.replace(/"/g, '\\"')}"`
  return [
    'ssh',
    '-i', q(sshKey),
    '-F', NULL_DEVICE,
    '-o', 'IdentitiesOnly=yes',
    '-o', 'IdentityAgent=none',
    '-o', `UserKnownHostsFile=${q(knownHosts)}`,
    '-o', `GlobalKnownHostsFile=${NULL_DEVICE}`,
    '-o', 'PreferredAuthentications=publickey',
    '-o', 'StrictHostKeyChecking=accept-new'
  ].join(' ')
}

export function gitEnv(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  ensureGitconfig()
  const p = getPaths()

  const base: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    LANG: process.env.LANG ?? 'C.UTF-8',
    LC_ALL: 'C.UTF-8',
    TMPDIR: process.env.TMPDIR,
    TEMP: process.env.TEMP,
    TMP: process.env.TMP,
    SystemRoot: process.env.SystemRoot,
    HOME: p.fakeHome,
    USERPROFILE: p.fakeHome,
    XDG_CONFIG_HOME: p.xdgConfigHome,
    GIT_CONFIG_GLOBAL: p.gitconfig,
    GIT_CONFIG_SYSTEM: NULL_DEVICE,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_TERMINAL_PROMPT: '0',
    GIT_SSH_COMMAND: buildSshCommand(),
    GIT_ASKPASS: askpassHelper(),
    SSH_ASKPASS: askpassHelper(),
    DISPLAY: process.env.DISPLAY
  }

  if (isWin) delete base.TMPDIR
  for (const k of Object.keys(base)) if (base[k] === undefined) delete base[k]

  return { ...base, ...extra }
}

