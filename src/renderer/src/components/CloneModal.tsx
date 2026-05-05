import React, { useState } from 'react'
import { useApp } from '../state'

export function CloneModal({ onClose }: { onClose: () => void }): React.ReactElement {
  const [url, setUrl] = useState('')
  const [dest, setDest] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const refreshRepos = useApp((s) => s.refreshRepos)

  async function pickDest(): Promise<void> {
    const d = await window.api.repos.pickCloneDest()
    if (d) setDest(d)
  }
  async function go(): Promise<void> {
    if (!url || !dest) return
    setBusy(true)
    setErr('')
    const r = await window.api.git.clone(url, dest)
    setBusy(false)
    if (!r.ok) {
      setErr(r.stderr)
      return
    }
    await window.api.repos.add(dest)
    await refreshRepos()
    onClose()
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Clone repository</h3>
        <div className="row">
          <label>URL</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/owner/repo.git or git@github.com:owner/repo.git" />
        </div>
        <div className="row">
          <label>Destination</label>
          <input value={dest} onChange={(e) => setDest(e.target.value)} />
          <button onClick={pickDest}>Browse…</button>
        </div>
        {err && <div style={{ color: '#d97a7a', whiteSpace: 'pre-wrap' }}>{err}</div>}
        <div className="row" style={{ marginTop: 16 }}>
          <span style={{ flex: 1 }} />
          <button onClick={onClose}>Cancel</button>
          <button onClick={go} disabled={busy || !url || !dest}>{busy ? 'Cloning…' : 'Clone'}</button>
        </div>
      </div>
    </div>
  )
}
