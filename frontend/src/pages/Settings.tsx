import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { useToast } from '../components/shared/Toast';

export function Settings() {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Persist display name — extend this to call your profile API when available
      toast('Settings saved', 'success');
    } catch {
      toast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold text-[#1A1A18] mb-1">Settings</h1>
      <p className="text-sm text-[#6B6B66] mb-8">Manage your account preferences.</p>

      <div className="bg-white border border-[#E8E8E4] rounded-xl p-6 flex flex-col gap-5">
        <div>
          <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wider mb-3">
            Account
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-[#9C9C96] mb-0.5">Email</p>
              <p className="text-sm font-medium text-[#1A1A18]">{user?.email ?? '—'}</p>
            </div>

            <Input
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-[#F0F0EC]">
          <Button onClick={handleSave} isLoading={saving}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
