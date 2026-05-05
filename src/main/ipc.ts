import { dialog, ipcMain } from 'electron'
import * as svc from './git/service'
import * as repos from './db/repos'
import * as keys from './ssh/keys'
import * as gh from './auth/oauth/github'
import * as keystore from './auth/keystore'
import { setPendingHost } from './auth/askpass'
import { getPaths } from './paths'
import { AppIdentity } from '../shared/types'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export function registerIpc(): void {
  // Repos
  ipcMain.handle('repos:list', () => repos.listRepos())
  ipcMain.handle('repos:add', async (_e, path: string) => repos.addRepo(path))
  ipcMain.handle('repos:remove', (_e, id: number) => repos.removeRepo(id))
  ipcMain.handle('repos:pickFolder', async () => {
    const r = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (r.canceled || !r.filePaths[0]) return null
    const folder = r.filePaths[0]
    if (!existsSync(join(folder, '.git'))) {
      const choice = await dialog.showMessageBox({
        type: 'question',
        buttons: ['Initialize repository', 'Cancel'],
        defaultId: 0,
        cancelId: 1,
        title: 'Not a git repository',
        message: 'This folder is not a git repository.',
        detail: `Run "git init" in:\n${folder}?`
      })
      if (choice.response !== 0) return null
      const initRes = await svc.init(folder)
      if (!initRes.ok) throw new Error(initRes.stderr.trim() || 'git init failed')
    }
    return repos.addRepo(folder)
  })
  ipcMain.handle('repos:pickCloneDest', async () => {
    const r = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] })
    if (r.canceled || !r.filePaths[0]) return null
    return r.filePaths[0]
  })

  // Identity
  ipcMain.handle('identity:get', (): AppIdentity => {
    const p = getPaths()
    if (!existsSync(p.gitconfig)) return { name: '', email: '' }
    const cfg = readFileSync(p.gitconfig, 'utf8')
    const name = cfg.match(/^\s*name\s*=\s*(.+)$/m)?.[1]?.trim() ?? ''
    const email = cfg.match(/^\s*email\s*=\s*(.+)$/m)?.[1]?.trim() ?? ''
    return { name, email }
  })
  ipcMain.handle('identity:set', (_e, id: AppIdentity) => {
    const p = getPaths()
    let cfg = existsSync(p.gitconfig) ? readFileSync(p.gitconfig, 'utf8') : ''
    cfg = cfg.replace(/\[user\][\s\S]*?(?=^\[|\Z)/m, '').trim()
    cfg += `\n[user]\n\tname = ${id.name}\n\temail = ${id.email}\n`
    writeFileSync(p.gitconfig, cfg, { mode: 0o600 })
    return true
  })

  // Git ops
  ipcMain.handle('git:status', (_e, repo: string) => svc.status(repo))
  ipcMain.handle('git:log', (_e, repo: string, max?: number) => svc.log(repo, max))
  ipcMain.handle('git:diff', (_e, repo: string, path: string, staged: boolean) =>
    svc.diff(repo, path, staged)
  )
  ipcMain.handle('git:diffCommit', (_e, repo: string, sha: string) => svc.diffCommit(repo, sha))
  ipcMain.handle('git:stage', (_e, repo: string, paths: string[]) => svc.stage(repo, paths))
  ipcMain.handle('git:unstage', (_e, repo: string, paths: string[]) => svc.unstage(repo, paths))
  ipcMain.handle('git:commit', (_e, repo: string, message: string) => svc.commit(repo, message))
  ipcMain.handle('git:branches', (_e, repo: string) => svc.branches(repo))
  ipcMain.handle('git:checkout', (_e, repo: string, b: string) => svc.checkout(repo, b))
  ipcMain.handle('git:createBranch', (_e, repo: string, b: string) => svc.createBranch(repo, b))
  ipcMain.handle('git:deleteBranch', (_e, repo: string, b: string) => svc.deleteBranch(repo, b))
  ipcMain.handle('git:merge', (_e, repo: string, b: string) => svc.merge(repo, b))
  ipcMain.handle('git:fetch', (_e, repo: string) => {
    setPendingHost(hostFromRepo(repo))
    return svc.fetch(repo)
  })
  ipcMain.handle('git:pull', (_e, repo: string) => {
    setPendingHost(hostFromRepo(repo))
    return svc.pull(repo)
  })
  ipcMain.handle('git:push', (_e, repo: string, remote?: string, branch?: string) => {
    setPendingHost(hostFromRepo(repo))
    return svc.push(repo, remote, branch)
  })
  ipcMain.handle('git:remotes', (_e, repo: string) => svc.listRemotes(repo))
  ipcMain.handle('git:addRemote', (_e, repo: string, name: string, url: string) =>
    svc.addRemote(repo, name, url)
  )
  ipcMain.handle('git:removeRemote', (_e, repo: string, name: string) =>
    svc.removeRemote(repo, name)
  )
  ipcMain.handle('git:clone', (_e, url: string, dest: string) => {
    try {
      const u = new URL(url)
      setPendingHost(u.host)
    } catch {
      /* ssh-style url */
    }
    return svc.clone(url, dest)
  })

  // SSH
  ipcMain.handle('ssh:hasKey', () => keys.hasKey())
  ipcMain.handle('ssh:generate', () => keys.generateKey())
  ipcMain.handle('ssh:publicKey', () => (keys.hasKey() ? keys.readPublicKey() : null))

  // OAuth — GitHub device flow (two phases)
  ipcMain.handle('oauth:gh:start', () => gh.startDeviceFlow())
  ipcMain.handle('oauth:gh:complete', (_e, dc: gh.DeviceCode) => gh.completeDeviceFlow(dc))

  // Generic credential save (for GitLab/Bitbucket/generic HTTPS)
  ipcMain.handle(
    'creds:set',
    (_e, host: string, username: string, secret: string) =>
      keystore.setCredential({ host, username }, secret)
  )
  ipcMain.handle('creds:findByHost', (_e, host: string) => keystore.findCredentialByHost(host))
  ipcMain.handle('creds:delete', (_e, host: string, username: string) =>
    keystore.deleteCredential({ host, username })
  )
}

function hostFromRepo(_repo: string): string {
  // Best-effort; real impl would `git remote get-url origin`. We let askpass
  // parse the URL out of the prompt as the primary path; this is a fallback.
  return ''
}
