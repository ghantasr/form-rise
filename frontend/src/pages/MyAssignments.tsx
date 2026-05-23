import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { studentsApi } from '../api/orgs';
import { PageLoader } from '../components/shared/LoadingSpinner';
import type { StudentAssignment } from '../types/org';

function dueDateLabel(closesAt?: string): { text: string; urgent: boolean } | null {
  if (!closesAt) return null;
  const due = new Date(closesAt);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const text = `Due ${due.toLocaleDateString(undefined, { dateStyle: 'medium' })}`;
  return { text, urgent: diffDays >= 0 && diffDays <= 3 };
}

function AssignmentCard({ assignment }: { assignment: StudentAssignment }) {
  const due = dueDateLabel(assignment.closesAt);

  return (
    <div className="bg-white border border-[#E8E8E4] rounded-xl px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1A1A18] truncate">{assignment.formTitle}</p>
        <p className="text-xs text-[#6B6B66] mt-0.5">{assignment.groupName}</p>
        {due && (
          <p className={`text-xs mt-0.5 font-medium ${due.urgent ? 'text-amber-600' : 'text-[#6B6B66]'}`}>
            {due.text}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {assignment.hasSubmitted ? (
          <>
            {assignment.maxScore != null && assignment.totalScore != null && (
              <span className="px-2 py-0.5 bg-[#E8F5EE] border border-[#1B6B4A]/20 rounded-md text-xs font-semibold text-[#1B6B4A]">
                {assignment.totalScore}/{assignment.maxScore}
              </span>
            )}
            {assignment.isPassed != null && (
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                assignment.isPassed
                  ? 'bg-[#E8F5EE] text-[#1B6B4A]'
                  : 'bg-red-50 text-red-600'
              }`}>
                {assignment.isPassed ? 'Passed' : 'Failed'}
              </span>
            )}
            <Link
              to={`/f/${assignment.formSlug}`}
              className="px-3 py-1.5 border border-[#E8E8E4] rounded-lg text-xs font-medium text-[#6B6B66] hover:bg-[#F5F5F3] transition-colors"
            >
              View
            </Link>
          </>
        ) : (
          <Link
            to={`/f/${assignment.formSlug}`}
            className="px-3 py-1.5 bg-[#1B6B4A] text-white rounded-lg text-xs font-medium hover:bg-[#134F36] transition-colors"
          >
            {assignment.mode === 'attempt_once' ? 'Start' : 'Open'}
          </Link>
        )}
      </div>
    </div>
  );
}

export function MyAssignments() {
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentsApi.getMyAssignments()
      .then(({ data }) => setAssignments(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const pending = assignments.filter((a) => !a.hasSubmitted);
  const completed = assignments.filter((a) => a.hasSubmitted);

  return (
    <div className="flex-1 bg-[#F7F7F5] overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#E8F5EE] flex items-center justify-center shrink-0">
            <ClipboardList size={18} className="text-[#1B6B4A]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A18]">My Assignments</h1>
            <p className="text-sm text-[#6B6B66]">Forms and quizzes assigned to you</p>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="bg-white border border-[#E8E8E4] rounded-xl py-16 flex flex-col items-center gap-3 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-[#F7F7F5] flex items-center justify-center">
              <ClipboardList size={20} className="text-[#6B6B66]" />
            </div>
            <p className="text-sm font-semibold text-[#1A1A18]">No assignments yet</p>
            <p className="text-xs text-[#6B6B66] max-w-xs">
              Your teacher or admin hasn't assigned anything to you yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {pending.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wider mb-2">
                  Pending ({pending.length})
                </h2>
                <div className="flex flex-col gap-2">
                  {pending.map((a) => (
                    <AssignmentCard key={a.assignmentId} assignment={a} />
                  ))}
                </div>
              </section>
            )}

            {completed.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wider mb-2">
                  Completed ({completed.length})
                </h2>
                <div className="flex flex-col gap-2">
                  {completed.map((a) => (
                    <AssignmentCard key={a.assignmentId} assignment={a} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
