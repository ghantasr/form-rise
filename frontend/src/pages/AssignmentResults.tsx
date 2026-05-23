import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { assignmentsApi } from '../api/orgs';
import { PageLoader } from '../components/shared/LoadingSpinner';
import type { AssignmentResult } from '../types/org';

function PassBadge({ isPassed }: { isPassed?: boolean }) {
  if (isPassed === undefined) return null;
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${isPassed ? 'bg-[#E8F5EE] text-[#1B6B4A]' : 'bg-red-50 text-red-600'}`}>
      {isPassed ? 'Passed' : 'Failed'}
    </span>
  );
}

function Avatar({ name, email, avatarUrl }: { name?: string; email?: string; avatarUrl?: string }) {
  const initials = (name || email || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  if (avatarUrl) return <img src={avatarUrl} alt={name} className="w-7 h-7 rounded-full object-cover shrink-0" />;
  return (
    <div className="w-7 h-7 rounded-full bg-[#1B6B4A] text-white font-bold text-xs flex items-center justify-center shrink-0">
      {initials}
    </div>
  );
}

function exportCsv(results: AssignmentResult[], isQuiz: boolean) {
  const headers = isQuiz
    ? ['Name', 'Email', 'Score', 'Max Score', 'Result', 'Submitted At']
    : ['Name', 'Email', 'Status', 'Submitted At'];

  const rows = results.map((r) => {
    const submittedAt = r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—';
    if (isQuiz) {
      return [
        r.userName,
        r.userEmail,
        r.totalScore !== undefined ? String(r.totalScore) : '—',
        r.maxScore !== undefined ? String(r.maxScore) : '—',
        r.isPassed !== undefined ? (r.isPassed ? 'Passed' : 'Failed') : '—',
        submittedAt,
      ];
    }
    return [
      r.userName,
      r.userEmail,
      r.submittedAt ? 'Submitted' : 'Not yet',
      submittedAt,
    ];
  });

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'assignment-results.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function AssignmentResults() {
  const { formId, assignmentId } = useParams<{ formId: string; assignmentId: string }>();
  const [results, setResults] = useState<AssignmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!formId || !assignmentId) return;
    assignmentsApi.getResults(formId, assignmentId)
      .then(({ data }) => setResults(data))
      .catch(() => setError('Failed to load assignment results.'))
      .finally(() => setLoading(false));
  }, [formId, assignmentId]);

  if (loading) return <PageLoader />;

  const isQuiz = results.some((r) => r.totalScore !== undefined);

  return (
    <div className="flex-1 bg-[#F7F7F5] overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/org"
              className="flex items-center gap-1.5 text-sm text-[#6B6B66] hover:text-[#1A1A18] transition-colors"
            >
              <ArrowLeft size={14} /> Back
            </Link>
            <h1 className="text-lg font-bold text-[#1A1A18]">Assignment Results</h1>
          </div>
          {results.length > 0 && (
            <button
              onClick={() => exportCsv(results, isQuiz)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E8E8E4] rounded-lg text-sm font-medium bg-white hover:bg-[#F5F5F3] transition-colors cursor-pointer text-[#1A1A18]"
            >
              <Download size={14} /> Export CSV
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4">
            {error}
          </div>
        )}

        {/* Results table */}
        <div className="bg-white border border-[#E8E8E4] rounded-xl overflow-hidden">
          {results.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#6B6B66]">
              No submissions yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E8E4] bg-[#F7F7F5]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B66] uppercase tracking-wide">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B66] uppercase tracking-wide">Email</th>
                    {isQuiz ? (
                      <>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B66] uppercase tracking-wide">Score</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B66] uppercase tracking-wide">Result</th>
                      </>
                    ) : (
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B66] uppercase tracking-wide">Status</th>
                    )}
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B66] uppercase tracking-wide">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E4]">
                  {results.map((r) => (
                    <tr key={r.responseId} className="hover:bg-[#FAFAF9] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={r.userName} email={r.userEmail} avatarUrl={r.avatarUrl} />
                          <span className="font-medium text-[#1A1A18] truncate max-w-[160px]">{r.userName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#6B6B66] truncate max-w-[200px]">{r.userEmail}</td>
                      {isQuiz ? (
                        <>
                          <td className="px-4 py-3 font-medium text-[#1A1A18]">
                            {r.totalScore !== undefined ? `${r.totalScore}/${r.maxScore}` : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {r.submittedAt ? <PassBadge isPassed={r.isPassed} /> : (
                              <span className="text-xs text-[#6B6B66]">Not submitted</span>
                            )}
                          </td>
                        </>
                      ) : (
                        <td className="px-4 py-3">
                          {r.submittedAt ? (
                            <span className="px-2 py-0.5 bg-[#E8F5EE] text-[#1B6B4A] rounded-md text-xs font-medium">Submitted</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-[#F7F7F5] text-[#6B6B66] rounded-md text-xs font-medium">Not yet</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 text-[#6B6B66] whitespace-nowrap">
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
