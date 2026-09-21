"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Users,
  MapPin,
  Sparkles,
  Gift,
  QrCode,
  ShieldCheck,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { adminPurgeTestDataAction } from "@/actions/admin/manage";

export function AdminMaintenanceCard() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmKeyword, setConfirmKeyword] = useState("");
  const [isPurging, setIsPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handlePurge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmKeyword.trim().toUpperCase() !== "PURGE") {
      setPurgeResult({
        type: "error",
        text: 'Please type "PURGE" in the box to confirm.',
      });
      return;
    }

    setIsPurging(true);
    setPurgeResult(null);

    try {
      const res = await adminPurgeTestDataAction();
      if (res.success) {
        setPurgeResult({
          type: "success",
          text: `Purge completed. Successfully cleared ${res.purgedCount ?? 0} test/dummy records. Real attendee and admin accounts preserved.`,
        });
        setTimeout(() => {
          setIsModalOpen(false);
          setConfirmKeyword("");
          setPurgeResult(null);
          router.refresh();
        }, 2000);
      } else {
        setPurgeResult({
          type: "error",
          text: res.message || "Failed to execute database purge.",
        });
      }
    } catch (err: any) {
      setPurgeResult({
        type: "error",
        text: err.message || "An unexpected error occurred during purge.",
      });
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* MAINTENANCE BAR */}
      <div className="p-6 bg-card text-card-foreground border-2 border-border shadow-neo flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-black bg-primary text-primary-foreground border border-border uppercase">
              Operations Control
            </span>
            <h2 className="text-base font-black text-foreground uppercase tracking-tight">
              Platform Data Hygiene & Rapid Tools
            </h2>
          </div>
          <p className="text-xs text-muted-foreground font-medium max-w-2xl">
            Quickly cleanse test submissions and jump to operational modules for District 3192.
            Admin credentials and authentic attendee registrations are permanently protected.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsModalOpen(true);
              setConfirmKeyword("");
              setPurgeResult(null);
            }}
            className="py-2 px-3 text-xs font-mono font-black uppercase tracking-wider bg-destructive text-destructive-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] active:translate-x-0.5 active:translate-y-0.5 hover:opacity-90 transition-all flex items-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Test & Demo Data</span>
          </button>
        </div>
      </div>

      {/* QUICK COMMAND TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
        <Link
          href="/admin/attendees"
          className="p-3 bg-card hover:bg-muted text-card-foreground border-2 border-border shadow-neo transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-foreground">
              01
            </span>
          </div>
          <div>
            <div className="text-xs font-black uppercase text-foreground">Attendees</div>
            <div className="text-[10px] text-muted-foreground font-bold">Roster & Wallets</div>
          </div>
        </Link>

        <Link
          href="/admin/zones"
          className="p-3 bg-card hover:bg-muted text-card-foreground border-2 border-border shadow-neo transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <MapPin className="w-4 h-4 text-secondary" />
            <span className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-foreground">
              02
            </span>
          </div>
          <div>
            <div className="text-xs font-black uppercase text-foreground">Zones</div>
            <div className="text-[10px] text-muted-foreground font-bold">6 Zones & Bonuses</div>
          </div>
        </Link>

        <Link
          href="/admin/experiences"
          className="p-3 bg-card hover:bg-muted text-card-foreground border-2 border-border shadow-neo transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-foreground">
              03
            </span>
          </div>
          <div>
            <div className="text-xs font-black uppercase text-foreground">Missions</div>
            <div className="text-[10px] text-muted-foreground font-bold">Quests & Costs</div>
          </div>
        </Link>

        <Link
          href="/admin/rewards"
          className="p-3 bg-card hover:bg-muted text-card-foreground border-2 border-border shadow-neo transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <Gift className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-foreground">
              04
            </span>
          </div>
          <div>
            <div className="text-xs font-black uppercase text-foreground">Rewards</div>
            <div className="text-[10px] text-muted-foreground font-bold">Inventory & Swag</div>
          </div>
        </Link>

        <Link
          href="/admin/qr"
          className="p-3 bg-card hover:bg-muted text-card-foreground border-2 border-border shadow-neo transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <QrCode className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-foreground">
              05
            </span>
          </div>
          <div>
            <div className="text-xs font-black uppercase text-foreground">QR Desk</div>
            <div className="text-[10px] text-muted-foreground font-bold">Physical Badges</div>
          </div>
        </Link>

        <Link
          href="/admin/audit-logs"
          className="p-3 bg-card hover:bg-muted text-card-foreground border-2 border-border shadow-neo transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-foreground">
              06
            </span>
          </div>
          <div>
            <div className="text-xs font-black uppercase text-foreground">Audit Log</div>
            <div className="text-[10px] text-muted-foreground font-bold">Security Trail</div>
          </div>
        </Link>
      </div>

      {/* PURGE CONFIRMATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border-4 border-border shadow-neo w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-150 font-mono">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-4">
              <div className="w-9 h-9 bg-destructive text-destructive-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground uppercase tracking-tight">
                  Purge Test & Demo Data
                </h3>
                <p className="text-xs font-bold text-muted-foreground">
                  Event-Wide Data Hygiene Procedure
                </p>
              </div>
            </div>

            {purgeResult && (
              <div
                className={`p-3 border-2 border-border mb-4 text-xs font-bold flex items-center space-x-2 ${
                  purgeResult.type === "success"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-destructive text-destructive-foreground"
                }`}
              >
                {purgeResult.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{purgeResult.text}</span>
              </div>
            )}

            <div className="p-3 bg-muted border-2 border-border mb-4 text-xs space-y-2">
              <div className="flex items-center space-x-1.5 text-emerald-500 font-black">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Protected Real Accounts:</span>
              </div>
              <ul className="list-disc list-inside text-foreground font-bold pl-1 space-y-0.5">
                <li>Thejaswin P (Admin: thejaswinps@gmail.com)</li>
                <li>Aarcha (Registered Attendee)</li>
              </ul>
              <p className="text-muted-foreground text-[11px] pt-1">
                All simulated browser test profiles, dummy transactions, and mock completions will be permanently wiped.
              </p>
            </div>

            <form onSubmit={handlePurge} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
                  Type &quot;PURGE&quot; to Confirm Action
                </label>
                <input
                  type="text"
                  required
                  value={confirmKeyword}
                  onChange={(e) => setConfirmKeyword(e.target.value)}
                  placeholder="PURGE"
                  className="w-full bg-background border-2 border-border p-2 text-sm font-black uppercase text-destructive focus:outline-none focus:ring-2 focus:ring-destructive"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPurging}
                  className="py-2 px-4 text-xs font-bold border-2 border-border bg-card text-foreground hover:bg-muted"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPurging || confirmKeyword.trim().toUpperCase() !== "PURGE"}
                  className="py-2 px-4 text-xs font-black uppercase tracking-wider bg-destructive text-destructive-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
                >
                  {isPurging && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Execute Purge</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
