import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, WifiOff, QrCode, Layers, CheckCircle2, Star } from 'lucide-react';
import { LogoMark } from '../components/shared/LogoMark';

const features = [
  {
    icon: Zap,
    title: 'Build in minutes',
    desc: 'Drag-and-drop builder with 10+ field types. No coding, no config — just create and share.',
  },
  {
    icon: WifiOff,
    title: 'Works offline',
    desc: 'Respondents can fill your form with no internet. Answers sync automatically when they reconnect.',
  },
  {
    icon: QrCode,
    title: 'QR code sharing',
    desc: 'Generate a QR code for any form instantly. Perfect for events, restaurants, and physical spaces.',
  },
  {
    icon: Layers,
    title: 'Ready-made templates',
    desc: 'Start from a community template and make it your own in seconds.',
  },
];

const steps = [
  { num: '01', title: 'Create your form', desc: 'Pick fields, add your questions, configure options.' },
  { num: '02', title: 'Share the link or QR', desc: 'One click to publish. Share a URL or print a QR code.' },
  { num: '03', title: 'View responses', desc: 'See answers in a clean dashboard with charts and CSV export.' },
];

const freeFeatures = [
  'Unlimited forms',
  'Unlimited responses',
  '10+ field types',
  'QR code sharing',
  'Offline submissions',
  'Response charts & CSV export',
  'Community templates',
  'No credit card required',
];

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F4F1] text-[#141412]" style={{ fontFamily: '"Inter", "DM Sans", system-ui, sans-serif' }}>

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-[#F5F4F1]/90 backdrop-blur border-b border-[#E4E4E0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoMark size={28} variant="dark" />
            <span className="font-semibold text-[15px] tracking-[-0.02em]">formrise</span>
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

      <main id="main-content">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-6 border"
          style={{ background: '#E8F5EE', color: '#1B6B4A', borderColor: '#B8DFC9' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#1B6B4A]" />
          100% free — no credit card needed
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-[-0.03em] leading-[1.1] mb-5 max-w-3xl mx-auto">
          The form builder that{' '}
          <span style={{ color: '#1B6B4A' }}>actually works</span>
          {' '}everywhere
        </h1>

        <p className="text-base sm:text-lg text-[#6B6B66] max-w-xl mx-auto mb-8 leading-relaxed">
          Build beautiful forms in minutes. Share via link or QR code. Collect responses — even offline.
          No fluff, no paywalls.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer hover:opacity-90 active:scale-95 shadow-sm"
            style={{ background: '#1B6B4A' }}
          >
            Start building for free
            <ArrowRight size={15} />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold text-[#141412] bg-white border border-[#E4E4E0] hover:border-[#1B6B4A] transition-all cursor-pointer"
          >
            View templates →
          </button>
        </div>

        {/* Hero visual */}
        <div className="mt-14 relative">
          <div className="bg-white border border-[#E4E4E0] rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto">
            {/* Fake browser bar */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#E4E4E0] bg-[#F5F4F1]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#E4E4E0]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#E4E4E0]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#E4E4E0]" />
              <div className="flex-1 mx-3 h-5 bg-[#ECEAE6] rounded-md text-[10px] flex items-center px-2 text-[#6B6B66]">
                formrise.fyi/f/event-feedback
              </div>
            </div>
            {/* Fake form */}
            <div className="p-6 text-left">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-[#141412] tracking-tight mb-1">Event Feedback</h2>
                <p className="text-xs text-[#6B6B66]">Share your thoughts about today's event.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#141412] mb-1.5">How would you rate the event? <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium border transition-all"
                        style={n <= 4 ? { background: '#1B6B4A', color: 'white', borderColor: '#1B6B4A' } : { background: 'white', color: '#141412', borderColor: '#E4E4E0' }}
                      >
                        {n <= 4 ? <Star size={14} fill="white" /> : n}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#141412] mb-1.5">What did you enjoy most?</label>
                  <div className="border border-[#E4E4E0] rounded-lg px-3 py-2.5 text-xs text-[#6B6B66] bg-white">
                    The keynote speakers were incredible...
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#141412] mb-1.5">Would you attend again? <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    {['Yes', 'Maybe', 'No'].map((opt) => (
                      <div
                        key={opt}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all"
                        style={opt === 'Yes' ? { background: '#E8F5EE', color: '#1B6B4A', borderColor: '#B8DFC9' } : { background: 'white', color: '#6B6B66', borderColor: '#E4E4E0' }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  className="w-full py-2.5 rounded-lg text-xs font-semibold text-white"
                  style={{ background: '#1B6B4A' }}
                >
                  Submit response
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] mb-2">Everything you need, nothing you don't</h2>
          <p className="text-[#6B6B66] text-sm sm:text-base">Built for speed. Designed to get out of your way.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-[#E4E4E0] rounded-xl p-5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: '#E8F5EE' }}>
                <Icon size={17} style={{ color: '#1B6B4A' }} />
              </div>
              <h3 className="font-semibold text-[#141412] text-sm mb-1.5 tracking-[-0.01em]">{title}</h3>
              <p className="text-xs text-[#6B6B66] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] mb-2">Up and running in 3 steps</h2>
          <p className="text-[#6B6B66] text-sm sm:text-base">From idea to live form in under 2 minutes.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map(({ num, title, desc }) => (
            <div key={num} className="bg-white border border-[#E4E4E0] rounded-xl p-6 relative overflow-hidden">
              <div
                className="text-5xl font-black tracking-tighter absolute top-4 right-5 select-none"
                style={{ color: '#F0F0EC' }}
              >
                {num}
              </div>
              <h3 className="font-semibold text-[#141412] mb-2 tracking-[-0.01em] relative z-10">{title}</h3>
              <p className="text-sm text-[#6B6B66] leading-relaxed relative z-10">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Free tier callout */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div
          className="rounded-2xl p-8 sm:p-12 flex flex-col md:flex-row items-start md:items-center gap-8"
          style={{ background: '#0C1910' }}
        >
          <div className="flex-1">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold mb-4"
              style={{ background: 'rgba(27,107,74,0.3)', color: '#6FD9A8' }}
            >
              Free forever
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-[-0.02em] mb-3">
              No limits on what matters.
            </h2>
            <p className="text-white/50 text-sm leading-relaxed max-w-md">
              formrise is free for individuals. Create as many forms as you want, collect unlimited responses, and share via QR — all without paying a cent.
            </p>
          </div>
          <div className="w-full md:w-64 shrink-0">
            <ul className="space-y-2.5 mb-6">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                  <CheckCircle2 size={14} style={{ color: '#1B6B4A' }} className="shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer hover:opacity-90 active:scale-95"
              style={{ background: '#1B6B4A' }}
            >
              Create your free account
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] mb-3">Ready to collect your first response?</h2>
        <p className="text-[#6B6B66] text-sm mb-7">No account setup friction. Sign in with Google or your email — you're done in 30 seconds.</p>
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer hover:opacity-90 active:scale-95 shadow-sm"
          style={{ background: '#1B6B4A' }}
        >
          Get started — it's free
          <ArrowRight size={15} />
        </button>
      </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#E4E4E0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LogoMark size={24} variant="dark" />
            <span className="text-sm font-semibold text-[#141412]">formrise</span>
          </div>
          <p className="text-xs text-[#6B6B66]">© {new Date().getFullYear()} formrise. Built for everyone, free for always.</p>
        </div>
      </footer>
    </div>
  );
}
