"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { hasPermission, hasRole } from "@/constants/roles";
import { useActivityLogs, type ActivityLog } from "@/features/stock/api/stock-api";
import { formatToReadableDateTime, formatRelative } from "@/lib/date-utils";
import { moduleLabel } from "@/constants/activity-modules";
import {
    LayoutGrid,
    ListFilter,
    Shield,
} from "lucide-react";
import { AuditFilters } from "./components/audit-filters";
import { AuditTimeline } from "./components/audit-timeline";
import { AuditInspector } from "./components/audit-inspector";

interface AuditFilterValues {
    search: string;
    modules: string[];
}

export function AuditLogs() {
    const { data: session } = useSession();
    const userRoles = session?.user?.roles || [];
    const userPermissions = session?.user?.permissions || [];

    const hasViewAuditLogs =
        hasRole(userRoles, "admin") ||
        hasPermission(userRoles, userPermissions, "view_audit_logs");

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [sortBy, setSortBy] = useState<string | undefined>("created_at");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>("desc");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [viewMode, setViewMode] = useState<"table" | "timeline">("table");
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

    const filterMethods = useForm<AuditFilterValues>({
        defaultValues: {
            search: "",
            modules: [],
        },
    });

    const { watch } = filterMethods;
    // eslint-disable-next-line react-hooks/incompatible-library
    const selectedModules = watch("modules") || [];

    const handleFilterSubmit = (data: AuditFilterValues) => {
        setDebouncedSearch(data.search);
        setPage(1);
    };

    const handleFilterReset = () => {
        filterMethods.reset({ search: "", modules: [] });
        setDebouncedSearch("");
        setPage(1);
    };

    const { data: logsData, isLoading, isFetching } = useActivityLogs({
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
        search: debouncedSearch || undefined,
        module: selectedModules.length ? selectedModules.join(',') : undefined,
    });

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

    const columns = useMemo<ColumnDef<ActivityLog>[]>(
        () => [
            {
                accessorKey: "created_at",
                header: "Tanggal",
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="text-slate-800 font-semibold text-xs">
                            {formatToReadableDateTime(row.original.created_at)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                            {formatRelative(row.original.created_at)}
                        </span>
                    </div>
                ),
                size: 160,
            },
            {
                accessorKey: "user",
                header: "Pengguna / Petugas",
                enableSorting: false,
                cell: ({ row }) => {
                    const user = row.original.user;
                    return (
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs uppercase shadow-xs">
                                {user ? user.name.substring(0, 2) : "S"}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-xs">
                                    {user ? user.name : "Sistem"}
                                </span>
                                {user && (
                                    <span className="text-[10px] text-slate-400 font-mono">
                                        @{user.username}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                },
                size: 160,
            },
            {
                accessorKey: "action",
                header: "Aksi",
                cell: ({ row }) => {
                    const action = row.original.action;
                    return (
                        <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide ${getActionBadgeClass(
                                action,
                            )}`}
                        >
                            {action.replace(/_/g, " ")}
                        </span>
                    );
                },
                size: 120,
            },
            {
                accessorKey: "module",
                header: "Modul",
                cell: ({ row }) => {
                    const modules = row.original.module ?? [];
                    if (!modules.length) return <span className="text-slate-400 text-xs">-</span>;
                    return (
                        <div className="flex flex-wrap gap-1">
                            {modules.map((m) => (
                                <span
                                    key={m}
                                    className="px-2 py-0.5 rounded-md border bg-slate-50 text-slate-700 border-slate-200 text-[10px] font-bold uppercase tracking-wide"
                                >
                                    {moduleLabel(m)}
                                </span>
                            ))}
                        </div>
                    );
                },
                size: 150,
            },
            {
                accessorKey: "description",
                header: "Deskripsi",
                cell: ({ row }) => (
                    <span className="text-slate-700 font-medium text-xs break-words block max-w-sm line-clamp-2" title={row.original.description}>
                        {row.original.description}
                    </span>
                ),
                size: 320,
            },
            {
                accessorKey: "ip_address",
                header: "IP Address",
                cell: ({ row }) => (
                    <span className="text-slate-400 font-mono text-[10px]">
                        {row.original.ip_address || "-"}
                    </span>
                ),
                size: 120,
            },
        ],
        [],
    );

    if (!hasViewAuditLogs) {
        return (
            <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl shadow-sm">
                <p className="text-sm font-bold text-slate-800">Akses Ditolak</p>
                <p className="text-xs text-slate-400 mt-1">Anda tidak memiliki izin untuk melihat log aktivitas.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header section with page description */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
                <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <Shield className="h-5 w-5 text-emerald-600 animate-pulse" />
                        Log Aktivitas & Audit Keamanan
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Catatan lengkap jejak audit pengguna, mutasi kas, stok, transaksi penjualan, dan pembelian secara real-time.
                    </p>
                </div>

                {/* View Mode Toggle Buttons */}
                <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
                    <button
                        onClick={() => setViewMode("table")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewMode === "table"
                                ? "bg-white text-emerald-700 shadow-xs border border-slate-200/20"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                    >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        Tabel
                    </button>
                    <button
                        onClick={() => setViewMode("timeline")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewMode === "timeline"
                                ? "bg-white text-emerald-700 shadow-xs border border-slate-200/20"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                    >
                        <ListFilter className="h-3.5 w-3.5" />
                        Linimasa
                    </button>
                </div>
            </div>

            {/* Filter controls panel */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-6 space-y-4">
                <AuditFilters
                    filterMethods={filterMethods}
                    onSubmit={handleFilterSubmit}
                    onReset={handleFilterReset}
                />

                {/* View rendering selector */}
                {viewMode === "table" ? (
                    <div className="pt-2">
                        <DataTable
                            columns={columns}
                            data={logsData?.data || []}
                            isLoading={isLoading}
                            isFetching={isFetching}
                            emptyMessage="Tidak ada catatan aktivitas ditemukan."
                            page={page}
                            perPage={perPage}
                            onPageChange={setPage}
                            onPerPageChange={setPerPage}
                            meta={logsData?.meta}
                            entityName="log aktivitas"
                            sortBy={sortBy}
                            sortOrder={sortOrder}
                            onSortChange={(by, order) => {
                                setSortBy(by);
                                setSortOrder(order);
                                setPage(1);
                            }}
                            onView={setSelectedLog} // Click on view action triggers details inspector dialog!
                            virtualize={true}
                            estimateRowHeight={54}
                        />
                    </div>
                ) : (
                    // Timeline Feed View
                    <div className="pt-2">
                        <AuditTimeline
                            logs={logsData?.data || []}
                            isLoading={isLoading}
                            isFetching={isFetching}
                            page={page}
                            setPage={setPage}
                            meta={logsData?.meta}
                            onViewDetail={setSelectedLog}
                        />
                    </div>
                )}
            </div>

            {/* Interactive Log Detail Inspector Dialog */}
            <AuditInspector
                log={selectedLog}
                open={selectedLog !== null}
                onOpenChange={(open) => !open && setSelectedLog(null)}
            />
        </div>
    );
}
