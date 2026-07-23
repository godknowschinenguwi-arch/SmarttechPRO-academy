export const metadata = { title: 'Privacy Policy — SmartTech Academy' };

export default function PrivacyPage() {
  return (
    <div className="container-x py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="h-display text-3xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink-faint">Last updated: 23 July 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-ink-soft">
          <section>
            <h2 className="font-display text-lg font-bold text-ink">1. What we collect</h2>
            <p className="mt-2">When you create an account or use SmartTech Academy, we collect:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Account details: name, email address, city/country, and a securely hashed password (we never store your password in plain text).</li>
              <li>Learning activity: course enrollments, lesson progress, quiz attempts, assignment submissions, and certificates issued.</li>
              <li>Payment records: amount, provider (Paynow/EcoCash/Stripe/PayPal/Mukuru/bank transfer) and a transaction reference. We do not collect or store your card, EcoCash PIN, or bank details ourselves — those are handled directly by our payment providers.</li>
              <li>Practical session bookings: city and session you book, for coordinating in-person training.</li>
              <li>Basic technical data: IP address and timestamps, used only for security purposes such as rate-limiting abuse and fraud prevention.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">2. How we use it</h2>
            <p className="mt-2">We use your data to: provide and improve the courses and certificates; process payments and practical session bookings; send you course, payment, and account notifications; and keep the platform secure.</p>
            <p className="mt-2">We do not sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">3. Cookies &amp; local storage</h2>
            <p className="mt-2">We use one essential cookie (<code>sta_session</code>) to keep you signed in — it is <code>httpOnly</code> and cannot be read by scripts. Your preferred display currency is remembered in your browser&apos;s local storage. We do not use third-party advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">4. Who we share data with</h2>
            <p className="mt-2">We share the minimum necessary data with: payment processors (Paynow and the providers it settles through) to complete a transaction; and our hosting/infrastructure providers, who process data on our behalf under their own security commitments. We do not share your data with anyone else without your consent, except where required by law.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">5. Your rights</h2>
            <p className="mt-2">You can ask us to access, correct, or delete your personal data, or export your learning records, at any time by emailing <a className="font-semibold text-brand-700" href="mailto:support@smarttech.academy">support@smarttech.academy</a>. We will respond within a reasonable time. Certificate serial numbers may be retained after account deletion solely so third parties can continue to verify certificates you were issued.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">6. Data retention &amp; security</h2>
            <p className="mt-2">We keep account and learning data for as long as your account is active, and payment records for as long as required for accounting and dispute purposes. We use industry-standard measures (hashed passwords, encrypted transport, access controls) to protect your data, but no online service can guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">7. Children</h2>
            <p className="mt-2">SmartTech Academy is intended for learners aged 16 and older. If you believe a younger child has created an account, please contact us so we can remove it.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">8. Contact</h2>
            <p className="mt-2">Questions about this policy? Email <a className="font-semibold text-brand-700" href="mailto:support@smarttech.academy">support@smarttech.academy</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
