'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';

export default function PollCard({ postId, poll }:{ postId: string; poll: { id:string; question:string; multi:boolean; options:{ id:string; text:string; ord:number }[] } }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [results, setResults] = useState<any[]|null>(null);

  async function vote() {
    const res = await fetch(`/api/polls/${postId}/vote`, {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ optionIds: selected })
    });
    const json = await res.json();
    setResults(json.results || []);
  }

  const toggle = (id:string) => setSelected(s => poll.multi ? (s.includes(id)? s.filter(x=>x!==id): [...s,id]) : [id]);

  return (
    <div className="rounded-lg border border-white/10 p-3">
      <div className="text-sm font-semibold mb-2">{poll.question}</div>
      {(results || poll.options).map((opt:any)=>(
        <button key={opt.id}
          onClick={()=>!results && toggle(opt.id)}
          className={`w-full text-left px-3 py-2 rounded-md mb-1 ${selected.includes(opt.id)?'bg-white/10':''} ${results?'cursor-default':''}`}>
          <div className="flex items-center justify-between gap-2">
            <span>{opt.text}</span>
            {results && <span className="text-xs text-white/70">{opt.votes}</span>}
          </div>
        </button>
      ))}
      {!results && <div className="flex justify-end"><button onClick={vote} disabled={!selected.length} className="px-3 h-8 rounded bg-background-sand text-black text-sm">Vote</button></div>}
    </div>
  );
}
