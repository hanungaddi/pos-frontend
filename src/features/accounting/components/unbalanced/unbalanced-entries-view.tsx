"use client";

import {
    IconAlertTriangle,
    IconCheck,
    IconScale,
    IconShieldCheck
} from "@tabler/icons-react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { FormDatePicker } from "@/components/forms/form-date-picker";
import { FormSelect } from "@/components/forms/form-select";
import { Badge } from "@/components/ui/badge";
import { BaseDialog } from "@/components/ui/base-dialog";
import { Button } from "@/components/ui/button";
import type { CommandOption } from "@/components/ui/command-select";
import { DataTable } from "@/components/ui/data-table";
import { useFlatChartOfAccounts } from "@/features/accounting/api/coa-api";
import { useBalanceEntry } from "@/features/accounting/api/ledger-api";
import { useGeneralLedgerUnbalanced } from "@/features/accounting/api/reports-api";
import type { GeneralLedgerEntry } from "@/features/accounting/types";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import { todayStr } from "@/lib/date-utils";

interface UnbalancedFilterValues {
    from: string;
    to: string;
}

interface BalanceEntryFormValues {
    chartOfAccountUid: string;
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

    const { data: coaData, isLoading: isLoadingCoas } = useFlatChartOfAccounts();
    const balanceMutation = useBalanceEntry();

    // Form Context for Dialog
    const dialogMethods = useForm<BalanceEntryFormValues>({
        defaultValues: {
            chartOfAccountUid: "",
        },
    });

    const coaOptions = useMemo<CommandOption[]>(() => {
        if (!coaData) return [];
        return coaData
            .filter((c) => c.is_active)
            .map((c) => ({
                value: c.uid,
                label: `[${c.kode}] ${c.nama}`,
                description: `${c.tipe.toUpperCase()} — ${c.saldo_normal === "debit" ? "Debit" : "Kredit"}`,
            }));
    }, [coaData]);

    const handleOpenBalancingDialog = (entry: GeneralLedgerEntry) => {
        setSelectedEntry(entry);
        dialogMethods.reset({ chartOfAccountUid: "" });
    };

    const handleCloseDialog = () => {
        setSelectedEntry(null);
        dialogMethods.reset({ chartOfAccountUid: "" });
    };

    const onSubmitBalanceEntry = dialogMethods.handleSubmit((values) => {
        if (!selectedEntry) return;

        balanceMutation.mutate(
            {
                unbalanced_uid: selectedEntry.uid,
                chart_of_account_uid: values.chartOfAccountUid,
            },
            {
                onSuccess: (res) => {
                    toast.success(res.message || "Entry balancing berhasil dibuat.");
                    handleCloseDialog();
                    refetch();
                },
                onError: (err) => {
                    toast.error(err.message || "Gagal membuat entry balancing.");
                },
            }
        );
    });

    const columns = useMemo<ColumnDef<GeneralLedgerEntry>[]>(
        () => [
            {
                accessorKey: "transaction_date",
                header: "Tanggal",
                cell: ({ row }) => (
                    <span className="text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                        {row.original.transaction_date
                            ? format(new Date(row.original.transaction_date), "dd MMM yyyy", { locale: localeId })
                            : "-"}
                    </span>
                ),
                size: 110,
            },
            {
                accessorKey: "kode",
                header: "Akun Asal",
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
                header: "Keterangan / Referensi",
                cell: ({ row }) => (
                    <div className="space-y-0.5">
                        <p className="text-slate-700 dark:text-slate-350 text-xs">
                            {row.original.description || "-"}
                        </p>
                        {row.original.reference_type && (
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                {row.original.reference_type}: {row.original.reference_uid || "-"}
                            </span>
                        )}
                    </div>
                ),
                size: 260,
            },
            {
                accessorKey: "debit",
                header: "Debit",
                cell: ({ row }) => (
                    <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold tabular-nums text-right block">
                        {Number(row.original.debit) > 0 ? formatRupiah(Number(row.original.debit)) : "-"}
                    </span>
                ),
                size: 130,
            },
            {
                accessorKey: "credit",
                header: "Kredit",
                cell: ({ row }) => (
                    <span className="text-rose-600 dark:text-rose-450 text-xs font-semibold tabular-nums text-right block">
                        {Number(row.original.credit) > 0 ? formatRupiah(Number(row.original.credit)) : "-"}
                    </span>
                ),
                size: 130,
            },
            {
                id: "difference",
                header: "Selisih",
                cell: ({ row }) => {
                    const diff = Math.abs(Number(row.original.debit) - Number(row.original.credit));
                    return (
                        <span className="text-amber-600 dark:text-amber-400 text-xs font-bold tabular-nums text-right block">
                            {formatRupiah(diff)}
                        </span>
                    );
                },
                size: 130,
            },
            {
                accessorKey: "source",
                header: "Sumber",
                cell: ({ row }) =>
                    row.original.source === "manual" ? (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold px-2 py-0.5 border dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
                            Manual
                        </Badge>
                    ) : (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold px-2 py-0.5 border dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30">
                            GL
                        </Badge>
                    ),
                size: 80,
            },
            {
                id: "actions",
                header: "Aksi",
                cell: ({ row }) => (
                    <Button
                        size="sm"
                        onClick={() => handleOpenBalancingDialog(row.original)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 rounded-xl font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                        <IconScale size={14} />
                        Seimbangkan
                    </Button>
                ),
                size: 130,
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const entries = data?.data ?? [];
    const meta = data?.meta;
    const totalUnbalanced = meta?.total ?? entries.length;

    const selectedDiff = selectedEntry
        ? Math.abs(Number(selectedEntry.debit) - Number(selectedEntry.credit))
        : 0;

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
            {!isLoading && (
                <div>
                    {totalUnbalanced > 0 ? (
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
                    ) : (
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
                    )}
                </div>
            )}

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

            {/* Modal Dialog for Balancing Entry */}
            <BaseDialog
                open={!!selectedEntry}
                onOpenChange={(open) => {
                    if (!open) handleCloseDialog();
                }}
                title={
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        <IconScale size={18} className="text-amber-500" />
                        <span>Pilih Akun Penyeimbang COA</span>
                    </div>
                }
                className="max-w-lg"
            >
                {selectedEntry && (
                    <FormProvider {...dialogMethods}>
                        <form onSubmit={onSubmitBalanceEntry} className="space-y-5 pt-3">
                            {/* Selected Entry Detail Summary */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                                <div className="flex justify-between items-center text-xs border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Akun Saat Ini</span>
                                    <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                                        [{selectedEntry.kode ?? "-"}] {selectedEntry.nama}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                        <span className="text-[10px] text-slate-400 block">Debit</span>
                                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                            {Number(selectedEntry.debit) > 0 ? formatRupiah(Number(selectedEntry.debit)) : "-"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block">Kredit</span>
                                        <span className="font-extrabold text-rose-600 dark:text-rose-400">
                                            {Number(selectedEntry.credit) > 0 ? formatRupiah(Number(selectedEntry.credit)) : "-"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block">Selisih Penyeimbang</span>
                                        <span className="font-extrabold text-amber-600 dark:text-amber-400">
                                            {formatRupiah(selectedDiff)}
                                        </span>
                                    </div>
                                </div>

                                {selectedEntry.description && (
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                                        <span className="font-semibold text-slate-600 dark:text-slate-300">Keterangan: </span>
                                        {selectedEntry.description}
                                    </div>
                                )}
                            </div>

                            {/* COA Selection Form Field */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    Akun COA Penyeimbang <span className="text-rose-500">*</span>
                                </label>
                                <FormSelect
                                    name="chartOfAccountUid"
                                    options={coaOptions}
                                    placeholder="Pilih akun COA penyeimbang..."
                                    searchPlaceholder="Cari berdasarkan kode atau nama..."
                                    emptyMessage="Akun COA tidak ditemukan."
                                    isLoading={isLoadingCoas}
                                    className="w-full dark:bg-slate-900"
                                />
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                                    Sistem akan membuat entri balancing jurnal dengan akun COA di atas untuk menetralkan selisih sebesar{" "}
                                    <strong className="text-slate-700 dark:text-slate-300">{formatRupiah(selectedDiff)}</strong>.
                                </p>
                            </div>

                            {/* Dialog Footer Actions */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCloseDialog}
                                    disabled={balanceMutation.isPending}
                                    className="rounded-xl text-xs font-semibold"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    // eslint-disable-next-line react-hooks/incompatible-library
                                    disabled={balanceMutation.isPending || !dialogMethods.watch("chartOfAccountUid")}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                                >
                                    {balanceMutation.isPending ? (
                                        "Menyimpan..."
                                    ) : (
                                        <>
                                            <IconCheck size={16} />
                                            Simpan Entry Penyeimbang
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </FormProvider>
                )}
            </BaseDialog>
        </div>
    );
}
