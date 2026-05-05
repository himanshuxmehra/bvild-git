export interface Repo {
  id: number
  path: string
  name: string
  addedAt: number
}

export interface FileStatus {
  path: string
  index: string
  worktree: string
  staged: boolean
  unstaged: boolean
  untracked: boolean
}

export interface Commit {
  sha: string
  parents: string[]
  author: string
  email: string
  date: number
  subject: string
}

export interface BranchInfo {
  name: string
  current: boolean
  upstream?: string
  ahead: number
  behind: number
}

export interface GitResult {
  ok: boolean
  stdout: string
  stderr: string
  code: number
}

export interface AppIdentity {
  name: string
  email: string
}
