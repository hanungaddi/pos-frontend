"use client";

import { ActivityLog } from "@/features/stock/api/stock-api";
import { formatRelative, formatToReadableDateTime } from "@/lib/date-utils";
import { moduleLabel } from "@/constants/activity-modules";
import {
    Activity,
    Calendar,
    Edit3,
    Eye,
    LogIn,
    LogOut,
    PlusCircle,
    SearchSlash,
    Trash2,
} from "lucide-react";

interface AuditTimelineProps {
    logs: ActivityLog[];
    isLoading: boolean;
    isFetching: boolean;
    page: number;
    setPage: (page: number | ((p: number) => number)) => void;
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    onViewDetail: (log: ActivityLog) => void;
}

export function AuditTimeline({
    logs,
    isLoading,
    isFetching,
    page,
    setPage,
    meta,
    onViewDetail,
}: AuditTimelineProps) {
    const getActionBadgeClass = (action: string) => {
        const act = action.toLowerCase();
        if (act.includes("login") || act.includes("logout")) {
            return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800";
        }
        if (act.includes("delete") || act.includes("remove") || act.includes("cancel")) {
            return "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30";
        }
        if (act.includes("create") || act.includes("store") || act.includes("checkout") || act.includes("sale")) {
            return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
        }
        if (act.includes("update") || act.includes("edit") || act.includes("movement") || act.includes("drawer")) {
            return "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
        }
        if (act.includes("finalize") || act.includes("complete")) {
            return "bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30";
        }
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800";
    };

    const getActionIcon = (action: string) => {
        const act = action.toLowerCase();
        if (act.includes("login")) return <LogIn className="h-4.5 w-4.5 text-slate-500" />;
        if (act.includes("logout")) return <LogOut className="h-4.5 w-4.5 text-slate-500" />;
        if (act.includes("delete") || act.includes("remove") || act.includes("cancel")) {
            return <Trash2 className="h-4.5 w-4.5 text-rose-500" />;
        }
        if (act.includes("create") || act.includes("store") || act.includes("checkout") || act.includes("sale")) {
            return <PlusCircle className="h-4.5 w-4.5 text-emerald-500" />;
        }
        if (act.includes("update") || act.includes("edit") || act.includes("movement") || act.includes("drawer")) {
            return <Edit3 className="h-4.5 w-4.5 text-amber-500" />;
        }
        return <Activity className="h-4.5 w-4.5 text-indigo-500" />;
    };

    if (isLoading || isFetching) {
        return (
            <div className="relative pl-8 space-y-6 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 animate-pulse">
                {[1, 2, 3].map((n) => (
                    <div key={n} className="relative flex flex-col gap-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <div className="absolute left-[-24px] top-4.5 h-4 w-4 rounded-full bg-slate-200 border-2 border-white" />
                        <div className="h-4 bg-slate-200 rounded-md w-1/4" />
                        <div className="h-3 bg-slate-200 rounded-md w-3/4" />
                        <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                    </div>
                ))}
            </div>
        );
    }

    if (!logs || logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <SearchSlash className="h-10 w-10 text-slate-300 stroke-[1.5]" />
                <h4 className="text-slate-800 font-bold text-sm mt-3">Log Kosong</h4>
                <p className="text-slate-400 text-xs mt-1 max-w-[280px]">
                    Tidak ada catatan aktivitas yang sesuai dengan kriteria filter Anda.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative pl-8 space-y-6 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                {logs.map((log) => (
                    <div
                        key={log.uid}
                        onClick={() => onViewDetail(log)}
                        className="group relative bg-white hover:bg-slate-50/30 border border-slate-100 hover:border-slate-200/80 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col gap-2.5 duration-300"
                    >
                        <div className="absolute left-[-28px] top-4 h-6 w-6 rounded-full bg-white border border-slate-150 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                            {getActionIcon(log.action)}
                        </div>

                        <div className="flex flex-wrap justify-between items-center gap-2">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-xs">
                                    {log.user ? log.user.name : "Sistem"}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {formatRelative(log.created_at)}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                                <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider ${getActionBadgeClass(log.action)}`}>
                                    {log.action.replace(/_/g, " ")}
                                </span>
                                {log.module && log.module.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-md border bg-slate-50 text-slate-600 border-slate-150 text-[9px] font-bold uppercase tracking-wider">
                                        {moduleLabel(log.module[0])}
                                    </span>
                                )}
                            </div>
                        </div>

                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                            {log.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 border-t border-slate-50 pt-2.5 mt-0.5 font-medium">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatToReadableDateTime(log.created_at)}
                            </span>
                            {log.ip_address && (
                                <span className="font-mono">IP: {log.ip_address}</span>
                            )}
                            <span className="flex items-center gap-1 ml-auto text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                <Eye className="h-3.5 w-3.5" />
                                Detail Inspeksi
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {meta && meta.last_page > 1 && (
                <div className="flex justify-between items-center border-t border-slate-100 pt-6 mt-4">
                    <span className="text-xs text-slate-400 font-semibold">
                        Halaman {page} dari {meta.last_page} ({meta.total} log)
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                        >
                            Sebelumnya
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                            disabled={page === meta.last_page}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                        >
                            Berikutnya
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
