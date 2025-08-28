'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';
import EmberRing from './EmberRing';
import { EPHEMERAL } from '@/lib/ephemeral/labels';

const fetcher = (u:string)=>fetch(u,{ cache:'no-store' }).then(r=>r.json());

export default function EmberTray() {
  const { data } = useSWR('/api/embers/feed', fetcher, { refreshInterval: 60_000 });
  const items = data?.items || [];
  if (!items.length) return null;

  return (
    <div className="flex gap-3 overflow-x-auto py-2 px-3">
      {items.map((e:any)=>(
        <Link key={e.id} href={`${EPHEMERAL.route}/${e.id}`} className="flex flex-col items-center gap-1">
          <EmberRing active size={56}/>
          <div className="w-14 h-14 relative -mt-12 rounded-full overflow-hidden">
            {e.media?.[0]?.key_md && <Image src={e.media[0].key_md} alt="" fill sizes="56px" className="object-cover" />}
          </div>
          <span className="text-[11px] text-white/70 mt-1">Ember</span>
        </Link>
      ))}
    </div>
  );
}
