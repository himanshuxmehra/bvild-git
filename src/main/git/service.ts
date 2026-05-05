import { git, gitOrThrow } from './exec'
import { LOG_FORMAT, parseLog, parseStatus } from './parse'
import { BranchInfo, Commit, FileStatus, GitResult } from '../../shared/types'

export async function status(repo: string): Promise<FileStatus[]> {
  const out = await gitOrThrow(['status', '--porcelain=v1', '-z', '--untracked-files=all'], repo)
  return parseStatus(out)
}

export async function log(repo: string, max = 200): Promise<Commit[]> {
  const out = await gitOrThrow(['log', `--max-count=${max}`, LOG_FORMAT], repo)
  return parseLog(out)
}

export async function diff(repo: string, path: string, staged: boolean): Promise<string> {
  const args = ['diff']
  if (staged) args.push('--cached')
  args.push('--', path)
  return gitOrThrow(args, repo)
}

export async function diffCommit(repo: string, sha: string): Promise<string> {
  return gitOrThrow(['show', '--patch', '--stat', sha], repo)
}

export async function stage(repo: string, paths: string[]): Promise<GitResult> {
  return git(['add', '--', ...paths], repo)
}

export async function unstage(repo: string, paths: string[]): Promise<GitResult> {
  return git(['restore', '--staged', '--', ...paths], repo)
}

export async function commit(
  repo: string,
  message: string,
  identity?: { name: string; email: string }
): Promise<GitResult> {
  const env: Record<string, string> = {}
  if (identity) {
    env.GIT_AUTHOR_NAME = identity.name
    env.GIT_AUTHOR_EMAIL = identity.email
    env.GIT_COMMITTER_NAME = identity.name
    env.GIT_COMMITTER_EMAIL = identity.email
  }
  return git(['commit', '-m', message], repo, { env })
}

export async function clone(url: string, dest: string): Promise<GitResult> {
  return git(['clone', '--', url, dest], process.cwd())
}

export async function init(dir: string): Promise<GitResult> {
  return git(['init'], dir)
}

export async function fetch(repo: string, remote = 'origin'): Promise<GitResult> {
  return git(['fetch', '--prune', remote], repo)
}

export async function pull(repo: string): Promise<GitResult> {
  return git(['pull', '--ff-only'], repo)
}

export async function push(repo: string, remote = 'origin', branch?: string): Promise<GitResult> {
  const args = ['push', remote]
  if (branch) args.push(branch)
  return git(args, repo)
}

export async function branches(repo: string): Promise<BranchInfo[]> {
  const out = await gitOrThrow(
    [
      'for-each-ref',
      '--format=%(HEAD)\t%(refname:short)\t%(upstream:short)\t%(upstream:track)',
      'refs/heads/'
    ],
    repo
  )
  const result: BranchInfo[] = []
  for (const line of out.split('\n')) {
    if (!line.trim()) continue
    const [head, name, upstream, track] = line.split('\t')
    let ahead = 0
    let behind = 0
    if (track) {
      const a = track.match(/ahead (\d+)/)
      const b = track.match(/behind (\d+)/)
      if (a) ahead = parseInt(a[1], 10)
      if (b) behind = parseInt(b[1], 10)
    }
    result.push({
      name,
      current: head.trim() === '*',
      upstream: upstream || undefined,
      ahead,
      behind
    })
  }
  return result
}

export async function checkout(repo: string, branch: string): Promise<GitResult> {
  return git(['checkout', branch], repo)
}

export async function createBranch(repo: string, name: string): Promise<GitResult> {
  return git(['checkout', '-b', name], repo)
}

export async function deleteBranch(repo: string, name: string): Promise<GitResult> {
  return git(['branch', '-d', name], repo)
}

export async function merge(repo: string, branch: string): Promise<GitResult> {
  return git(['merge', '--no-edit', branch], repo)
}
