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
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const timer = useRef<any>(null)
  const [longPressTriggered, setLongPressTriggered] = useState(false)

  useEffect(() => {
    loadReactions()
  }, [postId])

  const loadReactions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const response = await fetch(`/api/posts/${postId}/react`, { headers })
      const data = await response.json()
      setSummary(data.summary || [])
      setUserReaction(data.userReaction || null)
    } catch (error) {
      console.error('Error loading reactions:', error)
    }
  }

  function onPointerDown(){ 
    setLongPressTriggered(false)
    timer.current = setTimeout(() => {
      setLongPressTriggered(true)
      setOpen(true)
    }, 300)
  }

  async function onPointerUp(){
    if (timer.current) {
      clearTimeout(timer.current)
      
      // If long press was not triggered, do quick reaction
      if (!longPressTriggered) {
        await react('👍')
      }
      // If long press was triggered, menu is already open - do nothing
    }
  }

  function onPointerCancel() {
    if (timer.current) {
      clearTimeout(timer.current)
      setLongPressTriggered(false)
    }
  }

  async function react(emoji: string){
    setOpen(false)
    setLongPressTriggered(false)
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    
    try {
      const response = await fetch(`/api/posts/${postId}/react`, {
        method:'POST', 
        headers:{
          'Content-Type':'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }, 
        body: JSON.stringify({ emoji })
      })
      const data = await response.json()
      if (data.summary) {
        setSummary(data.summary)
        setUserReaction(emoji)
      }
    } catch (error) {
      console.error('Error reacting:', error)
    }
  }
  
  async function clearReaction(){
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    
    try {
      const response = await fetch(`/api/posts/${postId}/react`, { 
        method:'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()
      if (data.summary) {
        setSummary(data.summary)
        setUserReaction(null)
      }
    } catch (error) {
      console.error('Error clearing reaction:', error)
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (open) {
        setOpen(false)
        setLongPressTriggered(false)
      }
    }

    if (open) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [open])

  return (
    <div className="relative inline-flex items-center gap-2">
      <div className="relative">
        <button
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onContextMenu={(e)=>{ e.preventDefault(); setOpen(o=>!o) }}
          onClick={(e) => e.stopPropagation()} // Prevent triggering outside click
          aria-label="React to post"
          className="h-8 px-2 rounded bg-card-foreground/5 hover:bg-card-foreground/10 text-sm text-card-foreground/60 hover:text-card-foreground transition-colors select-none"
        >
          {userReaction || '👍'}
        </button>

        {open && (
          <div 
            className="absolute z-30 -top-12 left-0"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on menu
          >
            <ReactionBar onSelect={react}/>
          </div>
        )}
      </div>

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
