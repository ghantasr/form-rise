import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitFork, Layers } from 'lucide-react';
import client from '../api/client';
import { Button } from '../components/shared/Button';
import { EmptyState } from '../components/shared/EmptyState';
import { PageLoader } from '../components/shared/LoadingSpinner';
import { useToast } from '../components/shared/Toast';
import { useAuthStore } from '../stores/authStore';
import { LogoMark } from '../components/shared/LogoMark';

interface Template {
  id: string;
  slug: string;
  title: string;
  description?: string;
  forkCount: number;
}

type CategoryStyle = { bg: string; text: string; dot: string };

function getCategoryStyle(title: string): CategoryStyle {
  const t = title.toLowerCase();
  if (t.includes('feedback') || t.includes('nps') || t.includes('review') || t.includes('satisfaction') || t.includes('table'))
    return { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-400' };
  if (t.includes('registr') || t.includes('event') || t.includes('workshop') || t.includes('enrollment') || t.includes('waitlist') || t.includes('meeting'))
    return { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' };
  if (t.includes('job') || t.includes('application') || t.includes('scholarship') || t.includes('admission') || t.includes('volunteer') || t.includes('adoption'))
    return { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-400' };
  if (t.includes('bug') || t.includes('support') || t.includes('return') || t.includes('refund') || t.includes('ticket') || t.includes('feature'))
    return { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' };
  if (t.includes('patient') || t.includes('health') || t.includes('gym') || t.includes('medical') || t.includes('pet'))
    return { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' };
  if (t.includes('contact') || t.includes('lead') || t.includes('vendor') || t.includes('speaker') || t.includes('travel') || t.includes('design') || t.includes('newsletter'))
    return { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-400' };
  return { bg: 'bg-[#F5F4F1]', text: 'text-[#6B6B66]', dot: 'bg-[#C0C0BB]' };
}

function getCategoryLabel(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('feedback') || t.includes('nps') || t.includes('review') || t.includes('satisfaction')) return 'Feedback';
  if (t.includes('registr') || t.includes('event') || t.includes('workshop') || t.includes('enrollment') || t.includes('waitlist') || t.includes('meeting')) return 'Registration';
  if (t.includes('job') || t.includes('application') || t.includes('scholarship') || t.includes('admission') || t.includes('volunteer') || t.includes('adoption')) return 'Applications';
  if (t.includes('bug') || t.includes('support') || t.includes('ticket') || t.includes('feature')) return 'Support';
  if (t.includes('return') || t.includes('refund')) return 'Operations';
  if (t.includes('patient') || t.includes('health') || t.includes('gym') || t.includes('medical') || t.includes('pet')) return 'Health & Wellness';
  if (t.includes('contact') || t.includes('lead') || t.includes('newsletter')) return 'Marketing';
  if (t.includes('vendor') || t.includes('speaker') || t.includes('travel') || t.includes('design')) return 'Business';
  return 'General';
}

export function Templates() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [forkingId, setForkingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    client
      .get<Template[]>('/templates')
      .then(({ data }) => setTemplates(data))
      .catch(() => toast('Failed to load templates', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleFork = async (slug: string) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { next: '/templates' } });
      return;
    }
    setForkingId(slug);
    try {
      const { data } = await client.post<{ id: string }>(`/templates/${slug}/fork`);
      toast('Template added to your forms', 'success');
      navigate(`/forms/${data.id}/edit`);
    } catch {
      toast('Failed to use template', 'error');
    } finally {
      setForkingId(null);
    }
  };

  const categories = ['All', ...Array.from(new Set(templates.map((t) => getCategoryLabel(t.title))))].sort((a, b) =>
    a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b)
  );

  const filtered = activeCategory === 'All'
    ? templates
    : templates.filter((t) => getCategoryLabel(t.title) === activeCategory);

  if (loading || authLoading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-[#F5F4F1]" style={{ fontFamily: '"Inter", "DM Sans", system-ui, sans-serif' }}>
      {/* Public-only header — hidden for authenticated users (AppLayout provides sidebar + hamburger) */}
      {!isAuthenticated && (
        <header className="sticky top-0 z-50 bg-[#F5F4F1]/90 backdrop-blur border-b border-[#E4E4E0]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <LogoMark size={28} variant="dark" />
              <span className="font-semibold text-[15px] tracking-[-0.02em] text-[#141412]">formrise</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-[#6B6B66] hover:text-[#141412] transition-colors cursor-pointer font-medium"
              >
                Sign in
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-all cursor-pointer hover:opacity-90 active:scale-95"
                style={{ background: '#1B6B4A' }}
              >
                Get started free
              </button>
            </div>
          </div>
        </header>
      )}

    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-7 mt-2">
        <h1 className="text-2xl font-bold text-[#141412] tracking-[-0.02em]">Templates</h1>
        <p className="text-sm text-[#6B6B66] mt-0.5">
          Start with a ready-made template and customize it to your needs.
        </p>
      </div>

      {/* Category filter */}
      {templates.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-7">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#1B6B4A] text-white'
                  : 'bg-white border border-[#E4E4E0] text-[#6B6B66] hover:border-[#1B6B4A] hover:text-[#1B6B4A]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Layers size={44} />}
          title="No templates yet"
          description="Check back soon — community templates are on the way."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((template) => {
            const style = getCategoryStyle(template.title);
            const catLabel = getCategoryLabel(template.title);
            return (
              <div
                key={template.id}
                className="bg-white border border-[#E4E4E0] rounded-xl p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full mb-2 ${style.bg} ${style.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {catLabel}
                    </span>
                    <h3 className="font-semibold text-[#141412] line-clamp-2 text-[15px] tracking-[-0.01em]">
                      {template.title}
                    </h3>
                  </div>
                </div>

                {template.description && (
                  <p className="text-xs text-[#6B6B66] line-clamp-2 leading-relaxed -mt-1">{template.description}</p>
                )}

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#F0F0EC]">
                  <div className="flex items-center gap-1.5 text-xs text-[#6B6B66]">
                    <GitFork size={11} />
                    <span>{template.forkCount} use{template.forkCount !== 1 ? 's' : ''}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleFork(template.slug)}
                    isLoading={forkingId === template.slug}
                    className="text-xs"
                  >
                    Use template
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </div>
  );
}
