'use client'
import useSWR from 'swr'
import Image from 'next/image'

export default function ReactorsSheet({
  open, onClose, kind, targetId, emoji
}: { open: boolean; onClose: () => void; kind: 'post'|'comment'; targetId: string; emoji: string }) {
  const url = kind === 'post'
    ? `/api/reactions/post/${targetId}/reactors?emoji=${encodeURIComponent(emoji)}`
    : `/api/reactions/comment/${targetId}/reactors?emoji=${encodeURIComponent(emoji)}`
  const { data } = useSWR(open ? url : null, (u)=>fetch(u,{cache:'no-store'}).then(r=>r.json()))
  const items: any[] = data?.items || []

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-lg bg-[#0B1C13] border border-white/10 p-3"
           onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Reactions {emoji}</div>
          <button onClick={onClose} className="text-sm text-white/70">Close</button>
        </div>
        <div className="mt-2 max-h-80 overflow-auto space-y-2">
          {items.map((it, i)=>(
            <div key={i} className="flex items-center gap-3">
              <div className="relative h-9 w-9 rounded-full overflow-hidden bg-white/10">
                {it.user?.avatar_url && <Image src={it.user.avatar_url} alt="" fill sizes="36px" className="object-cover" />}
              </div>
              <div className="text-sm">
                <div>{it.user?.display_name || it.user?.username || 'User'}</div>
                <div className="text-xs text-white/60">{new Date(it.reacted_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
          {!items.length && <div className="text-sm text-white/60">No one yet.</div>}
        </div>
      </div>
    </div>
  )
}
