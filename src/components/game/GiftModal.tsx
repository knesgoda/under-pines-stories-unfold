'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function GiftModal({ open, onClose }:{ open:boolean; onClose:()=>void }){
  const [inv, setInv] = useState<Array<{ slug: string; name: string; emoji: string; qty: number; type: string }>>([]);
  const [q,setQ]=useState(''); 
  const [people,setPeople]=useState<Array<{ id: string; display_name?: string; username: string }>>([]);
  const [to,setTo]=useState<string|undefined>(); 
  const [item,setItem]=useState<string|undefined>(); 
  const [qty,setQty]=useState<number>(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(()=>{ 
    if (open) {
      loadInventory();
    }
  },[open]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (q.trim()) {
        search(q.trim());
      } else {
        setPeople([]);
      }
    }, 300);
    
    return () => clearTimeout(delayedSearch);
  }, [q]);

  async function loadInventory() {
    try {
      const { data, error } = await supabase.functions.invoke('game-inventory');
      if (error) throw error;
      // Only show crafted items that can be gifted
      const giftableItems = data.items?.filter((item: any) => item.type === 'crafted') || [];
      setInv(giftableItems);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  }

  async function search(searchQuery: string){ 
    try {
      const { data, error } = await supabase.functions.invoke('search-people', {
        body: { q: searchQuery, limit: 10 }
      });
      if (error) throw error;
      setPeople(data.profiles || []);
    } catch (error) {
      console.error('Error searching people:', error);
      setPeople([]);
    }
  }

  async function send(){
    if (!to || !item) return;
    
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('game-gift', {
        body: { 
          recipientId: to, 
          itemSlug: item, 
          quantity: qty 
        }
      });
      
      if (error) throw error;
      
      if (result.success) {
        toast({
          title: `${result.gift.emoji} Gift sent!`,
          description: `You sent ${result.gift.item} to ${result.gift.recipient}! 🎁`
        });
        onClose();
        // Reset form
        setTo(undefined);
        setItem(undefined);
        setQty(1);
        setQ('');
        loadInventory(); // Refresh inventory
      }
    } catch (error: any) {
      console.error('Error sending gift:', error);
      toast({
        title: "Gift failed",
        description: error.message || 'Failed to send gift',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-lg bg-[#0B1C13] border border-white/10 p-3" onClick={e=>e.stopPropagation()}>
        <div className="text-sm font-semibold mb-2">Gift Items</div>
        <input value={q} onChange={e=>{setQ(e.target.value); search(e.target.value);}} placeholder="Search friend…" className="w-full h-9 px-2 rounded bg-white/10 text-white placeholder:text-white/50"/>
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
          <button 
            onClick={send} 
            disabled={!to || !item || loading}
            className={`h-9 px-3 rounded text-sm transition-colors ${
              (!to || !item || loading) 
                ? 'bg-white/20 text-white/40 cursor-not-allowed' 
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {loading ? 'Sending...' : 'Send Gift'}
          </button>
          <button onClick={onClose} className="h-9 px-3 rounded bg-white/10 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}
