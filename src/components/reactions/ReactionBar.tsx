'use client'

import { cn } from '@/lib/utils'
import { REACTIONS } from './reactionTypes'

export default function ReactionBar({ onSelect, selected }: { onSelect: (emoji: string) => void; selected?: string }) {
  return (
    <div className="flex gap-2 rounded-2xl bg-emerald-950/90 border border-emerald-800/40 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur p-3">
      {REACTIONS.map(r => (
        <button
          key={r.emoji}
          onClick={() => onSelect(r.emoji)}
          className={cn(
            'h-12 w-12 flex items-center justify-center rounded-xl hover:bg-emerald-800/50 transition-transform text-3xl md:text-4xl leading-none',
            selected === r.emoji && 'ring-2 ring-amber-400 scale-110'
          )}
          aria-label={r.label}
        >
          {r.emoji}
        </button>
      ))}
    </div>
  )
}
