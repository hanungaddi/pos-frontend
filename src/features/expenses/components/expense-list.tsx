"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { hasRole, hasPermission } from "@/constants/roles";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconPlus } from "@tabler/icons-react";
import type { Expense } from "../types";
import { DataTable } from "@/components/ui/data-table";
import { useDeleteExpense } from "../api/expenses-api";
import { toast } from "sonner";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ExpenseListProps {
    expenses: Expense[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    page: number;
    perPage: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    onEdit: (expense: Expense) => void;
    onAddClick: () => void;
    isLoading?: boolean;
    isFetching?: boolean;
    filterElement?: React.ReactNode;
}

export function ExpenseList({
    expenses,
    meta,
    page,
    perPage,
    onPageChange,
    onPerPageChange,
    onEdit,
    onAddClick,
    isLoading = false,
    isFetching = false,
    filterElement,
}: ExpenseListProps) {
    const { data: session } = useSession();
    const userRoles = session?.user?.roles || [];
    const userPermissions = session?.user?.permissions || [];
    const hasManageExpenses =
        hasRole(userRoles, "admin") ||
        hasPermission(userRoles, userPermissions, "manage_expenses");

    const deleteExpense = useDeleteExpense();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

    const handleDelete = (e: Expense) => {
        setExpenseToDelete(e);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!expenseToDelete) return;
        deleteExpense.mutate(expenseToDelete.uid, {
            onSuccess: () => {
                toast.success(`Catatan pengeluaran "${expenseToDelete.nomor_pengeluaran}" berhasil dihapus.`);
                setIsConfirmOpen(false);
                setExpenseToDelete(null);
            },
            onError: (err) => {
                toast.error(err.message || "Gagal menghapus pengeluaran.");
            },
        });
    };

    const columns = useMemo<ColumnDef<Expense>[]>(
        () => [
            {
                accessorKey: "nomor_pengeluaran",
                header: "No. Pengeluaran",
                cell: ({ row }) => (
                    <span className="font-mono font-bold text-slate-800 text-xs whitespace-nowrap">
                        {row.original.nomor_pengeluaran}
                    </span>
                ),
                size: 150,
            },
            {
                accessorKey: "tanggal",
                header: "Tanggal",
                cell: ({ row }) => {
                    const d = new Date(row.original.tanggal);
                    return (
                        <span className="text-slate-500 text-xs whitespace-nowrap">
                            {format(d, "dd MMM yyyy", { locale: id })}
                        </span>
                    );
                },
                size: 130,
            },
            {
                accessorKey: "nama",
                header: "Keperluan / Deskripsi",
                cell: ({ row }) => (
                    <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-900 text-xs">
                            {row.original.nama || "-"}
                        </span>
                        {row.original.catatan && row.original.catatan !== row.original.nama && (
                            <span className="text-[10px] text-slate-400 font-medium line-clamp-1" title={row.original.catatan}>
                                {row.original.catatan}
                            </span>
                        )}
                    </div>
                ),
                size: 220,
            },
            {
                accessorKey: "category.nama",
                header: "Kategori",
                cell: ({ row }) => (
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-medium text-[10px]">
                        {row.original.category?.nama || "-"}
                    </span>
                ),
                size: 150,
            },
            {
                accessorKey: "cash_account.nama",
                header: "Sumber Kas",
                cell: ({ row }) => (
                    <span className="text-slate-600 text-xs">
                        {row.original.cashAccount?.nama || row.original.cash_account?.nama || "-"}
                    </span>
                ),
                size: 150,
            },
            {
                accessorKey: "amount",
                header: "Nominal",
                meta: {
                    headerClassName: "text-right",
                    cellClassName: "text-right font-bold text-rose-600 tabular-nums text-xs",
                },
                cell: ({ row }) => formatRupiah(row.original.amount),
                size: 130,
            },
            {
                accessorKey: "user.name",
                header: "Oleh",
                cell: ({ row }) => (
                    <span className="text-slate-500 text-xs whitespace-nowrap">
                        {row.original.user?.name || "-"}
                    </span>
                ),
                size: 120,
            },
        ],
        [],
    );

    return (
        <section className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-2">
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900">
                        Riwayat Pengeluaran Kas Toko
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        Daftar lengkap catatan transaksi pengeluaran operasional toko Anda.
                    </p>
                </div>
                {hasManageExpenses && (
                    <Button
                        onClick={onAddClick}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl flex gap-1.5 cursor-pointer border-none"
                    >
                        <IconPlus size={16} /> Catat Pengeluaran
                    </Button>
                )}
            </div>

            {filterElement}

            <DataTable
                columns={columns}
                data={expenses}
                isLoading={isLoading}
                isFetching={isFetching}
                emptyMessage="Tidak ada catatan pengeluaran ditemukan."
                page={page}
                perPage={perPage}
                onPageChange={onPageChange}
                onPerPageChange={onPerPageChange}
                meta={meta}
                entityName="pengeluaran"
                virtualize={true}
                estimateRowHeight={44}
                onEdit={hasManageExpenses ? onEdit : undefined}
                onDelete={hasManageExpenses ? handleDelete : undefined}
            />

            <ConfirmDialog
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                title="Hapus Catatan Pengeluaran"
                description={
                    expenseToDelete ? (
                        <span>
                            Apakah Anda yakin ingin menghapus pengeluaran{" "}
                            <strong className="font-semibold text-slate-900">
                                {expenseToDelete.nomor_pengeluaran}
                            </strong>
                            ? Jumlah pengeluaran akan ditambahkan kembali ke saldo akun kas terkait.
                        </span>
                    ) : (
                        "Apakah Anda yakin ingin menghapus pengeluaran ini?"
                    )
                }
                confirmText="Ya, Hapus"
                cancelText="Batal"
                onConfirm={handleConfirmDelete}
                isLoading={deleteExpense.isPending}
                variant="danger"
            />
        </section>
    );
}
