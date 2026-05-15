import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Layers, Settings, LogOut } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/templates', icon: Layers, label: 'Templates' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    navigate('/login');
  };

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <aside className="w-54 flex flex-col h-screen sticky top-0 shrink-0" style={{ width: '216px', background: '#0C1910' }}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: '#1B6B4A' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 12h6M9 16h4M7 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9 4h6v4H9V4z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-[15px] tracking-[-0.02em]">formrise</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 flex flex-col gap-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                isActive
                  ? 'text-white bg-white/10'
                  : 'text-white/40 hover:text-white/75 hover:bg-white/[0.06]'
              }`
            }
          >
            <Icon size={15} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-2.5 pb-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
              style={{ background: '#1B6B4A' }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              {user.displayName && (
                <p className="text-[12px] font-medium text-white/60 truncate leading-none mb-0.5">{user.displayName}</p>
              )}
              <p className="text-[11px] text-white/30 truncate leading-none">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-white/30 hover:text-white/65 hover:bg-white/[0.06] w-full transition-all cursor-pointer"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
