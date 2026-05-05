import React, { useState } from 'react'
import { useApp } from '../state'
import { DiffView } from './DiffView'

export function Changes(): React.ReactElement {
  const repo = useApp((s) => s.selectedRepo)
  const status = useApp((s) => s.status)
  const selectedFile = useApp((s) => s.selectedFile)
  const diff = useApp((s) => s.diff)
  const refreshStatus = useApp((s) => s.refreshStatus)
  const selectFile = useApp((s) => s.selectFile)
  const setToast = useApp((s) => s.setToast)
  const setBusy = useApp((s) => s.setBusy)

  const [message, setMessage] = useState('')

  const staged = status.filter((f) => f.staged)
  const unstaged = status.filter((f) => !f.staged)
  const stagedSet = new Set(staged.map((f) => f.path))

  async function stage(path: string): Promise<void> {
    if (!repo) return
    setBusy(true)
    const r = await window.api.git.stage(repo.path, [path])
    setBusy(false)
    if (!r.ok) setToast(r.stderr)
    await refreshStatus()
  }
  async function unstage(path: string): Promise<void> {
    if (!repo) return
    setBusy(true)
    const r = await window.api.git.unstage(repo.path, [path])
    setBusy(false)
    if (!r.ok) setToast(r.stderr)
    await refreshStatus()
  }
  async function stageAll(): Promise<void> {
    if (!repo || unstaged.length === 0) return
    setBusy(true)
    const r = await window.api.git.stage(repo.path, unstaged.map((f) => f.path))
    setBusy(false)
    if (!r.ok) setToast(r.stderr)
    await refreshStatus()
  }
  async function unstageAll(): Promise<void> {
    if (!repo || staged.length === 0) return
    setBusy(true)
    const r = await window.api.git.unstage(repo.path, staged.map((f) => f.path))
    setBusy(false)
    if (!r.ok) setToast(r.stderr)
    await refreshStatus()
  }
  async function doCommit(): Promise<void> {
    if (!repo || !message.trim() || staged.length === 0) return
    setBusy(true)
    const r = await window.api.git.commit(repo.path, message.trim())
    setBusy(false)
    if (!r.ok) {
      setToast(r.stderr || 'commit failed')
    } else {
      setMessage('')
      setToast('Committed')
    }
    await refreshStatus()
    await useApp.getState().refreshLog()
  }

  return (
    <div className="body">
      <div className="changes">
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ padding: '6px 10px', color: '#888', textTransform: 'uppercase', fontSize: 11, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1 }}>Staged ({staged.length})</span>
            <button
              style={{ textTransform: 'none', fontSize: 11 }}
              onClick={() => void unstageAll()}
              disabled={staged.length === 0}
            >
              Unstage all
            </button>
          </div>
          {staged.map((f) => (
            <div
              key={'s:' + f.path}
              className={'file ' + (selectedFile === f.path && stagedSet.has(f.path) ? 'selected' : '')}
              onClick={() => selectFile(f.path, true)}
            >
              <button onClick={(e) => { e.stopPropagation(); void unstage(f.path) }}>−</button>
              <span style={{ width: 18, color: '#888' }}>{f.index}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.path}</span>
            </div>
          ))}
          <div style={{ padding: '6px 10px', color: '#888', textTransform: 'uppercase', fontSize: 11, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1 }}>Changes ({unstaged.length})</span>
            <button
              style={{ textTransform: 'none', fontSize: 11 }}
              onClick={() => void stageAll()}
              disabled={unstaged.length === 0}
            >
              Stage all
            </button>
          </div>
          {unstaged.map((f) => (
            <div
              key={'u:' + f.path}
              className={'file ' + (selectedFile === f.path && !stagedSet.has(f.path) ? 'selected' : '')}
              onClick={() => selectFile(f.path, false)}
            >
              <button onClick={(e) => { e.stopPropagation(); void stage(f.path) }}>+</button>
              <span style={{ width: 18, color: '#888' }}>{f.untracked ? '?' : f.worktree}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.path}</span>
            </div>
          ))}
        </div>
        <div className="commit-box">
          <textarea
            placeholder="Commit message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={doCommit} disabled={staged.length === 0 || !message.trim()}>
            Commit {staged.length} file{staged.length === 1 ? '' : 's'}
          </button>
        </div>
      </div>
      <DiffView text={diff} />
    </div>
  )
}
