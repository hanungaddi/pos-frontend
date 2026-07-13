"use client";

import { FormInput } from "@/components/forms/form-input";
import { FormNominalInput } from "@/components/forms/form-nominal-input";
import { FormSwitch } from "@/components/forms/form-switch";
import { Button } from "@/components/ui/button";
import { BaseDialog } from "@/components/ui/base-dialog";
import { IconCash } from "@tabler/icons-react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { useCreateCashDrawer, useUpdateCashDrawer } from "../api/cash-drawers-api";
import { type CashDrawerInput } from "../schemas/cash-drawer-schema";
import type { CashDrawer } from "../types";

interface CashDrawerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingDrawer?: CashDrawer | null;
}

export function CashDrawerDialog({
    open,
    onOpenChange,
    editingDrawer = null,
}: CashDrawerDialogProps) {
    const createDrawer = useCreateCashDrawer();
    const updateDrawer = useUpdateCashDrawer();
    const isEdit = !!editingDrawer;

    const { handleSubmit } = useFormContext<CashDrawerInput>();

    const isPending = createDrawer.isPending || updateDrawer.isPending;

    const onSubmit = (data: CashDrawerInput) => {
        if (isEdit && editingDrawer) {
            updateDrawer.mutate(
                { uid: editingDrawer.uid, data },
                {
                    onSuccess: () => {
                        toast.success("Laci kasir berhasil diperbarui.");
                        onOpenChange(false);
                    },
                    onError: (err) => {
                        toast.error(err.message || "Gagal memperbarui laci kasir.");
                    },
                },
            );
        } else {
            createDrawer.mutate(data, {
                onSuccess: () => {
                    toast.success("Laci kasir berhasil dibuat.");
                    onOpenChange(false);
                },
                onError: (err) => {
                    toast.error(err.message || "Gagal membuat laci kasir.");
                },
            });
        }
    };

    return (
        <BaseDialog
            open={open}
            onOpenChange={onOpenChange}
            title={
                <>
                    <IconCash size={20} className="text-emerald-500" />
                    <span>
                        {isEdit ? "Ubah Laci Kasir" : "Tambah Laci Kasir Baru"}
                    </span>
                </>
            }
            className="max-w-md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <FormInput<CashDrawerInput>
                    name="nama"
                    label="Nama Laci Kasir *"
                    placeholder="Laci Kasir Utama, Laci Kasir 2, ..."
                    disabled={isPending}
                />

                <FormNominalInput<CashDrawerInput>
                    name="saldo"
                    label="Saldo Awal (Rp)"
                    placeholder="0"
                    disabled={isPending}
                />

                {isEdit && (
                    <FormSwitch<CashDrawerInput>
                        name="is_active"
                        label="Active"
                        disabled={isPending}
                    />
                )}

                <Button
                    type="submit"
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                    disabled={isPending}
                >
                    {isPending ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Laci Kasir"}
                </Button>
            </form>
        </BaseDialog>
    );
}
