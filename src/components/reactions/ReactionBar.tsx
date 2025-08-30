'use client'

const EMOJIS = ['👍','😂','😡','😢','🤬','🙄']

export default function ReactionBar({ onSelect }: { onSelect: (emoji: string) => void }) {
  return (
    <div className="flex gap-1 rounded bg-white/10 p-1 shadow">
      {EMOJIS.map(e => (
        <button
          key={e}
          onClick={() => onSelect(e)}
          className="h-8 w-8 flex items-center justify-center rounded hover:bg-white/20"
          aria-label={e}
        >
          {e}
        </button>
      ))}
    </div>
  )
}
