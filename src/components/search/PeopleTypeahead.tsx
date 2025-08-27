import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ProfileCTA from '@/components/profile/ProfileCTA'
import { supabase } from '@/integrations/supabase/client'
import type { Relation } from '@/lib/profiles'

type Person = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  isPrivate: boolean
  discoverable: boolean
  relation: Relation
  requestId?: string | null
}

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function PeopleTypeahead() {
  const [q, setQ] = useState('')
  const debouncedQ = useDebounced(q)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Person[]>([])
  const boxRef = useRef<HTMLDivElement>(null)

  const fetchResults = useCallback(async () => {
    if (!debouncedQ || debouncedQ.trim().length === 0) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      // Make GET request to search-people edge function
      const supabaseUrl = 'https://rxlrwephzfsmzspyjsdd.supabase.co'
      const url = new URL(`${supabaseUrl}/functions/v1/search-people`)
      url.searchParams.set('q', debouncedQ)
      url.searchParams.set('limit', '8')
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error('Search failed')
      const data = await response.json()
      setResults(data?.items || [])
    } catch (e) {
      console.error('[typeahead] fetch error', e)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [debouncedQ])

  useEffect(() => { 
    fetchResults() 
  }, [fetchResults])

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!boxRef.current) return
      if (!boxRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-light/60" />
        <input
          value={q}
          onChange={(e) => { 
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search people, @handles, interests"
          className="w-full h-10 pl-10 pr-4 rounded-md bg-background-panel text-text-light placeholder:text-text-light/60 outline-none border border-transparent focus:border-accent-warm/20 transition-colors"
          aria-label="Search people"
        />
      </div>

      {open && (loading || results.length > 0 || (q.trim().length > 0 && !loading)) && (
        <div className="absolute mt-2 w-full rounded-lg bg-background-panel text-text-light shadow-lg border border-[rgba(255,255,255,0.08)] z-20">
          {loading && (
            <div className="p-3 text-sm opacity-80 flex items-center gap-2">
              <Search className="h-4 w-4 animate-pulse" />
              Searching…
            </div>
          )}

          {!loading && results.length === 0 && q.trim().length > 0 && (
            <div className="p-3 text-sm opacity-80">No people found</div>
          )}

          {!loading && results.length > 0 && (
            <>
              <ul className="divide-y divide-white/5">
                {results.map((p) => (
                  <li key={p.id} className="p-3 hover:bg-white/5 flex items-center gap-3">
                    <Link 
                      to={`/${p.username}`} 
                      className="flex items-center gap-3 flex-1 min-w-0"
                      onClick={() => setOpen(false)}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={p.avatar_url || ''} alt={p.display_name || p.username} />
                        <AvatarFallback className="bg-background-sand text-text-dark">
                          {(p.display_name || p.username).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {p.display_name || p.username}
                        </div>
                        <div className="text-xs text-text-light/70 truncate">@{p.username}</div>
                        {p.bio && (
                          <div className="text-xs text-text-light/60 truncate mt-1">
                            {p.bio}
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Inline CTA uses existing ProfileCTA component */}
                    {p.relation !== 'self' && (
                      <ProfileCTA
                        profileUserId={p.id}
                        relation={p.relation}
                        isPrivate={p.isPrivate}
                        requestId={p.requestId ?? null}
                        onRelationChange={() => {
                          // Optionally refresh results to update relation state
                          fetchResults()
                        }}
                      />
                    )}
                  </li>
                ))}
              </ul>

              {q.trim().length > 0 && (
                <div className="p-2 text-right border-t border-white/5">
                  <Link
                    to={`/search?q=${encodeURIComponent(q)}`}
                    className="text-xs text-accent-warm hover:opacity-90"
                    onClick={() => setOpen(false)}
                  >
                    View all results
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}