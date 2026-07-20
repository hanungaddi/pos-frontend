"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ROUTES } from "@/constants/routes";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import { cn } from "@/lib/utils";
import { IconArrowRight, IconInfoCircle, IconScale } from "@tabler/icons-react";

interface BalanceSheetStatusCardProps {
    isBalanced: boolean;
    totalAssets: number;
    totalLiabilitiesAndEquity: number;
    difference: number;
    leftLabel?: string;
    rightLabel?: string;
    leftLegend?: string;
    rightLegend?: string;
    hideUnbalancedButton?: boolean;
}

export function BalanceSheetStatusCard({
    isBalanced,
    totalAssets,
    totalLiabilitiesAndEquity,
    difference,
    leftLabel,
    rightLabel,
    leftLegend,
    rightLegend,
    hideUnbalancedButton = false,
}: BalanceSheetStatusCardProps) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
                {/* Status Message */}
                <div className="flex items-start gap-4">
                    <div className={cn(
                        "p-3.5 rounded-2xl shrink-0 shadow-sm transition-colors",
                        isBalanced
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-450 ring-4 ring-emerald-50/50 dark:ring-emerald-950/20"
                            : "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-450 ring-4 ring-rose-50/50 dark:ring-rose-950/20"
                    )}>
                        <IconScale className="w-7 h-7 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                                Status Keseimbangan Neraca
                            </h3>
                            <span className={cn(
                                "text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider shadow-sm border",
                                isBalanced
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/40"
                                    : "bg-rose-100 text-rose-800 border-rose-200/60 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900/40"
                            )}>
                                {isBalanced ? "Seimbang (Balanced)" : "Tidak Seimbang"}
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-450 text-xs mt-2 max-w-xl leading-relaxed">
                            {isBalanced
                                ? "Sempurna! Persamaan neraca keuangan Anda tepat seimbang. Ini menunjukkan pencatatan jurnal pembukuan Anda sudah sinkron dan akurat."
                                : "Perhatian! Jumlah saldo tidak seimbang. Silakan periksa kembali nominal input atau entri jurnal penyesuaian Anda."}
                            {!isBalanced && difference > 0 && (
                                <span className="block font-extrabold text-rose-600 dark:text-rose-400 mt-1.5 font-mono text-[13px]">
                                    Selisih (Discrepancy): {formatRupiah(difference)}
                                </span>
                            )}
                        </p>
                        {!isBalanced && !hideUnbalancedButton && (
                            <div className="mt-3">
                                <Link href={ROUTES.ADMIN_ACCOUNTING_UNBALANCED}>
                                    <Button
                                        size="sm"
                                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl h-8 px-3 shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <IconScale size={15} />
                                        <span>Perbaiki di Entri Tidak Seimbang</span>
                                        <IconArrowRight size={14} />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Balance Bar & Metrics */}
                <div className="w-full lg:w-[420px] shrink-0 space-y-3.5">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                {leftLabel || "Total Aset (A)"}
                            </span>
                            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-450 font-mono">
                                {formatRupiah(totalAssets)}
                            </span>
                        </div>
                        <div className="text-right space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                {rightLabel || "Kewajiban + Ekuitas (K + E)"}
                            </span>
                            <span className={cn(
                                "text-base font-extrabold font-mono",
                                isBalanced ? "text-indigo-600 dark:text-indigo-400" : "text-rose-650 dark:text-rose-450"
                            )}>
                                {formatRupiah(totalLiabilitiesAndEquity)}
                            </span>
                        </div>
                    </div>

                    {/* Comparison Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 relative overflow-hidden">
                        {isBalanced ? (
                            <div className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full w-full opacity-90" />
                        ) : (
                            <div className="flex h-full rounded-full overflow-hidden w-full">
                                <div
                                    className="bg-emerald-500 h-full transition-all duration-500"
                                    style={{ width: `${(totalAssets / (totalAssets + totalLiabilitiesAndEquity || 1)) * 100}%` }}
                                />
                                <div
                                    className="bg-rose-500 h-full transition-all duration-500"
                                    style={{ width: `${(totalLiabilitiesAndEquity / (totalAssets + totalLiabilitiesAndEquity || 1)) * 100}%` }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full block" />
                            {leftLegend || "Aset"}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className={cn("w-2 h-2 rounded-full block", isBalanced ? "bg-indigo-500" : "bg-rose-500")} />
                            {rightLegend || "Kewajiban & Ekuitas"}
                        </span>
                    </div>

                    {/* Debit/Credit convention — tooltip */}
                    <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">Konvensi Debit & Kredit?</span>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    className="text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350 transition-colors"
                                    aria-label="Konvensi akuntansi"
                                >
                                    <IconInfoCircle className="w-3.5 h-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent
                                side="top"
                                className="text-[11px] leading-relaxed max-w-[270px] bg-slate-950 text-white rounded-xl p-3 shadow-xl border border-slate-800 space-y-1.5"
                            >
                                <p className="font-bold border-b border-slate-800 pb-1 text-slate-300">Prinsip Akuntansi Neraca:</p>
                                <p>
                                    <span className="text-emerald-400 font-semibold">Aset & Beban</span> normalnya bersaldo{" "}
                                    <span className="text-emerald-400 font-semibold">Debit</span>.
                                </p>
                                <p>
                                    <span className="text-indigo-400 font-semibold">Liabilitas, Ekuitas & Pendapatan</span> bersaldo{" "}
                                    <span className="text-indigo-400 font-semibold">Kredit</span>.
                                </p>
                                <p className="text-slate-400 pt-0.5">
                                    Neraca Standar:{" "}
                                    <span className="text-slate-200 font-semibold block">
                                        Aset = Liabilitas + Ekuitas
                                    </span>
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </div>
    );
}
