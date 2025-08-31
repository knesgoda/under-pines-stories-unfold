'use client';
import { Link, useLocation } from 'react-router-dom';
import { SparkIcon, BellIcon } from './icons';
import { useUnread } from './useUnread';

export default function AppHeader() {
  const location = useLocation();
  const p = location.pathname;
  const showSearch = !p.startsWith('/messages') && !p.startsWith('/compose');
  const { notifCount } = useUnread();

  return (
    <header className="sticky top-0 z-30 bg-[#0B1C13]/80 backdrop-blur border-b border-white/10">
      <div className="mx-auto max-w-3xl px-3 h-14 flex items-center gap-3">
        <Link to="/" className="lg:hidden text-base font-semibold">🌲 Under Pines</Link>
        {showSearch && (
          <div className="flex-1">
            {/* Replace with your existing PeopleTypeahead; this is a placeholder input */}
            <input
              className="w-full h-9 px-3 rounded-md bg-white/5 placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Search people and tags…"
              aria-label="Search"
              onFocus={(e)=>{ /* optionally open your search drawer */ }}
            />
          </div>
        )}
        <Link to="/notifications" className="relative inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-white/10">
          <BellIcon />
          {notifCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-warm text-black text-[11px] leading-[18px] text-center">
              {notifCount > 99 ? '99+' : notifCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Link>
        <Link to="/embers" className="hidden sm:inline-flex items-center gap-2 h-9 px-3 rounded-md bg-white/10 hover:bg-white/15">
          <SparkIcon /><span className="text-sm">Embers</span>
        </Link>
        <Link to="/compose" className="hidden sm:inline-flex items-center justify-center h-9 px-3 rounded-md bg-background-sand text-black text-sm font-medium">
          Create
        </Link>
      </div>
    </header>
  );
}
