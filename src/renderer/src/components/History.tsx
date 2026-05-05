import React from 'react'
import { useApp } from '../state'
import { DiffView } from './DiffView'

export function History(): React.ReactElement {
  const commits = useApp((s) => s.commits)
  const selectedCommit = useApp((s) => s.selectedCommit)
  const commitDiff = useApp((s) => s.commitDiff)
  const selectCommit = useApp((s) => s.selectCommit)

  return (
    <div className="body">
      <div className="history">
        {commits.map((c) => (
          <div
            key={c.sha}
            className={'commit ' + (selectedCommit === c.sha ? 'selected' : '')}
            onClick={() => selectCommit(c.sha)}
          >
            <div>{c.subject}</div>
            <div className="sha">
              {c.sha.slice(0, 7)} · {c.author} · {new Date(c.date).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      <DiffView text={commitDiff} />
    </div>
  )
}
