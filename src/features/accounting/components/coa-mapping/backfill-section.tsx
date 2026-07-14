"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    useLedgerBackfill,
    useLedgerBackfillStatus,
} from "@/features/accounting/api/ledger-api";
import { queryKeys } from "@/lib/query-keys";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    RefreshCw,
    Check,
    AlertCircle,
    Loader2,
    Database,
    Info,
} from "lucide-react";
import { toast } from "sonner";

export function BackfillSection({ borderless = false }: { borderless?: boolean }) {
    const queryClient = useQueryClient();
    const backfillMutation = useLedgerBackfill();
    const backfillStatus = useLedgerBackfillStatus(true);

    const bfState = backfillStatus.data?.status ?? "idle";
    const isBackfilling = bfState === "queued" || bfState === "running";

    // Handle toast alerts on backfill completion/failure transitions
    const prevBfState = useRef<string | undefined>(undefined);
    useEffect(() => {
        if (prevBfState.current && prevBfState.current !== bfState) {
            if (bfState === "completed") {
                toast.success("General ledger berhasil di-backfill ulang.");
                queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
            } else if (bfState === "failed") {
                toast.error(
                    backfillStatus.data?.message || "Backfill general ledger gagal."
                );
            }
        }
        prevBfState.current = bfState;
    }, [bfState, backfillStatus.data?.message, queryClient]);

    const handleBackfill = () => {
        backfillMutation.mutate(undefined, {
            onSuccess: () => {
                toast.info("Proses backfill general ledger telah dimulai.");
                queryClient.invalidateQueries({
                    queryKey: [...queryKeys.reports.all, "ledger-backfill-status"],
                });
            },
            onError: (e) => {
                toast.error(e.message || "Gagal memulai backfill general ledger.");
            },
        });
    };

    const getStatusConfig = () => {
        switch (bfState) {
            case "queued":
                return {
                    label: "Menunggu Antrean",
                    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
                    icon: <Loader2 className="h-5 w-5 animate-spin" />,
                    description: "Permintaan backfill sedang masuk dalam antrean server.",
                };
            case "running":
                return {
                    label: "Sedang Berjalan",
                    color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
                    icon: <Loader2 className="h-5 w-5 animate-spin" />,
                    description: "Sistem sedang memproses ulang postingan transaksi ke jurnal umum.",
                };
            case "completed":
                return {
                    label: "Selesai",
                    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
                    icon: <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
                    description: "Seluruh data historis transaksi telah berhasil di-backfill ke General Ledger.",
                };
            case "failed":
                return {
                    label: "Gagal",
                    color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
                    icon: <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
                    description: "Terjadi kesalahan saat memproses backfill general ledger.",
                };
            default:
                return {
                    label: "Siap",
                    color: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-800",
                    icon: <Database className="h-5 w-5 text-slate-500" />,
                    description: "Tidak ada proses berjalan. Sistem siap melakukan sinkronisasi.",
                };
        }
    };

    const statusConfig = getStatusConfig();
    const data = backfillStatus.data;

    const InfoWrapper = borderless ? "div" : Card;
    const infoProps: ComponentProps<"div"> = borderless
        ? { className: "space-y-4" }
        : { className: "p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900 rounded-2xl" };

    const MonitorWrapper = borderless ? "div" : Card;
    const monitorProps: ComponentProps<"div"> = borderless
        ? { className: "space-y-4" }
        : { className: "p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900 rounded-2xl" };

    if (borderless) {
        return (
            <div className="space-y-4 text-left">
                {/* Compact Info Row */}
                <div className="flex gap-2.5 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/40 p-2.5 rounded-xl leading-relaxed">
                    <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span>Sinkronisasi memperbarui pembukuan jurnal historis agar sesuai dengan konfigurasi COA yang baru.</span>
                </div>

                {/* Compact Status Indicator */}
                <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 ${statusConfig.color}`}>
                    <div className="shrink-0">{statusConfig.icon}</div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-[9px] uppercase tracking-wider leading-none mb-0.5">{statusConfig.label}</div>
                        <p className="text-[10px] opacity-90 truncate leading-none">{statusConfig.description}</p>
                    </div>
                </div>

                {/* Compact Action Trigger */}
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleBackfill}
                        disabled={backfillMutation.isPending || isBackfilling}
                        className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm border-none shrink-0"
                    >
                        {backfillMutation.isPending || isBackfilling ? (
                            <>
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                {isBackfilling ? "Sinkronisasi..." : "Memulai..."}
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                Mulai Sinkronisasi
                            </>
                        )}
                    </Button>
                </div>

                {/* Compact High-density Metadata Grid */}
                {data && (
                    <div className="rounded-xl border border-slate-100 dark:border-slate-850 overflow-hidden text-[10px] space-y-1 p-2.5 bg-slate-50/20 dark:bg-slate-900/10">
                        {data.queued_at && (
                            <div className="flex justify-between">
                                <span className="text-slate-400">Antrean:</span>
                                <span className="text-slate-700 dark:text-slate-350 font-mono">
                                    {new Date(data.queued_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        )}
                        {data.started_at && (
                            <div className="flex justify-between">
                                <span className="text-slate-400">Mulai:</span>
                                <span className="text-slate-700 dark:text-slate-350 font-mono">
                                    {new Date(data.started_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        )}
                        {data.finished_at && (
                            <div className="flex justify-between">
                                <span className="text-slate-400">Selesai:</span>
                                <span className="text-slate-700 dark:text-slate-350 font-mono">
                                    {new Date(data.finished_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        )}
                        {data.rows !== undefined && data.rows !== null && (
                            <div className="flex justify-between border-t border-slate-100 dark:border-slate-850/60 mt-1.5 pt-1.5">
                                <span className="text-slate-400">Diperbarui:</span>
                                <span className="text-slate-800 dark:text-slate-200 font-bold">
                                    {data.rows} baris
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Info Card */}
            <InfoWrapper {...infoProps}>
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-500/10 shadow-sm">
                            <RefreshCw className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                Sinkronisasi Data Jurnal Historis
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Ketika Anda mengubah pemetaan akun COA, pemetaan tersebut hanya akan berlaku untuk transaksi operasional yang dibuat dari saat ini ke depan. 
                                Untuk memperbarui data jurnal transaksi lama agar sesuai dengan konfigurasi COA yang baru, Anda dapat menjalankan proses **Backfill**.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
                        <div className="flex gap-2.5">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                                    Penting Sebelum Memulai:
                                </span>
                                <ul className="list-disc list-inside text-[11px] text-blue-800 dark:text-blue-400/90 leading-relaxed space-y-1">
                                    <li>Proses ini mungkin membutuhkan beberapa waktu tergantung pada volume transaksi historis Anda.</li>
                                    <li>Laporan keuangan (Neraca, Laba Rugi) akan otomatis diperbarui setelah proses ini selesai.</li>
                                    <li>Disarankan untuk melakukannya saat aktivitas transaksi sedang rendah (di luar jam sibuk).</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Trigger Button & Status Badge */}
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                        <Button
                            onClick={handleBackfill}
                            disabled={backfillMutation.isPending || isBackfilling}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-all rounded-xl"
                        >
                            {backfillMutation.isPending || isBackfilling ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isBackfilling ? "Memproses Backfill..." : "Memulai..."}
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Mulai Backfill Historis
                                </>
                            )}
                        </Button>

                        {isBackfilling && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 animate-pulse font-medium">
                                Sistem sedang bekerja di latar belakang. Anda dapat berpindah halaman jika perlu.
                            </span>
                        )}
                    </div>
                </div>
            </InfoWrapper>

            {/* Status Monitor Card */}
            <MonitorWrapper {...monitorProps}>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">
                    Monitor Status Sinkronisasi
                </h3>

                <div className="space-y-4">
                    {/* Active Status Badge Section */}
                    <div className={`flex items-start gap-3 rounded-xl border p-4 ${statusConfig.color}`}>
                        <div className="mt-0.5 shrink-0">{statusConfig.icon}</div>
                        <div className="space-y-1">
                            <span className="text-xs font-bold uppercase tracking-wider">
                                {statusConfig.label}
                            </span>
                            <p className="text-xs opacity-90 leading-normal">
                                {statusConfig.description}
                            </p>
                        </div>
                    </div>

                    {/* Job Details Grid */}
                    {data && (
                        <div className="rounded-xl border border-slate-100 dark:border-slate-800/60 overflow-hidden text-xs">
                            <div className="grid grid-cols-2 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/10 p-3">
                                <span className="font-medium text-slate-500 dark:text-slate-400">Atribut</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">Keterangan</span>
                            </div>
                            
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {data.queued_at && (
                                    <div className="grid grid-cols-2 p-3">
                                        <span className="text-slate-500 dark:text-slate-400">Waktu Antrean</span>
                                        <span className="text-slate-700 dark:text-slate-300 font-mono">
                                            {new Date(data.queued_at).toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                )}
                                {data.started_at && (
                                    <div className="grid grid-cols-2 p-3">
                                        <span className="text-slate-500 dark:text-slate-400">Waktu Mulai</span>
                                        <span className="text-slate-700 dark:text-slate-300 font-mono">
                                            {new Date(data.started_at).toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                )}
                                {data.finished_at && (
                                    <div className="grid grid-cols-2 p-3">
                                        <span className="text-slate-500 dark:text-slate-400">Waktu Selesai</span>
                                        <span className="text-slate-700 dark:text-slate-300 font-mono">
                                            {new Date(data.finished_at).toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                )}
                                {data.rows !== undefined && data.rows !== null && (
                                    <div className="grid grid-cols-2 p-3">
                                        <span className="text-slate-500 dark:text-slate-400">Jurnal Diperbarui</span>
                                        <span className="text-slate-700 dark:text-slate-200 font-semibold">
                                            {data.rows} baris
                                        </span>
                                    </div>
                                )}
                                {data.message && (
                                    <div className="grid grid-cols-2 p-3">
                                        <span className="text-slate-500 dark:text-slate-400">Catatan</span>
                                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                                            {data.message}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </MonitorWrapper>
        </div>
    );
}
