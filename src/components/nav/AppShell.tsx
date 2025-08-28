'use client';
import { ReactNode } from 'react';
import DesktopSidebar from './DesktopSidebar';
import MobileTabBar from './MobileTabBar';
import AppHeader from './AppHeader';

export default function AppShell({ children, meUsername }: { children: ReactNode; meUsername?: string }) {
  return (
    <div className="min-h-screen bg-[#0B1C13] text-white">
      <div className="mx-auto max-w-7xl flex">
        <DesktopSidebar meUsername={meUsername} />
        <main className="flex-1 min-w-0">
          <AppHeader />
          <div className="mx-auto max-w-3xl px-3 py-4">
            {children}
          </div>
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
