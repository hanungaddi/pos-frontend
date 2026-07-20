"use client";

import {
    IconAlertTriangle,
    IconCheck,
    IconInfoCircle,
    IconPlus,
    IconScale,
    IconTrash
} from "@tabler/icons-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useMemo } from "react";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { FormNominalInput } from "@/components/forms/form-nominal-input";
import { FormSelect } from "@/components/forms/form-select";
import { BaseDialog } from "@/components/ui/base-dialog";
import { Button } from "@/components/ui/button";
import type { CommandOption } from "@/components/ui/command-select";
import { Scrollable } from "@/components/ui/scrollable";
import { useFlatChartOfAccounts } from "@/features/accounting/api/coa-api";
import { useBalanceEntry } from "@/features/accounting/api/ledger-api";
import type { GeneralLedgerEntry } from "@/features/accounting/types";
import { formatRupiah } from "@/hooks/use-format-rupiah";

interface BalanceAllocationFormItem {
    chartOfAccountUid: string;
    amount: number | string;
}

interface BalanceEntryFormValues {
    allocations: BalanceAllocationFormItem[];
}

interface BalanceEntryDialogProps {
    selectedEntry: GeneralLedgerEntry | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function BalanceEntryDialog({ selectedEntry, onClose, onSuccess }: BalanceEntryDialogProps) {
    const { data: coaData, isLoading: isLoadingCoas } = useFlatChartOfAccounts();
    const balanceMutation = useBalanceEntry();

    const dialogMethods = useForm<BalanceEntryFormValues>({
        values: {
            allocations: selectedEntry
                ? [
                      {
                          chartOfAccountUid: "",
                          amount: Math.abs(Number(selectedEntry.debit) - Number(selectedEntry.credit)),
                      },
                  ]
                : [{ chartOfAccountUid: "", amount: 0 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: dialogMethods.control,
        name: "allocations",
    });

    const watchedAllocations = useWatch({
        control: dialogMethods.control,
        name: "allocations",
    });

    const coaOptions = useMemo<CommandOption[]>(() => {
        if (!coaData) return [];
        return coaData
            .filter((c) => c.is_active)
            .map((c) => ({
                value: c.uid,
                label: `[${c.kode}] ${c.nama}`,
                description: `${c.tipe.toUpperCase()} — ${c.saldo_normal === "debit" ? "Debit" : "Kredit"}`,
            }));
    }, [coaData]);

    const selectedDiff = selectedEntry
        ? Math.abs(Number(selectedEntry.debit) - Number(selectedEntry.credit))
        : 0;

    const totalAllocated = useMemo(() => {
        if (!watchedAllocations) return 0;
        return watchedAllocations.reduce((sum, item) => {
            const val = Number(item?.amount);
            return sum + (isNaN(val) ? 0 : val);
        }, 0);
    }, [watchedAllocations]);

    const remainingDiff = selectedDiff - totalAllocated;
    const isExactMatch = Math.abs(remainingDiff) < 0.01;

    const isValidForm = useMemo(() => {
        if (!isExactMatch || !watchedAllocations || watchedAllocations.length === 0) return false;
        return watchedAllocations.every(
            (item) => !!item?.chartOfAccountUid && Number(item?.amount) > 0
        );
    }, [isExactMatch, watchedAllocations]);

    const handleAddAllocation = () => {
        const nextAmount = remainingDiff > 0 ? remainingDiff : 0;
        append({ chartOfAccountUid: "", amount: nextAmount });
    };

    const onSubmitBalanceEntry = dialogMethods.handleSubmit((values) => {
        if (!selectedEntry || !isValidForm) return;

        const allocationsPayload = values.allocations.map((item) => ({
            chart_of_account_uid: item.chartOfAccountUid,
            amount: Number(item.amount),
        }));

        balanceMutation.mutate(
            {
                unbalanced_uid: selectedEntry.uid,
                allocations: allocationsPayload,
            },
            {
                onSuccess: (res) => {
                    toast.success(res.message || "Entry balancing berhasil dibuat.");
                    onClose();
                    onSuccess();
                },
                onError: (err) => {
                    toast.error(err.message || "Gagal membuat entry balancing.");
                },
            }
        );
    });

    return (
        <BaseDialog
            open={!!selectedEntry}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title={
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <IconScale size={18} className="text-amber-500" />
                    <span>Pilih Akun Penyeimbang COA</span>
                </div>
            }
            className="sm:max-w-4xl"
            scrollable={false}
        >
            {selectedEntry && (
                <FormProvider {...dialogMethods}>
                    <form onSubmit={onSubmitBalanceEntry} className="flex flex-col max-h-[75vh] pt-2">
                        {/* Scrollable Modal Content Body */}
                        <Scrollable className="flex-1 max-h-[calc(75vh-50px)] min-h-0 pb-4" scrollbarClassName="z-40">
                            <div className="pr-2 space-y-6">
                                {/* 2-Column Grid: Left (Summary Info) vs Right (Multi-COA List) */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                    {/* ── Left Column: Summary & Info ── */}
                                    <div className="md:col-span-5 space-y-4">
                                        <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-4">
                                            {/* Card Title & Date */}
                                            <div className="flex items-center justify-between text-xs border-b border-slate-200/60 dark:border-slate-700/60 pb-2.5">
                                                <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                                                    Informasi Entri Jurnal
                                                </span>
                                                {selectedEntry.transaction_date && (
                                                    <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] bg-slate-200/50 dark:bg-slate-700/50 px-2 py-0.5 rounded-md">
                                                        {format(new Date(selectedEntry.transaction_date), "dd MMM yyyy", { locale: localeId })}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Akun Saat Ini */}
                                            <div className="space-y-1 text-xs">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                                                    Akun Utama
                                                </span>
                                                <div className="font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                                                    <span className="font-mono text-indigo-600 dark:text-indigo-400 mr-1.5 font-bold">
                                                        [{selectedEntry.kode ?? "-"}]
                                                    </span>
                                                    {selectedEntry.nama}
                                                </div>
                                            </div>

                                            {/* Values Breakdown: Stacked Rows for Large Amounts */}
                                            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs shadow-2xs">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Nilai Debit</span>
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs tabular-nums">
                                                        {Number(selectedEntry.debit) > 0 ? formatRupiah(Number(selectedEntry.debit)) : "Rp 0"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2">
                                                    <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Nilai Kredit</span>
                                                    <span className="font-bold text-rose-600 dark:text-rose-400 font-mono text-xs tabular-nums">
                                                        {Number(selectedEntry.credit) > 0 ? formatRupiah(Number(selectedEntry.credit)) : "Rp 0"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Prominent Highlight Card for Selisih Penyeimbang */}
                                            <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 rounded-xl border border-amber-200/80 dark:border-amber-900/40 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                                                        Total Selisih Penyeimbang
                                                    </span>
                                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-200/60 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                                                        Perlu Seimbang
                                                    </span>
                                                </div>
                                                <div className="text-lg font-black text-amber-700 dark:text-amber-400 font-mono tabular-nums tracking-tight">
                                                    {formatRupiah(selectedDiff)}
                                                </div>
                                            </div>

                                            {/* Keterangan & Referensi */}
                                            {selectedEntry.description && (
                                                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                                        Keterangan / Referensi
                                                    </span>
                                                    <p className="leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs font-normal">
                                                        {selectedEntry.description}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5 text-xs">
                                            <IconInfoCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                                            <p className="leading-relaxed text-[11px]">
                                                Sistem akan membuat jurnal penyeimbang secara otomatis menggunakan akun COA dan alokasi nominal di sebelah kanan untuk menetralkan selisih sebesar <strong>{formatRupiah(selectedDiff)}</strong>.
                                            </p>
                                        </div>
                                    </div>

                                    {/* ── Right Column: Multi-COA Allocations List ── */}
                                    <div className="md:col-span-7 space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                                                    Daftar Akun COA Penyeimbang
                                                </h4>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                    {fields.length} Akun
                                                </span>
                                            </div>
                                        </div>

                                        {/* Live Allocation Summary & Status Banner */}
                                        <div className="p-3.5 rounded-2xl border bg-slate-50/70 dark:bg-slate-900/40 space-y-2 border-slate-200/60 dark:border-slate-800">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-bold text-slate-700 dark:text-slate-300">Total Alokasi Saat Ini:</span>
                                                <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100">
                                                    {formatRupiah(totalAllocated)} / {formatRupiah(selectedDiff)}
                                                </span>
                                            </div>

                                            {isExactMatch ? (
                                                <div className="flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                                                    <IconCheck size={16} className="shrink-0" />
                                                    <span>Total alokasi cocok 100% dengan selisih penyeimbang.</span>
                                                </div>
                                            ) : remainingDiff > 0 ? (
                                                <div className="flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                                                    <IconAlertTriangle size={16} className="shrink-0" />
                                                    <span>Sisa yang belum dialokasikan: <strong>{formatRupiah(remainingDiff)}</strong></span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-[11px] text-rose-700 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/30 p-2 rounded-xl border border-rose-200/60 dark:border-rose-900/40">
                                                    <IconAlertTriangle size={16} className="shrink-0" />
                                                    <span>Total alokasi melebihi selisih sebesar: <strong>{formatRupiah(Math.abs(remainingDiff))}</strong></span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Dedicated Scrollable Allocation COA Fields Container */}
                                        <Scrollable className="max-h-[300px] sm:max-h-[340px] pr-2.5" scrollbarClassName="z-40">
                                            <div className="space-y-3">
                                                {fields.map((field, index) => (
                                                    <div
                                                        key={field.id}
                                                        className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs relative"
                                                    >
                                                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                                                            <span>Alokasi #{index + 1}</span>
                                                            {fields.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => remove(index)}
                                                                    className="text-rose-500 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                                                    title="Hapus Alokasi"
                                                                >
                                                                    <IconTrash size={15} />
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3 items-end">
                                                            <div>
                                                                <FormSelect
                                                                    name={`allocations.${index}.chartOfAccountUid`}
                                                                    label="Akun COA"
                                                                    options={coaOptions}
                                                                    placeholder="Pilih akun COA..."
                                                                    searchPlaceholder="Cari berdasarkan kode atau nama..."
                                                                    emptyMessage="Akun COA tidak ditemukan."
                                                                    isLoading={isLoadingCoas}
                                                                    className="w-full dark:bg-slate-950"
                                                                />
                                                            </div>

                                                            <div>
                                                                <FormNominalInput
                                                                    name={`allocations.${index}.amount`}
                                                                    label="Nominal (Rp)"
                                                                    placeholder="0"
                                                                    className="font-mono text-right font-bold text-slate-800 dark:text-slate-100"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </Scrollable>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleAddAllocation}
                                            className="w-full border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-xl h-9 flex items-center justify-center gap-1.5"
                                        >
                                            <IconPlus size={15} />
                                            Tambah Akun Penyeimbang
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Scrollable>

                        {/* Sticky Dialog Footer Actions */}
                        <div className="shrink-0 flex items-center justify-end gap-3 pt-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={balanceMutation.isPending}
                                className="rounded-xl text-xs font-semibold"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={balanceMutation.isPending || !isValidForm}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                            >
                                {balanceMutation.isPending ? (
                                    "Menyimpan..."
                                ) : (
                                    <>
                                        <IconCheck size={16} />
                                        Simpan Entry Penyeimbang
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </FormProvider>
            )}
        </BaseDialog>
    );
}
