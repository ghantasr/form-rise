import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

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
