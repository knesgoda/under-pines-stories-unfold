'use client';
import useSWR from 'swr';

export default function CraftPanel(){
  const { data: inv } = useSWR('/api/game/inventory', (u)=>fetch(u).then(r=>r.json()));
  const { data: rec } = useSWR('/api/game/recipes', (u)=>fetch(u).then(r=>r.json()));
  const inventory = new Map((inv?.items||[]).map((i:any)=>[i.slug, i.qty]));

  async function craft(slug:string){
    const r = await fetch('/api/game/craft',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ recipe: slug, times: 1 }) });
    const j = await r.json(); alert(j.created?.length ? `Crafted ${j.created[0].output_slug} × ${j.created[0].crafted}` : 'Not enough ingredients');
  }

  return (
    <div className="rounded-lg border border-white/10 p-4 space-y-4">
      <div className="text-sm font-semibold">Campfire Crafting</div>
      {(rec?.items||[]).map((r:any)=>(
        <div key={r.slug} className="rounded bg-white/5 p-3">
          <div className="text-sm font-medium">{r.name}</div>
          <div className="text-xs text-white/60 mt-1">Needs: {r.ingredients.map((g:any)=>`${g.item?.emoji||''} ${g.item?.name||g.item_slug}×${g.qty}`).join(', ')}</div>
          <button onClick={()=>craft(r.slug)} className="mt-2 h-8 px-3 rounded bg-white/10 text-sm">Craft</button>
        </div>
      ))}
    </div>
  );
}
