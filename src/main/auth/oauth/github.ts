import { setCredential } from '../keystore'

// GitHub's well-known public OAuth client IDs for desktop device-flow apps
// can be configured via env. Default is the GitHub CLI client id which
// supports device flow; users can replace with their own.
const CLIENT_ID = process.env.BVILD_GITHUB_CLIENT_ID ?? '178c6fc778ccc68e1d6a'
const SCOPE = 'repo,workflow,read:user,user:email'

export interface DeviceCode {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

export async function startDeviceFlow(): Promise<DeviceCode> {
  const r = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: CLIENT_ID, scope: SCOPE })
  })
  if (!r.ok) throw new Error(`device-code request failed (${r.status})`)
  return (await r.json()) as DeviceCode
}

export async function pollForToken(dc: DeviceCode): Promise<string> {
  const deadline = Date.now() + dc.expires_in * 1000
  let interval = dc.interval
  while (Date.now() < deadline) {
    await new Promise((res) => setTimeout(res, interval * 1000))
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        device_code: dc.device_code,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      })
    })
    const j = (await r.json()) as { access_token?: string; error?: string; interval?: number }
    if (j.access_token) return j.access_token
    if (j.error === 'authorization_pending') continue
    if (j.error === 'slow_down') {
      interval = (j.interval ?? interval) + 5
      continue
    }
    throw new Error(`device flow error: ${j.error}`)
  }
  throw new Error('device flow timed out')
}

export async function fetchUserLogin(token: string): Promise<string> {
  const r = await fetch('https://api.github.com/user', {
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' }
  })
  if (!r.ok) throw new Error(`user fetch failed (${r.status})`)
  const j = (await r.json()) as { login: string }
  return j.login
}

export async function signInGitHub(): Promise<{ login: string; deviceCode: DeviceCode } | string> {
  // Two-phase: caller invokes startDeviceFlow(), shows the code, then completeDeviceFlow().
  throw new Error('use startDeviceFlow + completeDeviceFlow directly')
}

export async function completeDeviceFlow(dc: DeviceCode): Promise<{ login: string; token: string }> {
  const token = await pollForToken(dc)
  const login = await fetchUserLogin(token)
  await setCredential({ host: 'github.com', username: login }, token)
  return { login, token }
}
