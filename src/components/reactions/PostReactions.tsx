'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import ReactionBar from './ReactionBar'
import ReactorsSheet from './ReactorsSheet'
import { emojiToType, typeToEmoji, ReactionType } from './reactionTypes'

type Summary = { emoji: string; count: number }[]

export default function PostReactions({ postId, initialSummary = [] as Summary }:{
  postId: string; initialSummary?: Summary
}) {
  const [summary, setSummary] = useState<Summary>(initialSummary)
  const [open, setOpen] = useState(false)
  const [sheet, setSheet] = useState<{emoji:string}|null>(null)
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [lastReaction, setLastReaction] = useState<string>('👍')
  const timer = useRef<any>(null)
  const [longPressTriggered, setLongPressTriggered] = useState(false)

  useEffect(() => {
    loadReactions()
  }, [postId])

  useEffect(() => {
    const channel = supabase.channel(`public:post_reactions:post_id=eq.${postId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions', filter: `post_id=eq.${postId}` }, () => {
        loadReactions()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [postId])

  function countsToSummary(counts: any): Summary {
    if (!counts) return []
    const res: Summary = []
    
    // If counts is the new format with emoji keys
    if (typeof counts === 'object') {
      for (const [emoji, count] of Object.entries(counts)) {
        if (count && (count as number) > 0) {
          res.push({ emoji, count: count as number })
        }
      }
    }
    
    return res.sort((a, b) => b.count - a.count)
  }

  const loadReactions = async () => {
    try {
      // Use the get_post_reaction_summary function
      const { data: summaryData } = await supabase.rpc('get_post_reaction_summary', {
        p_post_id: postId
      })
      
      // The function returns an array in the correct format
      setSummary(Array.isArray(summaryData) ? summaryData as Summary : [])

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: reaction } = await supabase
          .from('post_reactions')
          .select('emoji')
          .eq('post_id', postId)
          .eq('user_id', session.user.id)
          .maybeSingle()
        if (reaction?.emoji) {
          setUserReaction(reaction.emoji)
          setLastReaction(reaction.emoji)
        } else {
          setUserReaction(null)
        }
      }
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
      if (!longPressTriggered) {
        if (userReaction) {
          await clearReaction()
        } else {
          await react(lastReaction)
        }
      }
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
      const reaction = emojiToType[emoji]
      const response = await fetch('/functions/v1/reactions/upsert', {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ post_id: postId, reaction })
      })
      const data = await response.json()
      if (data.counts) {
        setSummary(countsToSummary(data.counts))
        setUserReaction(emoji)
        setLastReaction(emoji)
      }
    } catch (error) {
      console.error('Error reacting:', error)
    }
  }

  async function clearReaction(){
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    try {
      const response = await fetch('/functions/v1/reactions/clear', {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ post_id: postId })
      })
      const data = await response.json()
      if (data.counts) {
        setSummary(countsToSummary(data.counts))
        setUserReaction(null)
      }
    } catch (error) {
      console.error('Error clearing reaction:', error)
    }
  }

  useEffect(() => {
    function handleClickOutside() {
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
          onClick={(e) => e.stopPropagation()}
          aria-label="React to post"
          className="h-8 px-2 rounded bg-card-foreground/5 hover:bg-card-foreground/10 text-sm text-card-foreground/60 hover:text-card-foreground transition-colors select-none"
        >
          {userReaction || lastReaction}
        </button>

        {open && (
          <div
            className="absolute z-30 -top-12 left-0"
            onClick={(e) => e.stopPropagation()}
          >
            <ReactionBar onSelect={react} selected={userReaction || undefined} />
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
