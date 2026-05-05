import React, { useEffect, useState } from 'react'
import { useApp } from '../state'

export function RemotesModal({ onClose }: { onClose: () => void }): React.ReactElement {
  const repo = useApp((s) => s.selectedRepo)
  const setToast = useApp((s) => s.setToast)

  const [remotes, setRemotes] = useState<{ name: string; url: string }[]>([])
  const [name, setName] = useState('origin')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function refresh(): Promise<void> {
    if (!repo) return
    try {
      setRemotes(await window.api.git.remotes(repo.path))
    } catch (e) {
      setErr(String(e))
    }
  }

  useEffect(() => {
    void refresh()
  }, [repo?.path])

  async function add(): Promise<void> {
    if (!repo || !name.trim() || !url.trim()) return
    setBusy(true)
    setErr('')
    const r = await window.api.git.addRemote(repo.path, name.trim(), url.trim())
    setBusy(false)
    if (!r.ok) {
      setErr(r.stderr)
      return
    }
    setUrl('')
    setToast(`Added remote ${name.trim()}`)
    await refresh()
  }

  async function remove(n: string): Promise<void> {
    if (!repo) return
    setBusy(true)
    const r = await window.api.git.removeRemote(repo.path, n)
    setBusy(false)
    if (!r.ok) {
      setErr(r.stderr)
      return
    }
    await refresh()
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Remotes</h3>
        {remotes.length === 0 ? (
          <div style={{ color: '#888', marginBottom: 8 }}>No remotes configured.</div>
        ) : (
          <div style={{ marginBottom: 12 }}>
            {remotes.map((r) => (
              <div
                key={r.name}
                className="row"
                style={{ alignItems: 'center', gap: 8, marginBottom: 4 }}
              >
                <span style={{ width: 80, color: '#aaa' }}>{r.name}</span>
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: 'monospace'
                  }}
                  title={r.url}
                >
                  {r.url}
                </span>
                <button onClick={() => void remove(r.name)} disabled={busy}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <h4 style={{ margin: '8px 0' }}>Add remote</h4>
        <div className="row">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="origin" />
        </div>
        <div className="row">
          <label>URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo.git or git@github.com:owner/repo.git"
          />
        </div>
        {err && <div style={{ color: '#d97a7a', whiteSpace: 'pre-wrap' }}>{err}</div>}
        <div className="row" style={{ marginTop: 16 }}>
          <span style={{ flex: 1 }} />
          <button onClick={onClose}>Close</button>
          <button onClick={add} disabled={busy || !name.trim() || !url.trim()}>
            {busy ? 'Working…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
