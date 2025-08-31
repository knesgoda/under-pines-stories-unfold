'use client';
import NavItem from './NavItem';
import { HomeIcon, SearchIcon, SparkIcon, BellIcon, DmIcon, GroupsIcon, SaveIcon, UserIcon } from './icons';
import { useUnread } from './useUnread';
import { Link } from 'react-router-dom';

export default function DesktopSidebar({ meUsername }: { meUsername?: string }) {
  const { notifCount, dmCount } = useUnread();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 border-r border-white/10 h-screen sticky top-0">
      <div className="px-4 py-5 text-lg font-semibold">🌲 Under Pines</div>
      <nav className="px-2 space-y-1">
        <NavItem href="/"           icon={HomeIcon}   label="Home" exact />
        <NavItem href="/search"     icon={SearchIcon} label="Search" />
        <NavItem href="/embers"     icon={SparkIcon}  label="Embers" />
        <NavItem href="/groups"     icon={GroupsIcon} label="Groups" />
        <NavItem href="/saved"      icon={SaveIcon}   label="Saved" />
        <NavItem href="/notifications" icon={BellIcon} label="Notifications" badge={notifCount} />
        <NavItem href="/messages"   icon={DmIcon}     label="Messages" badge={dmCount} />
      </nav>

      <div className="mt-auto px-2 py-4">
        <Link to="/compose" className="inline-flex items-center justify-center w-full h-10 rounded-md bg-background-sand text-black text-sm font-medium">
          Create
        </Link>
        <NavItem href={meUsername ? `/@${meUsername}` : '/me'} icon={UserIcon} label="Profile" />
      </div>
    </aside>
  );
}
