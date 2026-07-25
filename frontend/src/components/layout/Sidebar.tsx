import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FileText, ReceiptText, ClipboardCheck, Settings, LogOut, Layers, Trophy, ClipboardList, ChevronDown } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { LogoMark } from '../shared/LogoMark';

interface NavSection {
  label: string;
  icon: React.FC<{ size?: number; strokeWidth?: number; className?: string }>;
  to?: string;
  children?: { to: string; icon: React.FC<{ size?: number; strokeWidth?: number; className?: string }>; label: string }[];
}

const navSections: NavSection[] = [
  {
    label: 'Forms',
    icon: FileText,
    children: [
      { to: '/dashboard', icon: FileText, label: 'My Forms' },
      { to: '/templates', icon: Layers, label: 'Templates' },
    ],
  },
  {
    label: 'Bills',
    icon: ReceiptText,
    to: '/bills',
  },
  {
    label: 'Quiz',
    icon: ClipboardCheck,
    children: [
      { to: '/my-assignments', icon: ClipboardList, label: 'My Assignments' },
      { to: '/my-results', icon: Trophy, label: 'My Results' },
    ],
  },
  {
    label: 'Settings',
    icon: Settings,
    to: '/settings',
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Forms', 'Quiz']));

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    navigate('/login');
  };

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? '??';

  const handleNavClick = () => {
    setTimeout(() => onClose?.(), 180);
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive ? 'text-[#1B6B4A] bg-[#E8F5EE]' : 'text-[#6B6B66] hover:text-[#141412] hover:bg-[#F5F4F1]'
    }`;

  const subLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 pl-10 pr-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
      isActive ? 'text-[#1B6B4A] bg-[#E8F5EE]' : 'text-[#6B6B66] hover:text-[#141412] hover:bg-[#F5F4F1]'
    }`;

  return (
    <aside
      className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-40 lg:z-auto flex flex-col h-screen shrink-0 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
      style={{ width: '216px', background: '#FFFFFF' }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <LogoMark size={28} variant="dark" />
          <span className="text-[#141412] font-bold text-[15px] tracking-[-0.02em]">formrise™</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 flex flex-col gap-0.5 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            {/* Parent */}
            {section.to ? (
              <div className="flex items-center gap-0">
                <NavLink to={section.to} onClick={handleNavClick} className={linkClass} end style={{ flex: 1 }}>
                  <section.icon size={16} strokeWidth={1.8} />
                  <span className="flex-1">{section.label}</span>
                </NavLink>
                {section.children && section.children.length > 0 && (
                  <button
                    onClick={() => toggleSection(section.label)}
                    className="p-1 rounded-xl hover:bg-[#E8F5EE] transition-colors cursor-pointer shrink-0 mr-1"
                    aria-label={expandedSections.has(section.label) ? `Collapse ${section.label}` : `Expand ${section.label}`}
                  >
                    <ChevronDown size={14} className={`transition-transform ${expandedSections.has(section.label) ? '' : '-rotate-90'}`} />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => toggleSection(section.label)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full cursor-pointer text-[#6B6B66] hover:text-[#141412] hover:bg-[#F5F4F1]`}
              >
                <section.icon size={16} strokeWidth={1.8} />
                <span className="flex-1 text-left">{section.label}</span>
                {section.children && section.children.length > 0 && (
                  <ChevronDown size={12} className={`transition-transform ${expandedSections.has(section.label) ? '' : '-rotate-90'}`} />
                )}
              </button>
            )}

            {/* Children */}
            {section.children && expandedSections.has(section.label) && (
              <div className="flex flex-col gap-0.5 mt-0.5 mb-1">
                {section.children.map((child) => (
                  <NavLink key={child.to} to={child.to} onClick={handleNavClick} className={subLinkClass}>
                    <child.icon size={14} strokeWidth={1.8} />
                    {child.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-2.5 pb-4 pt-3" style={{ borderTop: '1px solid #E4E4E0' }}>
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl mb-0.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
              style={{ background: '#1B6B4A' }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              {user.displayName && (
                <p className="text-xs font-semibold text-[#141412] truncate leading-none mb-0.5">{user.displayName}</p>
              )}
              <p className="text-[11px] text-[#6B6B66] truncate leading-none">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[#6B6B66] hover:text-[#141412] hover:bg-[#F5F4F1] w-full transition-all cursor-pointer"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}