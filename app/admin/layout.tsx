import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  MapPin,
  Sparkles,
  QrCode,
  Users,
  Gift,
  FileText,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Zones", href: "/admin/zones", icon: MapPin },
    { label: "Experiences", href: "/admin/experiences", icon: Sparkles },
    { label: "QR Codes", href: "/admin/qr", icon: QrCode },
    { label: "Attendees", href: "/admin/attendees", icon: Users },
    { label: "Rewards", href: "/admin/rewards", icon: Gift },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-[#0B1120] flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              VIBE ADMIN
            </span>
            <p className="text-[11px] text-slate-400 font-mono">
              Rotaract District 3192
            </p>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <Icon className="w-4 h-4 text-blue-400" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link
            href="/app"
            className="flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Switch to Attendee App</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 max-w-6xl">
        {children}
      </main>
    </div>
  );
}
