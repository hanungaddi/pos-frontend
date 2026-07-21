"use client";

import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconAlertTriangle, IconLoader2, IconBan } from "@tabler/icons-react";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import { FormTextarea } from "@/components/forms/form-textarea";
import type { ReceivingPayment } from "@/features/purchase/types";

const voidPaymentSchema = z.object({
    alasan: z.string().min(1, "Alasan pembatalan wajib diisi."),
});

type VoidPaymentInput = z.infer<typeof voidPaymentSchema>;

interface PaymentVoidDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    payment: ReceivingPayment | null;
    onConfirm: (alasan: string) => Promise<void> | void;
    isLoading?: boolean;
}

export function PaymentVoidDialog({
    open,
    onOpenChange,
    payment,
    onConfirm,
    isLoading = false,
}: PaymentVoidDialogProps) {
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

    const handleSubmit = methods.handleSubmit((data) => {
        onConfirm(data.alasan);
    });

    const supplierName = payment.stock_receiving?.supplier_relationship?.nama || payment.stock_receiving?.supplier;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 gap-0 border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                showCloseButton={false}
            >
                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex flex-col items-center text-center">
                            {/* Danger Icon Container */}
                            <div className="w-12 h-12 rounded-full border bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50 flex items-center justify-center mb-4 animate-in fade-in zoom-in-75 duration-300">
                                <IconAlertTriangle size={24} stroke={2} />
                            </div>

                            <DialogHeader className="gap-1 mb-2">
                                <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center justify-center gap-1.5">
                                    <span>Batalkan Pembayaran (Void)</span>
                                </DialogTitle>
                                <DialogDescription render={<div />} className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                                    Transaksi pembayaran yang dibatalkan tidak dapat dikembalikan dan sisa hutang supplier akan dihitung ulang.
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        {/* Transaction details card */}
                        <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/60 dark:border-rose-900/30 rounded-xl p-3.5 space-y-2 text-xs">
                            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                <span>No. Transaksi:</span>
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{payment.nomor_transaksi}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                <span>Nominal Bayar:</span>
                                <span className="font-extrabold text-rose-600 dark:text-rose-400 font-mono text-sm">{formatRupiah(payment.total)}</span>
                            </div>
                            {supplierName && (
                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 border-t border-rose-100/40 dark:border-rose-900/20 pt-1.5">
                                    <span>Supplier:</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{supplierName}</span>
                                </div>
                            )}
                        </div>

                        {/* FormTextarea */}
                        <FormTextarea<VoidPaymentInput>
                            name="alasan"
                            label="Alasan Pembatalan *"
                            placeholder="Contoh: Salah nominal transaksi, kesalahan rekening kas..."
                            rows={3}
                            disabled={isLoading}
                        />

                        {/* Buttons */}
                        <div className="w-full flex flex-col sm:flex-row gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full sm:w-auto flex-1 h-10 text-xs font-bold border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 rounded-xl cursor-pointer order-2 sm:order-1"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full sm:w-auto flex-1 h-10 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer order-1 sm:order-2 focus-visible:ring-rose-500"
                            >
                                {isLoading ? (
                                    <IconLoader2 size={14} className="animate-spin" />
                                ) : (
                                    <IconBan size={15} />
                                )}
                                <span>Ya, Batalkan Pembayaran</span>
                            </Button>
                        </div>
                    </form>
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
}
