"use client";

import { Button } from "@/components/ui/button";
import { IconAlertTriangle } from "@tabler/icons-react";

interface BalanceSheetDraftBannerProps {
    onDiscard: () => void;
    onEdit: () => void;
}

export function BalanceSheetDraftBanner({ onDiscard, onEdit }: BalanceSheetDraftBannerProps) {
    return (
        <div className="bg-amber-50 border border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-900/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                    <IconAlertTriangle className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                    <p className="font-bold">Mode Pratinjau Draf</p>
                    <p className="text-amber-700/80 dark:text-amber-400/80">
                        Laporan neraca di bawah menampilkan draf penyesuaian yang belum diposting ke jurnal umum.
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onDiscard}
                    className="h-8 px-3.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl cursor-pointer"
                >
                    Buang Draf
                </Button>
                <Button
                    type="button"
                    onClick={onEdit}
                    className="h-8 px-3.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm shadow-amber-600/10 cursor-pointer"
                >
                    Edit Draf
                </Button>
            </div>
        </div>
    );
}
