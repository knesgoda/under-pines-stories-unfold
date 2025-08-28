'use client';
export default function NavBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="ml-2 inline-flex min-w-[18px] h-[18px] px-1 rounded-full bg-accent-warm text-black text-[11px] leading-[18px] justify-center">
      {count > 99 ? '99+' : count}
    </span>
  );
}
