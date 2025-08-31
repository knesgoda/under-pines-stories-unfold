'use client'

const EMOJIS = ['👍','😂','😡','😢','🤬','🙄']

export default function ReactionBar({ onSelect }: { onSelect: (emoji: string) => void }) {
  return (
    <div className="flex gap-1 rounded bg-popover border shadow-lg p-1">
      {EMOJIS.map(e => (
        <button
          key={e}
          onClick={() => onSelect(e)}
          className="h-8 w-8 flex items-center justify-center rounded hover:bg-accent"
          aria-label={e}
        >
          {e}
        </button>
      ))}
    </div>
  )
}
