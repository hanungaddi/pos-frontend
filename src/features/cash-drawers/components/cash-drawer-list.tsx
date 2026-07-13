"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { hasRole, hasPermission } from "@/constants/roles";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconPlus } from "@tabler/icons-react";
import type { CashDrawer } from "../types";
import { DataTable } from "@/components/ui/data-table";
import { useDeleteCashDrawer } from "../api/cash-drawers-api";
import { toast } from "sonner";
import { formatRupiah } from "@/hooks/use-format-rupiah";

interface CashDrawerListProps {
    drawers: CashDrawer[];
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
    onEdit: (drawer: CashDrawer) => void;
    onAddClick: () => void;
    isLoading?: boolean;
    isFetching?: boolean;
    filterElement?: React.ReactNode;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    onSortChange?: (sortBy: string | undefined, sortOrder: "asc" | "desc" | undefined) => void;
}

export function CashDrawerList({
    drawers,
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
    sortBy,
    sortOrder,
    onSortChange,
}: CashDrawerListProps) {
    const { data: session } = useSession();
    const userRoles = session?.user?.roles || [];
    const userPermissions = session?.user?.permissions || [];
    const hasManage =
        hasRole(userRoles, "admin") ||
        hasPermission(userRoles, userPermissions, "manage_cash_drawer");

    const deleteDrawer = useDeleteCashDrawer();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [drawerToDelete, setDrawerToDelete] = useState<CashDrawer | null>(null);

    const handleDelete = (d: CashDrawer) => {
        setDrawerToDelete(d);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!drawerToDelete) return;
        deleteDrawer.mutate(drawerToDelete.uid, {
            onSuccess: () => {
                toast.success(`Laci kasir "${drawerToDelete.nama}" berhasil dihapus.`);
                setIsConfirmOpen(false);
                setDrawerToDelete(null);
            },
            onError: (err) => {
                toast.error(err.message || "Gagal menghapus laci kasir.");
            },
        });
    };

    const columns = useMemo<ColumnDef<CashDrawer>[]>(
        () => {
            const baseColumns: ColumnDef<CashDrawer>[] = [
                {
                    accessorKey: "nama",
                    header: "Nama Laci",
                    cell: ({ row }) => (
                        <span className="font-bold text-slate-900 text-xs">
                            {row.original.nama}
                        </span>
                    ),
                    size: 240,
                },
                {
                    accessorKey: "saldo",
                    header: "Saldo",
                    cell: ({ row }) => (
                        <span className="font-semibold text-slate-700 text-xs tabular-nums">
                            {formatRupiah(row.original.saldo)}
                        </span>
                    ),
                    size: 120,
                },
                {
                    accessorKey: "sessions_count",
                    header: "Total Sesi",
                    cell: ({ row }) => (
                        <span className="text-slate-500 text-xs">
                            {row.original.sessions_count ?? "-"}
                        </span>
                    ),
                    size: 80,
                },
                {
                    accessorKey: "is_active",
                    header: "Status",
                    cell: ({ row }) => {
                        const active = row.original.is_active;
                        return active ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                Aktif
                            </span>
                        ) : (
                            <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                Nonaktif
                            </span>
                        );
                    },
                    size: 80,
                },
            ];

            return baseColumns;
        },
        [],
    );

    return (
        <section className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-2">
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900">
                        Daftar Laci Kasir
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        Kelola master laci kasir fisik untuk sesi kasir.
                    </p>
                </div>
                {hasManage && (
                    <Button
                        onClick={onAddClick}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl flex gap-1.5 cursor-pointer"
                    >
                        <IconPlus size={16} /> Tambah Laci
                    </Button>
                )}
            </div>

            {filterElement}

            <DataTable
                columns={columns}
                data={drawers}
                isLoading={isLoading}
                isFetching={isFetching}
                emptyMessage="Tidak ada laci kasir ditemukan."
                page={page}
                perPage={perPage}
                onPageChange={onPageChange}
                onPerPageChange={onPerPageChange}
                meta={meta}
                entityName="laci kasir"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={onSortChange}
                virtualize={true}
                estimateRowHeight={44}
                onEdit={hasManage ? onEdit : undefined}
                onDelete={hasManage ? handleDelete : undefined}
            />

            <ConfirmDialog
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                title="Hapus Laci Kasir"
                description={
                    drawerToDelete ? (
                        <span>
                            Apakah Anda yakin ingin menghapus laci kasir{" "}
                            <strong className="font-semibold text-slate-900">
                                {drawerToDelete.nama}
                            </strong>
                            ? Tindakan ini tidak dapat dibatalkan.
                        </span>
                    ) : (
                        "Apakah Anda yakin ingin menghapus laci kasir ini?"
                    )
                }
                confirmText="Ya, Hapus"
                cancelText="Batal"
                onConfirm={handleConfirmDelete}
                isLoading={deleteDrawer.isPending}
                variant="danger"
            />
        </section>
    );
}
