import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, Send, Check, Loader2, QrCode, Languages, Palette, Trophy, Users, Trash2, Plus } from 'lucide-react';
import { formsApi } from '../api/forms';
import { orgsApi, assignmentsApi } from '../api/orgs';
import { useFormStore } from '../stores/formStore';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../components/shared/Toast';
import { Button } from '../components/shared/Button';
import { PageLoader } from '../components/shared/LoadingSpinner';
import { FieldPicker } from '../components/builder/FieldPicker';
import { FormCanvas } from '../components/builder/FormCanvas';
import { FieldEditor } from '../components/builder/FieldEditor';
import { PublishModal } from '../components/builder/PublishModal';
import { QrShareModal } from '../components/qr/QrShareModal';
import { TranslationEditor, type TranslationPayload } from '../components/builder/TranslationEditor';
import { GuidedTour, shouldShowTour } from '../components/builder/GuidedTour';
import { OnboardingChecklist } from '../components/builder/OnboardingChecklist';
import { FORM_THEMES } from '../utils/formThemes';
import type { FieldType, Form, FormField } from '../types/form';
import type { OrgGroup, FormAssignment, Organization } from '../types/org';

export function FormBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const userEmail = useAuthStore((s) => s.user?.email ?? '');

  const {
    form,
    fields,
    selectedFieldId,
    isDirty,
    isSaving,
    setForm,
    setTitle,
    setThemeId,
    setQuizMode,
    setPassMark,
    addField,
    removeField,
    updateField,
    reorderFields,
    selectField,
    setSaving,
    setDirty,
    reset,
  } = useFormStore();

  const [loading, setLoading] = useState(true);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'fields' | 'canvas' | 'editor'>('canvas');
  const [showTranslations, setShowTranslations] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [org, setOrg] = useState<Organization | null>(null);
  const [orgGroups, setOrgGroups] = useState<OrgGroup[]>([]);
  const [assignments, setAssignments] = useState<FormAssignment[]>([]);
  const [accessMode, setAccessMode] = useState<string>('public');
  const [savingAccessMode, setSavingAccessMode] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ groupId: '', opensAt: '', closesAt: '', mode: 'attempt_once' as 'attempt_once' | 'unlimited' });
  const [creatingAssignment, setCreatingAssignment] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id) {
      formsApi
        .create('Untitled Form')
        .then(({ data }) => {
          setForm(data);
          navigate(`/forms/${data.id}/edit`, { replace: true });
        })
        .catch(() => {
          toast('Failed to create form', 'error');
          navigate('/');
        })
        .finally(() => setLoading(false));
    } else {
      formsApi
        .get(id)
        .then(({ data }) => setForm(data))
        .catch(() => {
          toast('Failed to load form', 'error');
          navigate('/');
        })
        .finally(() => setLoading(false));
    }

    return () => {
      reset();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [id]);

  // Show tour after load only for first-time users
  useEffect(() => {
    if (!loading && shouldShowTour()) {
      const t = setTimeout(() => setShowTour(true), 600);
      return () => clearTimeout(t);
    }
  }, [loading]);

  useEffect(() => {
    if (!isDirty || !form?.id) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await formsApi.update(form.id!, {
          title: form.title,
          description: form.description,
          themeId: form.themeId,
          isQuizMode: form.isQuizMode,
          passMark: form.passMark,
          fields,
        });
        setDirty(false);
      } catch {
        toast('Failed to save changes', 'error');
      } finally {
        setSaving(false);
      }
    }, 3000);
  }, [fields, form?.title, isDirty]);

  const handlePublish = async () => {
    if (!form?.id) return;
    try {
      const { data } = await formsApi.publish(form.id);
      setPublishedSlug(data.slug);
      setPublishModalOpen(true);
      toast('Form published successfully', 'success');
    } catch {
      toast('Failed to publish form', 'error');
    }
  };

  const handleThemeChange = async (themeId: string) => {
    if (!form?.id) return;
    setThemeId(themeId);
    try {
      await formsApi.update(form.id, { themeId });
      setDirty(false);
      toast('Theme saved', 'success');
    } catch {
      toast('Failed to save theme', 'error');
    }
  };

  const handleSaveTranslations = async (payload: TranslationPayload) => {
    if (!form?.id) return;

    // Cancel any pending auto-save so it doesn't race with this write
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    try {
      // Flush any pending field/title changes first, then write translations on top.
      // Sequential order matters: update recreates field rows, translations must come after.
      await formsApi.update(form.id, {
        title: form.title,
        description: form.description,
        themeId: form.themeId,
        isQuizMode: form.isQuizMode,
        passMark: form.passMark,
        fields,
      });
      await formsApi.updateTranslations(form.id, payload);

      // Sync local store so future auto-saves carry the correct enabledLanguages
      setForm({ ...form, enabledLanguages: payload.enabledLanguages } as Form);
      setDirty(false);
      toast('Translations saved', 'success');
    } catch {
      toast('Failed to save translations', 'error');
    }
  };

  // Sync accessMode from form once loaded
  useEffect(() => {
    if (form?.accessMode) setAccessMode(form.accessMode);
  }, [form?.accessMode]);

  // Close assign panel if quiz mode is turned off or form is unpublished
  useEffect(() => {
    if (showAssign && (!form?.isQuizMode || form?.status !== 'active')) {
      setShowAssign(false);
    }
  }, [form?.isQuizMode, form?.status, showAssign]);

  // Load org + groups + assignments when assign panel opens
  useEffect(() => {
    if (!showAssign || !form?.id) return;
    orgsApi.getMy().then(({ data }) => {
      setOrg(data);
      if (data?.id) {
        orgsApi.listGroups(data.id).then(({ data: groups }) => setOrgGroups(groups)).catch(() => {});
      }
    }).catch(() => {});
    assignmentsApi.list(form.id).then(({ data }) => setAssignments(data)).catch(() => {});
  }, [showAssign, form?.id]);

  const handleSaveAccessMode = async (mode: string) => {
    if (!form?.id) return;
    setAccessMode(mode);
    setSavingAccessMode(true);
    try {
      await formsApi.update(form.id, {
        accessMode: mode,
        orgId: mode === 'org' || mode === 'group' ? (org?.id ?? undefined) : undefined,
      });
      toast('Access settings saved', 'success');
    } catch {
      toast('Failed to save access settings', 'error');
    } finally {
      setSavingAccessMode(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form?.id || !newAssignment.groupId) return;
    setCreatingAssignment(true);
    try {
      const { data } = await assignmentsApi.create(form.id, {
        groupId: newAssignment.groupId,
        opensAt: newAssignment.opensAt || undefined,
        closesAt: newAssignment.closesAt || undefined,
        mode: newAssignment.mode,
      });
      setAssignments((prev) => [...prev, data]);
      setNewAssignment({ groupId: '', opensAt: '', closesAt: '', mode: 'attempt_once' });
      toast('Assignment created', 'success');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast(axiosErr.response?.data?.error ?? 'Failed to create assignment', 'error');
    } finally {
      setCreatingAssignment(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!form?.id) return;
    if (!confirm('Delete this assignment?')) return;
    try {
      await assignmentsApi.delete(form.id, assignmentId);
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    } catch {
      toast('Failed to delete assignment', 'error');
    }
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null;

  const saveStatusLabel = isSaving
    ? 'Saving...'
    : isDirty
    ? 'Unsaved changes'
    : 'Saved';

  if (loading) return <PageLoader />;

  return (
    <div className="flex flex-col h-full bg-[#FAFAF8] overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-white border-b border-[#E8E8E4] z-10 flex-shrink-0">
        {/* Title — flex-1 grows to fill space; min-w-[72px] keeps it tappable on very narrow screens */}
        <input
          type="text"
          value={form?.title ?? ''}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 min-w-[72px] text-sm sm:text-base font-semibold text-[#1A1A18] bg-transparent outline-none border-b border-transparent
            hover:border-[#E8E8E4] focus:border-[#1B6B4A] transition-colors px-1 py-0.5"
          placeholder="Untitled Form"
        />

        {/* Save status — desktop only */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#6B6B66] shrink-0">
          {isSaving ? (
            <Loader2 size={12} className="animate-spin" />
          ) : !isDirty ? (
            <Check size={12} className="text-[#1B6B4A]" />
          ) : null}
          <span>{saveStatusLabel}</span>
        </div>

        {/*
          Button group: no shrink-0 here — flex can compress this wrapper when space
          is tight. The inner div uses min-width:max-content so buttons never wrap;
          overflow-x:auto on the wrapper scrolls them horizontally within their
          flex-allocated width. Works down to ~200px without clipping anything.
        */}
        <div className="min-w-0 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2" style={{ minWidth: 'max-content' }}>
            <Button
              data-tour="preview-btn"
              variant="secondary"
              size="sm"
              onClick={() => { setHasPreviewed(true); window.open(`/f/${form?.id}?preview=true`, '_blank'); }}
              disabled={!form?.id}
              title="Preview"
            >
              <Eye size={14} />
              <span className="hidden sm:inline">Preview</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setQrModalOpen(true)}
              disabled={!form?.id || form?.status !== 'active'}
              title={form?.status !== 'active' ? 'Publish the form first to generate QR codes' : 'QR Codes'}
            >
              <QrCode size={14} />
              <span className="hidden sm:inline">QR Codes</span>
            </Button>
            <Button
              data-tour="style-btn"
              variant="secondary"
              size="sm"
              onClick={() => { setShowThemes((prev) => !prev); setShowTranslations(false); setShowQuiz(false); setShowAssign(false); }}
              disabled={!form?.id}
              title="Style"
            >
              <Palette size={14} />
              <span className="hidden sm:inline">Style</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setShowTranslations((prev) => !prev); setShowThemes(false); setShowQuiz(false); setShowAssign(false); }}
              disabled={!form?.id}
              title="Translations"
            >
              <Languages size={14} />
              <span className="hidden sm:inline">Translations</span>
            </Button>
            <Button
              variant={form?.isQuizMode ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => { setShowQuiz((prev) => !prev); setShowThemes(false); setShowTranslations(false); setShowAssign(false); }}
              disabled={!form?.id}
              title="Quiz Mode"
            >
              <Trophy size={14} />
              <span className="hidden sm:inline">Quiz</span>
            </Button>
            <Button
              variant={showAssign ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => { setShowAssign((prev) => !prev); setShowQuiz(false); setShowThemes(false); setShowTranslations(false); }}
              disabled={!form?.isQuizMode || form?.status !== 'active'}
              title={!form?.isQuizMode ? 'Enable quiz mode first to assign' : form?.status !== 'active' ? 'Publish the quiz first to assign' : 'Assign'}
            >
              <Users size={14} />
              <span className="hidden sm:inline">Assign</span>
            </Button>
            <Button data-tour="publish-btn" size="sm" onClick={handlePublish}>
              <Send size={14} />
              <span className="hidden sm:inline">Publish</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile panel tabs */}
      <div className="lg:hidden flex border-b border-[#E8E8E4] bg-white shrink-0">
        {(['fields', 'canvas', 'editor'] as const).map((panel) => (
          <button
            key={panel}
            onClick={() => setMobilePanel(panel)}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors cursor-pointer ${
              mobilePanel === panel
                ? 'border-b-2 border-[#1B6B4A] text-[#1B6B4A]'
                : 'text-[#6B6B66] border-b-2 border-transparent'
            }`}
          >
            {panel === 'editor' ? 'Edit Field' : panel.charAt(0).toUpperCase() + panel.slice(1)}
          </button>
        ))}
      </div>

      {/* Main content — desktop: 3 columns, mobile: single panel */}
      {showThemes ? (
        <div className="flex-1 overflow-y-auto bg-[#FAFAF8] p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-[#1A1A18]">Form Style</h2>
                <p className="text-sm text-[#6B6B66] mt-0.5">Choose a colour theme for your form</p>
              </div>
              <button
                onClick={() => setShowThemes(false)}
                className="text-sm text-[#6B6B66] hover:text-[#1A1A18] transition-colors cursor-pointer"
              >
                ← Back to builder
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {FORM_THEMES.map((t) => {
                const isActive = (form?.themeId ?? 'forest') === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={`flex flex-col gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer text-left focus:outline-none ${
                      isActive ? 'border-[#1B6B4A] shadow-sm' : 'border-[#E8E8E4] hover:border-[#1B6B4A]/40'
                    }`}
                  >
                    {/* Colour preview */}
                    <div className="flex gap-1.5 items-center">
                      <div className="w-6 h-6 rounded-md shrink-0" style={{ backgroundColor: t.primary }} />
                      <div className="flex-1 h-6 rounded-md" style={{ backgroundColor: t.bg, border: `1px solid ${t.border}` }} />
                      <div className="w-4 h-6 rounded-md shrink-0" style={{ backgroundColor: t.primaryLight }} />
                    </div>
                    <span className="text-xs font-medium text-[#1A1A18] leading-tight">{t.name}</span>
                    {isActive && (
                      <span className="text-[10px] font-semibold text-[#1B6B4A] uppercase tracking-wide">Active</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : showTranslations ? (
        <div className="flex-1 overflow-y-auto bg-[#FAFAF8] p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-[#1A1A18]">Translations</h2>
                <p className="text-sm text-[#6B6B66] mt-0.5">Add Indian language translations for your form</p>
              </div>
              <button
                onClick={() => setShowTranslations(false)}
                className="text-sm text-[#6B6B66] hover:text-[#1A1A18] transition-colors cursor-pointer"
              >
                ← Back to builder
              </button>
            </div>
            {form?.id && (
              <TranslationEditor
                form={{ ...(form as Form), fields }}
                userEmail={userEmail}
                onSave={handleSaveTranslations}
              />
            )}
          </div>
        </div>
      ) : showAssign ? (
        <div className="flex-1 overflow-y-auto bg-[#FAFAF8] p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-[#1A1A18]">Assign Form</h2>
                <p className="text-sm text-[#6B6B66] mt-0.5">Control who can access this form</p>
              </div>
              <button
                onClick={() => setShowAssign(false)}
                className="text-sm text-[#6B6B66] hover:text-[#1A1A18] transition-colors cursor-pointer"
              >
                ← Back to builder
              </button>
            </div>

            {/* Access mode selector */}
            <div className="bg-white border border-[#E8E8E4] rounded-xl p-5 mb-4">
              <p className="text-sm font-medium text-[#1A1A18] mb-3">Access mode</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {([
                  { value: 'public', label: 'Public', desc: 'Anyone with the link' },
                  { value: 'org', label: 'Organisation', desc: 'Any member of your org' },
                  { value: 'group', label: 'Group', desc: 'Only specific groups' },
                  { value: 'invite_only', label: 'Invite only', desc: 'Email allowlist' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSaveAccessMode(opt.value)}
                    disabled={savingAccessMode}
                    className={`flex flex-col items-start gap-0.5 p-3 rounded-xl border-2 text-left transition-all cursor-pointer focus:outline-none ${
                      accessMode === opt.value
                        ? 'border-[#1B6B4A] bg-[#E8F5EE]'
                        : 'border-[#E8E8E4] hover:border-[#1B6B4A]/40'
                    }`}
                  >
                    <span className="text-sm font-medium text-[#1A1A18]">{opt.label}</span>
                    <span className="text-xs text-[#6B6B66]">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Org mode info */}
            {accessMode === 'org' && (
              <div className="bg-[#E8F5EE] border border-[#1B6B4A]/20 rounded-xl p-4 mb-4">
                {org ? (
                  <p className="text-xs text-[#1B6B4A] font-medium">
                    Linked to: <span className="font-semibold">{org.name}</span>. Only org members can fill this form.
                  </p>
                ) : (
                  <p className="text-xs text-[#1B6B4A]">
                    You don't have an organisation yet. <a href="/org" className="font-semibold underline">Create one</a> to use org-restricted access.
                  </p>
                )}
              </div>
            )}

            {/* Group mode assignments */}
            {accessMode === 'group' && (
              <div className="flex flex-col gap-4">
                {/* Existing assignments */}
                {assignments.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-[#1A1A18]">Existing assignments</p>
                    {assignments.map((a) => (
                      <div key={a.id} className="bg-white border border-[#E8E8E4] rounded-xl px-4 py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1A1A18] truncate">{a.groupName}</p>
                          <p className="text-xs text-[#6B6B66]">
                            {a.opensAt ? new Date(a.opensAt).toLocaleDateString() : 'No start'} — {a.closesAt ? new Date(a.closesAt).toLocaleDateString() : 'No end'}
                            {' · '}{a.mode === 'attempt_once' ? 'One attempt' : 'Unlimited'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteAssignment(a.id)}
                          className="p-1.5 rounded-lg text-[#6B6B66] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add assignment form */}
                <div className="bg-white border border-[#E8E8E4] rounded-xl p-5">
                  <p className="text-sm font-medium text-[#1A1A18] mb-3 flex items-center gap-1.5">
                    <Plus size={14} /> Add assignment
                  </p>
                  {!org ? (
                    <p className="text-xs text-[#6B6B66]">
                      You need an organisation to assign groups. <a href="/org" className="text-[#1B6B4A] font-medium underline">Create one</a>
                    </p>
                  ) : orgGroups.length === 0 ? (
                    <p className="text-xs text-[#6B6B66]">
                      No groups found. <a href="/org" className="text-[#1B6B4A] font-medium underline">Create a group</a> first.
                    </p>
                  ) : (
                    <form onSubmit={handleCreateAssignment} className="flex flex-col gap-3">
                      <div>
                        <label className="text-xs font-medium text-[#6B6B66] mb-1 block">Assign to</label>
                        <select
                          value={newAssignment.groupId}
                          onChange={(e) => setNewAssignment((p) => ({ ...p, groupId: e.target.value }))}
                          required
                          className="w-full border border-[#E8E8E4] rounded-lg px-3 py-2 text-sm text-[#1A1A18] bg-white focus:outline-none focus:ring-1 focus:ring-[#1B6B4A]"
                        >
                          <option value="">Select audience...</option>
                          {orgGroups.filter((g) => g.isDefault).map((g) => (
                            <option key={g.id} value={g.id}>All org members</option>
                          ))}
                          {orgGroups.filter((g) => !g.isDefault).length > 0 && (
                            <optgroup label="Groups">
                              {orgGroups.filter((g) => !g.isDefault).map((g) => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-[#6B6B66] mb-1 block">Opens at (optional)</label>
                          <input
                            type="datetime-local"
                            value={newAssignment.opensAt}
                            onChange={(e) => setNewAssignment((p) => ({ ...p, opensAt: e.target.value }))}
                            className="w-full border border-[#E8E8E4] rounded-lg px-3 py-2 text-sm text-[#1A1A18] bg-white focus:outline-none focus:ring-1 focus:ring-[#1B6B4A]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#6B6B66] mb-1 block">Closes at (optional)</label>
                          <input
                            type="datetime-local"
                            value={newAssignment.closesAt}
                            onChange={(e) => setNewAssignment((p) => ({ ...p, closesAt: e.target.value }))}
                            className="w-full border border-[#E8E8E4] rounded-lg px-3 py-2 text-sm text-[#1A1A18] bg-white focus:outline-none focus:ring-1 focus:ring-[#1B6B4A]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#6B6B66] mb-1 block">Attempt mode</label>
                        <div className="flex gap-2">
                          {(['attempt_once', 'unlimited'] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setNewAssignment((p) => ({ ...p, mode: m }))}
                              className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                                newAssignment.mode === m
                                  ? 'border-[#1B6B4A] bg-[#E8F5EE] text-[#1B6B4A]'
                                  : 'border-[#E8E8E4] text-[#6B6B66] hover:border-[#1B6B4A]/40'
                              }`}
                            >
                              {m === 'attempt_once' ? 'One attempt' : 'Unlimited'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Button type="submit" isLoading={creatingAssignment} size="sm" className="w-full justify-center">
                        Assign
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : showQuiz ? (
        <div className="flex-1 overflow-y-auto bg-[#FAFAF8] p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-[#1A1A18]">Quiz Mode</h2>
                <p className="text-sm text-[#6B6B66] mt-0.5">Auto-score respondents and show results instantly</p>
              </div>
              <button
                onClick={() => setShowQuiz(false)}
                className="text-sm text-[#6B6B66] hover:text-[#1A1A18] transition-colors cursor-pointer"
              >
                ← Back to builder
              </button>
            </div>

            {/* Toggle */}
            <div className="bg-white border border-[#E8E8E4] rounded-xl p-5 flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-[#1A1A18]">Enable Quiz Mode</p>
                <p className="text-xs text-[#6B6B66] mt-0.5">Scores are calculated server-side on submission</p>
              </div>
              <button
                role="switch"
                aria-checked={form?.isQuizMode ?? false}
                onClick={() => setQuizMode(!(form?.isQuizMode ?? false))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  form?.isQuizMode ? 'bg-[#1B6B4A]' : 'bg-[#E8E8E4]'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                  form?.isQuizMode ? 'translate-x-[18px]' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Pass mark */}
            {form?.isQuizMode && (
              <div className="bg-white border border-[#E8E8E4] rounded-xl p-5 mb-4">
                <label className="text-sm font-medium text-[#1A1A18] block mb-2">
                  Pass mark: <span className="text-[#1B6B4A] font-semibold">{form.passMark ?? 60}%</span>
                </label>
                <input
                  type="range"
                  min={0} max={100} step={5}
                  value={form.passMark ?? 60}
                  onChange={(e) => setPassMark(Number(e.target.value))}
                  className="w-full accent-[#1B6B4A]"
                />
                <p className="text-xs text-[#6B6B66] mt-1.5">
                  Respondents scoring at or above this threshold pass
                </p>
              </div>
            )}

            {form?.isQuizMode && (
              <div className="bg-[#E8F5EE] border border-[#1B6B4A]/20 rounded-xl p-4">
                <p className="text-xs text-[#1B6B4A] font-medium">
                  💡 To mark correct answers and set point values, select a Radio, Checkbox, or Dropdown field in the canvas and edit it in the Field Properties panel.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div data-tour="field-picker" className={`${mobilePanel === 'fields' ? 'flex flex-1' : 'hidden'} lg:flex lg:flex-none`}>
            <FieldPicker onAdd={(type: FieldType) => { addField(type); setMobilePanel('canvas'); }} />
          </div>

          <div data-tour="form-canvas" className={`${mobilePanel === 'canvas' ? 'flex flex-1' : 'hidden'} lg:flex lg:flex-1`}>
            <FormCanvas
              fields={fields}
              selectedFieldId={selectedFieldId}
              onSelect={(fieldId) => { selectField(fieldId); setMobilePanel('editor'); }}
              onDelete={(fieldId) => removeField(fieldId)}
              onReorder={(oldIndex, newIndex) => reorderFields(oldIndex, newIndex)}
            />
          </div>

          <div data-tour="field-editor" className={`${mobilePanel === 'editor' ? 'flex flex-1' : 'hidden'} lg:flex lg:flex-none`}>
            {selectedField ? (
              <FieldEditor
                field={selectedField}
                allFields={fields}
                isQuizMode={form?.isQuizMode ?? false}
                onChange={(updates: Partial<FormField>) => updateField(selectedField.id, updates)}
              />
            ) : (
              <div className="lg:hidden flex-1 flex items-center justify-center text-sm text-[#6B6B66] p-8 text-center">
                Select a field from the Canvas tab to edit it.
              </div>
            )}
          </div>
        </div>
      )}

      <PublishModal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        slug={publishedSlug}
      />

      {form?.id && (
        <QrShareModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          formId={form.id}
        />
      )}

      {showTour && <GuidedTour onDone={() => setShowTour(false)} onMobilePanel={setMobilePanel} />}

      <OnboardingChecklist
        hasFields={fields.length > 0}
        hasRequiredField={fields.some((f) => f.isRequired)}
        hasPreviewed={hasPreviewed}
        isPublished={form?.status === 'active'}
        onStartTour={() => {
          setShowThemes(false);
          setShowTranslations(false);
          setShowTour(true);
        }}
      />
    </div>
  );
}
