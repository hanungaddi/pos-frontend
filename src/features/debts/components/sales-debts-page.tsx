"use client";

import { FilterForm } from "@/components/forms/filter-form";
import { FormInput } from "@/components/forms/form-input";
import { DataTable } from "@/components/ui/data-table";
import { hasPermission, hasRole } from "@/constants/roles";
import { useReceivingDebtsSummary } from "@/features/purchase/api/purchase-api";
import type { SupplierDebtSummary } from "@/features/purchase/types";
import { useAppRouter } from "@/hooks/use-app-router";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import { IconBuilding, IconCash, IconChevronRight } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface SalesDebtsFilterValues {
    search: string;
}

export function SalesDebtsPage() {
    const { data: session } = useSession();
    const router = useAppRouter();
    const userRoles = session?.user?.roles || [];
    const userPermissions = session?.user?.permissions || [];

    const hasViewPurchase =
        hasRole(userRoles, "admin") ||
        hasPermission(userRoles, userPermissions, "view_purchase") ||
        hasPermission(userRoles, userPermissions, "manage_purchase");

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [sortBy, setSortBy] = useState<string | undefined>(undefined);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(undefined);
    const [appliedFilters, setAppliedFilters] = useState<{ search?: string }>({});

    const filterMethods = useForm<SalesDebtsFilterValues>({
        defaultValues: { search: "" },
    });

    const handleFilterSubmit = (data: SalesDebtsFilterValues) => {
        setAppliedFilters({ search: data.search || undefined });
        setPage(1);
    };

    const handleFilterReset = () => {
        filterMethods.reset({ search: "" });
        setAppliedFilters({});
        setPage(1);
    };

    const { data: summaryData, isLoading, isFetching } = useReceivingDebtsSummary({
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...appliedFilters,
    });

    const suppliers = summaryData?.data || [];
    const totalSuppliers = summaryData?.meta?.total ?? 0;
    const totalHutang = suppliers.reduce((sum, s) => sum + (s.total_hutang || 0), 0);

    if (!hasViewPurchase) {
        return (
            <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl shadow-sm">
                <p className="text-sm font-bold text-slate-800">Akses Ditolak</p>
                <p className="text-xs text-slate-400 mt-1">
                    Anda tidak memiliki izin untuk melihat data hutang sales.
                </p>
            </div>
        );
    }

    const columns: ColumnDef<SupplierDebtSummary>[] = [
        {
            accessorKey: "nama_supplier",
            header: "Supplier",
            cell: ({ row }) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-800">{row.original.nama_supplier}</span>
                    {row.original.alamat && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {row.original.alamat}
                        </span>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "nomor_telepon",
            header: "Kontak",
            cell: ({ row }) => (
                <div className="flex flex-col text-[11px] text-slate-500">
                    <span>{row.original.nomor_telepon || "-"}</span>
                    {row.original.email && (
                        <span className="text-[10px] text-slate-400">{row.original.email}</span>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "total_nilai_faktur",
            header: "Total Nilai Faktur",
            meta: {
                headerClassName: "text-right",
                cellClassName: "text-right font-semibold text-slate-700 tabular-nums",
            },
            cell: ({ row }) => formatRupiah(row.original.total_nilai_faktur || 0),
        },
        {
            accessorKey: "total_dibayar",
            header: "Total Dibayar",
            meta: {
                headerClassName: "text-right",
                cellClassName: "text-right font-semibold text-emerald-600 tabular-nums",
            },
            cell: ({ row }) => formatRupiah(row.original.total_dibayar || 0),
        },
        {
            accessorKey: "total_hutang",
            header: "Sisa Hutang",
            meta: {
                headerClassName: "text-right",
                cellClassName: "text-right font-extrabold text-rose-600 tabular-nums",
            },
            cell: ({ row }) => formatRupiah(row.original.total_hutang || 0),
        },
        {
            id: "actions",
            header: "Aksi",
            meta: {
                headerClassName: "text-center w-24",
                cellClassName: "text-center",
            },
            cell: ({ row }) => (
                <button
                    onClick={() =>
                        router.push(
                            `/admin/debts/sales/${row.original.supplier_uid}?nama=${encodeURIComponent(row.original.nama_supplier)}`
                        )
                    }
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 border border-indigo-100 rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98] mx-auto"
                    title="Lihat Detail Hutang"
                >
                    <IconChevronRight size={12} /> Detail
                </button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card 1 */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
                    <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                            Total Supplier Berhutang
                        </span>
                        <h3 className="text-2xl font-black text-slate-800 leading-none">
                            {totalSuppliers}
                        </h3>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                            Supplier dengan sisa hutang belum lunas
                        </span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0 shadow-sm shadow-rose-100/5">
                        <IconBuilding size={20} className="stroke-[2.5]" />
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                    <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                            Total Akumulasi Hutang
                        </span>
                        <h3 className="text-2xl font-black text-indigo-600 leading-none tabular-nums">
                            {formatRupiah(totalHutang)}
                        </h3>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                            Akumulasi seluruh sisa hutang supplier
                        </span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0 shadow-sm shadow-indigo-100/5">
                        <IconCash size={20} className="stroke-[2.5]" />
                    </div>
                </div>
            </div>

            {/* List Table & Filter Section */}
            <section className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <div>
                        <h4 className="text-xs font-bold text-slate-800">Daftar Hutang Per Supplier</h4>
                        <p className="text-[10px] text-slate-400">
                            Klik &quot;Detail&quot; untuk melihat rincian hutang per transaksi penerimaan.
                        </p>
                    </div>
                </div>

                <FilterForm
                    methods={filterMethods}
                    onSubmit={handleFilterSubmit}
                    onReset={handleFilterReset}
                >
                    <FormInput<SalesDebtsFilterValues>
                        name="search"
                        label="Cari Supplier"
                        placeholder="Nama supplier, email, telepon..."
                    />
                </FilterForm>

                <DataTable
                    columns={columns}
                    data={suppliers}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    emptyMessage="Tidak ada data hutang sales yang ditemukan."
                    page={page}
                    perPage={perPage}
                    onPageChange={setPage}
                    onPerPageChange={(newPerPage) => {
                        setPerPage(newPerPage);
                        setPage(1);
                    }}
                    meta={summaryData?.meta}
                    entityName="supplier berhutang"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortChange={(by, order) => {
                        setSortBy(by);
                        setSortOrder(order);
                        setPage(1);
                    }}
                    virtualize={true}
                    estimateRowHeight={56}
                />
            </section>
        </div>
    );
}

export default SalesDebtsPage;
