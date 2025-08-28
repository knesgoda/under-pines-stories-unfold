'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NavBadge from './NavBadge';
import clsx from 'clsx';
import type { ComponentType, SVGProps } from 'react';

export default function NavItem({
  href, icon: Icon, label, badge = 0, exact = false
}: { href: string; icon: ComponentType<SVGProps<SVGSVGElement>>; label: string; badge?: number; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={clsx(
        'flex items-center gap-3 px-3 py-2 rounded-md transition',
        active ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5'
      )}
    >
      <Icon />
      <span className="text-sm">{label}</span>
      {!!badge && <NavBadge count={badge} />}
    </Link>
  );
}
