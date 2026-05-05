import { contextBridge, ipcRenderer } from 'electron'
import type { AppIdentity, BranchInfo, Commit, FileStatus, GitResult, Repo } from '../shared/types'

const api = {
  repos: {
    list: (): Promise<Repo[]> => ipcRenderer.invoke('repos:list'),
    add: (path: string): Promise<Repo> => ipcRenderer.invoke('repos:add', path),
    remove: (id: number): Promise<void> => ipcRenderer.invoke('repos:remove', id),
    pickFolder: (): Promise<Repo | null> => ipcRenderer.invoke('repos:pickFolder'),
    pickCloneDest: (): Promise<string | null> => ipcRenderer.invoke('repos:pickCloneDest')
  },
  identity: {
    get: (): Promise<AppIdentity> => ipcRenderer.invoke('identity:get'),
    set: (id: AppIdentity): Promise<boolean> => ipcRenderer.invoke('identity:set', id)
  },
  git: {
    status: (repo: string): Promise<FileStatus[]> => ipcRenderer.invoke('git:status', repo),
    log: (repo: string, max?: number): Promise<Commit[]> =>
      ipcRenderer.invoke('git:log', repo, max),
    diff: (repo: string, path: string, staged: boolean): Promise<string> =>
      ipcRenderer.invoke('git:diff', repo, path, staged),
    diffCommit: (repo: string, sha: string): Promise<string> =>
      ipcRenderer.invoke('git:diffCommit', repo, sha),
    stage: (repo: string, paths: string[]): Promise<GitResult> =>
      ipcRenderer.invoke('git:stage', repo, paths),
    unstage: (repo: string, paths: string[]): Promise<GitResult> =>
      ipcRenderer.invoke('git:unstage', repo, paths),
    commit: (repo: string, message: string): Promise<GitResult> =>
      ipcRenderer.invoke('git:commit', repo, message),
    branches: (repo: string): Promise<BranchInfo[]> => ipcRenderer.invoke('git:branches', repo),
    checkout: (repo: string, b: string): Promise<GitResult> =>
      ipcRenderer.invoke('git:checkout', repo, b),
    createBranch: (repo: string, b: string): Promise<GitResult> =>
      ipcRenderer.invoke('git:createBranch', repo, b),
    deleteBranch: (repo: string, b: string): Promise<GitResult> =>
      ipcRenderer.invoke('git:deleteBranch', repo, b),
    merge: (repo: string, b: string): Promise<GitResult> =>
      ipcRenderer.invoke('git:merge', repo, b),
    fetch: (repo: string): Promise<GitResult> => ipcRenderer.invoke('git:fetch', repo),
    pull: (repo: string): Promise<GitResult> => ipcRenderer.invoke('git:pull', repo),
    push: (repo: string, remote?: string, branch?: string): Promise<GitResult> =>
      ipcRenderer.invoke('git:push', repo, remote, branch),
    clone: (url: string, dest: string): Promise<GitResult> =>
      ipcRenderer.invoke('git:clone', url, dest),
    remotes: (repo: string): Promise<{ name: string; url: string }[]> =>
      ipcRenderer.invoke('git:remotes', repo),
    addRemote: (repo: string, name: string, url: string): Promise<GitResult> =>
      ipcRenderer.invoke('git:addRemote', repo, name, url),
    removeRemote: (repo: string, name: string): Promise<GitResult> =>
      ipcRenderer.invoke('git:removeRemote', repo, name)
  },
  ssh: {
    hasKey: (): Promise<boolean> => ipcRenderer.invoke('ssh:hasKey'),
    generate: (): Promise<void> => ipcRenderer.invoke('ssh:generate'),
    publicKey: (): Promise<string | null> => ipcRenderer.invoke('ssh:publicKey')
  },
  oauth: {
    githubStart: (): Promise<{
      device_code: string
      user_code: string
      verification_uri: string
      expires_in: number
      interval: number
    }> => ipcRenderer.invoke('oauth:gh:start'),
    githubComplete: (dc: unknown): Promise<{ login: string; token: string }> =>
      ipcRenderer.invoke('oauth:gh:complete', dc)
  },
  creds: {
    set: (host: string, username: string, secret: string): Promise<void> =>
      ipcRenderer.invoke('creds:set', host, username, secret),
    findByHost: (host: string): Promise<{ username: string; secret: string } | null> =>
      ipcRenderer.invoke('creds:findByHost', host),
    delete: (host: string, username: string): Promise<boolean> =>
      ipcRenderer.invoke('creds:delete', host, username)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
