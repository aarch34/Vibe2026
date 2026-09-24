import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, FileText, CheckCircle2, UserCheck, AlertCircle, Mail, MapPin } from "lucide-react";

export const metadata = {
  title: "DPDP Act 2023 Privacy Notice • VIBE 2026",
  description: "Digital Personal Data Protection Notice and Data Principal Rights Policy for VIBE 2026, Rotaract District 3192.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Link
            href="/app"
            className="inline-flex items-center space-x-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to VIBE Platform</span>
          </Link>

          <div className="p-8 rounded-3xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 border border-purple-500/30 shadow-2xl space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-mono font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>STATUTORY NOTICE UNDER DPDP ACT, 2023 (INDIA)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Digital Personal Data Protection Notice & Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              This statutory notice is published in compliance with Section 5 of the Digital Personal Data Protection Act, 2023 (DPDP Act, 2023) by Rotaract District 3192 for the VIBE 2026 youth festival platform.
            </p>
            <p className="text-[11px] font-mono text-muted-foreground">
              Effective Date: September 2026 • Last Reviewed: September 24, 2026 • Jurisdiction: Bengaluru, India
            </p>
          </div>
        </div>

        {/* Content Card */}
        <div className="p-6 sm:p-10 rounded-3xl bg-card border border-border shadow-xl space-y-8 text-sm leading-relaxed">
          {/* Section 1: Data Fiduciary */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold font-mono">
                01
              </span>
              <span>Identity of Data Fiduciary</span>
            </h2>
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border text-xs space-y-1.5 font-mono">
              <p className="font-bold text-foreground">Data Fiduciary: Rotaract District 3192 (District Council & VIBE 2026 Committee)</p>
              <p className="text-muted-foreground flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-pink-400" />
                <span>District Secretariat, Bengaluru, Karnataka 560001, India</span>
              </p>
              <p className="text-muted-foreground flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                <span>Grievance Email: grievance@vibe2026.rotaract.org / dpo@vibe2026.rotaract.org</span>
              </p>
            </div>
          </section>

          {/* Section 2: Personal Data Collected */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center text-xs font-bold font-mono">
                02
              </span>
              <span>Categories of Digital Personal Data Collected</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              In accordance with the principle of Data Minimisation (Section 4 & 5), we only collect personal data strictly necessary for event participation:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/70 space-y-1">
                <span className="font-bold text-purple-400 block">Identity & Profile Data</span>
                <p className="text-muted-foreground">Full Name, Chosen Username, VIBE ID (Accreditation Code), and Profile Photograph.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/70 space-y-1">
                <span className="font-bold text-pink-400 block">Contact & Affiliation Data</span>
                <p className="text-muted-foreground">Email address, Phone number, College / University, Rotaract Club, and Designation.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/70 space-y-1">
                <span className="font-bold text-cyan-400 block">Social & Networking Data</span>
                <p className="text-muted-foreground">Instagram handle, Interests, Bio, User-uploaded event photos, Captions, Comments, and Post Likes.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/70 space-y-1">
                <span className="font-bold text-amber-400 block">Gamification & Engagement Data</span>
                <p className="text-muted-foreground">Arcade Game scores, Time scores, XP progression, Level tier, Leaderboard ranking, and Digital Coins.</p>
              </div>
            </div>
          </section>

          {/* Section 3: Lawful Purpose & Processing */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
                03
              </span>
              <span>Lawful Purpose of Processing (Section 4 & 5)</span>
            </h2>
            <ul className="space-y-2 text-xs text-muted-foreground list-disc list-inside">
              <li><strong className="text-foreground">Event Accreditation:</strong> Issuing digital delegate badges (VIBE ID Pass) and scanning QR credentials at entry gates and activity zones.</li>
              <li><strong className="text-foreground">Peer Networking:</strong> Enabling attendees to discover fellow students, send connection requests, and view mutual delegates.</li>
              <li><strong className="text-foreground">Festival Gamification:</strong> Maintaining festival XP scores, calculating tier milestones, and displaying community rankings on the live leaderboard.</li>
              <li><strong className="text-foreground">Safety & Operational Notices:</strong> Transmitting essential schedule updates, stall alerts, security announcements, and connection notifications.</li>
            </ul>
          </section>

          {/* Section 4: Consent & Withdrawal */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">
                04
              </span>
              <span>Consent & Right to Withdraw (Section 6)</span>
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Under Section 6 of the DPDP Act 2023, your consent must be freely given, specific, informed, unconditional, and unambiguous. You have given consent by affirmative action during registration.
            </p>
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1 text-emerald-400 font-medium">
              <p className="font-bold">Withdrawal of Consent (Section 6(4)):</p>
              <p className="text-muted-foreground">
                You possess the legal right to withdraw your consent at any time through your Profile Settings or by submitting a written request to our Grievance Officer. Upon withdrawal, your personal data will be deleted or anonymized, and event accreditation may be revoked.
              </p>
            </div>
          </section>

          {/* Section 5: Data Principal Rights */}
          <section className="space-y-4">
            <h2 className="text-lg font-black text-foreground flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold font-mono">
                05
              </span>
              <span>Your Rights as a Data Principal (Sections 11–14)</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border">
                <h4 className="font-black text-foreground text-sm flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Right to Access & Summary (Section 11)</span>
                </h4>
                <p className="text-muted-foreground mt-1">
                  You can obtain a digital summary of all personal data held about you at any time. An instant self-service <strong>"Download My Personal Data (DPDP Export)"</strong> tool is available in your Profile view.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border">
                <h4 className="font-black text-foreground text-sm flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-pink-400" />
                  <span>Right to Correction & Erasure (Section 12)</span>
                </h4>
                <p className="text-muted-foreground mt-1">
                  You may correct inaccurate information via <em>Edit Profile</em> or trigger <strong>"Delete My Account & Personal Data"</strong> to permanently erase your records from Supabase and platform storage.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border">
                <h4 className="font-black text-foreground text-sm flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <span>Right of Grievance Redressal (Section 13)</span>
                </h4>
                <p className="text-muted-foreground mt-1">
                  You have the right to readily available grievance redressal. You can submit grievances regarding your data rights to our Grievance Officer, with guaranteed statutory acknowledgment within 48 hours and resolution within 7 working days.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border">
                <h4 className="font-black text-foreground text-sm flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Right to Nominate (Section 14)</span>
                </h4>
                <p className="text-muted-foreground mt-1">
                  You may nominate an individual who shall, in the event of your death or incapacity, exercise your data rights in accordance with the Act.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Minor Protection */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-mono">
                06
              </span>
              <span>Protection of Children & Minors (Section 9)</span>
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              VIBE 2026 is designed for college delegates and young adults. In compliance with Section 9 of the DPDP Act 2023, individuals must be 18 years of age or older, or have explicit verifiable consent from their parent or legal guardian to register and create a profile.
            </p>
          </section>

          {/* Section 7: Security Safeguards */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-bold font-mono">
                07
              </span>
              <span>Data Security Safeguards (Section 8(5))</span>
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We employ strict technical and organizational safeguards including end-to-end HTTPS/TLS encryption in transit, PostgreSQL Row Level Security (RLS) policies, isolated session tokens, and regular vulnerability audits to prevent unauthorized access or breach.
            </p>
          </section>

          {/* Section 8: Grievance Officer Details */}
          <section className="space-y-3 pt-4 border-t border-border">
            <h2 className="text-lg font-black text-foreground flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center text-xs font-bold font-mono">
                08
              </span>
              <span>Grievance Redressal Officer Contact Details</span>
            </h2>
            <div className="p-5 rounded-2xl bg-secondary/50 border border-purple-500/30 text-xs space-y-2">
              <p className="font-black text-foreground">Grievance Redressal Officer: Rotaract District 3192</p>
              <p className="text-muted-foreground">Office Address: Rotaract District Secretariat, Bengaluru, Karnataka, India</p>
              <p className="text-muted-foreground">Official Email: <strong className="text-cyan-400">grievance@vibe2026.rotaract.org</strong></p>
              <p className="text-muted-foreground">Response Timelines: Acknowledgment within <strong>48 hours</strong>; Final Resolution within <strong>7 working days</strong>.</p>
              <p className="text-muted-foreground pt-1">
                If unresolved, you have the right to approach the <em>Data Protection Board of India</em> as provided under the DPDP Act, 2023.
              </p>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border text-xs">
          <Link
            href="/app/profile"
            className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black transition-all shadow-md"
          >
            Manage Privacy & Exercise Rights in Profile
          </Link>
          <span className="text-muted-foreground font-mono">Rotaract District 3192 • VIBE 2026</span>
        </div>
      </div>
    </div>
  );
}
