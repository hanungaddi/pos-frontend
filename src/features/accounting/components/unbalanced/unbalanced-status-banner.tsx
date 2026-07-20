"use client";

import { IconAlertTriangle, IconShieldCheck } from "@tabler/icons-react";

interface UnbalancedStatusBannerProps {
    isLoading: boolean;
    totalUnbalanced: number;
}

export function UnbalancedStatusBanner({ isLoading, totalUnbalanced }: UnbalancedStatusBannerProps) {
    if (isLoading) return null;

    if (totalUnbalanced > 0) {
        return (
            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-900/40 flex items-start gap-3.5 text-amber-900 dark:text-amber-200 shadow-sm transition-all">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                    <IconAlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1 text-xs">
                    <h4 className="font-extrabold text-sm text-amber-950 dark:text-amber-100">
                        Ditemukan {totalUnbalanced} Entri Tidak Seimbang
                    </h4>
                    <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                        Entri di bawah ini memiliki ketidakseimbangan nilai Debit & Kredit di General Ledger. Klik tombol <strong>&quot;Seimbangkan&quot;</strong> untuk menentukan COA kontra penyeimbang.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/20 dark:border-emerald-900/40 flex items-start gap-3.5 text-emerald-900 dark:text-emerald-200 shadow-sm transition-all">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                <IconShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
                <h4 className="font-extrabold text-sm text-emerald-950 dark:text-emerald-100">
                    Semua Entri Jurnal Seimbang
                </h4>
                <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
                    Tidak ditemukan transaksi General Ledger yang tidak seimbang pada rentang ini. Posisi Neraca berjalan dalam kondisi seimbang (Balanced).
                </p>
            </div>
        </div>
    );
}
