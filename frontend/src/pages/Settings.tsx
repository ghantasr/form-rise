import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { useToast } from '../components/shared/Toast';

export function Settings() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      toast('Settings saved', 'success');
    } catch {
      toast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <div className="p-4 sm:p-8 max-w-lg">
      <button
        onClick={() => navigate(-1)}
        className="lg:hidden flex items-center gap-1.5 text-sm text-[#6B6B66] hover:text-[#141412] transition-colors cursor-pointer mb-6"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#141412] tracking-[-0.02em]">Settings</h1>
        <p className="text-sm text-[#6B6B66] mt-0.5">Manage your account preferences.</p>
      </div>

      {/* Profile card */}
      <div className="bg-white border border-[#E4E4E0] rounded-xl p-6 mb-4">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#F0F0EC]">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
            style={{ background: '#1B6B4A' }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[#141412] text-sm truncate">{user?.displayName || 'No name set'}</p>
            <p className="text-xs text-[#9C9C96] mt-0.5 truncate">{user?.email}</p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <Input
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
          />

          <div>
            <p className="text-xs font-medium text-[#6B6B66] mb-1.5">Email address</p>
            <p className="text-sm text-[#141412] font-medium bg-[#F5F4F1] border border-[#E4E4E0] rounded-lg px-3 py-2.5 truncate">
              {user?.email ?? '—'}
            </p>
            <p className="text-xs text-[#9C9C96] mt-1">Email cannot be changed.</p>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} isLoading={saving}>
        Save changes
      </Button>
    </div>
  );
}
