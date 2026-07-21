"use client";

import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import { cn } from "@/lib/utils";
import {
    IconAlertCircle,
    IconCheck,
    IconCircleCheck,
    IconDeviceFloppy,
    IconLoader2,
    IconX
} from "@tabler/icons-react";

interface BalanceSheetFooterActionsProps {
    isBalanced: boolean;
    difference: number;
    totalDebit: number; // Will display Left Side of Equation
    totalCredit: number; // Will display Right Side of Equation
    onCancel: () => void;
    onSaveDraft: () => void;
    onPost: () => void;
    isPending: boolean;
    hasDescriptionAndDate: boolean;
    viewType?: "standard" | "equation";
    hasChanges?: boolean;
}

export function BalanceSheetFooterActions({
    isBalanced,
    difference,
    totalDebit,
    totalCredit,
    onCancel,
    onSaveDraft,
    onPost,
    isPending,
    hasDescriptionAndDate,
    viewType = "standard",
    hasChanges = true,
}: BalanceSheetFooterActionsProps) {
    return (
        <div className="sticky bottom-6 z-50 w-full mt-8 px-2 sm:px-4">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-5 transition-all duration-300 ring-1 ring-slate-100/50 dark:ring-slate-900/20">

                {/* Left Side: Balance & Totals Status */}
                <div className="flex flex-col xl:flex-row items-center gap-4 w-full md:w-auto">
                    {/* Status Badge */}
                    <div className={cn(
                        "flex items-center gap-2 px-3.5 py-2 rounded-2xl border font-bold uppercase tracking-wider text-[10px] shadow-sm transition-all duration-300 w-full sm:w-auto justify-center shrink-0",
                        isBalanced
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-450 dark:border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-450 dark:border-rose-500/20 animate-pulse"
                    )}>
                        {isBalanced ? (
                            <>
                                <IconCircleCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>Seimbang</span>
                            </>
                        ) : (
                            <>
                                <IconAlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                <span>Selisih: {formatRupiah(difference)}</span>
                            </>
                        )}
                    </div>

                    {/* Totals Section Unified Container */}
                    <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-850/40 p-2.5 rounded-2xl border border-slate-150/60 dark:border-slate-800/40 w-full sm:w-auto justify-center select-none">
                        {/* Aktiva (Left) */}
                        <div className="text-center sm:text-left min-w-[120px] px-1">
                            <span className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider block font-bold">
                                Aktiva
                            </span>
                            <span className="text-xs font-black text-slate-850 dark:text-slate-200 font-mono block mt-0.5">
                                {formatRupiah(totalDebit)}
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium block mt-0.5 whitespace-nowrap">
                                {viewType === "equation" ? "Aset + Beban" : "Total Aset"}
                            </span>
                        </div>

                        {/* Divider (=) */}
                        <div className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-lg bg-white dark:bg-slate-900 border shrink-0 text-xs font-extrabold shadow-sm font-mono transition-all duration-300",
                            isBalanced
                                ? "text-emerald-500 border-emerald-200 dark:border-emerald-900/30"
                                : "text-slate-400 border-slate-200 dark:border-slate-800"
                        )}>
                            =
                        </div>

                        {/* Pasiva (Right) */}
                        <div className="text-center sm:text-left min-w-[120px] px-1">
                            <span className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider block font-bold">
                                Pasiva
                            </span>
                            <span className="text-xs font-black text-slate-850 dark:text-slate-200 font-mono block mt-0.5">
                                {formatRupiah(totalCredit)}
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium block mt-0.5 whitespace-nowrap">
                                {viewType === "equation" ? "Kewajiban + Ekuitas + Pendapatan" : "Kewajiban + Ekuitas"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Action Buttons */}
                <div className="flex flex-row items-center gap-3 w-full md:w-auto justify-center md:justify-end shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isPending}
                        className="h-11 px-5 text-xs font-bold rounded-2xl border-slate-200 hover:border-rose-250 dark:border-slate-800 hover:bg-rose-500/5 dark:hover:bg-rose-950/20 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                        title="Batalkan perubahan"
                    >
                        <IconX className="w-4 h-4 opacity-75" />
                        <span>Batal</span>
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        disabled={isPending || !hasChanges}
                        onClick={onSaveDraft}
                        title={!hasChanges ? "Tidak ada perubahan di neraca" : "Simpan Draf"}
                        className="h-11 px-5 text-xs font-bold rounded-2xl border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/40 hover:bg-indigo-500/5 dark:hover:bg-indigo-950/10 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <IconLoader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <IconDeviceFloppy className="w-4 h-4 opacity-75" />
                        )}
                        <span>Draft</span>
                    </Button>

                    <Button
                        type="button"
                        disabled={!isBalanced || !hasDescriptionAndDate || isPending || !hasChanges}
                        onClick={onPost}
                        title={
                            !hasChanges
                                ? "Tidak ada perubahan di neraca"
                                : !isBalanced
                                ? "Nilai debit dan kredit harus seimbang"
                                : !hasDescriptionAndDate
                                ? "Deskripsi dan tanggal wajib diisi"
                                : "Posting Jurnal"
                        }
                        className="h-11 px-6 text-xs font-extrabold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-400 dark:disabled:from-slate-800 dark:disabled:to-slate-800 dark:disabled:text-slate-600 rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_14px_rgba(99,102,241,0.25)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.35)] disabled:shadow-none active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <>
                                <IconLoader2 className="w-4 h-4 animate-spin" />
                                <span>Posting...</span>
                            </>
                        ) : (
                            <>
                                <IconCheck className="w-4 h-4" />
                                <span>Posting Jurnal</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
