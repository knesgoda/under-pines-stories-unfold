'use client'

import { cn } from '@/lib/utils'
import { REACTIONS } from './reactionTypes'

export default function ReactionBar({ onSelect, selected }: { onSelect: (emoji: string) => void; selected?: string }) {
  return (
    <div className="flex gap-1 rounded bg-popover border shadow-lg p-1">
      {REACTIONS.map(r => (
        <button
          key={r.emoji}
          onClick={() => onSelect(r.emoji)}
          className={cn(
            'h-8 w-8 flex items-center justify-center rounded hover:bg-accent transition-transform',
            selected === r.emoji && 'ring-2 ring-primary scale-110'
          )}
          aria-label={r.label}
        >
          {r.emoji}
        </button>
      ))}
    </div>
  )
}
