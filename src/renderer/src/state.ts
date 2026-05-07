import { create } from 'zustand'
import type { BranchInfo, Commit, FileStatus, Repo } from '../../shared/types'

export type Theme =
  | 'slate-cyan'
  | 'copper'
  | 'navy-amber'
  | 'graphite-blue'
  | 'plum-rose'
  | 'forest-green'
  | 'ink-gold'

export type Mode = 'dark' | 'light'

export const THEMES: { id: Theme; label: string }[] = [
  { id: 'slate-cyan',    label: 'Slate + Cyan' },
  { id: 'copper',        label: 'Ink + Copper' },
  { id: 'navy-amber',    label: 'Navy + Amber' },
  { id: 'graphite-blue', label: 'Graphite + Blue' },
  { id: 'plum-rose',     label: 'Plum + Rose' },
  { id: 'forest-green',  label: 'Forest + Green' },
  { id: 'ink-gold',      label: 'Ink + Gold' },
]

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
  theme: Theme
  mode: Mode

  refreshRepos(): Promise<void>
  removeRepo(id: number): Promise<void>
  selectRepo(r: Repo | null): Promise<void>
  setTab(t: AppState['tab']): void
  refreshStatus(): Promise<void>
  refreshLog(): Promise<void>
  refreshBranches(): Promise<void>
  selectFile(path: string | null, staged: boolean): Promise<void>
  selectCommit(sha: string | null): Promise<void>
  setBusy(b: boolean): void
  setToast(t: string | null): void
  setTheme(t: Theme): void
  setMode(m: Mode): void
}

const storedTheme = (localStorage.getItem('bvild-theme') as Theme | null) ?? 'slate-cyan'
const storedMode = (localStorage.getItem('bvild-mode') as Mode | null) ?? 'dark'

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
  theme: storedTheme,
  mode: storedMode,

  async refreshRepos() {
    set({ repos: await window.api.repos.list() })
  },
  async removeRepo(id) {
    await window.api.repos.remove(id)
    if (get().selectedRepo?.id === id) {
      await get().selectRepo(null)
    }
    await get().refreshRepos()
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
    const newStatus = await window.api.git.status(r.path)
    const { selectedFile } = get()
    const stillPresent = selectedFile && newStatus.some((f) => f.path === selectedFile)
    set({
      status: newStatus,
      ...(stillPresent ? {} : { selectedFile: null, diff: '' })
    })
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
  },
  setTheme(t) {
    localStorage.setItem('bvild-theme', t)
    set({ theme: t })
  },
  setMode(m) {
    localStorage.setItem('bvild-mode', m)
    set({ mode: m })
  }
}))
