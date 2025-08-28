'use client';
import clsx from 'clsx';

export default function EmberRing({ active, size=56 }: { active?: boolean; size?: number }) {
  return (
    <div
      className={clsx('rounded-full grid place-items-center', active && 'shadow-[0_0_20px_4px_rgba(255,120,0,0.35)]')}
      style={{ width: size, height: size, border: '2px solid rgba(255,120,0,0.6)' }}
      aria-label={active ? 'Active Ember' : 'Ember'}
    >
      <div className="rounded-full" style={{ width: size-8, height: size-8, background: 'linear-gradient(180deg,#1b2a22,#0b1c13)' }}/>
    </div>
  );
}
