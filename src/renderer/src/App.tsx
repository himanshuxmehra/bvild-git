import React, { useEffect, useState } from 'react'
import { useApp } from './state'
import { Changes } from './components/Changes'
import { History } from './components/History'
import { Branches } from './components/Branches'
import { SettingsModal } from './components/SettingsModal'
import { CloneModal } from './components/CloneModal'
import { RemotesModal } from './components/RemotesModal'
import { TagsModal } from './components/TagsModal'

export function App(): React.ReactElement {
  const repos = useApp((s) => s.repos)
  const selected = useApp((s) => s.selectedRepo)
  const tab = useApp((s) => s.tab)
  const branches = useApp((s) => s.branches)
  const busy = useApp((s) => s.busy)
  const toast = useApp((s) => s.toast)

  const refreshRepos = useApp((s) => s.refreshRepos)
  const selectRepo = useApp((s) => s.selectRepo)
  const setTab = useApp((s) => s.setTab)
  const refreshStatus = useApp((s) => s.refreshStatus)
  const refreshLog = useApp((s) => s.refreshLog)
  const refreshBranches = useApp((s) => s.refreshBranches)
  const setToast = useApp((s) => s.setToast)
  const setBusy = useApp((s) => s.setBusy)
  const theme = useApp((s) => s.theme)
  const mode = useApp((s) => s.mode)

  const [showSettings, setShowSettings] = useState(false)
  const [showClone, setShowClone] = useState(false)
  const [showRemotes, setShowRemotes] = useState(false)
  const [showTags, setShowTags] = useState(false)

  useEffect(() => {
    void refreshRepos()
  }, [refreshRepos])

  useEffect(() => {
    if (theme === 'slate-cyan') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [theme])

  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.removeAttribute('data-mode')
    } else {
      document.documentElement.setAttribute('data-mode', mode)
    }
  }, [mode])

  const current = branches.find((b) => b.current)

  async function addLocal(): Promise<void> {
    const r = await window.api.repos.pickFolder()
    if (r) {
      await refreshRepos()
      await selectRepo(r)
    }
  }

  async function doFetch(): Promise<void> {
    if (!selected) return
    setBusy(true)
    const r = await window.api.git.fetch(selected.path)
    setBusy(false)
    if (!r.ok) setToast(r.stderr)
    else setToast('Fetched')
    await refreshBranches()
  }
  async function doPull(): Promise<void> {
    if (!selected) return
    setBusy(true)
    const r = await window.api.git.pull(selected.path)
    setBusy(false)
    if (!r.ok) setToast(r.stderr)
    else setToast('Pulled')
    await Promise.all([refreshStatus(), refreshLog(), refreshBranches()])
  }
  async function doPush(): Promise<void> {
    if (!selected || !current) return
    setBusy(true)
    const args: [string, string?, string?] = [selected.path, 'origin', current.name]
    const r = await window.api.git.push(...args)
    setBusy(false)
    if (!r.ok) setToast(r.stderr)
    else setToast('Pushed')
    await refreshBranches()
  }

  return (
    <div className="app">
      <div className="sidebar">
        <h2>Repositories</h2>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {repos.map((r) => (
            <div
              key={r.id}
              className={'repo ' + (selected?.id === r.id ? 'active' : '')}
              onClick={() => selectRepo(r)}
              title={r.path}
            >
              {r.name}
              <div style={{ fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.path}
              </div>
            </div>
          ))}
        </div>
        <div className="actions">
          <button onClick={addLocal}>Add local</button>
          <button onClick={() => setShowClone(true)}>Clone…</button>
          <button onClick={() => setShowSettings(true)}>Settings</button>
        </div>
      </div>

      <div className="main">
        {selected ? (
          <>
            <div className="toolbar">
              <span className="branch">{current?.name ?? '(no branch)'}</span>
              {current?.upstream && (
                <span className="muted">↑{current.ahead} ↓{current.behind}</span>
              )}
              <span className="spacer" style={{ flex: 1 }} />
              <button onClick={() => setShowRemotes(true)} disabled={busy}>Remotes</button>
              <button onClick={doFetch} disabled={busy}>Fetch</button>
              <button onClick={doPull} disabled={busy || !current}>Pull</button>
              <button onClick={doPush} disabled={busy || !current}>Push</button>
              <button onClick={() => setShowTags(true)} disabled={busy}>Tag</button>
            </div>
            <div className="tabs">
              <button
                className="refresh-btn"
                onClick={() =>
                  Promise.all([refreshStatus(), refreshLog(), refreshBranches()])
                }
                disabled={busy}
                title="Refresh"
                aria-label="Refresh"
              >
                ↻
              </button>
              <button className={tab === 'changes' ? 'active' : ''} onClick={() => setTab('changes')}>
                Changes
              </button>
              <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
                History
              </button>
              <button className={tab === 'branches' ? 'active' : ''} onClick={() => setTab('branches')}>
                Branches
              </button>
            </div>
            {tab === 'changes' && <Changes />}
            {tab === 'history' && <History />}
            {tab === 'branches' && <Branches />}
          </>
        ) : (
          <div style={{ margin: 'auto', color: '#888' }}>
            No repository selected. Add one from the sidebar.
          </div>
        )}
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showClone && <CloneModal onClose={() => setShowClone(false)} />}
      {showRemotes && selected && <RemotesModal onClose={() => setShowRemotes(false)} />}
      {showTags && selected && <TagsModal onClose={() => setShowTags(false)} />}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#2a2c30',
            border: '1px solid #3a3d42',
            padding: '8px 16px',
            borderRadius: 6,
            maxWidth: '70vw',
            whiteSpace: 'pre-wrap'
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
