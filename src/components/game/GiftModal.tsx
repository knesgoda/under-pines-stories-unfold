'use client';
import { useEffect, useState } from 'react';

export default function GiftModal({ open, onClose }:{ open:boolean; onClose:()=>void }){
  const [inv, setInv] = useState<Array<{ slug: string; name: string; emoji: string; qty: number }>>([]);
  const [q,setQ]=useState(''); const [people,setPeople]=useState<Array<{ id: string; display_name?: string; username: string }>>([]);
  const [to,setTo]=useState<string|undefined>(); const [item,setItem]=useState<string|undefined>(); const [qty,setQty]=useState<number>(1);

  useEffect(()=>{ 
    // Game functionality disabled for now
    // TODO: Implement game features with Supabase Edge Function if needed
  },[open]);
  async function search(v:string){ 
    // User search functionality disabled for now
    // TODO: Implement user search with Supabase if needed
  }
  async function send(){
    // Gift functionality disabled for now
    // TODO: Implement gift system with Supabase Edge Function if needed
    alert('Gift functionality is not available at this time');
    onClose();
  }

  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-lg bg-[#0B1C13] border border-white/10 p-3" onClick={e=>e.stopPropagation()}>
        <div className="text-sm font-semibold mb-2">Gift Items</div>
        <input value={q} onChange={e=>search(e.target.value)} placeholder="Search friend…" className="w-full h-9 px-2 rounded bg-white/10"/>
        <div className="mt-2 max-h-28 overflow-auto">
          {people.map((p: { id: string; display_name?: string; username: string })=>(
            <button key={p.id} onClick={()=>setTo(p.id)} className={"w-full text-left px-2 py-1 rounded " + (to===p.id?'bg-white/10':'hover:bg-white/5')}>
              {p.display_name || p.username}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <div className="text-xs text-white/60 mb-1">Choose item</div>
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-auto">
            {inv.map(it=>(
              <button key={it.slug} onClick={()=>setItem(it.slug)} className={"px-2 py-2 rounded bg-white/5 text-left " + (item===it.slug?'outline outline-1 outline-white/30':'')}>
                <div className="text-lg">{it.emoji}</div>
                <div className="text-xs">{it.name} ×{it.qty}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <input type="number" min={1} value={qty} onChange={e=>setQty(parseInt(e.target.value||'1',10))} className="w-24 h-9 px-2 rounded bg-white/10"/>
          <button onClick={send} className="h-9 px-3 rounded bg-background-sand text-black text-sm">Send</button>
          <button onClick={onClose} className="h-9 px-3 rounded bg-white/10 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}
