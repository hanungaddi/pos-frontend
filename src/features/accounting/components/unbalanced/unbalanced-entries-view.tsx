"use client";

import { IconScale } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { FormDatePicker } from "@/components/forms/form-date-picker";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useGeneralLedgerUnbalanced } from "@/features/accounting/api/reports-api";
import type { GeneralLedgerEntry } from "@/features/accounting/types";
import { todayStr } from "@/lib/date-utils";

import { BalanceEntryDialog } from "./balance-entry-dialog";
import { UnbalancedStatusBanner } from "./unbalanced-status-banner";
import { getUnbalancedTableColumns } from "./unbalanced-table-columns";

interface UnbalancedFilterValues {
    from: string;
    to: string;
}

export function UnbalancedEntriesView() {
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(50);
    const [sortBy, setSortBy] = useState<string>("transaction_date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Modal state for balancing entry
    const [selectedEntry, setSelectedEntry] = useState<GeneralLedgerEntry | null>(null);

    // Form Context for Filters
    const filterMethods = useForm<UnbalancedFilterValues>({
        defaultValues: {
            from: "",
            to: todayStr(),
        },
    });

    const [from, to] = useWatch({
        control: filterMethods.control,
        name: ["from", "to"],
    });

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPage(1);
    }, [from, to]);

    // Data fetching
    const { data, isLoading, isFetching, refetch } = useGeneralLedgerUnbalanced({
        from: from || undefined,
        to: to || undefined,
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
    });

    const columns = useMemo(() => getUnbalancedTableColumns(), []);

    const entries = data?.data ?? [];
    const meta = data?.meta;
    const totalUnbalanced = meta?.total ?? entries.length;

    return (
        <div className="space-y-6">
            {/* Header Hero Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-4">
                    <div className="relative flex items-center justify-center p-3.5 bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-800 text-white rounded-2xl shadow-lg shadow-amber-500/15 dark:shadow-amber-950/30 ring-4 ring-amber-50 dark:ring-amber-950/20 shrink-0">
                        <IconScale className="w-6 h-6" />
                        <div className="absolute inset-0 bg-amber-500 rounded-2xl blur-lg opacity-25 -z-10" />
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                                Entri Tidak Seimbang
                            </h2>
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30 uppercase tracking-wider shadow-sm">
                                General Ledger Unbalanced
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                            Mendeteksi dan menambahkan akun penyeimbang pada entri General Ledger yang membuat posisi Neraca tidak seimbang.
                        </p>
                    </div>
                </div>
            </div>

            {/* Status Banner Alert */}
            <UnbalancedStatusBanner isLoading={isLoading} totalUnbalanced={totalUnbalanced} />

            {/* Filter Card */}
            <FormProvider {...filterMethods}>
                <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/60 shadow-sm rounded-3xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full md:w-auto">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Dari:</span>
                            <FormDatePicker
                                name="from"
                                size="sm"
                                className="w-[125px] sm:w-[135px]"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sampai:</span>
                            <FormDatePicker
                                name="to"
                                size="sm"
                                className="w-[125px] sm:w-[135px]"
                            />
                        </div>
                    </div>
                </div>
            </FormProvider>

            {/* DataTable Section */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-sm p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                    <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                        Daftar Entri Tidak Seimbang
                        {meta ? ` (${meta.total} entri)` : ""}
                    </h3>
                </div>

                <DataTable
                    columns={columns}
                    data={entries}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    emptyMessage="Tidak ada entri yang tidak seimbang pada rentang tanggal ini."
                    page={page}
                    perPage={perPage}
                    onPageChange={setPage}
                    onPerPageChange={setPerPage}
                    meta={meta}
                    entityName="entri tidak seimbang"
                    virtualize={true}
                    estimateRowHeight={52}
                    enableSortingRemoval={false}
                    extraActions={(row) => (
                        <Button
                            size="sm"
                            onClick={() => setSelectedEntry(row)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 rounded-xl font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                            <IconScale size={14} />
                            Seimbangkan
                        </Button>
                    )}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortChange={(key, order) => {
                        if (key && order) {
                            setSortBy(key);
                            setSortOrder(order);
                        } else {
                            setSortBy("transaction_date");
                            setSortOrder("desc");
                        }
                        setPage(1);
                    }}
                />
            </section>

            {/* Refactored 2-Column Modal Dialog */}
            <BalanceEntryDialog
                selectedEntry={selectedEntry}
                onClose={() => setSelectedEntry(null)}
                onSuccess={() => refetch()}
            />
        </div>
    );
}
