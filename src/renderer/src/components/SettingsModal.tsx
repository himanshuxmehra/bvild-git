import React, { useEffect, useState } from 'react'

export function SettingsModal({ onClose }: { onClose: () => void }): React.ReactElement {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pubKey, setPubKey] = useState<string | null>(null)
  const [ghCode, setGhCode] = useState<{ user_code: string; verification_uri: string } | null>(null)
  const [ghStatus, setGhStatus] = useState('')
  const [ghUser, setGhUser] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const id = await window.api.identity.get()
      setName(id.name)
      setEmail(id.email)
      setPubKey(await window.api.ssh.publicKey())
      const cred = await window.api.creds.findByHost('github.com')
      if (cred) setGhUser(cred.username)
    })()
  }, [])

  async function saveIdentity(): Promise<void> {
    await window.api.identity.set({ name, email })
  }

  async function ensureKey(): Promise<void> {
    await window.api.ssh.generate()
    setPubKey(await window.api.ssh.publicKey())
  }

  async function signInGitHub(): Promise<void> {
    setGhStatus('Requesting device code…')
    const dc = await window.api.oauth.githubStart()
    setGhCode({ user_code: dc.user_code, verification_uri: dc.verification_uri })
    setGhStatus('Waiting for approval…')
    try {
      const r = await window.api.oauth.githubComplete(dc)
      setGhStatus(`Signed in as ${r.login}`)
      setGhUser(r.login)
      setGhCode(null)
    } catch (e) {
      setGhStatus(`Failed: ${(e as Error).message}`)
    }
  }

  async function signOutGitHub(): Promise<void> {
    if (!ghUser) return
    await window.api.creds.delete('github.com', ghUser)
    setGhUser(null)
    setGhStatus('')
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Settings</h3>

        <h4>App git identity (isolated from system git)</h4>
        <div className="row">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="row">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="row">
          <span className="spacer" style={{ flex: 1 }} />
          <button onClick={saveIdentity}>Save identity</button>
        </div>

        <h4>SSH key (app-only)</h4>
        {pubKey ? (
          <>
            <div className="muted">Add this to your GitHub/GitLab/Bitbucket SSH keys:</div>
            <textarea readOnly value={pubKey} style={{ width: '100%', height: 60 }} />
          </>
        ) : (
          <button onClick={ensureKey}>Generate ed25519 keypair</button>
        )}

        <h4>GitHub sign-in</h4>
        {ghUser ? (
          <div className="row">
            <div style={{ flex: 1 }}>
              Signed in as <span className="code">{ghUser}</span>
            </div>
            <button onClick={signOutGitHub}>Sign out</button>
          </div>
        ) : ghCode ? (
          <div>
            <div>Open <span className="code">{ghCode.verification_uri}</span> and enter code:</div>
            <div className="code" style={{ fontSize: 18, marginTop: 6 }}>{ghCode.user_code}</div>
          </div>
        ) : (
          <button onClick={signInGitHub}>Sign in with GitHub</button>
        )}
        {ghStatus && !ghUser && <div className="muted" style={{ marginTop: 6 }}>{ghStatus}</div>}

        <div className="row" style={{ marginTop: 16 }}>
          <span style={{ flex: 1 }} />
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
