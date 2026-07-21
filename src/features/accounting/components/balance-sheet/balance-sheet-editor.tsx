"use client";

import { FormDatePicker } from "@/components/forms/form-date-picker";
import { FormInput } from "@/components/forms/form-input";
import { Card } from "@/components/ui/card";
import { useCreateManualJournal, useUpdateManualJournal } from "@/features/accounting/api/manual-journal-api";
import type { BalanceSheetData, BalanceSheetItem, ChartOfAccount } from "@/features/accounting/types";
import type { ManualJournal } from "@/features/accounting/types/manual-journal";
import { formatUTC, todayStr } from "@/lib/date-utils";
import { useBalanceSheetStore } from "@/stores/balance-sheet-store";
import {
    IconCoin,
    IconEdit,
    IconTrendingUp,
    IconWallet,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { BalanceSheetFooterActions } from "./balance-sheet-footer-actions";
import { BalanceSheetSectionCard } from "./balance-sheet-section-card";
import { BalanceSheetStatusCard } from "./balance-sheet-status-card";

interface ManualJournalDraftMeta {
    description: string;
    transaction_date: string;
}

interface BalanceSheetEditorProps {
    asOfDate: string;
    data: BalanceSheetData | undefined;
    flatAccounts: ChartOfAccount[] | undefined;
    journal: ManualJournal | undefined;
    action: string | null;
    journalUid: string | null;
    refetch: () => void;
}

export function BalanceSheetEditor({
    asOfDate,
    data,
    flatAccounts,
    journal,
    action,
    journalUid,
    refetch,
}: BalanceSheetEditorProps) {
    const router = useRouter();
    const createJournalMutation = useCreateManualJournal();
    const updateJournalMutation = useUpdateManualJournal();

    const [hasInitializedJournal, setHasInitializedJournal] = useState(false);
    const [hasInitializedNew, setHasInitializedNew] = useState(false);

    const {
        editedData,
        description,
        transactionDate,
        setEditing,
        initializeData,
        initializeFromJournal,
        setDescription,
        setTransactionDate,
        reset: resetStore,
    } = useBalanceSheetStore();

    const methods = useForm<ManualJournalDraftMeta>({
        defaultValues: {
            description: description || "Penyesuaian Neraca Keuangan",
            transaction_date: transactionDate || todayStr(),
        },
    });

    // Synchronize form description and transaction date to Zustand store
    useEffect(() => {
        // eslint-disable-next-line react-hooks/incompatible-library
        const subscription = methods.watch((value) => {
            if (value.description !== undefined) {
                setDescription(value.description || "");
            }
            if (value.transaction_date !== undefined) {
                setTransactionDate(value.transaction_date || "");
            }
        });
        return () => subscription.unsubscribe();
    }, [methods, setDescription, setTransactionDate]);

    // Reset initialization guard when journal or action changes
    useEffect(() => {
        setHasInitializedJournal(false);
        setHasInitializedNew(false);
    }, [journalUid, action]);

    // Initialize edit mode for NEW adjustments
    useEffect(() => {
        if (action === "new" && data && flatAccounts && !hasInitializedNew) {
            initializeData(data, flatAccounts);
            methods.reset({
                description: "Penyesuaian Neraca Keuangan",
                transaction_date: asOfDate,
            });
            setEditing(true);
            setHasInitializedNew(true);
        }
    }, [action, data, flatAccounts, hasInitializedNew, initializeData, methods, asOfDate, setEditing]);

    // Initialize edit mode for EXISTING manual journal
    useEffect(() => {
        if (action === "edit" && journal && flatAccounts && !hasInitializedJournal) {
            initializeFromJournal(journal, flatAccounts);
            methods.reset({
                description: journal.description || "Penyesuaian Neraca Keuangan",
                transaction_date: journal.transaction_date ? journal.transaction_date.substring(0, 10) : todayStr(),
            });
            setHasInitializedJournal(true);
            setEditing(true);
        }
    }, [action, journal, flatAccounts, hasInitializedJournal, initializeFromJournal, methods, setEditing]);

    const effectiveViewType = "equation";

    // 1. Calculate section values
    const sectionsData = useMemo(() => {
        if (editedData) {
            return {
                assets: editedData.assets,
                liabilities: editedData.liabilities,
                equity: editedData.equity,
                revenue: editedData.revenue,
                expense: editedData.expense,
                totalAssets: editedData.assets.reduce((sum, item) => sum + (item.amount || 0), 0),
                totalLiabilities: editedData.liabilities.reduce((sum, item) => sum + (item.amount || 0), 0),
                totalEquity: editedData.equity.reduce((sum, item) => sum + (item.amount || 0), 0),
                totalRevenue: editedData.revenue.reduce((sum, item) => sum + (item.amount || 0), 0),
                totalExpense: editedData.expense.reduce((sum, item) => sum + (item.amount || 0), 0),
            };
        }

        return {
            assets: [],
            liabilities: [],
            equity: [],
            revenue: [],
            expense: [],
            totalAssets: 0,
            totalLiabilities: 0,
            totalEquity: 0,
            totalRevenue: 0,
            totalExpense: 0,
        };
    }, [editedData]);

    const {
        assets,
        liabilities,
        equity,
        revenue,
        expense,
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalRevenue,
        totalExpense,
    } = sectionsData;

    const totalLeftVal = totalAssets + totalExpense;
    const totalRightVal = totalLiabilities + totalEquity + totalRevenue;
    const difference = Math.abs(totalLeftVal - totalRightVal);
    const isBalanced = difference < 0.1;

    // Calculate adjustment journal lines
    const adjustmentLines = useMemo(() => {
        if (!editedData) return [];

        const journalDesc = description || "Penyesuaian Neraca Keuangan";
        const lines: { chart_of_account_uid: string; description: string; debit: number; credit: number }[] = [];
        const isEditingExisting = action === "edit" && !!journalUid;

        if (isEditingExisting) {
            // Edit mode: post the full sheet values
            const pushSection = (items: typeof editedData.assets) => {
                items.forEach((item) => {
                    const debitVal = item.debit || 0;
                    const creditVal = item.credit || 0;
                    if (debitVal !== 0 || creditVal !== 0) {
                        lines.push({
                            chart_of_account_uid: item.uid,
                            description: `${journalDesc} - ${item.nama}`,
                            debit: debitVal,
                            credit: creditVal,
                        });
                    }
                });
            };
            pushSection(editedData.assets);
            pushSection(editedData.expense);
            pushSection(editedData.liabilities);
            pushSection(editedData.equity);
            pushSection(editedData.revenue);
        } else {
            // New adjustment: post delta values only vs original database values
            const originalByKode: Record<string, { debit: number; credit: number }> = {};
            const recordOriginals = (items?: BalanceSheetItem[]) => {
                (items || []).forEach((it) => {
                    const key = it.kode ?? "__null__";
                    originalByKode[key] = {
                        debit: it.debit || 0,
                        credit: it.credit || 0,
                    };
                });
            };

            recordOriginals(data?.assets?.items);
            recordOriginals(data?.liabilities?.items);
            recordOriginals(data?.equity?.items);
            recordOriginals(data?.revenue?.items);
            recordOriginals(data?.expense?.items);

            const sectionsKeys: Array<"assets" | "liabilities" | "equity" | "revenue" | "expense"> = [
                "assets", "liabilities", "equity", "revenue", "expense",
            ];

            for (const section of sectionsKeys) {
                const items = editedData[section];
                for (const item of items) {
                    if (item.kode === null) continue; // Skip synthetic Laba Rugi codes
                    const orig = originalByKode[item.kode] || { debit: 0, credit: 0 };

                    const deltaDebit = (item.debit || 0) - orig.debit;
                    const deltaCredit = (item.credit || 0) - orig.credit;

                    if (deltaDebit === 0 && deltaCredit === 0) continue;

                    lines.push({
                        chart_of_account_uid: item.uid,
                        description: `${journalDesc} - ${item.nama}`,
                        debit: deltaDebit,
                        credit: deltaCredit,
                    });
                }
            }
        }

        return lines;
    }, [editedData, action, journalUid, description, data]);

    const hasChanges = adjustmentLines.length > 0;

    // Save adjustment journal line items
    const handleSaveJournal = async (status: "draft" | "posted") => {
        if (!editedData || !hasChanges) return;

        const journalDesc = description || "Penyesuaian Neraca Keuangan";
        const lines = adjustmentLines;

        const isSavingPending = createJournalMutation.isPending || updateJournalMutation.isPending;
        if (isSavingPending) return;

        try {
            if (action === "edit" && journalUid) {
                await updateJournalMutation.mutateAsync({
                    uid: journalUid,
                    data: {
                        transaction_date: formatUTC(transactionDate),
                        description: journalDesc,
                        status,
                        lines,
                    },
                });
                toast.success(status === "posted" ? "Jurnal penyesuaian diposting!" : "Draf jurnal diperbarui!");
            } else {
                await createJournalMutation.mutateAsync({
                    transaction_date: formatUTC(transactionDate),
                    description: journalDesc,
                    status,
                    lines,
                });
                toast.success(status === "posted" ? "Jurnal penyesuaian diposting!" : "Draf jurnal disimpan!");
            }
            resetStore();
            refetch();
            router.push("/admin/accounting/journals");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Gagal menyimpan jurnal.";
            toast.error(msg);
        }
    };

    const isPending = createJournalMutation.isPending || updateJournalMutation.isPending;

    return (
        <div className="space-y-6">
            {/* Header Edit Mode */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div className="flex items-center gap-4">
                    <div className="relative flex items-center justify-center p-3.5 bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-850 text-white rounded-2xl shadow-lg shadow-amber-500/15 dark:shadow-amber-950/30 ring-4 ring-amber-50 dark:ring-amber-950/20 shrink-0">
                        <IconEdit className="w-6 h-6" />
                        <div className="absolute inset-0 bg-amber-500 rounded-2xl blur-lg opacity-25 -z-10" />
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                                {action === "edit" ? "Edit Jurnal Penyesuaian" : "Sesuaikan Neraca Keuangan"}
                            </h2>
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30 uppercase tracking-wider shadow-sm">
                                Mode Penyesuaian
                            </span>
                        </div>
                        <p className="text-xs text-slate-450 dark:text-slate-500 leading-relaxed max-w-xl">
                            Masukkan nominal Debit dan Kredit untuk masing-masing akun neraca. Nilai total selisih wajib seimbang (nol).
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Metadata Card */}
            <Card className="p-5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/65 rounded-3xl shadow-sm space-y-4">
                <FormProvider {...methods}>
                    <div className="flex flex-col sm:flex-row items-end gap-5">
                        <div className="flex-1 w-full">
                            <FormInput<ManualJournalDraftMeta>
                                name="description"
                                label="Deskripsi Jurnal Penyesuaian *"
                                placeholder="Deskripsi penyesuaian keuangan..."
                            />
                        </div>
                        <div className="w-full sm:w-[220px] shrink-0">
                            <FormDatePicker<ManualJournalDraftMeta>
                                name="transaction_date"
                                label="Tanggal Jurnal *"
                            />
                        </div>
                    </div>
                </FormProvider>
            </Card>

            {/* Balance Status Visual Card */}
            <BalanceSheetStatusCard
                isBalanced={isBalanced}
                totalAssets={totalLeftVal}
                totalLiabilitiesAndEquity={totalRightVal}
                difference={difference}
                leftLabel="Total Aset + Beban (A + B)"
                rightLabel="Liabilitas + Ekuitas + Pendapatan (L + E + P)"
                leftLegend="Aset & Beban"
                rightLegend="Liabilitas, Ekuitas & Pendapatan"
                hideUnbalancedButton={true}
            />

            {/* Single Column Grid in Edit Mode */}
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-6">
                    <BalanceSheetSectionCard
                        title="Aset"
                        description="Harta kekayaan perusahaan termasuk kas, rekening bank, piutang, dan stok persediaan barang dagang."
                        items={assets}
                        total={totalAssets}
                        accentColor="emerald"
                        totalLabel="Total Aset"
                        icon={<IconWallet className="w-4.5 h-4.5 text-emerald-500" />}
                        isEditing={true}
                        showDebitCredit={true}
                        sectionKey="assets"
                        coaList={flatAccounts || []}
                    />

                    <BalanceSheetSectionCard
                        title="Beban (Expenses)"
                        description="Biaya-biaya operasional, pengeluaran administratif, beban pembelian, serta penyusutan aset."
                        items={expense}
                        total={totalExpense}
                        accentColor="amber"
                        totalLabel="Total Beban"
                        icon={<IconTrendingUp className="w-4.5 h-4.5 text-amber-500" />}
                        isEditing={true}
                        showDebitCredit={true}
                        sectionKey="expense"
                        coaList={flatAccounts || []}
                    />
                </div>

                <div className="space-y-6">
                    <BalanceSheetSectionCard
                        title="Kewajiban (Liabilitas)"
                        description="Kewajiban finansial jangka pendek dan jangka panjang perusahaan kepada pihak lain."
                        items={liabilities}
                        total={totalLiabilities}
                        accentColor="amber"
                        totalLabel="Total Kewajiban"
                        icon={<IconCoin className="w-4.5 h-4.5 text-amber-500" />}
                        isEditing={true}
                        showDebitCredit={true}
                        sectionKey="liabilities"
                        coaList={flatAccounts || []}
                    />

                    <BalanceSheetSectionCard
                        title="Ekuitas"
                        description="Modal pemilik perusahaan beserta laba ditahan dan laba berjalan hasil operasional."
                        items={equity}
                        total={totalEquity}
                        accentColor="indigo"
                        totalLabel="Total Ekuitas"
                        icon={<IconTrendingUp className="w-4.5 h-4.5 text-indigo-500" />}
                        isEditing={true}
                        showDebitCredit={true}
                        sectionKey="equity"
                        coaList={flatAccounts || []}
                    />

                    <BalanceSheetSectionCard
                        title="Pendapatan (Revenues)"
                        description="Penerimaan dari omset hasil penjualan barang, pendapatan jasa, maupun penerimaan non-operasional."
                        items={revenue}
                        total={totalRevenue}
                        accentColor="indigo"
                        totalLabel="Total Pendapatan"
                        icon={<IconCoin className="w-4.5 h-4.5 text-indigo-500" />}
                        isEditing={true}
                        showDebitCredit={true}
                        sectionKey="revenue"
                        coaList={flatAccounts || []}
                    />
                </div>
            </div>

            {/* Sticky footer controls */}
            {editedData && (
                <BalanceSheetFooterActions
                    isBalanced={isBalanced}
                    difference={difference}
                    totalDebit={totalLeftVal}
                    totalCredit={totalRightVal}
                    viewType={effectiveViewType}
                    onCancel={() => {
                        resetStore();
                        router.push("/admin/accounting/journals");
                    }}
                    onSaveDraft={() => handleSaveJournal("draft")}
                    onPost={() => handleSaveJournal("posted")}
                    isPending={isPending}
                    hasDescriptionAndDate={!!description && !!transactionDate}
                    hasChanges={hasChanges}
                />
            )}
        </div>
    );
}
