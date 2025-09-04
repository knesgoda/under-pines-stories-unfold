'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
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
  const timer = useRef<NodeJS.Timeout | null>(null)
  const [longPressTriggered, setLongPressTriggered] = useState(false)

  const loadReactions = useCallback(async () => {
    try {
      console.log('Loading reactions for post:', postId)
      
      // Get reaction counts directly from post_reactions table
      const { data: reactionsData, error: reactionsError } = await supabase
        .from('post_reactions')
        .select('emoji')
        .eq('post_id', postId)
      
      console.log('Reactions data:', reactionsData, 'Error:', reactionsError)
      
      // Count reactions by emoji
      const counts: Record<string, number> = {}
      if (reactionsData && !reactionsError) {
        for (const reaction of reactionsData) {
          if (reaction && reaction.emoji) {
            counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1
          }
        }
      }
      
      // Get current user's reaction
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        const { data: userReactionData } = await supabase
          .from('post_reactions')
          .select('emoji')
          .eq('post_id', postId)
          .eq('user_id', session.user.id)
          .single()
        
        setUserReaction(userReactionData?.emoji || null)
      }
      
      // Convert counts to summary format
      const res = Object.entries(counts).map(([emoji, count]) => ({ emoji, count }))
      setSummary(res)
      
      console.log('Final summary:', res)
    } catch (error) {
      console.error('Error loading reactions:', error)
    }
  }, [postId])

  useEffect(() => {
    loadReactions()
  }, [postId, loadReactions])

  useEffect(() => {
    const subscription = supabase.channel(`public:post_reactions:post_id=eq.${postId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions', filter: `post_id=eq.${postId}` }, () => {
        loadReactions()
      })
      .subscribe()
    return () => { subscription.unsubscribe() }
  }, [postId, loadReactions])

  function countsToSummary(counts: Record<string, number> | null): Summary {
    if (!counts) return []
    const res: Summary = []
    
    // If counts is the new format with reaction type keys
    if (typeof counts === 'object') {
      for (const [reactionType, count] of Object.entries(counts)) {
        if (count && (count as number) > 0) {
          const emoji = typeToEmoji[reactionType as ReactionType]
          if (emoji) {
            res.push({ emoji, count: count as number })
          }
        }
      }
    }
    
    return res.sort((a, b) => b.count - a.count)
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
    console.log('Reacting with emoji:', emoji)
    setOpen(false)
    setLongPressTriggered(false)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    try {
      const reaction = emojiToType[emoji]
      console.log('Converting emoji to reaction type:', emoji, '->', reaction)
      
      // Use direct database operations instead of Edge Function
      const { data, error } = await supabase
        .from('post_reactions')
        .upsert({
          post_id: postId,
          user_id: session.user.id,
          emoji: emoji
        }, {
          onConflict: 'post_id,user_id'
        })
        .select()
      
      console.log('Direct database response:', data, 'Error:', error)
      
      if (error) throw error
      
      // Update UI immediately
      setUserReaction(emoji)
      setLastReaction(emoji)
      
      // Refresh data to get updated counts
      console.log('Refreshing reactions...')
      loadReactions()
    } catch (error) {
      console.error('Error reacting:', error)
    }
  }

  async function clearReaction(){
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    try {
      // Use direct database operations instead of Edge Function
      const { error } = await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', session.user.id)
      
      if (error) throw error
      
      // Update UI immediately
      setUserReaction(null)
      
      // Refresh data to get updated counts
      loadReactions()
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
          className="h-10 px-3 rounded-full bg-emerald-900/20 hover:bg-emerald-900/30 text-emerald-100/90 hover:text-emerald-50 transition-colors select-none flex items-center gap-2"
        >
          <span className="text-[22px] leading-none sm:text-[26px]">
            {userReaction || lastReaction || '🙂'}
          </span>
          <span className="hidden sm:inline text-sm">React</span>
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
