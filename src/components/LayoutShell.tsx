'use client';

import { useState } from 'react';
import AppSidebar from './AppSidebar';
import ThemeToggle from './ThemeToggle';
import LangToggle from './LangToggle';
import CanvasSelector from './CanvasSelector';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="sticky top-0 z-[100] border-b border-[rgb(var(--border))]/60 bg-[rgb(var(--bg))]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[rgb(var(--bg))]/60 h-14 flex items-center px-4 sm:px-6 gap-3"
          role="banner"
        >
          <button
            data-testid="button-sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 -ms-2 rounded-xl text-[rgb(var(--text2))] hover:bg-[rgb(var(--surface2))] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {sidebarOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>

          <a
            href="/"
            data-testid="link-home"
            className="lg:hidden text-base font-semibold text-[rgb(var(--text))] tracking-tight no-underline"
          >
            Riyadh Demand Loop
          </a>

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <LangToggle />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {process.env.NODE_ENV === 'development' && <CanvasSelector />}
    </div>
  );
}
