import { Suspense, useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, WifiOff } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { LogoMark } from '../shared/LogoMark';
import { PageLoader } from '../shared/LoadingSpinner';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

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
            <LogoMark size={24} variant="dark" />
            <span className="font-semibold text-[#141412] text-[15px] tracking-[-0.02em]">formrise™</span>
          </div>
        </header>

        {!isOnline && (
          <div className="shrink-0 flex items-start gap-3 px-4 py-3 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
            <WifiOff size={16} className="shrink-0 mt-0.5 text-amber-500" />
            <div>
              <span className="font-semibold">You're offline.</span>
              {' '}Your dashboard and builder need a connection.
              <span className="block text-xs text-amber-700 mt-0.5">
                To fill a form offline, open its share link once while online — it'll be available next time.
              </span>
            </div>
          </div>
        )}

        <main id="main-content" className="flex-1 overflow-y-auto overflow-x-hidden" style={{ overscrollBehavior: 'contain' }}>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
