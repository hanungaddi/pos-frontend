"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { hasPermission, hasRole } from "@/constants/roles";
import { IconPlus } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppRouter } from "@/hooks/use-app-router";
import {
    useDeletePayment,
} from "../../api/purchase-api";
import type { ReceivingPayment } from "../../types";
import {
    PAYMENT_TRANSACTION_STATUS,
} from "@/constants/purchase";
import { paymentColumns } from "./payment-columns";
import { PaymentVoidDialog } from "./void-payment-dialog";

interface PaymentListProps {
    payments: ReceivingPayment[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    page: number;
    onPageChange: (page: number) => void;
    onAddClick: () => void;
    isLoading?: boolean;
    isFetching?: boolean;
    filterElement?: React.ReactNode;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    onSortChange?: (sortBy: string | undefined, sortOrder: "asc" | "desc" | undefined) => void;
}

export function PaymentList({
    payments,
    meta,
    page,
    onPageChange,
    onAddClick,
    isLoading = false,
    isFetching = false,
    filterElement,
    sortBy,
    sortOrder,
    onSortChange,
}: PaymentListProps) {
    const { data: session } = useSession();
    const router = useAppRouter();
    const deletePayment = useDeletePayment();

    const [voidPayment, setVoidPayment] = useState<ReceivingPayment | null>(null);
    const [isVoidOpen, setIsVoidOpen] = useState(false);

    const userRoles = session?.user?.roles || [];
    const userPermissions = session?.user?.permissions || [];
    const hasManagePurchase =
        hasRole(userRoles, "admin") ||
        hasPermission(userRoles, userPermissions, "manage_purchase");

    const handleDelete = (payment: ReceivingPayment) => {
        setVoidPayment(payment);
        setIsVoidOpen(true);
    };

    const handleConfirmVoid = (alasan: string) => {
        if (!voidPayment) return;
        deletePayment.mutate(
            { uid: voidPayment.uid, alasan },
            {
                onSuccess: () => {
                    toast.success("Transaksi pembayaran berhasil dibatalkan (void).");
                    setIsVoidOpen(false);
                    setVoidPayment(null);
                },
                onError: (err) => {
                    toast.error(err.message || "Gagal membatalkan pembayaran.");
                },
            }
        );
    };

    const handleEditClick = (payment: ReceivingPayment) => {
        router.push(`/admin/purchase/payment/new?edit=${payment.uid}`);
    };

    const handleDetailClick = (payment: ReceivingPayment) => {
        router.push(`/admin/purchase/payment/${payment.uid}`);
    };

    const columns = useMemo(
        () => paymentColumns,
        []
    );

    return (
        <section className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-2">
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900">
                        Pembayaran Invoices
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        Daftar riwayat pembayaran transaksi pembelian barang masuk ke supplier.
                    </p>
                </div>
                {hasManagePurchase && (
                    <Button
                        onClick={onAddClick}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl flex gap-1.5 cursor-pointer"
                    >
                        <IconPlus size={16} /> Catat Pembayaran
                    </Button>
                )}
            </div>

            {filterElement}

            <DataTable
                columns={columns}
                data={payments}
                isLoading={isLoading}
                isFetching={isFetching}
                emptyMessage="Belum ada transaksi pembayaran supplier."
                page={page}
                onPageChange={onPageChange}
                meta={meta}
                entityName="transaksi pembayaran"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={onSortChange}
                virtualize={true}
                estimateRowHeight={44}
                onView={handleDetailClick}
                onEdit={handleEditClick}
                hideEdit={() => true}
                onDelete={handleDelete}
                hideDelete={(p) => !(p.status === PAYMENT_TRANSACTION_STATUS.COMPLETED && hasManagePurchase)}
            />

            {/* Danger Void Payment Dialog */}
            <PaymentVoidDialog
                open={isVoidOpen}
                onOpenChange={setIsVoidOpen}
                payment={voidPayment}
                onConfirm={handleConfirmVoid}
                isLoading={deletePayment.isPending}
            />
        </section>
    );
}
