"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { IconBook } from "@tabler/icons-react";
import { FormDatePicker } from "@/components/forms/form-date-picker";
import { FormSelect } from "@/components/forms/form-select";
import type { CommandOption } from "@/components/ui/command-select";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import { todayStr } from "@/lib/date-utils";
import { useGeneralLedger } from "@/features/accounting/api/reports-api";
import { useFlatChartOfAccounts } from "@/features/accounting/api/coa-api";
import type { GeneralLedgerEntry } from "@/features/accounting/types";

interface BukuBesarFilterValues {
    from: string;
    to: string;
    coaUid: string;
}

export function BukuBesarView() {
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(50);

    // Server Sorting States (Default: transaction_date DESC)
    const [sortBy, setSortBy] = useState<string>("transaction_date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Form Context for Reusable Components
    const methods = useForm<BukuBesarFilterValues>({
        defaultValues: {
            from: "",
            to: todayStr(),
            coaUid: "",
        },
    });

    const [from, to, coaUid] = useWatch({
        control: methods.control,
        name: ["from", "to", "coaUid"],
    });

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPage(1);
    }, [from, to, coaUid]);

    const { data, isLoading, isFetching } = useGeneralLedger({
        from: from || undefined,
        to: to || undefined,
        chart_of_account_uid: coaUid || undefined,
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
    });

    const { data: coaData } = useFlatChartOfAccounts();

    const coaOptions = useMemo<CommandOption[]>(() => {
        const list = (coaData ?? []).map((c) => ({
            value: c.uid,
            label: `[${c.kode}] ${c.nama}`,
        }));
        return [{ value: "", label: "Semua Akun" }, ...list];
    }, [coaData]);

    const columns = useMemo<ColumnDef<GeneralLedgerEntry>[]>(
        () => [
            {
                accessorKey: "transaction_date",
                header: "Tanggal",
                cell: ({ row }) => (
                    <span className="text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                        {format(new Date(row.original.transaction_date), "dd MMM yyyy", {
                            locale: localeId,
                        })}
                    </span>
                ),
                size: 110,
            },
            {
                accessorKey: "kode",
                header: "Akun",
                cell: ({ row }) => (
                    <div className="whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {row.original.kode ?? "-"}
                        </span>
                        <span className="text-slate-500 dark:text-slate-450 text-[11px] ml-1.5">
                            {row.original.nama}
                        </span>
                    </div>
                ),
                size: 200,
            },
            {
                accessorKey: "description",
                header: "Keterangan",
                cell: ({ row }) => (
                    <span className="text-slate-700 dark:text-slate-350 text-xs">
                        {row.original.description || row.original.reference_type || "-"}
                    </span>
                ),
                size: 280,
            },
            {
                accessorKey: "debit",
                header: "Debit",
                cell: ({ row }) => (
                    <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold tabular-nums text-right block">
                        {Number(row.original.debit) > 0
                            ? formatRupiah(Number(row.original.debit))
                            : "-"}
                    </span>
                ),
                size: 140,
            },
            {
                accessorKey: "credit",
                header: "Kredit",
                cell: ({ row }) => (
                    <span className="text-rose-600 dark:text-rose-455 text-xs font-semibold tabular-nums text-right block">
                        {Number(row.original.credit) > 0
                            ? formatRupiah(Number(row.original.credit))
                            : "-"}
                    </span>
                ),
                size: 140,
            },
            {
                accessorKey: "source",
                header: "Sumber",
                cell: ({ row }) =>
                    row.original.source === "manual" ? (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-250 text-[10px] font-semibold px-2 py-0.5 border dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30">
                            Manual
                        </Badge>
                    ) : (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-250 text-[10px] font-semibold px-2 py-0.5 border dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30">
                            GL
                        </Badge>
                    ),
                size: 90,
            },
        ],
        []
    );

    const entries = data?.data ?? [];
    const meta = data?.meta;

    return (
        <div className="space-y-6">
            {/* Header Hero Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-4">
                    {/* Glowing Icon Container */}
                    <div className="relative flex items-center justify-center p-3.5 bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-800 text-white rounded-2xl shadow-lg shadow-emerald-500/15 dark:shadow-emerald-950/30 ring-4 ring-emerald-50 dark:ring-emerald-950/20 shrink-0">
                        <IconBook className="w-6 h-6" />
                        <div className="absolute inset-0 bg-emerald-500 rounded-2xl blur-lg opacity-25 -z-10" />
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                                Buku Besar
                            </h2>
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold bg-emerald-55 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30 uppercase tracking-wider shadow-sm">
                                General Ledger
                            </span>
                        </div>
                        <p className="text-xs text-slate-450 dark:text-slate-500 leading-relaxed max-w-xl">
                            Riwayat pencatatan transaksi Debit & Kredit per pos akun (Jurnal Umum & Jurnal Penyesuaian).
                        </p>
                    </div>
                </div>
            </div>

            {/* Compact Filter Toolbar Card */}
            <FormProvider {...methods}>
                <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/60 shadow-sm rounded-3xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300">
                    {/* Left Side: Date Filters (Dari & Sampai) */}
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

                    {/* Right Side: Account Selector (COA) */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Akun:</span>
                        <div className="w-full sm:w-[220px]">
                            <FormSelect
                                name="coaUid"
                                options={coaOptions}
                                placeholder="Semua Akun"
                                searchPlaceholder="Cari akun..."
                                emptyMessage="Akun tidak ditemukan."
                                size="sm"
                            />
                        </div>
                    </div>
                </div>
            </FormProvider>

            {/* Table Entries Card */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-sm p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                    <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                        Entri Buku Besar
                        {meta ? ` (${meta.total} entri)` : ""}
                    </h3>
                </div>

                <DataTable
                    columns={columns}
                    data={entries}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    emptyMessage="Tidak ada entri pada rentang tanggal ini."
                    page={page}
                    perPage={perPage}
                    onPageChange={setPage}
                    onPerPageChange={setPerPage}
                    meta={meta}
                    entityName="entri buku besar"
                    virtualize={true}
                    estimateRowHeight={44}
                    enableSortingRemoval={false}

                    // Server-side Sorting
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
        </div>
    );
}
