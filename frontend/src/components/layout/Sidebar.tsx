import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, GitFork, Settings, LogOut } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/templates', icon: GitFork, label: 'Templates' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-60 bg-white border-r border-[#E8E8E4] flex flex-col h-screen sticky top-0">
      <div className="px-5 py-4 border-b border-[#E8E8E4]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#1B6B4A] rounded-lg flex items-center justify-center">
            <FileText size={14} className="text-white" />
          </div>
          <span className="font-bold text-[#1A1A18] text-lg">FormRise</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#E8F5EE] text-[#1B6B4A]'
                  : 'text-[#6B6B66] hover:bg-[#F5F5F3] hover:text-[#1A1A18]'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-[#E8E8E4]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#6B6B66] hover:bg-red-50 hover:text-red-600 w-full transition-colors cursor-pointer"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
