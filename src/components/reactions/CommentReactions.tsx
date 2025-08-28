'use client'
import { useEffect, useRef, useState } from 'react'
import ReactionBar from './ReactionBar'

type Summary = { emoji: string; count: number }[]

export default function CommentReactions({ commentId, initialSummary = [] as Summary }:{
  commentId: string; initialSummary?: Summary
}) {
  const [summary, setSummary] = useState<Summary>(initialSummary)
  const [open, setOpen] = useState(false)
  const timer = useRef<any>(null)

  useEffect(()=>{ (async()=>{
    const r = await fetch(`/api/comments/${commentId}/react`)
    const j = await r.json(); setSummary(j.summary || [])
  })(); }, [commentId])

  function onPointerDown(){ timer.current = setTimeout(()=>setOpen(true), 300) }
  async function onPointerUp(){
    if (timer.current) {
      clearTimeout(timer.current)
      await react('👍') // short tap defaults to 👍
    }
  }

  async function react(emoji: string){
    setOpen(false)
    const r = await fetch(`/api/comments/${commentId}/react`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ emoji })
    })
    const j = await r.json(); if (j.summary) setSummary(j.summary)
  }
  async function clearReaction(){
    const r = await fetch(`/api/comments/${commentId}/react`, { method:'DELETE' })
    const j = await r.json(); if (j.summary) setSummary(j.summary)
  }

  return (
    <div className="relative inline-flex items-center gap-2">
      <button
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={()=>timer.current && clearTimeout(timer.current)}
        onContextMenu={(e)=>{ e.preventDefault(); setOpen(o=>!o) }}
        aria-label="React to comment"
        className="h-7 px-2 rounded bg-white/10 text-xs"
      >
        React
      </button>

      {open && (
        <div className="absolute z-20 -top-11 left-0">
          <ReactionBar onSelect={react}/>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-white/80">
        {summary.slice(0,4).map(s=>(
          <span key={s.emoji} className="inline-flex items-center gap-1">
            <span>{s.emoji}</span><span className="text-[10px]">{s.count}</span>
          </span>
        ))}
        {!!summary.length && <button onClick={clearReaction} className="text-[10px] text-white/50 hover:underline">Clear</button>}
      </div>
    </div>
  )
}
