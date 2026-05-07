import { createServer, Server } from 'node:net'
import { writeFileSync, chmodSync, existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'
import { getPaths } from '../paths'
import { findCredentialByHost } from './keystore'

let server: Server | null = null

const isWin = process.platform === 'win32'

function jsHelperScript(socket: string): string {
  // Run by Electron in ELECTRON_RUN_AS_NODE mode. Receives the prompt as
  // its single CLI arg and must print the credential to stdout.
  return `const net = require('net');
const prompt = process.argv[2] || '';
const socket = ${JSON.stringify(socket)};
const c = net.createConnection(socket);
let buf = '';
c.on('connect', () => c.write(JSON.stringify({ prompt }) + '\\n'));
c.on('data', (d) => { buf += d.toString('utf8'); });
c.on('end', () => { process.stdout.write(buf); });
c.on('error', () => process.exit(1));
`
}

function shellWrapperScript(execPath: string, jsPath: string): string {
  // Posix shell wrapper. We can't put env vars in a shebang, and git's
  // PATH may not contain a Node binary, so we exec the Electron binary
  // with ELECTRON_RUN_AS_NODE=1 to run our JS helper.
  const q = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`
  return `#!/bin/sh
ELECTRON_RUN_AS_NODE=1 exec ${q(execPath)} ${q(jsPath)} "$@"
`
}

function cmdWrapperScript(execPath: string, jsPath: string): string {
  // Windows .cmd wrapper.
  return `@echo off\r\nset ELECTRON_RUN_AS_NODE=1\r\n"${execPath}" "${jsPath}" %*\r\n`
}

export function helperPath(): string {
  const userData = app.getPath('userData')
  return join(userData, isWin ? 'askpass-helper.cmd' : 'askpass-helper.sh')
}

function jsHelperPath(): string {
  return join(app.getPath('userData'), 'askpass-helper.js')
}

function writeHelper(socket: string): void {
  const jsPath = jsHelperPath()
  writeFileSync(jsPath, jsHelperScript(socket), { mode: 0o600 })

  const wrapperPath = helperPath()
  const execPath = process.execPath
  const wrapper = isWin
    ? cmdWrapperScript(execPath, jsPath)
    : shellWrapperScript(execPath, jsPath)
  writeFileSync(wrapperPath, wrapper, { mode: 0o700 })
  try {
    chmodSync(wrapperPath, 0o700)
  } catch {
    /* windows */
  }
}

interface PendingHost {
  host: string
  username?: string
}

let pending: PendingHost | null = null

export function setPendingHost(host: string, username?: string): void {
  pending = { host, username }
}

export function clearPendingHost(): void {
  pending = null
}

function parsePrompt(prompt: string): { kind: 'username' | 'password'; host?: string; user?: string } {
  // Prompts look like:
  //   Username for 'https://github.com':
  //   Password for 'https://user@github.com':
  const isUser = /^Username/i.test(prompt)
  const m = prompt.match(/['"]([^'"]+)['"]/)
  let host: string | undefined
  let user: string | undefined
  if (m) {
    try {
      const u = new URL(m[1])
      host = u.host
      if (u.username) user = decodeURIComponent(u.username)
    } catch {
      /* ignore */
    }
  }
  return { kind: isUser ? 'username' : 'password', host, user }
}

export async function startAskpassServer(): Promise<void> {
  const { askpassSocket } = getPaths()
  if (process.platform !== 'win32' && existsSync(askpassSocket)) {
    try {
      unlinkSync(askpassSocket)
    } catch {
      /* ignore */
    }
  }
  await new Promise<void>((resolve, reject) => {
    server = createServer((sock) => {
      let buf = ''
      sock.on('data', async (d) => {
        buf += d.toString('utf8')
        const nl = buf.indexOf('\n')
        if (nl < 0) return
        try {
          const msg = JSON.parse(buf.slice(0, nl)) as { prompt: string }
          const parsed = parsePrompt(msg.prompt)
          const host = parsed.host ?? pending?.host
          let answer = ''
          if (host) {
            if (parsed.kind === 'username') {
              const c = await findCredentialByHost(host)
              answer = pending?.username ?? c?.username ?? ''
            } else {
              const c = await findCredentialByHost(host)
              answer = c?.secret ?? ''
            }
          }
          sock.end(answer)
        } catch {
          sock.end('')
        }
      })
    })
    server.on('error', reject)
    server.listen(askpassSocket, () => {
      writeHelper(askpassSocket)
      resolve()
    })
  })
}

export function stopAskpassServer(): void {
  server?.close()
  server = null
  const { askpassSocket } = getPaths()
  if (process.platform !== 'win32' && existsSync(askpassSocket)) {
    try {
      unlinkSync(askpassSocket)
    } catch {
      /* ignore */
    }
  }
}
