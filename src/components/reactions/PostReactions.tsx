'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import ReactionBar from './ReactionBar'
import ReactorsSheet from './ReactorsSheet'

type Summary = { emoji: string; count: number }[]

export default function PostReactions({ postId, initialSummary = [] as Summary }:{
  postId: string; initialSummary?: Summary
}) {
  const [summary, setSummary] = useState<Summary>(initialSummary)
  const [open, setOpen] = useState(false)
  const [sheet, setSheet] = useState<{emoji:string}|null>(null)
  const timer = useRef<any>(null)

  useEffect(()=>{ (async()=>{
    const r = await fetch(`/api/posts/${postId}/react`)
    const j = await r.json(); setSummary(j.summary || [])
  })(); }, [postId])

  function onPointerDown(){ timer.current = setTimeout(()=>setOpen(true), 300) }
  async function onPointerUp(){
    if (timer.current) {
      clearTimeout(timer.current)
      await react('👍')
    }
  }

  async function react(emoji: string){
    setOpen(false)
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    
    const r = await fetch(`/api/posts/${postId}/react`, {
      method:'POST', 
      headers:{
        'Content-Type':'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }, 
      body: JSON.stringify({ emoji })
    })
    const j = await r.json(); if (j.summary) setSummary(j.summary)
  }
  
  async function clearReaction(){
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    
    const r = await fetch(`/api/posts/${postId}/react`, { 
      method:'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    const j = await r.json(); if (j.summary) setSummary(j.summary)
  }

  return (
    <div className="relative inline-flex items-center gap-2">
      <button
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={()=>timer.current && clearTimeout(timer.current)}
        onContextMenu={(e)=>{ e.preventDefault(); setOpen(o=>!o) }}
        aria-label="React to post"
        className="h-8 px-2 rounded bg-card-foreground/5 hover:bg-card-foreground/10 text-sm text-card-foreground/60 hover:text-card-foreground transition-colors"
      >
        React
      </button>

      {open && (
        <div className="absolute z-20 -top-12 left-0">
          <ReactionBar onSelect={react}/>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-card-foreground/80">
        {summary.slice(0,4).map(s=>(
          <button
            type="button"
            key={s.emoji}
            onClick={()=>setSheet({ emoji: s.emoji })}
            className="inline-flex items-center gap-1 px-2 h-7 rounded bg-card-foreground/5 hover:bg-card-foreground/10 transition-colors"
            title="See who reacted"
          >
            <span>{s.emoji}</span><span className="text-xs">{s.count}</span>
          </button>
        ))}
        {!!summary.length && (
          <button 
            onClick={clearReaction} 
            className="text-xs text-card-foreground/50 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {sheet && (
        <ReactorsSheet
          open
          onClose={()=>setSheet(null)}
          kind="post"
          targetId={postId}
          emoji={sheet.emoji}
        />
      )}
    </div>
  )
}
