import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Eye, BarChart2, Trash2 } from 'lucide-react';
import { formsApi } from '../api/forms';
import type { FormListItem } from '../types/form';
import { Button } from '../components/shared/Button';
import { EmptyState } from '../components/shared/EmptyState';
import { PageLoader } from '../components/shared/LoadingSpinner';
import { useToast } from '../components/shared/Toast';

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

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    active: 'bg-[#E8F5EE] text-[#1B6B4A]',
    paused: 'bg-amber-100 text-amber-700',
    closed: 'bg-red-100 text-red-600',
  };

  if (loading) return <PageLoader />;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A18]">My Forms</h1>
          <p className="text-sm text-[#6B6B66] mt-1">{forms.length} form{forms.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus size={16} />
          New form
        </Button>
      </div>

      {forms.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title="No forms yet"
          description="Create your first form and start collecting responses."
          action={<Button onClick={handleCreate}><Plus size={16} />Create your first form</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {forms.map((form) => (
            <div
              key={form.id}
              onClick={() => navigate(`/forms/${form.id}/edit`)}
              className="bg-white border border-[#E8E8E4] rounded-xl p-5 cursor-pointer hover:border-[#1B6B4A] hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[form.status] ?? ''}`}>
                  {form.status}
                </span>
                <button
                  onClick={(e) => handleDelete(form.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-[#9C9C96] hover:text-red-500 transition-all cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <h3 className="font-semibold text-[#1A1A18] mb-1 line-clamp-2">{form.title}</h3>
              {form.description && (
                <p className="text-xs text-[#9C9C96] mb-3 line-clamp-2">{form.description}</p>
              )}

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#F0F0EC]">
                <div className="flex items-center gap-1.5 text-xs text-[#6B6B66]">
                  <BarChart2 size={13} />
                  {form.responseCount} responses
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/forms/${form.id}/responses`); }}
                  className="ml-auto flex items-center gap-1.5 text-xs text-[#6B6B66] hover:text-[#1B6B4A] cursor-pointer"
                >
                  <Eye size={13} />
                  View responses
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
