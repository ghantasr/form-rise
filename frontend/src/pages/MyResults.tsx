import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { studentsApi } from '../api/orgs';
import { PageLoader } from '../components/shared/LoadingSpinner';
import type { StudentResult } from '../types/org';

function ScoreBadge({ totalScore, maxScore }: { totalScore?: number; maxScore?: number }) {
  if (totalScore === undefined) return null;
  return (
    <span className="px-2 py-0.5 bg-[#F7F7F5] border border-[#E8E8E4] rounded-md text-xs font-semibold text-[#1A1A18]">
      {totalScore}/{maxScore}
    </span>
  );
}

function PassBadge({ isPassed }: { isPassed?: boolean }) {
  if (isPassed === undefined) return null;
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${isPassed ? 'bg-[#E8F5EE] text-[#1B6B4A]' : 'bg-red-50 text-red-600'}`}>
      {isPassed ? 'Passed' : 'Failed'}
    </span>
  );
}

export function MyResults() {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentsApi.getMyResults()
      .then(({ data }) => {
        // Only show quiz results (where totalScore is not null)
        setResults(data.filter((r) => r.totalScore !== undefined));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="flex-1 bg-[#F7F7F5] overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#E8F5EE] flex items-center justify-center shrink-0">
            <Trophy size={18} className="text-[#1B6B4A]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A18]">My Quiz Results</h1>
            <p className="text-xs text-[#6B6B66]">Your quiz submission history</p>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="bg-white border border-[#E8E8E4] rounded-xl py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#E8F5EE] flex items-center justify-center mx-auto mb-4">
              <Trophy size={20} className="text-[#1B6B4A]" />
            </div>
            <p className="text-sm font-medium text-[#1A1A18] mb-1">No quiz results yet</p>
            <p className="text-xs text-[#6B6B66]">Your quiz submissions will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {results.map((r) => (
              <div key={r.responseId} className="bg-white border border-[#E8E8E4] rounded-xl px-5 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A1A18] truncate">{r.formTitle}</p>
                  <p className="text-xs text-[#6B6B66] mt-0.5">
                    {new Date(r.submittedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <ScoreBadge totalScore={r.totalScore} maxScore={r.maxScore} />
                  <PassBadge isPassed={r.isPassed} />
                  <Link
                    to={`/f/${r.slug}`}
                    className="text-xs font-medium text-[#1B6B4A] hover:text-[#134F36] transition-colors ml-1"
                  >
                    View form
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
