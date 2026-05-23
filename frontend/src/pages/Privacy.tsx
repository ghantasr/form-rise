import { Link } from 'react-router-dom';

const EFFECTIVE_DATE = '21 May 2026';
const CONTACT_EMAIL = 'privacy@formrise.fyi';
const DOMAIN = 'formrise.fyi';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-[#1A1A18] mb-3">{title}</h2>
      <div className="text-sm text-[#4B4B46] leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export function Privacy() {
  return (
    <div className="min-h-screen bg-[#F5F4F1]">
      {/* Nav */}
      <header className="bg-white border-b border-[#E4E4E0]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1B6B4A] flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M9 12h6M9 16h4M7 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 4h6v4H9V4z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-semibold text-[#141412] tracking-[-0.02em]">formrise™</span>
          </Link>
          <Link to="/login" className="text-sm text-[#1B6B4A] font-medium hover:text-[#134F36] transition-colors">
            Sign in
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-[#E4E4E0] px-8 py-10 shadow-sm">
          <div className="mb-8 pb-6 border-b border-[#E8E8E4]">
            <h1 className="text-2xl font-bold text-[#141412] tracking-[-0.02em] mb-1">Privacy Policy</h1>
            <p className="text-sm text-[#6B6B66]">Effective date: {EFFECTIVE_DATE}</p>
          </div>

          <p className="text-sm text-[#4B4B46] leading-relaxed mb-8">
            FormRise ("<strong>we</strong>", "<strong>our</strong>", "<strong>us</strong>") operates{' '}
            <strong>{DOMAIN}</strong>. This policy explains what data we collect, why we collect it,
            and your rights over it. We keep this simple and honest — we do not sell your data and
            we do not run advertising.
          </p>

          <Section title="1. Data we collect">
            <p><strong>Account data</strong> — when you sign in we store your email address and, if
            you use Google Sign-In, your display name and profile picture URL. We do not store
            passwords.</p>
            <p><strong>Form responses</strong> — answers submitted to any form on the platform,
            including the respondent's email address when the form requests it.</p>
            <p><strong>Usage data</strong> — a hashed (SHA-256, non-reversible) version of your IP
            address and your browser's User-Agent string are stored per form submission for
            basic abuse prevention. We cannot reverse these hashes back to your original IP.</p>
            <p><strong>Form view and field-reach counts</strong> — aggregate counters that tell the
            form owner how many times a form was viewed and how far respondents read. These are
            counts only; no individual is identified.</p>
          </Section>

          <Section title="2. Cookies and local storage">
            <p><strong>refreshToken cookie</strong> — an HttpOnly, Secure cookie that keeps you
            signed in across browser sessions. It contains a random token (not your personal data)
            and expires after 30 days of inactivity. This cookie is strictly necessary for
            authentication and does not require your consent under the ePrivacy Directive.</p>
            <p><strong>localStorage</strong> — we store small preference flags in your browser's
            local storage:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code className="text-xs bg-[#F5F4F1] px-1 py-0.5 rounded">fr_has_session</code> — tells the app a session may exist so it can restore your login without a visible flash.</li>
              <li><code className="text-xs bg-[#F5F4F1] px-1 py-0.5 rounded">fr_user_cache</code> — caches your name and email so the UI loads instantly.</li>
              <li><code className="text-xs bg-[#F5F4F1] px-1 py-0.5 rounded">fr_tour_done</code>, <code className="text-xs bg-[#F5F4F1] px-1 py-0.5 rounded">fr_checklist_dismissed</code> — remember that you dismissed the onboarding tour.</li>
            </ul>
            <p>We do not use advertising cookies, third-party tracking cookies, or analytics cookies
            (e.g. Google Analytics, Facebook Pixel). We therefore do not display a cookie consent
            banner — none of our cookies require it.</p>
          </Section>

          <Section title="3. How we use your data">
            <ul className="list-disc pl-5 space-y-1">
              <li>To authenticate you and keep your session secure.</li>
              <li>To deliver form responses to the form owner.</li>
              <li>To send transactional emails (one-time sign-in codes, invite links) via Brevo (Sendinblue). Brevo acts as a data processor on our behalf and does not use your email for their own marketing.</li>
              <li>To prevent abuse (rate limiting, duplicate submission detection).</li>
            </ul>
            <p>We never use your data for profiling, targeted advertising, or selling to third parties.</p>
          </Section>

          <Section title="4. Third-party services">
            <p>We use a small number of sub-processors:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Brevo (Sendinblue)</strong> — transactional email delivery. <a href="https://www.brevo.com/legal/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-[#1B6B4A] hover:underline">Their privacy policy</a>.</li>
              <li><strong>Google OAuth</strong> — optional sign-in via Google. If you choose Google Sign-In, Google shares your email, name, and profile picture with us. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#1B6B4A] hover:underline">Google's privacy policy</a>.</li>
              <li><strong>Hetzner Cloud</strong> — our server infrastructure, located in the EU.</li>
            </ul>
          </Section>

          <Section title="5. Data retention">
            <p>Your account data and form responses are retained for as long as your account is active.
            Refresh tokens expire after 30 days of inactivity and are purged automatically.</p>
            <p>If you delete your account (via Settings → Delete account), all your personal data,
            forms, and responses are permanently deleted within 30 days.</p>
          </Section>

          <Section title="6. Your rights (GDPR)">
            <p>If you are located in the EU/EEA or UK, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong>Rectification</strong> — ask us to correct inaccurate data.</li>
              <li><strong>Erasure</strong> — ask us to delete your data ("right to be forgotten").</li>
              <li><strong>Portability</strong> — receive your data in a machine-readable format.</li>
              <li><strong>Objection</strong> — object to processing where our legal basis is legitimate interest.</li>
            </ul>
            <p>To exercise any of these rights, email us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#1B6B4A] hover:underline">{CONTACT_EMAIL}</a>.
              We respond within 30 days.
            </p>
          </Section>

          <Section title="7. Children">
            <p>FormRise is not directed at children under 16. We do not knowingly collect personal
            data from anyone under 16. If you believe a child has submitted data through our platform,
            contact us and we will delete it promptly.</p>
          </Section>

          <Section title="8. Changes to this policy">
            <p>We may update this policy from time to time. When we do, we will update the effective
            date at the top of this page. For material changes we will notify signed-in users via
            email at least 14 days before the change takes effect.</p>
          </Section>

          <Section title="9. Contact">
            <p>Questions or concerns? Email us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#1B6B4A] hover:underline">{CONTACT_EMAIL}</a>.
            </p>
          </Section>
        </div>
      </main>

      <footer className="text-center text-xs text-[#6B6B66] py-8">
        © {new Date().getFullYear()} formrise™ · <Link to="/privacy" className="hover:text-[#1B6B4A]">Privacy Policy</Link>
      </footer>
    </div>
  );
}
