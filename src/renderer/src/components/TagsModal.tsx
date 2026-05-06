import React, { useEffect, useState } from 'react'
import { useApp } from '../state'

export function TagsModal({ onClose }: { onClose: () => void }): React.ReactElement {
  const repo = useApp((s) => s.selectedRepo)
  const setToast = useApp((s) => s.setToast)

  const [tags, setTags] = useState<string[]>([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [ref, setRef] = useState('')
  const [pushAfter, setPushAfter] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function refresh(): Promise<void> {
    if (!repo) return
    try {
      setTags(await window.api.git.tags(repo.path))
    } catch (e) {
      setErr(String(e))
    }
  }

  useEffect(() => {
    void refresh()
  }, [repo?.path])

  async function create(): Promise<void> {
    if (!repo || !name.trim()) return
    setBusy(true)
    setErr('')
    const r = await window.api.git.createTag(
      repo.path,
      name.trim(),
      message.trim() || undefined,
      ref.trim() || undefined
    )
    if (!r.ok) {
      setBusy(false)
      setErr(r.stderr)
      return
    }
    if (pushAfter) {
      const p = await window.api.git.pushTag(repo.path, name.trim())
      if (!p.ok) {
        setBusy(false)
        setErr(p.stderr)
        await refresh()
        return
      }
      setToast(`Created and pushed tag ${name.trim()}`)
    } else {
      setToast(`Created tag ${name.trim()}`)
    }
    setBusy(false)
    setName('')
    setMessage('')
    setRef('')
    await refresh()
  }

  async function remove(t: string): Promise<void> {
    if (!repo) return
    setBusy(true)
    setErr('')
    const r = await window.api.git.deleteTag(repo.path, t)
    setBusy(false)
    if (!r.ok) {
      setErr(r.stderr)
      return
    }
    setToast(`Deleted tag ${t}`)
    await refresh()
  }

  async function push(t: string): Promise<void> {
    if (!repo) return
    setBusy(true)
    setErr('')
    const r = await window.api.git.pushTag(repo.path, t)
    setBusy(false)
    if (!r.ok) {
      setErr(r.stderr)
      return
    }
    setToast(`Pushed tag ${t}`)
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Tags</h3>
        {tags.length === 0 ? (
          <div style={{ color: '#888', marginBottom: 8 }}>No tags yet.</div>
        ) : (
          <div style={{ marginBottom: 12, maxHeight: 200, overflow: 'auto' }}>
            {tags.map((t) => (
              <div
                key={t}
                className="row"
                style={{ alignItems: 'center', gap: 8, marginBottom: 4 }}
              >
                <span style={{ flex: 1, fontFamily: 'monospace' }}>{t}</span>
                <button onClick={() => void push(t)} disabled={busy}>
                  Push
                </button>
                <button onClick={() => void remove(t)} disabled={busy}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        <h4 style={{ margin: '8px 0' }}>Create tag</h4>
        <div className="row">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="v0.1.0" />
        </div>
        <div className="row">
          <label>Message</label>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="(optional — annotated tag if set)"
          />
        </div>
        <div className="row">
          <label>Ref</label>
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="(optional — defaults to HEAD)"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0' }}>
          <input
            id="push-after-tag"
            type="checkbox"
            checked={pushAfter}
            onChange={(e) => setPushAfter(e.target.checked)}
            style={{ width: 'auto', flex: 'none', margin: 0 }}
          />
          <label htmlFor="push-after-tag" style={{ width: 'auto', textTransform: 'none', letterSpacing: 0, cursor: 'pointer' }}>
            Push to origin after creating
          </label>
        </div>
        {err && <div style={{ color: '#d97a7a', whiteSpace: 'pre-wrap' }}>{err}</div>}
        <div className="row" style={{ marginTop: 16 }}>
          <span style={{ flex: 1 }} />
          <button onClick={onClose}>Close</button>
          <button onClick={create} disabled={busy || !name.trim()}>
            {busy ? 'Working…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
