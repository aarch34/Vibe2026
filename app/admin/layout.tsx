import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
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
  LogOut,
  UserCheck,
} from "lucide-react";
import { getAdminSession, logoutAdminAction } from "@/actions/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || headersList.get("next-url") || "";

  // If on login page, render children directly
  const admin = await getAdminSession();

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
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Admin Header */}
      <header className="md:hidden border-b border-slate-800 bg-[#0B1120] p-4 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              ROCCO ADMIN
            </span>
            <span className="text-[10px] text-slate-400 font-mono block">
              {admin ? `Admin: ${admin.username.toUpperCase()}` : "Rotaract District 3192"}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {admin ? (
              <form action={logoutAdminAction}>
                <button
                  type="submit"
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1 bg-rose-950/60 border border-rose-500/30 px-2 py-1 rounded-lg cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Logout</span>
                </button>
              </form>
            ) : (
              <Link
                href="/admin/login"
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 bg-cyan-950/60 border border-cyan-500/30 px-2 py-1 rounded-lg"
              >
                <span>Login</span>
              </Link>
            )}
            <Link
              href="/app"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 bg-blue-950/60 border border-blue-500/30 px-2.5 py-1 rounded-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>App</span>
            </Link>
          </div>
        </div>

        {/* Scrollable Horizontal Tabs for Mobile */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-800 shrink-0 font-medium"
              >
                <Icon className="w-3.5 h-3.5 text-blue-400" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-slate-800 bg-[#0B1120] flex-col shrink-0 min-h-screen">
        <div className="p-5 border-b border-slate-800 space-y-2">
          <div>
            <span className="text-xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              ROCCO ADMIN
            </span>
            <p className="text-[11px] text-slate-400 font-mono">
              Rotaract District 3192
            </p>
          </div>

          {admin ? (
            <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold shrink-0">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block font-mono">Logged in as</span>
                  <span className="text-xs font-bold text-white uppercase truncate block">
                    {admin.username}
                  </span>
                </div>
              </div>
              <form action={logoutAdminAction}>
                <button
                  type="submit"
                  title="Log out of admin console"
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/admin/login"
              className="block p-2 text-center rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-bold hover:bg-cyan-900/40 transition-colors"
            >
              Sign In (jk / gunjan)
            </Link>
          )}
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
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
        {children}
      </main>
    </div>
  );
}
