'use client';
import useSWR from 'swr';

export default function Pantry(){
  const { data, mutate } = useSWR('/api/game/inventory', (u)=>fetch(u).then(r=>r.json()));
  const items = data?.items || [];

  async function claimDaily(){
    // Game functionality disabled for now
    // TODO: Implement game features with Supabase Edge Function if needed
    mutate();
  }

  return (
    <div className="rounded-lg border border-white/10 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Camp Pantry</div>
        <button onClick={claimDaily} className="h-8 px-3 rounded bg-background-sand text-black text-sm">Claim Daily Kit</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
        {items.map((it:any)=>(
          <div key={it.slug} className="rounded bg-white/5 p-3">
            <div className="text-2xl">{it.emoji}</div>
            <div className="text-sm mt-1">{it.name}</div>
            <div className="text-xs text-white/60">x{it.qty}</div>
          </div>
        ))}
        {!items.length && <div className="text-sm text-white/60">No items yet. Earn by posting, reacting, and sharing!</div>}
      </div>
    </div>
  );
}
