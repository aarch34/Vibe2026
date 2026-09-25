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
  Trophy,
  MessageSquare
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

  // If on login page, render children directly without admin layout chrome
  if (pathname.includes("/admin/login")) {
    return <>{children}</>;
  }

  const admin = await getAdminSession();
  if (!admin) {
    redirect("/admin/login");
  }

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Attendees & Moderation", href: "/admin/attendees", icon: Users },
    { label: "Global Leaderboard", href: "/admin/leaderboard", icon: Trophy },
    { label: "Social Feed", href: "/admin/social", icon: MessageSquare },
    { label: "XP & Audit Logs", href: "/admin/audit-logs", icon: FileText },
  ];


  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Mobile Admin Header */}
      <header className="md:hidden border-b-2 border-border bg-card p-4 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-black text-foreground uppercase tracking-wider">
              ROCCO ADMIN
            </span>
            <span className="text-[10px] text-muted-foreground font-mono font-bold block">
              {admin ? `Admin: ${admin.username.toUpperCase()}` : "Rotaract District 3192"}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {admin ? (
              <form action={logoutAdminAction}>
                <button
                  type="submit"
                  className="neo-btn-card text-xs font-bold px-2 py-1 border-2 border-border shadow-[1px_1px_0px_var(--border)] flex items-center space-x-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Logout</span>
                </button>
              </form>
            ) : (
              <Link
                href="/admin/login"
                className="neo-btn-primary text-xs font-bold px-2.5 py-1"
              >
                <span>Login</span>
              </Link>
            )}
            <Link
              href="/app"
              className="neo-btn-secondary text-xs font-bold px-2.5 py-1 flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>App</span>
            </Link>
          </div>
        </div>

        {/* Scrollable Horizontal Tabs for Mobile */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="neo-btn-card flex items-center space-x-1.5 px-3 py-1.5 text-foreground shrink-0 font-bold border-2 border-border shadow-[2px_2px_0px_var(--border)]"
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r-2 border-border bg-card flex-col shrink-0 min-h-screen">
        <div className="p-5 border-b-2 border-border space-y-2">
          <div>
            <span className="text-xl font-black text-foreground uppercase tracking-wider">
              ROCCO ADMIN
            </span>
            <p className="text-[11px] text-muted-foreground font-mono font-bold">
              Rotaract District 3192
            </p>
          </div>

          {admin ? (
            <div className="p-2.5 bg-muted border-2 border-border flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-6 h-6 bg-secondary text-secondary-foreground border border-border flex items-center justify-center text-xs font-black shrink-0">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-muted-foreground block font-mono font-bold">Logged in as</span>
                  <span className="text-xs font-black text-foreground uppercase truncate block">
                    {admin.username}
                  </span>
                </div>
              </div>
              <form action={logoutAdminAction}>
                <button
                  type="submit"
                  title="Log out of admin console"
                  className="neo-btn-card p-1 border border-border"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/admin/login"
              className="neo-btn-primary block p-2 text-center text-xs font-black uppercase tracking-wider"
            >
              Sign In (Admin Console)
            </Link>
          )}
        </div>

        <nav className="p-3 space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 px-3 py-2 text-xs font-bold text-foreground hover:bg-muted border-2 border-transparent hover:border-border transition-all"
              >
                <Icon className="w-4 h-4 text-primary" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t-2 border-border">
          <Link
            href="/app"
            className="neo-btn-card w-full py-2.5 px-3 flex items-center justify-center space-x-2 text-xs font-black uppercase tracking-wider"
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
