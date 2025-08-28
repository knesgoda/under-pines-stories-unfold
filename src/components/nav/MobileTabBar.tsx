'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, SearchIcon, SparkIcon, BellIcon, DmIcon, PlusIcon } from './icons';
import NavBadge from './NavBadge';
import { useUnread } from './useUnread';
import clsx from 'clsx';
import type { ComponentType, SVGProps } from 'react';

export default function MobileTabBar() {
  const { notifCount, dmCount } = useUnread();
  const p = usePathname();

  const Item = ({ href, Icon }: { href: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }) => {
    const active = p === href || p.startsWith(href);
    return (
      <Link href={href} className={clsx('flex-1 grid place-items-center h-12', active ? 'text-white' : 'text-white/70')}>
        <Icon />
        <span className="sr-only">{href}</span>
        {href === '/notifications' && <div className="absolute top-1 right-[20%]"><NavBadge count={notifCount}/></div>}
        {href === '/messages'      && <div className="absolute top-1 right-[5%]"><NavBadge count={dmCount}/></div>}
      </Link>
    );
  };

  return (
    <div className="lg:hidden">
      <div className="fixed bottom-0 inset-x-0 border-t border-white/10 bg-[#0B1C13]/95 backdrop-blur z-40">
        <div className="relative flex items-center">
          <Item href="/"             Icon={HomeIcon}/>
          <Item href="/search"       Icon={SearchIcon}/>
          <div className="relative -mt-6 flex-1 grid place-items-center">
            <Link href="/compose" className="grid place-items-center h-12 w-12 rounded-full bg-background-sand text-black shadow-md">
              <PlusIcon />
              <span className="sr-only">Compose</span>
            </Link>
          </div>
          <Item href="/notifications" Icon={BellIcon}/>
          <Item href="/messages"      Icon={DmIcon}/>
        </div>
      </div>

      {/* Optional quick access to Embers */}
      <Link href="/embers" className="fixed right-4 bottom-20 grid place-items-center h-10 w-10 rounded-full bg-white/10 text-white/90 backdrop-blur z-40">
        <SparkIcon />
        <span className="sr-only">Embers</span>
      </Link>
    </div>
  );
}
