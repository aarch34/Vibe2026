"use client";

import React, { useState, useEffect, useMemo } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  Download,
  Printer,
  Plus,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Search,
  Filter,
  Sparkles,
  CheckCircle2,
  X,
  FileCode,
  FileImage,
  Layers,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { adminGenerateQRCodeAction } from "@/actions/admin/manage";

interface QRItem {
  code: string;
  experienceTitle: string;
  zoneName: string;
}

interface AdminQRClientProps {
  initialQRs: QRItem[];
  experiences: { id: string; title: string }[];
}

export function AdminQRClient({
  initialQRs,
  experiences,
}: AdminQRClientProps) {
  const [qrs, setQrs] = useState<QRItem[]>(initialQRs);
  const [selectedExpId, setSelectedExpId] = useState(experiences[0]?.id || "");
  const [customCode, setCustomCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [encodeMode, setEncodeMode] = useState<"url" | "token">("url");

  // Poster Modal
  const [activePosterQR, setActivePosterQR] = useState<QRItem | null>(null);

  // Dynamic Origin
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Unique zones
  const zones = useMemo(() => {
    const set = new Set<string>();
    qrs.forEach((q) => {
      if (q.zoneName) set.add(q.zoneName);
    });
    return Array.from(set);
  }, [qrs]);

  // Filtered list
  const filteredQRs = useMemo(() => {
    return qrs.filter((q) => {
      const matchesSearch =
        q.experienceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.zoneName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesZone = zoneFilter === "all" || q.zoneName === zoneFilter;
      return matchesSearch && matchesZone;
    });
  }, [qrs, searchQuery, zoneFilter]);

  async function handleCreateQR(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedExpId) return;
    setIsGenerating(true);
    setMsg(null);

    const res = await adminGenerateQRCodeAction({
      experienceId: selectedExpId,
      customCode: customCode.trim() || undefined,
    });

    if (res.success && res.qr) {
      const exp = experiences.find((x) => x.id === selectedExpId);
      setQrs([
        {
          code: res.qr.code,
          experienceTitle: exp?.title || "New Experience",
          zoneName: "Venue Zone",
        },
        ...qrs,
      ]);
      setCustomCode("");
      setMsg(`QR Checkpoint generated successfully: ${res.qr.code}`);
    } else {
      setMsg(res.message || "Failed to generate QR code");
    }

    setIsGenerating(false);
  }

  return (
    <div className="space-y-6">
      {/* 1. Generator Form & Controls */}
      <div className="no-print space-y-6">
        <form
          onSubmit={handleCreateQR}
          className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md space-y-4 shadow-xl shadow-black/20"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Plus className="w-4 h-4" />
              </div>
              <span>Generate New Zone QR Checkpoint</span>
            </h3>

            <div className="flex items-center space-x-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 px-2 font-medium">Format:</span>
              <button
                type="button"
                onClick={() => setEncodeMode("url")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  encodeMode === "url"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Encodes full scan URL so phone cameras and QR scanners automatically open the app"
              >
                Scan URL (Phone Camera Ready)
              </button>
              <button
                type="button"
                onClick={() => setEncodeMode("token")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  encodeMode === "token"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Encodes raw checkpoint code string"
              >
                Raw Token
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                Select Experience
              </label>
              <select
                value={selectedExpId}
                onChange={(e) => setSelectedExpId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                {experiences.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {exp.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                Custom Code / Token (Optional)
              </label>
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="e.g. vibe-stage-special-2026"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            {msg ? (
              <span className="text-xs font-medium text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                {msg}
              </span>
            ) : (
              <p className="text-[11px] text-slate-400">
                Generated checkpoints are immediately live and scannable by attendees.
              </p>
            )}
            <button
              type="submit"
              disabled={isGenerating}
              className="ml-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isGenerating ? "Generating..." : "Create Checkpoint QR"}</span>
            </button>
          </div>
        </form>

        {/* 2. Search, Filter & Actions Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search checkpoint or zone..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {zones.length > 0 && (
              <div className="flex items-center space-x-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Zones ({zones.length})</option>
                  {zones.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <span className="text-xs text-slate-400 font-mono">
              Showing {filteredQRs.length} of {qrs.length}
            </span>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center space-x-2 transition-colors border border-slate-700/50 shadow-sm"
              title="Prints all checkpoint badges as high-contrast physical signage cards"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Print All Badges</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Checkpoint Cards Grid */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 print:p-0 print:border-none print:bg-white">
        <div className="flex items-center justify-between no-print">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <QrCode className="w-5 h-5 text-blue-400" />
              <span>Active Signboard Checkpoints ({filteredQRs.length})</span>
            </h2>
            <p className="text-xs text-slate-400">
              Unique, high-contrast 2D QR matrices generated dynamically. Point any camera or scanner to verify.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 print:grid-cols-2 print:gap-6">
          {filteredQRs.map((qr) => (
            <QRCodeCheckpointCard
              key={qr.code}
              qr={qr}
              origin={origin}
              encodeMode={encodeMode}
              onPreviewPoster={() => setActivePosterQR(qr)}
            />
          ))}
        </div>

        {filteredQRs.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-xs">
            No checkpoints match your search query.
          </div>
        )}
      </div>

      {/* 4. Full Signboard Poster Modal */}
      {activePosterQR && (
        <SignboardPosterModal
          qr={activePosterQR}
          origin={origin}
          encodeMode={encodeMode}
          onClose={() => setActivePosterQR(null)}
        />
      )}

      {/* 5. Print Styling Sheet */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          header, nav, aside, footer {
            display: none !important;
          }
          .print-badge-item {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            border: 2px solid #000000 !important;
            background: #ffffff !important;
            color: #000000 !important;
            margin-bottom: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}

// -------------------------------------------------------------
// Dedicated Dynamic QR Code Card Component
// -------------------------------------------------------------
function QRCodeCheckpointCard({
  qr,
  origin,
  encodeMode,
  onPreviewPoster,
}: {
  qr: QRItem;
  origin: string;
  encodeMode: "url" | "token";
  onPreviewPoster: () => void;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [svgString, setSvgString] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const payload = useMemo(() => {
    if (encodeMode === "url" && origin) {
      return `${origin}/app/scan?code=${encodeURIComponent(qr.code)}`;
    }
    return qr.code;
  }, [encodeMode, origin, qr.code]);

  useEffect(() => {
    let isMounted = true;

    // Generate crisp 512px QR data URL
    QRCode.toDataURL(payload, {
      width: 512,
      margin: 1,
      color: {
        dark: "#090d16",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch((err) => console.error("QR Code dataURL generation failed:", err));

    // Generate crisp vector SVG
    QRCode.toString(payload, {
      type: "svg",
      margin: 1,
      color: {
        dark: "#090d16",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((svg) => {
        if (isMounted) setSvgString(svg);
      })
      .catch((err) => console.error("QR Code SVG generation failed:", err));

    return () => {
      isMounted = false;
    };
  }, [payload]);

  function handleCopyPayload() {
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadPNG() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `checkpoint-${qr.code}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleDownloadSVG() {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checkpoint-${qr.code}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="print-badge-item relative p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col items-center text-center space-y-3 shadow-lg group">
      {/* Zone & Status Badge */}
      <div className="w-full flex items-center justify-between text-[10px]">
        <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 font-mono text-cyan-400 font-bold uppercase tracking-wider">
          {qr.zoneName}
        </span>
        <span className="inline-flex items-center space-x-1 text-emerald-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Scannable</span>
        </span>
      </div>

      {/* High-Contrast Real Scannable QR Matrix */}
      <div
        onClick={onPreviewPoster}
        className="w-40 h-40 bg-white p-2.5 rounded-2xl flex items-center justify-center shadow-lg border border-slate-200 cursor-pointer group-hover:scale-[1.02] transition-transform relative overflow-hidden"
        title="Click to view large signboard poster"
      >
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={`QR Code for ${qr.experienceTitle}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 animate-pulse rounded-lg flex items-center justify-center">
            <QrCode className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        )}

        {/* Hover overlay hint */}
        <div className="no-print absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2 text-center rounded-2xl">
          <Eye className="w-6 h-6 mb-1 text-cyan-400" />
          <span className="text-[10px] font-bold">Signboard Poster</span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1 w-full">
        <h4 className="text-xs font-black text-white truncate" title={qr.experienceTitle}>
          {qr.experienceTitle}
        </h4>
        <div className="flex items-center justify-center space-x-1">
          <p className="text-[10px] font-mono text-slate-400 truncate max-w-[170px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {qr.code}
          </p>
          <button
            onClick={handleCopyPayload}
            className="no-print p-1 hover:text-white text-slate-400 transition-colors"
            title="Copy payload"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="no-print w-full pt-1 grid grid-cols-3 gap-1.5 border-t border-slate-800/80">
        <button
          onClick={handleDownloadPNG}
          disabled={!dataUrl}
          className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-slate-300 hover:text-white transition-colors border border-slate-800"
          title="Download 512x512 PNG image"
        >
          <FileImage className="w-3 h-3 text-blue-400" />
          <span>PNG</span>
        </button>

        <button
          onClick={handleDownloadSVG}
          disabled={!svgString}
          className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-slate-300 hover:text-white transition-colors border border-slate-800"
          title="Download vector SVG format"
        >
          <FileCode className="w-3 h-3 text-cyan-400" />
          <span>SVG</span>
        </button>

        <button
          onClick={onPreviewPoster}
          className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-[10px] font-semibold text-blue-300 hover:text-blue-200 transition-colors border border-blue-500/30"
          title="Open printable venue poster modal"
        >
          <Eye className="w-3 h-3 text-blue-400" />
          <span>Sign</span>
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Signboard Poster Preview Modal Component
// -------------------------------------------------------------
function SignboardPosterModal({
  qr,
  origin,
  encodeMode,
  onClose,
}: {
  qr: QRItem;
  origin: string;
  encodeMode: "url" | "token";
  onClose: () => void;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const payload = useMemo(() => {
    if (encodeMode === "url" && origin) {
      return `${origin}/app/scan?code=${encodeURIComponent(qr.code)}`;
    }
    return qr.code;
  }, [encodeMode, origin, qr.code]);

  useEffect(() => {
    QRCode.toDataURL(payload, {
      width: 800,
      margin: 1,
      color: {
        dark: "#020617",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    }).then(setDataUrl);
  }, [payload]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-0">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>Venue Signboard Placard Preview</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Printable Placard Design */}
        <div className="p-6 flex flex-col items-center text-center bg-white text-slate-950 space-y-4 m-4 rounded-2xl border-4 border-slate-950 shadow-inner">
          {/* Header branding */}
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-700">
              ROCCO 2026 • OFFICIAL FESTIVAL CHECKPOINT
            </span>
            <div className="inline-block px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-xs font-mono font-black uppercase text-slate-800">
              ZONE: {qr.zoneName}
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-950 tracking-tight leading-tight">
            {qr.experienceTitle}
          </h2>

          {/* Large High-Res QR code */}
          <div className="w-64 h-64 p-3 bg-white border-2 border-slate-900 rounded-2xl shadow-md flex items-center justify-center">
            {dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dataUrl}
                alt={qr.experienceTitle}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 animate-pulse rounded-lg" />
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-1.5 max-w-sm">
            <p className="text-xs font-bold text-slate-800">
              Point your phone camera or the VIBE App Scanner here
            </p>
            <p className="text-[10px] text-slate-500">
              Instant check-in • Earn XP • Unlock digital badges & stage rewards
            </p>
          </div>

          {/* Manual Entry Footer */}
          <div className="w-full pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-[10px] font-mono text-slate-600 px-2">
            <span>MANUAL TOKEN:</span>
            <span className="font-bold text-slate-950 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
              {qr.code}
            </span>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Standard A5 / A4 physical placard size
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                window.print();
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center space-x-1.5 transition-colors shadow-lg shadow-blue-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>Print Signboard</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

