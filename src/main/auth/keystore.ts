import keytar from 'keytar'

const SERVICE = 'bvild.app'

export interface CredentialKey {
  host: string
  username: string
}

function accountFor(k: CredentialKey): string {
  return `${k.host}:${k.username}`
}

export async function setCredential(k: CredentialKey, secret: string): Promise<void> {
  await keytar.setPassword(SERVICE, accountFor(k), secret)
}

export async function getCredential(k: CredentialKey): Promise<string | null> {
  return keytar.getPassword(SERVICE, accountFor(k))
}

export async function deleteCredential(k: CredentialKey): Promise<boolean> {
  return keytar.deletePassword(SERVICE, accountFor(k))
}

export async function findCredentialByHost(host: string): Promise<{ username: string; secret: string } | null> {
  const all = await keytar.findCredentials(SERVICE)
  for (const c of all) {
    const [h, ...rest] = c.account.split(':')
    if (h === host) return { username: rest.join(':'), secret: c.password }
  }
  return null
}
