import { create } from 'zustand'
import type { BranchInfo, Commit, FileStatus, Repo } from '../../shared/types'

interface AppState {
  repos: Repo[]
  selectedRepo: Repo | null
  tab: 'changes' | 'history' | 'branches'
  status: FileStatus[]
  selectedFile: string | null
  diff: string
  commits: Commit[]
  selectedCommit: string | null
  commitDiff: string
  branches: BranchInfo[]
  busy: boolean
  toast: string | null

  refreshRepos(): Promise<void>
  selectRepo(r: Repo | null): Promise<void>
  setTab(t: AppState['tab']): void
  refreshStatus(): Promise<void>
  refreshLog(): Promise<void>
  refreshBranches(): Promise<void>
  selectFile(path: string | null, staged: boolean): Promise<void>
  selectCommit(sha: string | null): Promise<void>
  setBusy(b: boolean): void
  setToast(t: string | null): void
}

export const useApp = create<AppState>((set, get) => ({
  repos: [],
  selectedRepo: null,
  tab: 'changes',
  status: [],
  selectedFile: null,
  diff: '',
  commits: [],
  selectedCommit: null,
  commitDiff: '',
  branches: [],
  busy: false,
  toast: null,

  async refreshRepos() {
    set({ repos: await window.api.repos.list() })
  },
  async selectRepo(r) {
    set({
      selectedRepo: r,
      status: [],
      selectedFile: null,
      diff: '',
      commits: [],
      selectedCommit: null,
      commitDiff: '',
      branches: []
    })
    if (r) {
      await Promise.all([get().refreshStatus(), get().refreshLog(), get().refreshBranches()])
    }
  },
  setTab(t) {
    set({ tab: t })
  },
  async refreshStatus() {
    const r = get().selectedRepo
    if (!r) return
    set({ status: await window.api.git.status(r.path) })
  },
  async refreshLog() {
    const r = get().selectedRepo
    if (!r) return
    set({ commits: await window.api.git.log(r.path, 200) })
  },
  async refreshBranches() {
    const r = get().selectedRepo
    if (!r) return
    set({ branches: await window.api.git.branches(r.path) })
  },
  async selectFile(path, staged) {
    const r = get().selectedRepo
    set({ selectedFile: path })
    if (!r || !path) {
      set({ diff: '' })
      return
    }
    set({ diff: await window.api.git.diff(r.path, path, staged) })
  },
  async selectCommit(sha) {
    const r = get().selectedRepo
    set({ selectedCommit: sha })
    if (!r || !sha) {
      set({ commitDiff: '' })
      return
    }
    set({ commitDiff: await window.api.git.diffCommit(r.path, sha) })
  },
  setBusy(b) {
    set({ busy: b })
  },
  setToast(t) {
    set({ toast: t })
    if (t) setTimeout(() => set({ toast: null }), 3500)
  }
}))
