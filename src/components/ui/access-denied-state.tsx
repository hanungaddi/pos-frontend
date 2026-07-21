"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  IconShieldLock,
  IconArrowLeft,
  IconHome,
  IconKey,
  IconCopy,
  IconCheck,
  IconInfoCircle,
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
  IconSparkles,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface AccessDeniedStateProps {
  title?: string;
  description?: string;
  requiredPermission?: string;
  suggestion?: string;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  showRefreshButton?: boolean;
  actionButton?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function AccessDeniedState({
  title = "Akses Ditolak",
  description = "Anda tidak memiliki izin yang cukup untuk mengakses atau mengelola data pada halaman ini. Hubungi Administrator jika Anda memerlukan akses.",
  requiredPermission,
  suggestion,
  showHomeButton = true,
  showBackButton = true,
  showRefreshButton = false,
  actionButton,
  className,
  compact = false,
}: AccessDeniedStateProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const handleCopyPermission = () => {
    if (!requiredPermission) return;
    navigator.clipboard.writeText(requiredPermission);
    setCopied(true);
    toast.success("Kode izin berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact) {
    return (
      <div
        className={cn(
          "relative overflow-hidden p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-50/80 via-white to-slate-50/50 dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-900 border border-rose-100 dark:border-rose-900/40 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md",
          className
        )}
      >
        {/* Subtle accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-rose-500 to-rose-600 rounded-l-2xl" />

        <div className="flex items-start sm:items-center gap-3.5 pl-1">
          <div className="relative group shrink-0">
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-200/60 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <IconShieldLock size={22} strokeWidth={2} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center ring-2 ring-white dark:ring-slate-900 text-[10px]">
              <IconKey size={10} />
            </div>
          </div>

          <div className="space-y-0.5 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{title}</h4>
              {requiredPermission && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={handleCopyPermission}
                        className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-rose-100/70 dark:bg-rose-950/60 hover:bg-rose-200/70 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-md border border-rose-200/80 dark:border-rose-800/80 transition-colors cursor-pointer"
                      >
                        <IconKey size={10} />
                        <span>{requiredPermission}</span>
                        {copied ? <IconCheck size={10} className="text-emerald-600" /> : <IconCopy size={10} className="opacity-60" />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Klik untuk menyalin kode izin</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">{description}</p>
            {suggestion && (
              <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1">
                <IconSparkles size={12} className="shrink-0" />
                <span>{suggestion}</span>
              </p>
            )}
          </div>
        </div>

        {actionButton && <div className="shrink-0 pt-2 sm:pt-0">{actionButton}</div>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden p-8 md:p-12 flex flex-col items-center justify-center text-center min-h-[420px] bg-gradient-to-b from-rose-50/50 via-white to-slate-50/60 dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none mx-auto max-w-2xl my-6 space-y-6 transition-all duration-300",
        className
      )}
    >
      {/* Background Decorative Radial Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Icon with Glowing Pulse effect */}
      {requiredPermission ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative group cursor-pointer" onClick={handleCopyPermission}>
                {/* Soft Outer Halo */}
                <div className="absolute -inset-2 rounded-full bg-rose-500/20 dark:bg-rose-500/30 blur-md animate-pulse group-hover:bg-rose-500/30 transition-all duration-300" />

                {/* Main Icon Container */}
                <div className="relative w-20 h-20 bg-gradient-to-tr from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-700 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-rose-500/25 group-hover:scale-105 group-hover:rotate-1 transition-all duration-300">
                  <IconShieldLock size={42} strokeWidth={1.75} className="drop-shadow" />
                </div>

                {/* Small Lock Badge */}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 text-rose-400 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-md">
                  <IconKey size={14} />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Klik untuk menyalin kode izin</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <div className="relative group">
          <div className="absolute -inset-2 rounded-full bg-rose-500/20 dark:bg-rose-500/30 blur-md animate-pulse" />
          <div className="relative w-20 h-20 bg-gradient-to-tr from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-700 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-rose-500/25">
            <IconShieldLock size={42} strokeWidth={1.75} className="drop-shadow" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 text-rose-400 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-md">
            <IconKey size={14} />
          </div>
        </div>
      )}

      {/* Title & Main Description */}
      <div className="space-y-3 max-w-lg relative z-10">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
          {title}
        </h3>
        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
          {description}
        </p>

        {/* Suggestion Callout if provided */}
        {suggestion && (
          <div className="mt-2 p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 rounded-xl text-left flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <IconSparkles size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="font-medium">{suggestion}</div>
          </div>
        )}

        {/* Required Permission Interactive Pill */}
        {requiredPermission && (
          <div className="pt-2 flex flex-col items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Kode Hak Akses
            </span>
            <button
              type="button"
              onClick={handleCopyPermission}
              className="group inline-flex items-center gap-2 text-xs font-mono font-bold bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <IconKey size={14} className="text-rose-500" />
              <span>{requiredPermission}</span>
              {copied ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-sans font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                  <IconCheck size={12} /> Tersalin
                </span>
              ) : (
                <IconCopy size={13} className="opacity-50 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Solution & Help Guide Collapsible */}
      <div className="w-full max-w-md pt-1">
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <IconInfoCircle size={15} className="text-rose-500" />
          <span>Cara Menyelesaikan Kendala Akses</span>
          {showGuide ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        </button>

        {showGuide && (
          <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl text-left text-xs space-y-2.5 text-slate-600 dark:text-slate-300 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>Langkah Rekomendasi:</span>
            </div>
            <ul className="space-y-1.5 pl-4 list-disc text-[11px] leading-relaxed">
              <li>
                <strong>Periksa Toko Aktif:</strong> Pastikan Anda saat ini masuk pada outlet / lokasi toko yang sesuai di menu pengalih toko (store switcher).
              </li>
              <li>
                <strong>Hubungi Supervisor / Admin:</strong> Berikan kode izin{" "}
                <code className="bg-slate-200/70 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-[10px]">
                  {requiredPermission || "akses halaman"}
                </code>{" "}
                agar role akun Anda diberikan otorisasi.
              </li>
              <li>
                <strong>Refresh Sesi:</strong> Setelah izin ditambahkan, tekan tombol muat ulang halaman untuk memperbarui data hak akses Anda.
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {(showBackButton || showHomeButton || showRefreshButton || actionButton) && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {showBackButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="h-9 px-4 text-xs font-bold rounded-xl gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <IconArrowLeft size={16} />
              Kembali
            </Button>
          )}

          {showRefreshButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="h-9 px-4 text-xs font-bold rounded-xl gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <IconRefresh size={16} />
              Muat Ulang
            </Button>
          )}

          {actionButton}

          {showHomeButton && (
            <Button
              size="sm"
              onClick={() => router.push(ROUTES.ADMIN)}
              className="h-9 px-4 text-xs font-bold rounded-xl gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <IconHome size={16} />
              Ke Dashboard
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

