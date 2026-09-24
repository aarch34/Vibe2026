import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Mail,
  MapPin,
  Clock,
  Trash2,
  Download,
  UserCheck,
  Scale,
  Lock,
  Eye,
  FileWarning,
  UserX,
  Globe,
} from "lucide-react";

export const metadata = {
  title: "DPDP Act 2023 Privacy Notice • VIBE 2026",
  description:
    "Statutory Privacy Notice & Data Principal Rights under the Digital Personal Data Protection Act, 2023 (India) — Rotaract District 3192, VIBE 2026.",
};

const SECTION_BADGE =
  "inline-flex items-center px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-mono font-black border border-purple-500/30";

function SectionHead({ num, title, badge }: { num: string; title: string; badge?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-7 h-7 shrink-0 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold font-mono mt-0.5">
        {num}
      </span>
      <div>
        <h2 className="text-base font-black text-foreground leading-tight">{title}</h2>
        {badge && <span className={SECTION_BADGE}>{badge}</span>}
      </div>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Navigation */}
        <Link
          href="/app"
          className="inline-flex items-center space-x-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to VIBE Platform</span>
        </Link>

        {/* Hero Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 border border-purple-500/30 shadow-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-mono font-black">
            <ShieldCheck className="w-4 h-4" />
            <span>STATUTORY NOTICE — DPDP ACT, 2023 (NO. 22 OF 2023)</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            Digital Personal Data Protection Notice & Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            This statutory notice is published in compliance with <strong>Section 5</strong> of the Digital Personal Data
            Protection Act, 2023 (DPDP Act, 2023) by <strong>Rotaract District 3192</strong> for the VIBE 2026 youth
            festival platform.
          </p>
          <div className="flex flex-wrap gap-4 text-[11px] font-mono text-muted-foreground">
            <span>Act: No. 22 of 2023, dated 11th August 2023</span>
            <span>•</span>
            <span>Jurisdiction: Bengaluru, India</span>
            <span>•</span>
            <span>Last Reviewed: September 2026</span>
          </div>
        </div>

        <div className="p-6 sm:p-10 rounded-3xl bg-card border border-border shadow-xl space-y-10 text-sm leading-relaxed">

          {/* ── SECTION 1: DATA FIDUCIARY ── */}
          <section className="space-y-3">
            <SectionHead num="01" title="Identity of Data Fiduciary (Section 5(1))" badge="§5 Notice Requirement" />
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border text-xs space-y-2 font-mono">
              <p className="font-black text-foreground">Data Fiduciary: Rotaract District 3192 (District Council & VIBE 2026 Committee)</p>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-pink-400" />
                District Secretariat, Bengaluru, Karnataka 560001, India
              </p>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                <span>
                  Data Protection Officer:{" "}
                  <a href="mailto:dpo@vibe2026.rotaract.org" className="text-cyan-400 underline font-bold">
                    dpo@vibe2026.rotaract.org
                  </a>
                </span>
              </p>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                <span>
                  Grievance Officer:{" "}
                  <a href="mailto:grievance@vibe2026.rotaract.org" className="text-purple-400 underline font-bold">
                    grievance@vibe2026.rotaract.org
                  </a>
                </span>
              </p>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                Platform URL: vibe2026.rotaract.org
              </p>
            </div>
          </section>

          {/* ── SECTION 2: PERSONAL DATA COLLECTED ── */}
          <section className="space-y-3">
            <SectionHead num="02" title="Categories of Personal Data Collected (Section 5(1)(i))" badge="§5 — Data Minimisation" />
            <p className="text-xs text-muted-foreground">
              We collect only data strictly necessary for the specified purpose (principle of data minimisation):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {[
                { color: "purple", label: "Identity & Profile", desc: "Full Name, Username, VIBE ID (Accreditation Code), Profile Photograph" },
                { color: "pink", label: "Contact & Affiliation", desc: "Email address, Phone number, College / University, Rotaract Club, Designation" },
                { color: "cyan", label: "Social & Networking", desc: "Instagram handle (optional), Bio, User-uploaded event photos, Captions, Comments, Post Likes" },
                { color: "amber", label: "Gamification & Engagement", desc: "Arcade Game scores, XP progression, Level tier, Leaderboard ranking, VIBE Coins balance" },
              ].map(({ color, label, desc }) => (
                <div key={label} className="p-3.5 rounded-2xl bg-secondary/30 border border-border/70 space-y-1">
                  <span className={`font-bold text-${color}-400 block`}>{label}</span>
                  <p className="text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── SECTION 3: LAWFUL PURPOSE ── */}
          <section className="space-y-3">
            <SectionHead num="03" title="Lawful Purpose of Processing (Sections 4 & 5(1)(i))" badge="§4 — Lawful Basis" />
            <div className="space-y-2 text-xs text-muted-foreground">
              {[
                { title: "Event Accreditation", desc: "Issuing digital delegate badges (VIBE ID Pass) and scanning QR credentials at entry gates and activity zones." },
                { title: "Peer Networking", desc: "Enabling attendees to discover fellow delegates, send connection requests, view mutual profiles, and build their event network." },
                { title: "Festival Gamification", desc: "Maintaining XP scores, calculating tier milestones, and displaying community rankings on the live leaderboard." },
                { title: "Safety & Operational Notices", desc: "Transmitting essential schedule updates, stall alerts, security announcements, and connection notifications." },
              ].map(({ title, desc }) => (
                <div key={title} className="flex gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <p><strong className="text-foreground">{title}:</strong> {desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── SECTION 4: CONSENT ── */}
          <section className="space-y-3">
            <SectionHead num="04" title="Consent & Right to Withdraw (Section 6)" badge="§6 — Consent Requirements" />
            <p className="text-xs text-muted-foreground">
              Under Section 6(1), your consent is <strong className="text-foreground">free, specific, informed, unconditional and unambiguous</strong> — given
              by affirmative action during registration. Consent is limited to data strictly necessary for the specified purpose.
            </p>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
              <p className="font-black text-amber-400">§6(4) — Withdrawal of Consent:</p>
              <p className="text-muted-foreground">
                You may withdraw your consent at any time from your Profile → Privacy Settings. The ease of withdrawal is
                comparable to the ease of giving consent (Section 6(4)). Upon withdrawal, your profile will be hidden from
                discovery. Processing that occurred prior to withdrawal remains lawful (Section 6(5)).
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Consequences (§6(5)):</strong> Event QR accreditation may be revoked.
                To fully erase data, use the "Delete My Account" option.
              </p>
            </div>
          </section>

          {/* ── SECTION 5: RETENTION PERIOD ── */}
          <section className="space-y-3">
            <SectionHead num="05" title="Data Retention Period (Section 8(7))" badge="§8(7) — Retention Limits" />
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border text-xs space-y-2">
              <div className="flex gap-2 items-start">
                <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  Personal data is retained only for the duration of the VIBE 2026 event and post-event activities
                  (estimated: until <strong className="text-foreground">31 December 2026</strong>). After this, all
                  personal data not required for legal compliance will be permanently erased or anonymised.
                </p>
              </div>
              <div className="flex gap-2 items-start">
                <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  Financial transaction logs (coins / XP audit trails) may be retained for up to <strong className="text-foreground">3 years</strong> as
                  required by applicable accounting and audit laws in India.
                </p>
              </div>
            </div>
          </section>

          {/* ── SECTION 6: DATA PRINCIPAL RIGHTS ── */}
          <section className="space-y-4">
            <SectionHead num="06" title="Your Rights as a Data Principal (Sections 11–14)" badge="Chapter III — Rights" />
            <div className="space-y-3 text-xs">
              {[
                {
                  icon: <Download className="w-4 h-4 text-cyan-400" />,
                  title: "Right to Access & Summary (§11)",
                  desc: 'You can download a portable copy of all personal data held about you. Use the "Download My Personal Data (DPDP Export)" tool in your Profile.',
                  link: "/app/profile",
                  linkText: "Go to Profile → Export Data",
                },
                {
                  icon: <Eye className="w-4 h-4 text-emerald-400" />,
                  title: "Right to Correction (§12(2))",
                  desc: 'You may correct inaccurate, incomplete or outdated data at any time via "Edit Profile" in your profile settings.',
                  link: "/app/profile",
                  linkText: "Go to Profile → Edit Profile",
                },
                {
                  icon: <Trash2 className="w-4 h-4 text-red-400" />,
                  title: "Right to Erasure (§12(3))",
                  desc: 'You may permanently erase all your personal data. Use "Delete My Account & Data" in Profile Settings. This erases all posts, connections, XP logs, and profile data from our servers.',
                  link: "/app/profile",
                  linkText: "Go to Profile → Delete Account",
                },
                {
                  icon: <UserX className="w-4 h-4 text-amber-400" />,
                  title: "Right to Withdraw Consent (§6(4))",
                  desc: "You may withdraw your data processing consent at any time. The withdrawal is effective immediately. Your profile will be hidden from discovery.",
                  link: "/app/profile",
                  linkText: "Go to Profile → Privacy Settings",
                },
                {
                  icon: <Scale className="w-4 h-4 text-purple-400" />,
                  title: "Right of Grievance Redressal (§13)",
                  desc: "You have the right to file a grievance with our Grievance Officer. Statutory acknowledgment within 48 hours; resolution within 7 working days. If unresolved, you may approach the Data Protection Board of India.",
                  link: "/app/profile",
                  linkText: "Go to Profile → File a Grievance",
                },
                {
                  icon: <UserCheck className="w-4 h-4 text-blue-400" />,
                  title: "Right to Nominate (§14)",
                  desc: "You may nominate an individual who shall, in the event of your death or incapacity (as defined in §14(2)), exercise your data rights on your behalf.",
                  link: "/app/profile",
                  linkText: "Go to Profile → Designate Nominee",
                },
              ].map(({ icon, title, desc, link, linkText }) => (
                <div key={title} className="p-3.5 rounded-2xl bg-secondary/40 border border-border space-y-1.5">
                  <h4 className="font-black text-foreground flex items-center gap-1.5">
                    {icon}
                    <span>{title}</span>
                  </h4>
                  <p className="text-muted-foreground">{desc}</p>
                  {link && (
                    <Link href={link} className="inline-flex items-center gap-1 text-pink-400 font-bold hover:text-pink-300 underline text-[11px]">
                      → {linkText}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── SECTION 7: SECTION 9 — CHILDREN ── */}
          <section className="space-y-3">
            <SectionHead num="07" title="Protection of Children (Section 9)" badge="§9 — Minors under 18" />
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs space-y-2">
              <div className="flex gap-2 items-start">
                <AlertCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  VIBE 2026 is designed for college delegates aged 18 and above. In compliance with Section 9(1), individuals
                  below 18 years may only register with <strong className="text-foreground">verifiable consent of a parent or lawful guardian</strong>.
                  Self-declaration of age is collected at registration; parental consent verification is conducted by event staff for minors.
                </p>
              </div>
              <div className="flex gap-2 items-start">
                <AlertCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  In compliance with Section 9(3), the platform does <strong className="text-foreground">not undertake tracking or behavioural monitoring
                  of children</strong> and does not direct targeted advertising at anyone under 18.
                </p>
              </div>
            </div>
          </section>

          {/* ── SECTION 8: SECURITY SAFEGUARDS ── */}
          <section className="space-y-3">
            <SectionHead num="08" title="Data Security Safeguards (Section 8(5))" badge="§8(5) — Security Obligations" />
            <div className="space-y-2 text-xs text-muted-foreground">
              {[
                "HTTPS / TLS 1.3 encryption for all data in transit",
                "PostgreSQL Row Level Security (RLS) policies — users can only access their own data",
                "Clerk-managed authentication with token isolation and session invalidation",
                "Supabase service-role keys stored server-side only (never exposed to client)",
                "Supabase Storage with signed URLs for media assets",
                "Regular dependency vulnerability audits",
              ].map((item) => (
                <div key={item} className="flex gap-2 items-start">
                  <Lock className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── SECTION 9: BREACH NOTIFICATION ── */}
          <section className="space-y-3">
            <SectionHead num="09" title="Personal Data Breach Notification (Section 8(6))" badge="§8(6) — Breach Intimation" />
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs space-y-2">
              <div className="flex gap-2 items-start">
                <FileWarning className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  In the event of a personal data breach, we shall notify the <strong className="text-foreground">Data Protection Board of India</strong> and
                  each affected Data Principal <strong className="text-foreground">promptly</strong>, in the form and manner as may be prescribed under
                  Section 8(6) of the DPDP Act, 2023. Notifications will be sent to your registered email address.
                </p>
              </div>
            </div>
          </section>

          {/* ── SECTION 10: DUTIES OF DATA PRINCIPAL ── */}
          <section className="space-y-3">
            <SectionHead num="10" title="Your Duties as a Data Principal (Section 15)" badge="§15 — Data Principal Duties" />
            <p className="text-xs text-muted-foreground">
              In exercising your rights under this Act, you are required to perform the following duties under Section 15:
            </p>
            <div className="space-y-2 text-xs">
              {[
                { duty: "§15(a)", desc: "Comply with all applicable laws while exercising your rights under the DPDP Act." },
                { duty: "§15(b)", desc: "Not impersonate another person while providing personal data for any specified purpose." },
                { duty: "§15(c)", desc: "Not suppress any material information while providing data for a document, unique identifier, proof of identity or proof of address." },
                { duty: "§15(d)", desc: "Not register a false or frivolous grievance or complaint with the Data Fiduciary or the Data Protection Board." },
                { duty: "§15(e)", desc: "Furnish only verifiably authentic information while exercising the right to correction or erasure." },
              ].map(({ duty, desc }) => (
                <div key={duty} className="flex gap-3 p-3 rounded-xl bg-secondary/30 border border-border/60">
                  <span className="text-[10px] font-mono font-black text-amber-400 shrink-0 mt-0.5 w-10">{duty}</span>
                  <p className="text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── SECTION 11: CROSS-BORDER TRANSFERS ── */}
          <section className="space-y-3">
            <SectionHead num="11" title="Cross-Border Data Transfer (Section 16)" badge="§16 — Transfer Restrictions" />
            <p className="text-xs text-muted-foreground">
              Your personal data is processed and stored in India. Third-party services used (Clerk for authentication,
              Supabase for database) process data on Indian-region servers where available. No personal data is transferred
              to countries restricted by Central Government notification under Section 16 of the DPDP Act, 2023.
            </p>
          </section>

          {/* ── SECTION 12: GRIEVANCE OFFICER ── */}
          <section className="space-y-3 pt-4 border-t border-border">
            <SectionHead num="12" title="Grievance Redressal Officer & Data Protection Officer (Sections 8(9) & 13)" badge="§8(9) Published Contact" />
            <div className="p-5 rounded-2xl bg-secondary/50 border border-purple-500/30 text-xs space-y-3">
              <div className="space-y-1">
                <p className="font-black text-foreground">Grievance Redressal Officer</p>
                <p className="text-muted-foreground">Rotaract District 3192 — VIBE 2026 Committee</p>
                <p className="text-muted-foreground">Bengaluru, Karnataka 560001, India</p>
                <p>
                  Email:{" "}
                  <a href="mailto:grievance@vibe2026.rotaract.org" className="text-purple-400 font-bold underline">
                    grievance@vibe2026.rotaract.org
                  </a>
                </p>
                <p className="text-muted-foreground">
                  Response: <strong className="text-foreground">Acknowledgment within 48 hours</strong>; Resolution within{" "}
                  <strong className="text-foreground">7 working days</strong> (Section 13(2)).
                </p>
              </div>
              <div className="pt-2 border-t border-border space-y-1">
                <p className="font-black text-foreground">Data Protection Officer</p>
                <p>
                  Email:{" "}
                  <a href="mailto:dpo@vibe2026.rotaract.org" className="text-cyan-400 font-bold underline">
                    dpo@vibe2026.rotaract.org
                  </a>
                </p>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-muted-foreground text-[11px]">
                  If your grievance remains unresolved, you may approach the{" "}
                  <strong className="text-foreground">Data Protection Board of India</strong> established under Section 18 of
                  the DPDP Act, 2023. Appeals against Board orders may be filed with the Telecom Disputes Settlement and
                  Appellate Tribunal (TDSAT) under Section 29 of the Act.
                </p>
              </div>
            </div>
          </section>

          {/* ── SECTION 13: SCHEDULE — PENALTIES ── */}
          <section className="space-y-3">
            <SectionHead num="13" title="Penalty Framework (Section 33 & Schedule)" badge="§33 — Penalties" />
            <p className="text-xs text-muted-foreground">
              Breaches of the DPDP Act attract monetary penalties. As a platform, we are committed to full compliance to
              avoid the following prescribed penalties under the Schedule to the Act:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-border rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-secondary/60">
                    <th className="text-left p-2.5 font-black text-foreground border-b border-border">Breach</th>
                    <th className="text-right p-2.5 font-black text-foreground border-b border-border">Max Penalty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["Failure of reasonable security safeguards (§8(5))", "₹250 Crore"],
                    ["Failure to notify breach to Board / Data Principal (§8(6))", "₹200 Crore"],
                    ["Breach of children's data obligations (§9)", "₹200 Crore"],
                    ["Breach of Significant Data Fiduciary obligations (§10)", "₹150 Crore"],
                    ["Breach of Data Principal duties (§15)", "₹10,000"],
                    ["Breach of voluntary undertaking accepted by Board (§32)", "Per extent of breach"],
                    ["Any other breach of Act / Rules", "₹50 Crore"],
                  ].map(([breach, penalty]) => (
                    <tr key={breach} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-2.5 text-muted-foreground">{breach}</td>
                      <td className="p-2.5 text-right font-black text-pink-400">{penalty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>{/* end content card */}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border text-xs">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/app/profile"
              className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black transition-all shadow-md"
            >
              Manage Privacy & Exercise Rights →
            </Link>
            <a
              href="mailto:grievance@vibe2026.rotaract.org"
              className="px-5 py-2.5 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-black transition-all border border-border"
            >
              Email Grievance Officer
            </a>
          </div>
          <span className="text-muted-foreground font-mono text-[11px]">
            Rotaract District 3192 • VIBE 2026 • DPDP Act No. 22 of 2023
          </span>
        </div>

      </div>
    </div>
  );
}
