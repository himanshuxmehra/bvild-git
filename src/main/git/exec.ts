import { exec as dugiteExec } from 'dugite'
import { gitEnv } from './env'
import { GitResult } from '../../shared/types'

export async function git(
  args: string[],
  cwd: string,
  opts: { env?: Record<string, string> } = {}
): Promise<GitResult> {
  const r = await dugiteExec(args, cwd, { env: gitEnv(opts.env) })
  return {
    ok: r.exitCode === 0,
    stdout: r.stdout,
    stderr: r.stderr,
    code: r.exitCode
  }
}

export async function gitOrThrow(args: string[], cwd: string): Promise<string> {
  const r = await git(args, cwd)
  if (!r.ok) {
    throw new Error(`git ${args.join(' ')} failed (${r.code}): ${r.stderr.trim()}`)
  }
  return r.stdout
}
