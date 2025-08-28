'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import useSWR from 'swr';

export default function PostInsightsMini({ postId }:{ postId:string }) {
  const { data } = useSWR(`/api/insights/post/${postId}?days=14`, (u)=>fetch(u,{cache:'no-store'}).then(r=>r.json()));
  const series = data?.series || [];
  if (!series.length) return null;
  const max = Math.max(...series.map((d:any)=>d.impressions||0), 1);
  return (
    <div className="mt-2 text-xs text-white/70">
      <div className="flex items-end gap-1 h-10">
        {series.map((d:any, i:number)=>(
          <div key={i} title={`${d.day}: ${d.impressions} views`} style={{ height: `${(d.impressions/max)*100}%` }} className="w-2 bg-white/30 rounded-sm"/>
        ))}
      </div>
      <div className="mt-1">Views (14d)</div>
    </div>
  );
}
