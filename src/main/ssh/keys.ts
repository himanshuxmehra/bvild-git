import { spawn } from 'node:child_process'
import { existsSync, chmodSync, readFileSync } from 'node:fs'
import { getPaths } from '../paths'

export function hasKey(): boolean {
  const { sshKey, sshPubKey } = getPaths()
  return existsSync(sshKey) && existsSync(sshPubKey)
}

export function readPublicKey(): string {
  return readFileSync(getPaths().sshPubKey, 'utf8').trim()
}

export function generateKey(comment = 'bvild-app'): Promise<void> {
  const { sshKey } = getPaths()
  if (hasKey()) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const p = spawn('ssh-keygen', ['-t', 'ed25519', '-f', sshKey, '-N', '', '-C', comment], {
      stdio: 'ignore'
    })
    p.on('error', reject)
    p.on('exit', (code) => {
      if (code !== 0) return reject(new Error(`ssh-keygen exited ${code}`))
      try {
        chmodSync(sshKey, 0o600)
      } catch {
        /* ignore on windows */
      }
      resolve()
    })
  })
}
