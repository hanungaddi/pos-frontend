"use client";

import { FormInput } from "@/components/forms/form-input";
import { FormNominalInput } from "@/components/forms/form-nominal-input";
import { Button } from "@/components/ui/button";
import { canAccessAdmin } from "@/constants/roles";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import { signOut } from "@/lib/auth-helpers";
import { useCheckoutStore } from "@/stores/checkout-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconChevronLeft, IconDoorExit, IconLoader2 } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { FormProvider, useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { useCloseCashDrawer } from "../../api/cash-drawer-api";
import { closeCashDrawerSchema, type CloseCashDrawerInput } from "../../schemas/cash-drawer-schema";
import { db } from "@/lib/db";

interface CloseShiftFormProps {
    sessionId: string;
    expectedCash: number;
    token?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function CloseShiftForm({
    sessionId,
    expectedCash,
    token,
    onSuccess,
    onCancel,
}: CloseShiftFormProps) {
    const closeMutation = useCloseCashDrawer();
    const { data: session } = useSession();
    const isAdmin = canAccessAdmin(session?.user?.roles || []);

    const methods = useForm<CloseCashDrawerInput>({
        resolver: zodResolver(closeCashDrawerSchema) as Resolver<CloseCashDrawerInput>,
        defaultValues: {
            actual_closing_balance: null as unknown as number,
            closing_note: "",
        },
    });

    const { handleSubmit, formState: { isSubmitting } } = methods;

    const actualClosing = useWatch({ control: methods.control, name: "actual_closing_balance" });
    const hasEnteredBalance = actualClosing !== null && actualClosing !== undefined && actualClosing !== ("" as unknown as number);
    const diff = hasEnteredBalance ? Number(actualClosing) - expectedCash : 0;

    const onSubmit = async (data: CloseCashDrawerInput) => {
        const storeCart = useCheckoutStore.getState().cart;
        const storeHoldList = useCheckoutStore.getState().holdList;

        if (storeCart.length > 0 || storeHoldList.length > 0) {
            toast.error(
                "Tidak dapat menutup shift! Masih terdapat transaksi gantung (keranjang belanja aktif atau transaksi hold). Selesaikan atau batalkan (void) transaksi tersebut terlebih dahulu."
            );
            return;
        }

        // Check for unsynced offline transactions
        try {
            const pendingCount = await db.offlineTransactions
                .where("status")
                .equals("pending")
                .count();

            if (pendingCount > 0) {
                toast.error(
                    `Tidak dapat menutup shift! Masih terdapat ${pendingCount} transaksi offline yang belum disinkronisasi ke server. Silakan kirimkan transaksi tersebut terlebih dahulu.`
                );
                return;
            }
        } catch (dbErr) {
            console.error("Gagal memeriksa transaksi offline pending:", dbErr);
        }

        try {
            await closeMutation.mutateAsync({
                session: sessionId,
                payload: {
                    actual_closing_balance: data.actual_closing_balance,
                    closing_note: data.closing_note?.trim() || undefined,
                },
                token,
            });

            // Clear checkout Zustand store client-side state on successful shift close
            useCheckoutStore.getState().clearCart();
            useCheckoutStore.getState().clearHoldList();

            toast.success("Sesi shift laci kasir berhasil ditutup.");
            onSuccess();
            if (!isAdmin) {
                await signOut({ callbackUrl: "/login" });
            }
        } catch (err) {
            const error = err as Error;
            toast.error(error.message || "Gagal menutup laci kasir.");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* ── Symmetric Header ── */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <button
                    type="button"
                    onClick={onCancel}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer border-none bg-transparent shrink-0"
                    disabled={closeMutation.isPending || isSubmitting}
                >
                    <IconChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-slate-900">Akhiri Shift &amp; Hitung Uang Laci</span>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-400">Total Perkiraan di Laci (Expected Cash)</span>
                <span className="text-slate-800 font-bold text-[13px] tabular-nums">
                    {formatRupiah(expectedCash)}
                </span>
            </div>

            <div className="space-y-4 pt-2">
                <FormProvider {...methods}>
                    <FormNominalInput<CloseCashDrawerInput>
                        name="actual_closing_balance"
                        label="Jumlah Saldo Akhir Nyata (Fisik Laci)"
                        placeholder="0"
                        disabled={closeMutation.isPending || isSubmitting}
                        autoFocus
                    />

                    {hasEnteredBalance && !isNaN(Number(actualClosing)) && (
                        <div className="text-[11px] font-bold mt-1.5 flex justify-between px-1">
                            <span className="text-slate-400">Selisih Hitung:</span>
                            {diff === 0 ? (
                                <span className="text-emerald-600 font-extrabold">Pas (Tidak ada selisih)</span>
                            ) : diff > 0 ? (
                                <span className="text-blue-600 font-extrabold">Kelebihan: +{formatRupiah(diff)}</span>
                            ) : (
                                <span className="text-rose-600 font-extrabold">Kekurangan: {formatRupiah(diff)}</span>
                            )}
                        </div>
                    )}

                    <FormInput<CloseCashDrawerInput>
                        name="closing_note"
                        label="Catatan Penutupan Shift (Opsional)"
                        type="text"
                        placeholder="Contoh: Selisih kurang seribu rupiah."
                        disabled={closeMutation.isPending || isSubmitting}
                    />
                </FormProvider>

                <div className="flex gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="grow h-11 border-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer bg-white"
                        disabled={closeMutation.isPending || isSubmitting}
                    >
                        Kembali
                    </Button>
                    <Button
                        type="submit"
                        disabled={closeMutation.isPending || isSubmitting}
                        className="grow h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer border-none shadow-lg shadow-rose-600/10"
                    >
                        {closeMutation.isPending || isSubmitting ? (
                            <IconLoader2 size={16} className="animate-spin" />
                        ) : (
                            <IconDoorExit size={16} />
                        )}
                        <span>Akhiri Shift & Hitung Laci</span>
                    </Button>
                </div>
            </div>
        </form>
    );
}
