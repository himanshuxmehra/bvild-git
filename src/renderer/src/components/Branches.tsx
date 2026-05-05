import React, { useState } from 'react'
import { useApp } from '../state'

export function Branches(): React.ReactElement {
  const repo = useApp((s) => s.selectedRepo)
  const branches = useApp((s) => s.branches)
  const refreshBranches = useApp((s) => s.refreshBranches)
  const refreshStatus = useApp((s) => s.refreshStatus)
  const refreshLog = useApp((s) => s.refreshLog)
  const setToast = useApp((s) => s.setToast)
  const [newName, setNewName] = useState('')

  async function checkout(b: string): Promise<void> {
    if (!repo) return
    const r = await window.api.git.checkout(repo.path, b)
    if (!r.ok) setToast(r.stderr)
    await Promise.all([refreshBranches(), refreshStatus(), refreshLog()])
  }
  async function create(): Promise<void> {
    if (!repo || !newName.trim()) return
    const r = await window.api.git.createBranch(repo.path, newName.trim())
    if (!r.ok) setToast(r.stderr)
    setNewName('')
    await Promise.all([refreshBranches(), refreshStatus(), refreshLog()])
  }
  async function del(b: string): Promise<void> {
    if (!repo) return
    if (!confirm(`Delete branch ${b}?`)) return
    const r = await window.api.git.deleteBranch(repo.path, b)
    if (!r.ok) setToast(r.stderr)
    await refreshBranches()
  }
  async function merge(b: string): Promise<void> {
    if (!repo) return
    const r = await window.api.git.merge(repo.path, b)
    if (!r.ok) setToast(r.stderr)
    await Promise.all([refreshBranches(), refreshStatus(), refreshLog()])
  }

  return (
    <div className="body" style={{ flexDirection: 'column', padding: 12, gap: 12 }}>
      <div className="row">
        <input
          placeholder="new-branch-name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ flex: 1 }}
        />
        <button onClick={create} disabled={!newName.trim()}>Create branch</button>
      </div>
      <div style={{ overflow: 'auto', flex: 1 }}>
        {branches.map((b) => (
          <div
            key={b.name}
            style={{
              padding: '8px 6px',
              borderBottom: '1px solid #2a2c30',
              display: 'flex',
              gap: 8,
              alignItems: 'center'
            }}
          >
            <span style={{ width: 16 }}>{b.current ? '●' : ''}</span>
            <span style={{ flex: 1 }}>
              {b.name}
              {b.upstream && (
                <span className="muted"> · {b.upstream} (↑{b.ahead} ↓{b.behind})</span>
              )}
            </span>
            {!b.current && <button onClick={() => checkout(b.name)}>Checkout</button>}
            {!b.current && <button onClick={() => merge(b.name)}>Merge into current</button>}
            {!b.current && <button onClick={() => del(b.name)}>Delete</button>}
          </div>
        ))}
      </div>
    </div>
  )
}
