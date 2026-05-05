import { Commit, FileStatus } from '../../shared/types'

export function parseStatus(porcelain: string): FileStatus[] {
  const out: FileStatus[] = []
  let i = 0
  while (i < porcelain.length) {
    if (porcelain[i] === '\0') {
      i++
      continue
    }
    const x = porcelain[i]
    const y = porcelain[i + 1]
    i += 3
    let path = ''
    while (i < porcelain.length && porcelain[i] !== '\0') {
      path += porcelain[i]
      i++
    }
    i++
    if (x === 'R' || x === 'C') {
      while (i < porcelain.length && porcelain[i] !== '\0') i++
      i++
    }
    out.push({
      path,
      index: x,
      worktree: y,
      staged: x !== ' ' && x !== '?',
      unstaged: y !== ' ' && y !== '?',
      untracked: x === '?' && y === '?'
    })
  }
  return out
}

const SEP = ''
const FIELD = ''
export const LOG_FORMAT = `--pretty=format:%H${FIELD}%P${FIELD}%an${FIELD}%ae${FIELD}%at${FIELD}%s${SEP}`

export function parseLog(stdout: string): Commit[] {
  const out: Commit[] = []
  for (const raw of stdout.split(SEP)) {
    const entry = raw.replace(/^\n/, '')
    if (!entry.trim()) continue
    const [sha, parents, author, email, date, subject] = entry.split(FIELD)
    out.push({
      sha,
      parents: parents ? parents.split(' ').filter(Boolean) : [],
      author,
      email,
      date: parseInt(date, 10) * 1000,
      subject: subject ?? ''
    })
  }
  return out
}
