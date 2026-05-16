import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAF8]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-30 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-[#E8E8E4] shrink-0 z-20">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-1 text-[#6B6B66] hover:text-[#1A1A18] transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#1B6B4A' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M9 12h6M9 16h4M7 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 4h6v4H9V4z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-semibold text-[#141412] text-[15px] tracking-[-0.02em]">formrise</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
