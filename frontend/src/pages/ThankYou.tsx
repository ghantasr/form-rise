import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

interface LocationState {
  thankYouMsg?: string;
}

export function ThankYou() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const message =
    state?.thankYouMsg ||
    'Thank you for your submission! Your response has been recorded.';

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
      <div className="bg-white border border-[#E8E8E4] rounded-xl shadow-sm p-10 w-full max-w-md text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-[#E8F5EE] rounded-full mx-auto mb-5">
          <CheckCircle size={32} className="text-[#1B6B4A]" />
        </div>

        <h1 className="text-2xl font-bold text-[#1A1A18] mb-3">All done!</h1>

        <p className="text-sm text-[#6B6B66] leading-relaxed mb-8">{message}</p>

        {slug && (
          <Link
            to={`/f/${slug}`}
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-[#1B6B4A] border border-[#1B6B4A] rounded-lg hover:bg-[#E8F5EE] transition-colors"
          >
            Submit another response
          </Link>
        )}
      </div>
    </div>
  );
}
