export const metadata = { title: 'Terms of Service — SmartTech Academy' };

export default function TermsPage() {
  return (
    <div className="container-x py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="h-display text-3xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-ink-faint">Last updated: 23 July 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-ink-soft">
          <section>
            <h2 className="font-display text-lg font-bold text-ink">1. Using SmartTech Academy</h2>
            <p className="mt-2">By creating an account or enrolling in a course, you agree to these terms. You must provide accurate registration information and keep your login credentials confidential — you&apos;re responsible for activity under your account.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">2. Enrollment &amp; payment</h2>
            <p className="mt-2">Course prices are shown before checkout. Payments are processed by Paynow and its supported methods (EcoCash, OneMoney, card). Access to a course unlocks once payment is confirmed. Optional hands-on practical sessions carry a separate fee, payable when you book a session, and are subject to availability and capacity at the listed venue.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">3. Refunds</h2>
            <p className="mt-2">If you haven&apos;t started a course (no lessons completed), you may request a refund within 7 days of purchase by emailing support. Once a certificate has been issued for a course, that course is no longer eligible for a refund. Practical session fees are non-refundable within 48 hours of the session start time.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">4. Certificates</h2>
            <p className="mt-2">Certificates are issued on successful completion of a course&apos;s lessons and final exam, and can be independently verified via their serial number at <code>/verify</code>. Certificates confirm completion of our training; they don&apos;t constitute a government-issued trade license, and where a licence is legally required for a trade (e.g. electrical work), you are responsible for obtaining it separately.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">5. Acceptable use</h2>
            <p className="mt-2">Don&apos;t share your account, resell course access, scrape or redistribute course content, or attempt to interfere with the security of the platform (including circumventing rate limits, payment verification, or certificate verification). We may suspend accounts that violate this.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">6. Content &amp; intellectual property</h2>
            <p className="mt-2">Course videos, materials, templates and assessments belong to SmartTech Academy and its instructors. Your enrollment grants you a personal, non-transferable license to access them for your own learning — not to redistribute or resell.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">7. Liability</h2>
            <p className="mt-2">Practical training involves tools and equipment; follow instructor safety guidance at all times. SmartTech Academy is not liable for losses arising from your use of the platform beyond what is required by applicable Zimbabwean law.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">8. Changes</h2>
            <p className="mt-2">We may update these terms as the platform grows; material changes will be posted here with an updated date. Continued use after a change means you accept the updated terms.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">9. Contact</h2>
            <p className="mt-2">Questions? Email <a className="font-semibold text-brand-700" href="mailto:support@smarttech.academy">support@smarttech.academy</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
