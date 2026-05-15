import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BarChart2, Eye, Trash2, FileText, Zap, TrendingUp } from 'lucide-react';
import { formsApi } from '../api/forms';
import type { FormListItem } from '../types/form';
import { Button } from '../components/shared/Button';
import { EmptyState } from '../components/shared/EmptyState';
import { PageLoader } from '../components/shared/LoadingSpinner';
import { useToast } from '../components/shared/Toast';

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  draft:  { label: 'Draft',  color: 'bg-[#F0F0EC] text-[#6B6B66]', dot: 'bg-[#C0C0BB]' },
  active: { label: 'Active', color: 'bg-[#E6F5EE] text-[#1B6B4A]', dot: 'bg-[#1B6B4A]' },
  paused: { label: 'Paused', color: 'bg-amber-50 text-amber-700',   dot: 'bg-amber-400' },
  closed: { label: 'Closed', color: 'bg-red-50 text-red-600',       dot: 'bg-red-400' },
};

const statusBorder: Record<string, string> = {
  draft:  'border-l-[#C0C0BB]',
  active: 'border-l-[#1B6B4A]',
  paused: 'border-l-amber-400',
  closed: 'border-l-red-400',
};

export function Dashboard() {
  const [forms, setForms] = useState<FormListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    formsApi.list()
      .then((r) => setForms(r.data))
      .catch(() => toast('Failed to load forms', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    try {
      const { data } = await formsApi.create('Untitled Form');
      navigate(`/forms/${data.id}/edit`);
    } catch {
      toast('Failed to create form', 'error');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this form and all its responses?')) return;
    try {
      await formsApi.delete(id);
      setForms((f) => f.filter((x) => x.id !== id));
      toast('Form deleted', 'success');
    } catch {
      toast('Failed to delete form', 'error');
    }
  };

  const totalResponses = forms.reduce((sum, f) => sum + f.responseCount, 0);
  const activeForms = forms.filter((f) => f.status === 'active').length;

  if (loading) return <PageLoader />;

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#141412] tracking-[-0.02em]">My Forms</h1>
          <p className="text-sm text-[#6B6B66] mt-0.5">{forms.length} form{forms.length !== 1 ? 's' : ''} total</p>
        </div>
        <Button onClick={handleCreate} className="gap-1.5">
          <Plus size={15} strokeWidth={2.5} />
          New form
        </Button>
      </div>

      {/* Stats row */}
      {forms.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#E4E4E0] p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#F5F4F1] flex items-center justify-center">
              <FileText size={18} className="text-[#6B6B66]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#141412] leading-none tracking-[-0.02em]">{forms.length}</p>
              <p className="text-xs text-[#9C9C96] mt-1">Total forms</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#E4E4E0] p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#E6F5EE] flex items-center justify-center">
              <Zap size={18} className="text-[#1B6B4A]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#141412] leading-none tracking-[-0.02em]">{activeForms}</p>
              <p className="text-xs text-[#9C9C96] mt-1">Active forms</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#E4E4E0] p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#F0EEFF] flex items-center justify-center">
              <TrendingUp size={18} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#141412] leading-none tracking-[-0.02em]">{totalResponses}</p>
              <p className="text-xs text-[#9C9C96] mt-1">Total responses</p>
            </div>
          </div>
        </div>
      )}

      {forms.length === 0 ? (
        <EmptyState
          icon={<FileText size={44} />}
          title="No forms yet"
          description="Create your first form and start collecting responses in minutes."
          action={
            <Button onClick={handleCreate} size="lg">
              <Plus size={16} />
              Create your first form
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {forms.map((form) => {
            const sc = statusConfig[form.status] ?? statusConfig.draft;
            const sb = statusBorder[form.status] ?? statusBorder.draft;
            return (
              <div
                key={form.id}
                onClick={() => navigate(`/forms/${form.id}/edit`)}
                className={`bg-white border border-[#E4E4E0] border-l-4 ${sb} rounded-xl p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${sc.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </span>
                  <button
                    onClick={(e) => handleDelete(form.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-[#C0C0BB] hover:text-red-500 transition-all cursor-pointer p-0.5"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <h3 className="font-semibold text-[#141412] mb-1 line-clamp-2 text-[15px] tracking-[-0.01em]">
                  {form.title}
                </h3>
                {form.description && (
                  <p className="text-xs text-[#9C9C96] mb-3 line-clamp-2 leading-relaxed">{form.description}</p>
                )}

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#F0F0EC]">
                  <div className="flex items-center gap-1.5 text-xs text-[#9C9C96]">
                    <BarChart2 size={12} />
                    <span>{form.responseCount} response{form.responseCount !== 1 ? 's' : ''}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/forms/${form.id}/responses`); }}
                    className="ml-auto flex items-center gap-1.5 text-xs text-[#9C9C96] hover:text-[#1B6B4A] cursor-pointer transition-colors"
                  >
                    <Eye size={12} />
                    Responses
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
