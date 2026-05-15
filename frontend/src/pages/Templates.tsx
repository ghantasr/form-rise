import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitFork, FileText } from 'lucide-react';
import client from '../api/client';
import { Button } from '../components/shared/Button';
import { EmptyState } from '../components/shared/EmptyState';
import { PageLoader } from '../components/shared/LoadingSpinner';
import { useToast } from '../components/shared/Toast';

interface Template {
  id: string;
  slug: string;
  title: string;
  description?: string;
  forkCount: number;
}

export function Templates() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [forkingId, setForkingId] = useState<string | null>(null);

  useEffect(() => {
    client
      .get<Template[]>('/templates')
      .then(({ data }) => setTemplates(data))
      .catch(() => toast('Failed to load templates', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleFork = async (slug: string) => {
    setForkingId(slug);
    try {
      const { data } = await client.post<{ id: string }>(`/templates/${slug}/fork`);
      toast('Template forked successfully', 'success');
      navigate(`/forms/${data.id}/edit`);
    } catch {
      toast('Failed to fork template', 'error');
    } finally {
      setForkingId(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A18]">Templates</h1>
        <p className="text-sm text-[#6B6B66] mt-1">
          Start with a ready-made form template and customize it to your needs.
        </p>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title="No templates yet"
          description="Check back later for community templates."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white border border-[#E8E8E4] rounded-xl p-5 flex flex-col gap-3 hover:border-[#1B6B4A] hover:shadow-sm transition-all"
            >
              <div>
                <h3 className="font-semibold text-[#1A1A18] mb-1 line-clamp-2">{template.title}</h3>
                {template.description && (
                  <p className="text-xs text-[#9C9C96] line-clamp-3">{template.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#F0F0EC]">
                <div className="flex items-center gap-1.5 text-xs text-[#6B6B66]">
                  <GitFork size={12} />
                  <span>{template.forkCount} fork{template.forkCount !== 1 ? 's' : ''}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleFork(template.slug)}
                  isLoading={forkingId === template.slug}
                >
                  <GitFork size={13} />
                  Fork
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
