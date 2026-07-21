"use client";

import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormTextarea } from "@/components/forms/form-textarea";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import type { MemberPayment } from "@/features/members/api/members-api";

const voidPaymentSchema = z.object({
    alasan: z.string().min(1, "Alasan pembatalan wajib diisi."),
});

type VoidPaymentInput = z.infer<typeof voidPaymentSchema>;

interface MemberPaymentVoidDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    payment: MemberPayment | null;
    onConfirm: (alasan: string) => Promise<void> | void;
    isLoading?: boolean;
}

export function MemberPaymentVoidDialog({
    open,
    onOpenChange,
    payment,
    onConfirm,
    isLoading = false,
}: MemberPaymentVoidDialogProps) {
    const methods = useForm<VoidPaymentInput>({
        resolver: zodResolver(voidPaymentSchema),
        defaultValues: {
            alasan: "",
        },
    });

    useEffect(() => {
        if (open) {
            methods.reset({ alasan: "" });
        }
    }, [open, methods]);

    if (!payment) return null;

    const handleConfirm = methods.handleSubmit((data) => {
        return onConfirm(data.alasan);
    });

    const memberName = payment.member?.nama;

    const descriptionContent = (
        <div className="space-y-4 text-left mt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal text-center">
                Transaksi pembayaran hutang member yang dibatalkan tidak dapat dikembalikan dan sisa hutang member akan dihitung ulang.
            </p>

            {/* Transaction details card */}
            <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/60 dark:border-rose-900/30 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>No. Pembayaran:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{payment.nomor_pembayaran}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Nominal Bayar:</span>
                    <span className="font-extrabold text-rose-600 dark:text-rose-400 font-mono text-sm">{formatRupiah(payment.jumlah_bayar)}</span>
                </div>
                {memberName && (
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 border-t border-rose-100/40 dark:border-rose-900/20 pt-1.5">
                        <span>Member:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{memberName}</span>
                    </div>
                )}
            </div>

            {/* Input Alasan */}
            <FormTextarea<VoidPaymentInput>
                name="alasan"
                label="Alasan Pembatalan *"
                placeholder="Contoh: Salah input jumlah..."
                rows={3}
                disabled={isLoading}
                className="dark:bg-slate-900 focus:border-rose-500 focus:ring-rose-500"
            />
        </div>
    );

    return (
        <FormProvider {...methods}>
            <ConfirmDialog
                open={open}
                onOpenChange={onOpenChange}
                variant="danger"
                title="Batalkan Pembayaran Hutang (Void)"
                description={descriptionContent}
                confirmText="Ya, Batalkan Pembayaran"
                cancelText="Batal"
                onConfirm={handleConfirm}
                isLoading={isLoading}
            />
        </FormProvider>
    );
}
