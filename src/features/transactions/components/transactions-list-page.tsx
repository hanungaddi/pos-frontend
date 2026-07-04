"use client";

import { useAppRouter } from "@/hooks/use-app-router";
import { DataTable } from "@/components/ui/data-table";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import { useSession } from "next-auth/react";
import { hasPermission, hasRole } from "@/constants/roles";
import { useDeferredValue, useState } from "react";
import { useForm } from "react-hook-form";
import { FilterForm } from "@/components/forms/filter-form";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { FormDatePicker } from "@/components/forms/form-date-picker";
import { useTransactionsList } from "../api/transactions-api";
import type { ColumnDef } from "@tanstack/react-table";
import type { Transaction } from "../types";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { IconInfoCircle } from "@tabler/icons-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TransactionFilterValues {
    search: string;
    status: string;
    payment_method: string;
    from: string;
    to: string;
}

export function TransactionsListPage() {
    const { data: session } = useSession();
    const router = useAppRouter();

    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState<string | undefined>("created_at");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>("desc");

    // Filters state
    const [filters, setFilters] = useState({
        search: "",
        status: "all",
        payment_method: "all",
        from: "",
        to: "",
    });

    const deferredFilters = useDeferredValue(filters);

    const filterMethods = useForm<TransactionFilterValues>({
        defaultValues: {
            search: "",
            status: "all",
            payment_method: "all",
            from: "",
            to: "",
        },
    });

    const handleFilterSubmit = (data: TransactionFilterValues) => {
        setFilters({
            search: data.search,
            status: data.status,
            payment_method: data.payment_method,
            from: data.from,
            to: data.to,
        });
        setPage(1);
    };

    const handleFilterReset = () => {
        filterMethods.reset({
            search: "",
            status: "all",
            payment_method: "all",
            from: "",
            to: "",
        });
        setFilters({
            search: "",
            status: "all",
            payment_method: "all",
            from: "",
            to: "",
        });
        setPage(1);
    };

    // Prepare API params
    const apiParams: {
        page: number;
        per_page: number;
        search?: string;
        status?: string;
        payment_method?: string;
        from?: string;
        to?: string;
        sort_by?: string;
        sort_order?: "asc" | "desc";
    } = {
        page,
        per_page: 10,
        sort_by: sortBy,
        sort_order: sortOrder,
    };

    if (deferredFilters.search) {
        apiParams.search = deferredFilters.search;
    }
    if (deferredFilters.status && deferredFilters.status !== "all") {
        apiParams.status = deferredFilters.status;
    }
    if (deferredFilters.payment_method && deferredFilters.payment_method !== "all") {
        apiParams.payment_method = deferredFilters.payment_method;
    }
    if (deferredFilters.from) {
        apiParams.from = deferredFilters.from;
    }
    if (deferredFilters.to) {
        apiParams.to = deferredFilters.to;
    }

    const { data: transactionsData, isLoading, isFetching } = useTransactionsList(apiParams);
    const transactions = transactionsData?.data || [];

    const userRoles = session?.user?.roles || [];
    const userPermissions = session?.user?.permissions || [];

    const hasViewSales =
        hasRole(userRoles, "admin") ||
        hasPermission(userRoles, userPermissions, "view_sales") ||
        hasPermission(userRoles, userPermissions, "create_sales");

    if (!hasViewSales) {
        return (
            <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl shadow-sm">
                <p className="text-sm font-bold text-slate-800">Akses Ditolak</p>
                <p className="text-xs text-slate-400 mt-1">Anda tidak memiliki izin untuk melihat daftar transaksi.</p>
            </div>
        );
    }

    const statusBadges: Record<string, string> = {
        completed: "bg-emerald-50 text-emerald-700 border-emerald-100/50",
        canceled: "bg-rose-50 text-rose-700 border-rose-100/50",
        draft: "bg-amber-50 text-amber-700 border-amber-100/50",
    };

    const statusLabels: Record<string, string> = {
        completed: "Selesai",
        canceled: "Void / Batal",
        draft: "Draft",
    };

    // Columns config
    const columns: ColumnDef<Transaction>[] = [
        {
            accessorKey: "nomor_transaksi",
            header: "No. Transaksi",
            cell: ({ row }) => (
                <span className="font-bold text-slate-800">
                    {row.original.nomor_transaksi}
                </span>
            ),
        },
        {
            accessorKey: "nama_transaksi",
            header: "Nama/Keterangan",
            cell: ({ row }) => (
                <span className="text-slate-655 font-semibold truncate max-w-[150px] inline-block" title={row.original.nama_transaksi || undefined}>
                    {row.original.nama_transaksi || "-"}
                </span>
            ),
        },
        {
            accessorKey: "user.name",
            header: "Kasir",
            cell: ({ row }) => (
                <span className="font-semibold text-slate-700">
                    {row.original.user?.name || "Kasir"}
                </span>
            ),
        },
        {
            accessorKey: "created_at",
            header: "Waktu Transaksi",
            cell: ({ row }) => {
                const date = new Date(row.original.created_at);
                return (
                    <span className="text-slate-500 whitespace-nowrap">
                        {format(date, "dd MMM yyyy, HH:mm", { locale: id })}
                    </span>
                );
            },
        },
        {
            accessorKey: "metode_pembayaran",
            header: "Pembayaran",
            cell: ({ row }) => {
                const method = row.original.metode_pembayaran?.toLowerCase() || "draft";
                const methodLabel: Record<string, string> = {
                    cash: "Tunai",
                    card: "EDC/Card",
                    split: "Split",
                    draft: "Draft",
                };
                const methodClasses: Record<string, string> = {
                    cash: "bg-emerald-50 text-emerald-700 border-emerald-100",
                    card: "bg-blue-50 text-blue-700 border-blue-100",
                    split: "bg-indigo-50 text-indigo-700 border-indigo-100",
                    draft: "bg-slate-50 text-slate-500 border-slate-100",
                };
                return (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wide ${methodClasses[method] || "bg-slate-50 text-slate-500 border-slate-100"}`}>
                        {methodLabel[method] || method}
                    </span>
                );
            },
        },
        {
            accessorKey: "total",
            header: "Total",
            meta: {
                headerClassName: "text-right",
                cellClassName: "text-right font-bold text-slate-900 tabular-nums align-middle",
            },
            cell: ({ row }) => {
                const totalFormatted = formatRupiah(row.original.total);
                const method = row.original.metode_pembayaran?.toLowerCase();
                const isDebt = method === "debt";

                return (
                    <div className="flex items-center justify-end gap-1.5">
                        <span>{totalFormatted}</span>
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="text-slate-400 hover:text-indigo-500 cursor-help transition-colors">
                                        <IconInfoCircle size={14} className="stroke-[2.5]" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" align="end" className="text-[11px] space-y-1 p-2.5 min-w-[150px] shadow-lg border-slate-700 bg-slate-900">
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="text-slate-300">{isDebt ? "DP Tunai" : "Tunai"}</span>
                                        <span className="font-bold text-emerald-400 tabular-nums">{formatRupiah(row.original.cash_amount || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="text-slate-300">{isDebt ? "DP Non-Tunai" : "Non-Tunai"}</span>
                                        <span className="font-bold text-blue-400 tabular-nums">{formatRupiah(row.original.card_amount || 0)}</span>
                                    </div>
                                    {isDebt && (
                                        <>
                                            <div className="border-t border-slate-700 my-1.5"></div>
                                            <div className="flex justify-between items-center gap-4">
                                                <span className="text-slate-300">Sisa Utang</span>
                                                <span className="font-bold text-rose-400 tabular-nums">{formatRupiah(row.original.debt_amount || 0)}</span>
                                            </div>
                                        </>
                                    )}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                );
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status?.toLowerCase() || "completed";
                const badgeClass = statusBadges[status] || "bg-emerald-50 text-emerald-700 border-emerald-100/50";
                const label = statusLabels[status] || row.original.status;
                return (
                    <span className={`text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full border ${badgeClass}`}>
                        {label}
                    </span>
                );
            },
        },
    ];

    // Status options for filters
    const statusOptions = [
        { value: "all", label: "Semua Status" },
        { value: "completed", label: "Selesai" },
        { value: "canceled", label: "Void / Batal" },
        { value: "draft", label: "Draft" },
    ];

    // Payment method options for filters
    const paymentMethodOptions = [
        { value: "all", label: "Semua Pembayaran" },
        { value: "cash", label: "Tunai (Cash)" },
        { value: "card", label: "Non-Tunai (Card)" },
        { value: "split", label: "Split Payment" },
    ];

    return (
        <div className="space-y-6">
            <section className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">
                            Daftar Transaksi (History)
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Daftar riwayat seluruh transaksi penjualan di toko.
                        </p>
                    </div>
                </div>

                <FilterForm
                    methods={filterMethods}
                    onSubmit={handleFilterSubmit}
                    onReset={handleFilterReset}
                >
                    <FormInput<TransactionFilterValues>
                        name="search"
                        label="Cari Transaksi"
                        placeholder="Cari nomor transaksi..."
                    />

                    <FormDatePicker<TransactionFilterValues>
                        name="from"
                        label="Tanggal Awal"
                        placeholder="Dari Tanggal"
                    />

                    <FormDatePicker<TransactionFilterValues>
                        name="to"
                        label="Tanggal Akhir"
                        placeholder="Sampai Tanggal"
                    />

                    <FormSelect<TransactionFilterValues>
                        name="status"
                        label="Status"
                        options={statusOptions}
                        placeholder="Semua Status"
                    />

                    <FormSelect<TransactionFilterValues>
                        name="payment_method"
                        label="Pembayaran"
                        options={paymentMethodOptions}
                        placeholder="Semua Pembayaran"
                    />
                </FilterForm>

                <DataTable
                    columns={columns}
                    data={transactions}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    emptyMessage="Belum ada transaksi yang tercatat."
                    page={page}
                    onPageChange={setPage}
                    meta={transactionsData?.meta}
                    entityName="transaksi"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortChange={(by, order) => {
                        setSortBy(by);
                        setSortOrder(order);
                        setPage(1);
                    }}
                    virtualize={true}
                    estimateRowHeight={44}
                    onView={(trx) => router.push(`/admin/transactions/${trx.uid}`)}
                />
            </section>
        </div>
    );
}

export default TransactionsListPage;
