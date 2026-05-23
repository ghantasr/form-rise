import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import type { Answer, } from '../types/response';
import type { FormField } from '../types/form';

interface QuizResultState {
  totalScore: number;
  maxScore: number;
  isPassed: boolean;
  passMark: number;
  answers: Answer[];
  fields: FormField[];
}

interface LocationState {
  thankYouMsg?: string;
  quizResult?: QuizResultState;
}

export function ThankYou() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const message =
    state?.thankYouMsg ||
    'Thank you for your submission! Your response has been recorded.';

  const qr = state?.quizResult;

  if (qr) {
    const pct = qr.maxScore > 0 ? Math.round((qr.totalScore / qr.maxScore) * 100) : 0;
    const scoredAnswers = qr.answers.filter((a) => a.isCorrect !== undefined && a.isCorrect !== null);

    return (
      <div className="min-h-screen bg-[#F5F4F1] flex items-center justify-center p-4">
        <div className="bg-white border border-[#E4E4E0] rounded-2xl shadow-sm p-8 w-full max-w-lg">
          {/* Score badge */}
          <div className="flex flex-col items-center mb-6">
            <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 mb-3 ${
              qr.isPassed ? 'border-[#1B6B4A] bg-[#E8F5EE]' : 'border-amber-400 bg-amber-50'
            }`}>
              <span className={`text-2xl font-bold ${qr.isPassed ? 'text-[#1B6B4A]' : 'text-amber-600'}`}>
                {pct}%
              </span>
              <span className="text-xs text-[#6B6B66]">{qr.totalScore}/{qr.maxScore}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              qr.isPassed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {qr.isPassed ? '🎉 Passed' : '❌ Not passed'}
            </span>
            <p className="text-xs text-[#6B6B66] mt-1.5">Pass mark: {qr.passMark}%</p>
          </div>

          {/* Per-question breakdown */}
          {scoredAnswers.length > 0 && (
            <div className="flex flex-col gap-3 mb-6">
              <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wider">Review</p>
              {scoredAnswers.map((answer) => {
                const field = qr.fields.find((f) => f.id === answer.fieldId);
                const givenDisplay = answer.valuesArray?.join(', ') ?? answer.value ?? '—';
                const correctDisplay = field?.quizConfig?.correctAnswers?.join(', ');
                return (
                  <div key={answer.fieldId} className={`rounded-xl border p-3.5 ${
                    answer.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}>
                    <p className="text-sm font-medium text-[#1A1A18] mb-1">{field?.label ?? 'Question'}</p>
                    <p className={`text-sm ${answer.isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                      {answer.isCorrect ? '✓' : '✗'} Your answer: <span className="font-medium">{givenDisplay}</span>
                    </p>
                    {!answer.isCorrect && correctDisplay && (
                      <p className="text-sm text-green-700 mt-0.5">
                        ✓ Correct: <span className="font-medium">{correctDisplay}</span>
                      </p>
                    )}
                    {answer.explanation && (
                      <p className="text-xs text-[#6B6B66] mt-1.5 italic">{answer.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-sm text-[#6B6B66] leading-relaxed text-center mb-5">{message}</p>

          {slug && (
            <div className="flex justify-center">
              <Link
                to={`/f/${slug}`}
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-[#1B6B4A] border border-[#1B6B4A]/30 rounded-lg hover:bg-[#E6F5EE] transition-colors"
              >
                Submit another response
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F4F1] flex items-center justify-center p-4">
      <div className="bg-white border border-[#E4E4E0] rounded-2xl shadow-sm p-10 w-full max-w-md text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-[#E6F5EE] rounded-full mx-auto mb-6">
          <CheckCircle2 size={30} className="text-[#1B6B4A]" />
        </div>

        <h1 className="text-2xl font-bold text-[#141412] mb-3 tracking-[-0.02em]">All done!</h1>

        <p className="text-sm text-[#6B6B66] leading-relaxed mb-8 max-w-xs mx-auto">{message}</p>

        {slug && (
          <Link
            to={`/f/${slug}`}
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-[#1B6B4A] border border-[#1B6B4A]/30 rounded-lg hover:bg-[#E6F5EE] transition-colors"
          >
            Submit another response
          </Link>
        )}
      </div>
    </div>
  );
}
