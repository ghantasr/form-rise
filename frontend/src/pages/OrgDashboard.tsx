import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Layers, ClipboardList, Plus, Trash2, Copy, Check, ChevronDown, ChevronUp, UserMinus } from 'lucide-react';
import { orgsApi } from '../api/orgs';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { PageLoader } from '../components/shared/LoadingSpinner';
import type { Organization, OrgMember, OrgGroup, FormAssignment } from '../types/org';

type Tab = 'members' | 'groups' | 'assignments';

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: 'bg-[#E8F5EE] text-[#1B6B4A]',
    moderator: 'bg-blue-50 text-blue-700',
    member: 'bg-[#F7F7F5] text-[#6B6B66]',
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${styles[role] ?? styles.member}`}>
      {role}
    </span>
  );
}

function Avatar({ name, email, avatarUrl, size = 'sm' }: { name?: string; email?: string; avatarUrl?: string; size?: 'sm' | 'md' }) {
  const initials = (name || email || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const dim = size === 'md' ? 'w-9 h-9 text-sm' : 'w-7 h-7 text-xs';
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={`${dim} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${dim} rounded-full bg-[#1B6B4A] text-white font-bold flex items-center justify-center shrink-0`}>
      {initials}
    </div>
  );
}

// ── Create Org ──────────────────────────────────────────────────────────────
function CreateOrgCard({ onCreated }: { onCreated: (org: Organization) => void }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Organisation name is required.'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await orgsApi.create(name.trim());
      onCreated(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error ?? 'Failed to create organisation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-16 px-4">
      <div className="bg-white border border-[#E8E8E4] rounded-xl p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-full bg-[#E8F5EE] flex items-center justify-center mx-auto mb-5">
          <Building2 size={24} className="text-[#1B6B4A]" />
        </div>
        <h1 className="text-xl font-bold text-[#1A1A18] mb-2">Create your organisation</h1>
        <p className="text-sm text-[#6B6B66] mb-6">
          Create an org to distribute forms and quizzes to specific groups of people.
        </p>
        <form onSubmit={handleCreate} className="flex flex-col gap-3 text-left">
          <Input
            label="Organisation name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Corp"
            error={error}
            autoFocus
          />
          <Button type="submit" isLoading={loading} className="w-full justify-center">
            Create organisation
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── Members Tab ─────────────────────────────────────────────────────────────
function MembersTab({ org }: { org: Organization }) {
  const currentUser = useAuthStore((s) => s.user);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      const { data } = await orgsApi.getMembers(org.id);
      setMembers(data);
    } catch {}
    finally { setLoading(false); }
  }, [org.id]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      const { data } = await orgsApi.invite(org.id, inviteEmail || undefined, inviteRole);
      setInviteUrl(data.joinUrl);
    } catch {}
    finally { setInviteLoading(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await orgsApi.updateMemberRole(org.id, userId, role);
      setMembers((prev) => prev.map((m) => m.userId === userId ? { ...m, role: role as OrgMember['role'] } : m));
    } catch {}
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Remove this member from the organisation?')) return;
    try {
      await orgsApi.removeMember(org.id, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch {}
  };

  if (loading) return <div className="py-12 flex justify-center"><PageLoader /></div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6B6B66]">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        <Button variant="secondary" size="sm" onClick={() => { setShowInvite((p) => !p); setInviteUrl(''); }} className="gap-1.5">
          <Plus size={14} /> Invite
        </Button>
      </div>

      {showInvite && (
        <div className="bg-[#F7F7F5] border border-[#E8E8E4] rounded-xl p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-[#1A1A18]">Generate invite link</p>
          {!inviteUrl ? (
            <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Input
                  label="Email (optional)"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="person@example.com"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#6B6B66]">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="border border-[#E8E8E4] rounded-lg px-3 py-2 text-sm text-[#1A1A18] bg-white focus:outline-none focus:ring-1 focus:ring-[#1B6B4A]"
                >
                  <option value="member">Member</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>
              <Button type="submit" isLoading={inviteLoading} size="sm">Generate link</Button>
            </form>
          ) : (
            <div className="flex gap-2">
              <input
                readOnly
                value={inviteUrl}
                className="flex-1 border border-[#E8E8E4] rounded-lg px-3 py-2 text-sm text-[#1A1A18] bg-white focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 border border-[#E8E8E4] rounded-lg text-sm font-medium bg-white hover:bg-[#F5F5F3] transition-colors cursor-pointer"
              >
                {copied ? <Check size={14} className="text-[#1B6B4A]" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col divide-y divide-[#E8E8E4] bg-white border border-[#E8E8E4] rounded-xl overflow-hidden">
        {members.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#6B6B66]">No members yet.</div>
        ) : (
          members.map((member) => {
            const isSelf = member.email === currentUser?.email;
            return (
              <div key={member.userId} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={member.name} email={member.email} avatarUrl={member.avatarUrl} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A18] truncate">{member.name || member.email}</p>
                  <p className="text-xs text-[#6B6B66] truncate">{member.email}</p>
                </div>
                {isSelf ? (
                  <RoleBadge role={member.role} />
                ) : (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                    className="border border-[#E8E8E4] rounded-md px-2 py-1 text-xs text-[#1A1A18] bg-white focus:outline-none focus:ring-1 focus:ring-[#1B6B4A] cursor-pointer"
                  >
                    <option value="member">Member</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
                {!isSelf && (
                  <button
                    onClick={() => handleRemove(member.userId)}
                    className="p-1.5 rounded-lg text-[#6B6B66] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove member"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Groups Tab ──────────────────────────────────────────────────────────────
function GroupsTab({ org }: { org: Organization }) {
  const [groups, setGroups] = useState<OrgGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<Record<string, OrgMember[]>>({});
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [addingToGroup, setAddingToGroup] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');

  const fetchGroups = useCallback(async () => {
    try {
      const { data } = await orgsApi.listGroups(org.id);
      setGroups(data);
    } catch {}
    finally { setLoading(false); }
  }, [org.id]);

  const fetchOrgMembers = useCallback(async () => {
    try {
      const { data } = await orgsApi.getMembers(org.id);
      setOrgMembers(data);
    } catch {}
  }, [org.id]);

  useEffect(() => { fetchGroups(); fetchOrgMembers(); }, [fetchGroups, fetchOrgMembers]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const { data } = await orgsApi.createGroup(org.id, newGroupName.trim());
      setGroups((prev) => [...prev, data]);
      setNewGroupName('');
      setShowNewGroup(false);
    } catch {}
    finally { setCreating(false); }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Delete this group? This action cannot be undone.')) return;
    try {
      await orgsApi.deleteGroup(org.id, groupId);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      if (expandedGroup === groupId) setExpandedGroup(null);
    } catch {}
  };

  const toggleExpand = async (groupId: string) => {
    if (expandedGroup === groupId) { setExpandedGroup(null); return; }
    setExpandedGroup(groupId);
    if (!groupMembers[groupId]) {
      try {
        const { data } = await orgsApi.getGroupMembers(org.id, groupId);
        setGroupMembers((prev) => ({ ...prev, [groupId]: data }));
      } catch {}
    }
  };

  const handleAddMember = async (groupId: string) => {
    if (!selectedUserId) return;
    try {
      await orgsApi.addGroupMembers(org.id, groupId, [selectedUserId]);
      const { data } = await orgsApi.getGroupMembers(org.id, groupId);
      setGroupMembers((prev) => ({ ...prev, [groupId]: data }));
      setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, memberCount: data.length } : g));
      setSelectedUserId('');
      setAddingToGroup(null);
    } catch {}
  };

  const handleRemoveGroupMember = async (groupId: string, userId: string) => {
    try {
      await orgsApi.removeGroupMember(org.id, groupId, userId);
      setGroupMembers((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] ?? []).filter((m) => m.userId !== userId),
      }));
      setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, memberCount: Math.max(0, g.memberCount - 1) } : g));
    } catch {}
  };

  if (loading) return <div className="py-12 flex justify-center"><PageLoader /></div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6B6B66]">{groups.length} group{groups.length !== 1 ? 's' : ''}</p>
        <Button variant="secondary" size="sm" onClick={() => setShowNewGroup((p) => !p)} className="gap-1.5">
          <Plus size={14} /> New group
        </Button>
      </div>

      {showNewGroup && (
        <form onSubmit={handleCreateGroup} className="flex gap-2 bg-[#F7F7F5] border border-[#E8E8E4] rounded-xl p-3">
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name"
            autoFocus
            className="flex-1 border border-[#E8E8E4] rounded-lg px-3 py-2 text-sm text-[#1A1A18] bg-white focus:outline-none focus:ring-1 focus:ring-[#1B6B4A]"
          />
          <Button type="submit" isLoading={creating} size="sm">Create</Button>
        </form>
      )}

      <div className="flex flex-col gap-2">
        {groups.length === 0 ? (
          <div className="bg-white border border-[#E8E8E4] rounded-xl py-12 text-center text-sm text-[#6B6B66]">
            No groups yet. Create one to start distributing forms.
          </div>
        ) : (
          groups.map((group) => {
            const isExpanded = expandedGroup === group.id;
            const members = groupMembers[group.id] ?? [];
            return (
              <div key={group.id} className="bg-white border border-[#E8E8E4] rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => toggleExpand(group.id)}
                    className="flex-1 flex items-center gap-3 text-left cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#E8F5EE] flex items-center justify-center shrink-0">
                      <Users size={14} className="text-[#1B6B4A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#1A1A18]">
                          {group.isDefault ? 'All org members' : group.name}
                        </p>
                        {group.isDefault && (
                          <span className="px-1.5 py-0.5 bg-[#E8F5EE] text-[#1B6B4A] text-[10px] font-medium rounded">default</span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B6B66]">{group.memberCount} member{group.memberCount !== 1 ? 's' : ''} · {group.assignmentCount} assignment{group.assignmentCount !== 1 ? 's' : ''}</p>
                    </div>
                    {isExpanded ? <ChevronUp size={14} className="text-[#6B6B66] shrink-0" /> : <ChevronDown size={14} className="text-[#6B6B66] shrink-0" />}
                  </button>
                  {!group.isDefault && (
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-1.5 rounded-lg text-[#6B6B66] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                      title="Delete group"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-[#E8E8E4] px-4 py-3 bg-[#FAFAF9]">
                    {members.length === 0 ? (
                      <p className="text-xs text-[#6B6B66] mb-3">No members in this group yet.</p>
                    ) : (
                      <div className="flex flex-col gap-2 mb-3">
                        {members.map((m) => (
                          <div key={m.userId} className="flex items-center gap-2">
                            <Avatar name={m.name} email={m.email} avatarUrl={m.avatarUrl} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-[#1A1A18] truncate">{m.name || m.email}</p>
                              <p className="text-xs text-[#6B6B66] truncate">{m.email}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveGroupMember(group.id, m.userId)}
                              className="p-1 rounded text-[#6B6B66] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Remove from group"
                            >
                              <UserMinus size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {addingToGroup === group.id ? (
                      <div className="flex gap-2 items-center">
                        <select
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="flex-1 border border-[#E8E8E4] rounded-lg px-2 py-1.5 text-xs text-[#1A1A18] bg-white focus:outline-none focus:ring-1 focus:ring-[#1B6B4A]"
                        >
                          <option value="">Select a member...</option>
                          {orgMembers
                            .filter((m) => !members.some((gm) => gm.userId === m.userId))
                            .map((m) => (
                              <option key={m.userId} value={m.userId}>{m.name || m.email}</option>
                            ))
                          }
                        </select>
                        <button onClick={() => handleAddMember(group.id)} className="px-2.5 py-1.5 bg-[#1B6B4A] text-white text-xs font-medium rounded-lg hover:bg-[#134F36] transition-colors cursor-pointer">Add</button>
                        <button onClick={() => { setAddingToGroup(null); setSelectedUserId(''); }} className="px-2.5 py-1.5 border border-[#E8E8E4] text-xs font-medium rounded-lg hover:bg-[#F5F5F3] transition-colors cursor-pointer">Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingToGroup(group.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-[#1B6B4A] hover:text-[#134F36] transition-colors cursor-pointer"
                      >
                        <Plus size={12} /> Add members
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Assignments Tab ─────────────────────────────────────────────────────────
function AssignmentsTab({ assignments, loading }: { assignments: FormAssignment[]; loading: boolean }) {
  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';

  if (loading) return <div className="py-12 flex justify-center"><PageLoader /></div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[#E8F5EE] border border-[#1B6B4A]/20 rounded-xl p-4">
        <p className="text-xs text-[#1B6B4A] font-medium">
          To assign a form to a group, open the form in the builder and use the Assign button in the toolbar.
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white border border-[#E8E8E4] rounded-xl py-12 text-center text-sm text-[#6B6B66]">
          No assignments yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {assignments.map((a) => (
            <Link
              key={a.id}
              to={`/forms/${a.formId}/assignments/${a.id}`}
              className="bg-white border border-[#E8E8E4] rounded-xl px-4 py-3 hover:border-[#1B6B4A]/30 transition-colors flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A1A18] truncate">{a.formTitle}</p>
                <p className="text-xs text-[#6B6B66]">{a.isDefaultGroup ? 'All org members' : `Group: ${a.groupName}`}</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-[#6B6B66]">
                  {fmt(a.opensAt)} — {fmt(a.closesAt)}
                </span>
                <span className="px-2 py-0.5 bg-[#F7F7F5] border border-[#E8E8E4] rounded-md text-xs text-[#6B6B66]">
                  {a.mode === 'attempt_once' ? 'One attempt' : 'Unlimited'}
                </span>
                <span className="px-2 py-0.5 bg-[#E8F5EE] rounded-md text-xs font-medium text-[#1B6B4A]">
                  {a.submittedCount}/{a.memberCount} submitted
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export function OrgDashboard() {
  const [org, setOrg] = useState<Organization | null | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [assignments, setAssignments] = useState<FormAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const assignmentsFetched = useRef(false);

  useEffect(() => {
    orgsApi.getMy()
      .then(({ data }) => setOrg(data))
      .catch(() => setOrg(null));
  }, []);

  useEffect(() => {
    if (!org || assignmentsFetched.current) return;
    assignmentsFetched.current = true;
    setAssignmentsLoading(true);
    orgsApi.getOrgAssignments(org.id)
      .then(({ data }) => setAssignments(data))
      .catch(() => {})
      .finally(() => setAssignmentsLoading(false));
  }, [org]);

  if (org === undefined) return <PageLoader />;

  if (!org) {
    return (
      <div className="flex-1 bg-[#F7F7F5] overflow-y-auto">
        <CreateOrgCard onCreated={(o) => setOrg(o)} />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'members', label: 'Members', icon: <Users size={15} /> },
    { id: 'groups', label: 'Groups', icon: <Layers size={15} /> },
    { id: 'assignments', label: 'Assignments', icon: <ClipboardList size={15} /> },
  ];

  return (
    <div className="flex-1 bg-[#F7F7F5] overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#E8F5EE] flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-[#1B6B4A]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A18]">{org.name}</h1>
            <p className="text-xs text-[#6B6B66]">{org.memberCount} member{org.memberCount !== 1 ? 's' : ''} · {org.groupCount} group{org.groupCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[#E8E8E4] rounded-xl p-1 mb-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#1B6B4A] text-white shadow-sm'
                  : 'text-[#6B6B66] hover:text-[#1A1A18] hover:bg-[#F5F5F3]'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'members' && <MembersTab org={org} />}
        {activeTab === 'groups' && <GroupsTab org={org} />}
        {activeTab === 'assignments' && <AssignmentsTab assignments={assignments} loading={assignmentsLoading} />}
      </div>
    </div>
  );
}
