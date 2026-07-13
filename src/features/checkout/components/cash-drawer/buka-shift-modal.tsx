"use client";

import React from "react";
import { useForm, FormProvider, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BaseDialog } from "@/components/ui/base-dialog";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/forms/form-input";
import { FormNominalInput } from "@/components/forms/form-nominal-input";
import { toast } from "sonner";
import { useOpenCashDrawer } from "../../api/cash-drawer-api";
import { openCashDrawerSchema, type OpenCashDrawerInput } from "../../schemas/cash-drawer-schema";
import { IconLock, IconLoader2, IconDeviceFloppy, IconLogout, IconHome } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { signOut } from "@/lib/auth-helpers";
import { useAppRouter } from "@/hooks/use-app-router";
import { canAccessAdmin } from "@/constants/roles";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface BukaShiftModalProps {
    open: boolean;
    token?: string;
    onSuccess: (sessionId: string) => void;
    isLoading?: boolean;
    isOnline?: boolean;
}

export function BukaShiftModal({
    open,
    token,
    onSuccess,
    isLoading = false,
    isOnline = true,
}: BukaShiftModalProps) {
    const { data: session } = useSession();
    const router = useAppRouter();
    const userRoles = session?.user?.roles || [];
    const showAdminBtn = canAccessAdmin(userRoles);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = React.useState(false);

    const openMutation = useOpenCashDrawer();

    const methods = useForm<OpenCashDrawerInput>({
        resolver: zodResolver(openCashDrawerSchema) as Resolver<OpenCashDrawerInput>,
        defaultValues: {
            opening_balance: 100000,
            opening_note: "Modal awal shift.",
        },
    });

    const { handleSubmit, formState: { isSubmitting } } = methods;

    const onSubmit = async (data: OpenCashDrawerInput) => {
        try {
            const res = await openMutation.mutateAsync({
                payload: {
                    opening_balance: data.opening_balance,
                    opening_note: data.opening_note?.trim() || undefined,
                },
                token,
            });

            if (res?.data?.uid) {
                toast.success("Shift kasir berhasil dibuka!");
                onSuccess(res.data.uid);
            } else {
                toast.error("Gagal mendapatkan ID sesi laci kasir.");
            }
        } catch (err) {
            const error = err as Error;
            const message = error.message || "Gagal membuka laci kasir.";
            toast.error(message);
        }
    };

    const isFormDisabled = openMutation.isPending || isSubmitting || isLoading || !isOnline;

    return (
        <>
            <BaseDialog
                open={open}
                onOpenChange={() => { }}
                title={
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            {isFormDisabled ? (
                                <IconLoader2 size={16} className="animate-spin text-emerald-600" />
                            ) : (
                                <IconLock size={16} />
                            )}
                        </div>
                        <div>
                            <span className="block text-sm font-extrabold">Buka Shift Laci Kasir</span>
                            <span className="block text-[11px] font-medium text-slate-400 mt-0.5">
                                {isLoading
                                    ? "Memeriksa status sesi laci kasir..."
                                    : "Masukkan saldo awal laci untuk memulai shift."}
                            </span>
                        </div>
                    </div>
                }
                className="max-w-md"
                showCloseButton={false}
            >
                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit)} className="pt-4 space-y-4">
                        {!isOnline && (
                            <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3.5 rounded-xl text-xs font-semibold leading-relaxed">
                                Koneksi internet terputus. Anda harus online untuk dapat membuka shift laci kasir baru. Silakan hubungkan komputer ke jaringan internet.
                            </div>
                        )}
                        <FormNominalInput<OpenCashDrawerInput>
                            name="opening_balance"
                            label="Saldo Awal (Rp)"
                            placeholder="0"
                            disabled={isFormDisabled}
                        />

                        <FormInput<OpenCashDrawerInput>
                            name="opening_note"
                            label="Catatan Pembukaan (Opsional)"
                            type="text"
                            placeholder="Contoh: Modal awal shift pagi."
                            disabled={isFormDisabled}
                        />

                        <div className="space-y-3 pt-2">
                            <Button
                                type="submit"
                                disabled={isFormDisabled}
                                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/10 active:scale-[0.99] transition-all disabled:opacity-50 border-none"
                            >
                                {isFormDisabled ? (
                                    <IconLoader2 size={16} className="animate-spin" />
                                ) : (
                                    <IconDeviceFloppy size={16} />
                                )}
                                <span>
                                    {isLoading
                                        ? "Memeriksa Sesi..."
                                        : (openMutation.isPending || isSubmitting)
                                            ? "Membuka Laci..."
                                            : "Mulai Shift (Buka Laci)"}
                                </span>
                            </Button>

                            <div className={cn("grid gap-3", showAdminBtn ? "grid-cols-2" : "grid-cols-1")}>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        if (!isOnline) {
                                            toast.error("Koneksi terputus. Harap sambungkan ke internet sebelum logout.");
                                            return;
                                        }
                                        setIsLogoutConfirmOpen(true);
                                    }}
                                    className="h-11 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer bg-white w-full"
                                    disabled={isFormDisabled}
                                >
                                    <IconLogout size={16} />
                                    <span>Logout</span>
                                </Button>

                                {showAdminBtn && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.push("/admin")}
                                        className="h-11 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer bg-white w-full"
                                        disabled={isFormDisabled}
                                    >
                                        <IconHome size={16} />
                                        <span>Kembali ke Admin</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </form>
                </FormProvider>
            </BaseDialog>

            <ConfirmDialog
                open={isLogoutConfirmOpen}
                onOpenChange={setIsLogoutConfirmOpen}
                title="Keluar dari Akun"
                description="Apakah Anda yakin ingin keluar dari aplikasi? Sesi Anda saat ini akan diakhiri."
                confirmText="Ya, Keluar"
                cancelText="Batal"
                variant="danger"
                onConfirm={async () => {
                    await signOut({ callbackUrl: "/login" });
                }}
            />
        </>
    );
}
