'use client'
import useSWR from 'swr'

type EmojiCount = { emoji: string; count: number }
type Reactor = { count: number; user: { id: string; username?: string; display_name?: string; avatar_url?: string } }

export default function ProfileReactionStats({ userId = 'me' }:{ userId?: string }) {
  const { data } = useSWR(`/api/profile/${userId}/reaction-stats`, (u)=>fetch(u,{cache:'no-store'}).then(r=>r.json()))
  const used: EmojiCount[] = data?.used || []
  const received: EmojiCount[] = data?.received || []
  const top: Reactor[] = data?.topReactors || []

  return (
    <div className="rounded-lg border border-white/10 p-4 space-y-4">
      <div className="text-sm font-semibold">Reaction Insights</div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-white/60 mb-1">Most used by you</div>
          <div className="flex flex-wrap gap-2">
            {used.slice(0,5).map((e)=>(
              <span key={e.emoji} className="inline-flex items-center gap-1 px-2 h-7 rounded bg-white/10 text-sm">
                <span>{e.emoji}</span><span className="text-xs">{e.count}</span>
              </span>
            ))}
            {!used.length && <div className="text-xs text-white/50">No reactions yet</div>}
          </div>
        </div>

        <div>
          <div className="text-xs text-white/60 mb-1">Most received on your content</div>
          <div className="flex flex-wrap gap-2">
            {received.slice(0,5).map((e)=>(
              <span key={e.emoji} className="inline-flex items-center gap-1 px-2 h-7 rounded bg-white/10 text-sm">
                <span>{e.emoji}</span><span className="text-xs">{e.count}</span>
              </span>
            ))}
            {!received.length && <div className="text-xs text-white/50">No reactions yet</div>}
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs text-white/60 mb-2">Top reactors</div>
        <div className="flex flex-wrap gap-3">
          {top.slice(0,12).map((r, i)=>(
            <div key={i} className="flex items-center gap-2">
              <div className="relative h-7 w-7 rounded-full overflow-hidden bg-white/10">
                {r.user.avatar_url && <img src={r.user.avatar_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="text-xs">
                <div className="leading-4">{r.user.display_name || r.user.username || 'User'}</div>
                <div className="text-white/50">{r.count} reactions</div>
              </div>
            </div>
          ))}
          {!top.length && <div className="text-xs text-white/50">No reactors yet</div>}
        </div>
      </div>
    </div>
  )
}
