import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import ProfileCTA from '@/components/profile/ProfileCTA'
import { supabase } from '@/integrations/supabase/client'
import { highlight } from '@/lib/highlight'
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

type Suggestion = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  followers: number
}

function useDebounced<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function EnhancedPeopleTypeahead() {
  const [q, setQ] = useState('')
  const debouncedQ = useDebounced(q)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Person[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load suggestions on mount
  useEffect(() => {
    loadSuggestions()
  }, [])

  const loadSuggestions = useCallback(async () => {
    try {
      const response = await fetch('https://rxlrwephzfsmzspyjsdd.supabase.co/functions/v1/suggestions?limit=8', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data)
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    }
  }, [])

  const fetchResults = useCallback(async () => {
    if (!debouncedQ || debouncedQ.trim().length === 0) {
      setResults([])
      setShowSuggestions(false)
      return
    }

    setLoading(true)
    setShowSuggestions(false)
    try {
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
      setSelectedIndex(-1)
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
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = showSuggestions ? suggestions : results
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => prev < items.length - 1 ? prev + 1 : 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : items.length - 1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < items.length) {
        const item = items[selectedIndex]
        window.location.href = `/${item.username}`
        setOpen(false)
        setShowSuggestions(false)
        setQ('')
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  const handleFocus = () => {
    if (!q.trim() && suggestions.length > 0) {
      setShowSuggestions(true)
      setOpen(true)
    } else if (q.trim() && results.length > 0) {
      setOpen(true)
    }
  }

  const clearSearch = () => {
    setQ('')
    setResults([])
    setOpen(false)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-light/60" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { 
            setQ(e.target.value)
            setOpen(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder="Search people, @handles, interests"
          className="w-full h-10 pl-10 pr-10 rounded-md bg-background-panel text-text-light placeholder:text-text-light/60 outline-none border border-transparent focus:border-accent-warm/20 transition-colors"
          aria-label="Search people"
        />
        {q && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-light/60 hover:text-text-light"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (loading || results.length > 0 || showSuggestions || (q.trim().length > 0 && !loading)) && (
        <div className="absolute mt-2 w-full rounded-lg bg-background-panel text-text-light shadow-lg border border-[rgba(255,255,255,0.08)] z-20 max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-3 text-sm opacity-80 flex items-center gap-2">
              <Search className="h-4 w-4 animate-pulse" />
              Searching…
            </div>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <>
              <div className="p-3 text-sm font-medium text-text-light/80 border-b border-white/5">
                Suggested for you
              </div>
              <ul className="divide-y divide-white/5">
                {suggestions.map((person, index) => (
                  <li 
                    key={person.id} 
                    className={`p-3 flex items-center gap-3 cursor-pointer ${
                      selectedIndex === index ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <Link 
                      to={`/${person.username}`} 
                      className="flex items-center gap-3 flex-1 min-w-0"
                      onClick={() => {
                        setOpen(false)
                        setShowSuggestions(false)
                      }}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={person.avatar_url || ''} alt={person.display_name || person.username} />
                        <AvatarFallback className="bg-background-sand text-text-dark">
                          {(person.display_name || person.username).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {person.display_name || person.username}
                        </div>
                        <div className="text-xs text-text-light/70 truncate">
                          @{person.username} • {person.followers} followers
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {!loading && !showSuggestions && results.length === 0 && q.trim().length > 0 && (
            <div className="p-3 text-sm opacity-80">No people found for "{q}"</div>
          )}

          {!loading && !showSuggestions && results.length > 0 && (
            <>
              <ul className="divide-y divide-white/5">
                {results.map((p, index) => (
                  <li 
                    key={p.id} 
                    className={`p-3 flex items-center gap-3 ${
                      selectedIndex === index ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <Link 
                      to={`/${p.username}`} 
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => setOpen(false)}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={p.avatar_url || ''} alt={p.display_name || p.username} />
                        <AvatarFallback className="bg-background-sand text-text-dark">
                          {(p.display_name || p.username).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div 
                            className="text-sm font-semibold truncate"
                            dangerouslySetInnerHTML={{
                              __html: highlight(p.display_name || p.username, q)
                            }}
                          />
                          {p.isPrivate && (
                            <Badge variant="secondary" className="text-xs bg-background-sand/20 text-text-light">
                              Private
                            </Badge>
                          )}
                        </div>
                        <div 
                          className="text-xs text-text-light/70 truncate"
                          dangerouslySetInnerHTML={{
                            __html: `@${highlight(p.username, q)}`
                          }}
                        />
                        {p.bio && (
                          <div className="text-xs text-text-light/60 truncate mt-1">
                            {p.bio}
                          </div>
                        )}
                      </div>
                    </Link>

                    {p.relation !== 'self' && (
                      <ProfileCTA
                        profileUserId={p.id}
                        relation={p.relation}
                        isPrivate={p.isPrivate}
                        requestId={p.requestId ?? null}
                        onRelationChange={() => {
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