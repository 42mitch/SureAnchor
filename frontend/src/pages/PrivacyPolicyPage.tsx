import PublicLayout from '../layouts/PublicLayout';

const SECTIONS = [
  {
    title: '1. Who We Are',
    body: `SureAnchor is a non-profit organisation dedicated to the protection, rehabilitation, and reintegration of vulnerable women and children in the Philippines. We operate secure residential safehouses and provide social welfare services in partnership with the Department of Social Welfare and Development (DSWD).

Data Controller:
SureAnchor Foundation
Quezon City, Philippines
Email: privacy@sureanchor.org`,
  },
  {
    title: '2. What Personal Data We Collect',
    body: `We collect only the data necessary to provide our services and operate this platform. Depending on how you interact with our site, this may include:

Donors and Supporters
• Full name and display name
• Email address
• Country and region
• Donation history (amounts, campaigns, dates)
• Payment information (processed securely by our payment partner — we do not store card details)

Staff and Volunteers
• Name, email address, and role
• Account credentials (password stored as a hashed value only)

Website Visitors
• IP address and browser type (via server logs, retained for 30 days)
• Pages visited and time on site (aggregated, non-identifying)

Residents in Our Care
• We hold detailed personal and case information about residents strictly for social welfare and legal compliance purposes. This data is never disclosed publicly, is not accessible through this website, and is governed by a separate internal Data Protection Policy and applicable Philippine law (RA 10173).`,
  },
  {
    title: '3. How We Use Your Data',
    body: `We process your personal data only for specified, explicit, and legitimate purposes:

• To process and record donations and issue acknowledgements
• To maintain your donor or staff account and provide access to the portal
• To communicate with you about your support, updates, and our programmes (only with your consent)
• To comply with financial, legal, and regulatory obligations (e.g., BIR reporting)
• To improve the security and performance of this website
• To fulfil our obligations under DSWD accreditation requirements

We do not sell, rent, or share your personal data with third parties for marketing purposes.`,
  },
  {
    title: '4. Legal Basis for Processing',
    body: `We rely on the following legal bases under the GDPR and the Philippine Data Privacy Act of 2012 (RA 10173):

• Consent — for optional communications such as newsletters and donation impact updates. You may withdraw consent at any time.
• Contractual necessity — to process your donation or manage your staff/volunteer account.
• Legal obligation — to comply with applicable financial, tax, and welfare regulations.
• Legitimate interests — to maintain the security of our systems and detect fraud, provided these interests are not overridden by your rights.`,
  },
  {
    title: '5. Cookies and Tracking',
    body: `We use cookies to operate this website. Our cookie usage is minimal and falls into two categories:

Strictly Necessary Cookies (no consent required)
• Session cookie — keeps you logged in during your visit. Deleted when you close your browser.
• XSRF/security token — protects form submissions from cross-site request forgery.

Analytics Cookies (require consent)
• We may use privacy-friendly, aggregate analytics to understand how visitors use our site. No individual user profiles are built. If you decline, no analytics cookies are set.

We do not use advertising cookies, social media tracking pixels, or any third-party behavioural tracking.

You can manage or withdraw your cookie consent at any time by clicking "Cookie Settings" in the footer.`,
  },
  {
    title: '6. Data Retention',
    body: `We retain your personal data only for as long as necessary:

• Donor records — 7 years from the date of the last transaction, for financial compliance purposes.
• Staff and volunteer accounts — for the duration of your engagement plus 5 years.
• Website server logs — 30 days, then automatically deleted.
• Resident case files — in accordance with DSWD guidelines and applicable court orders. Not accessible via this website.

When data is no longer needed it is securely deleted or anonymised.`,
  },
  {
    title: '7. Data Storage and Security',
    body: `All data is stored on Microsoft Azure servers located in the Southeast Asia region (Singapore). We implement the following measures to protect your data:

• TLS/HTTPS encryption for all data in transit
• Encrypted storage for sensitive fields at rest
• Role-based access control — staff see only what they need
• Regular security reviews and dependency updates
• Multi-factor authentication available for all staff accounts

No method of transmission or storage is 100% secure. In the unlikely event of a data breach that affects your personal information, we will notify you within 72 hours of becoming aware of it, in accordance with NPC requirements.`,
  },
  {
    title: '8. Sharing Your Data',
    body: `We share personal data only in limited circumstances:

• Payment processors — to complete donation transactions. They are bound by their own GDPR/PCI-DSS compliance obligations.
• Cloud infrastructure (Microsoft Azure) — as our data processor, under a Data Processing Agreement.
• Legal authorities — when required by law, court order, or to protect the safety of individuals in our care.

We do not transfer data outside of Microsoft Azure's Southeast Asia region without appropriate safeguards.`,
  },
  {
    title: '9. Your Rights',
    body: `Under the GDPR and RA 10173, you have the following rights regarding your personal data:

• Right to be informed — you are reading this policy.
• Right of access — request a copy of the data we hold about you.
• Right to rectification — ask us to correct inaccurate data.
• Right to erasure ("right to be forgotten") — ask us to delete your data where there is no overriding legal reason to keep it.
• Right to restrict processing — ask us to limit how we use your data.
• Right to data portability — receive your data in a machine-readable format.
• Right to object — object to processing based on legitimate interests or for direct marketing.
• Rights related to automated decision-making — we do not make solely automated decisions that significantly affect you.

To exercise any of these rights, contact us at privacy@sureanchor.org. We will respond within 30 days. You also have the right to lodge a complaint with the National Privacy Commission (Philippines) at www.privacy.gov.ph, or with a supervisory authority in your country of residence.`,
  },
  {
    title: '10. Children\'s Privacy',
    body: `This website is not directed at individuals under the age of 18 for the purpose of creating accounts or making donations. We do not knowingly collect personal data from minors through this platform. Information about children in our residential care programmes is handled exclusively under our internal Child Protection and Data Privacy policies, in strict accordance with RA 10173 and DSWD regulations.`,
  },
  {
    title: '11. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. When we do, we will update the "Last updated" date at the top of this page. For material changes, we will notify registered users by email or via a notice on the website.`,
  },
  {
    title: '12. Contact Us',
    body: `For any privacy-related questions, requests, or complaints:

Data Protection Officer
SureAnchor Foundation
Email: privacy@sureanchor.org
Address: Quezon City, Philippines

For complaints you may also contact the National Privacy Commission:
Website: www.privacy.gov.ph
Email: info@privacy.gov.ph`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <PublicLayout>
      <div className="bg-gradient-to-br from-navy to-navy-light py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-3">Legal</p>
          <h1 className="font-display text-4xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-white/55 text-sm">Last updated: April 2026 · Effective date: April 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Intro */}
        <div className="bg-teal/8 border border-teal/20 rounded-2xl px-6 py-5 mb-10">
          <p className="text-dark/70 text-sm leading-relaxed">
            SureAnchor ("we", "us", "our") is committed to protecting your personal data and respecting your privacy.
            This Privacy Policy explains what information we collect, why we collect it, how we use it, and your rights
            under the <strong>EU General Data Protection Regulation (GDPR)</strong> and the
            <strong> Philippine Data Privacy Act of 2012 (Republic Act No. 10173)</strong>.
            Please read this policy carefully before using our website or services.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map(section => (
            <section key={section.title}>
              <h2 className="font-display text-xl font-bold text-navy mb-3">{section.title}</h2>
              <div className="prose prose-sm max-w-none text-dark/70 leading-relaxed whitespace-pre-line">
                {section.body}
              </div>
            </section>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 pt-8 border-t border-dark/10 text-center">
          <p className="text-xs text-dark/35">
            © 2026 SureAnchor Foundation · This privacy policy was last reviewed in April 2026.
            <br />
            For questions contact <a href="mailto:privacy@sureanchor.org" className="text-teal hover:underline">privacy@sureanchor.org</a>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
