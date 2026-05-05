import React from 'react'

export function DiffView({ text }: { text: string }): React.ReactElement {
  if (!text) return <div className="diff muted">No diff</div>
  return (
    <div className="diff">
      {text.split('\n').map((line, i) => {
        let cls = ''
        if (line.startsWith('+') && !line.startsWith('+++')) cls = 'add'
        else if (line.startsWith('-') && !line.startsWith('---')) cls = 'del'
        else if (line.startsWith('@@')) cls = 'hunk'
        return (
          <div key={i} className={cls}>
            {line || ' '}
          </div>
        )
      })}
    </div>
  )
}
