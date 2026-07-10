"use client";

import { FormDatePicker } from "@/components/forms/form-date-picker";
import { FormInput } from "@/components/forms/form-input";
import { FormNominalInput } from "@/components/forms/form-nominal-input";
import { FormSelect } from "@/components/forms/form-select";
import { FormTextarea } from "@/components/forms/form-textarea";
import { BaseDialog } from "@/components/ui/base-dialog";
import { Button } from "@/components/ui/button";
import { useCashAccounts } from "@/features/cash/api/cash-api";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import { formatUTC, todayStr } from "@/lib/date-utils";
import { IconCoin } from "@tabler/icons-react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { useCreateExpense, useExpenseCategories, useUpdateExpense } from "../api/expenses-api";
import type { ExpenseInput } from "../schemas/expense-schema";
import type { Expense } from "../types";

interface ExpenseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingExpense?: Expense | null;
}

export function ExpenseDialog({
    open,
    onOpenChange,
    editingExpense = null,
}: ExpenseDialogProps) {
    const createExpense = useCreateExpense();
    const updateExpense = useUpdateExpense();
    const isEdit = !!editingExpense;

    const { handleSubmit } = useFormContext<ExpenseInput>();
    const isPending = createExpense.isPending || updateExpense.isPending;

    const { data: categories = [], isLoading: isCategoriesLoading } = useExpenseCategories();
    const { data: cashAccounts = [], isLoading: isCashLoading } = useCashAccounts();

    const onSubmit = (data: ExpenseInput) => {
        const formattedData = {
            ...data,
            tanggal: formatUTC(data.tanggal || todayStr()),
        };

        if (isEdit && editingExpense) {
            updateExpense.mutate(
                { uid: editingExpense.uid, data: formattedData },
                {
                    onSuccess: () => {
                        toast.success("Catatan pengeluaran berhasil diperbarui.");
                        onOpenChange(false);
                    },
                    onError: (err) => {
                        toast.error(err.message || "Gagal memperbarui catatan pengeluaran.");
                    },
                },
            );
        } else {
            createExpense.mutate(formattedData, {
                onSuccess: () => {
                    toast.success("Pengeluaran berhasil dicatat.");
                    onOpenChange(false);
                },
                onError: (err) => {
                    toast.error(err.message || "Gagal mencatat pengeluaran.");
                },
            });
        }
    };

    const categoryOptions = categories.map((c) => ({
        value: String(c.uid),
        label: c.nama + (c.is_recurring ? " (Berulang)" : ""),
    }));

    const accountOptions = cashAccounts.map((a) => ({
        value: String(a.uid),
        label: a.nama,
        description: `Saldo: ${formatRupiah(a.saldo)}`,
    }));

    return (
        <BaseDialog
            open={open}
            onOpenChange={onOpenChange}
            title={
                <>
                    <IconCoin size={20} className="text-emerald-500" />
                    <span>{isEdit ? "Ubah Catatan Pengeluaran" : "Catat Transaksi Pengeluaran"}</span>
                </>
            }
            className="sm:max-w-lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                    {/* Kategori Pengeluaran */}
                    <FormSelect<ExpenseInput>
                        name="expense_category_uid"
                        label="Kategori Pengeluaran *"
                        options={categoryOptions}
                        placeholder="Pilih kategori..."
                        isLoading={isCategoriesLoading}
                        disabled={isPending}
                    />

                    {/* Akun Sumber Kas */}
                    <FormSelect<ExpenseInput>
                        name="cash_account_uid"
                        label="Sumber Kas (Akun) *"
                        options={accountOptions}
                        placeholder="Pilih sumber dana kas..."
                        isLoading={isCashLoading}
                        disabled={isPending}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Nominal Jumlah */}
                    <FormNominalInput<ExpenseInput>
                        name="amount"
                        label="Nominal Jumlah *"
                        placeholder="Masukkan nominal pengeluaran..."
                        disabled={isPending}
                    />

                    {/* Tanggal Transaksi */}
                    <FormDatePicker<ExpenseInput>
                        name="tanggal"
                        label="Tanggal Transaksi *"
                        placeholder="Pilih tanggal transaksi..."
                        disabled={isPending}
                    />
                </div>

                {/* Deskripsi Singkat */}
                <FormInput<ExpenseInput>
                    name="nama"
                    label="Nama / Keperluan Pengeluaran"
                    placeholder="Contoh: Bayar Listrik Ruko Juni, Pembelian ATK..."
                    disabled={isPending}
                />

                {/* Catatan Tambahan */}
                <FormTextarea<ExpenseInput>
                    name="catatan"
                    label="Catatan Tambahan"
                    placeholder="Masukkan rincian tambahan jika diperlukan..."
                    disabled={isPending}
                />

                <Button
                    type="submit"
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer mt-4 border-none"
                    disabled={isPending}
                >
                    {isPending ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Catatan Pengeluaran"}
                </Button>
            </form>
        </BaseDialog>
    );
}
