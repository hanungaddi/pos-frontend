"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { FormSelect } from "@/components/forms/form-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import { cn } from "@/lib/utils";
import { useBalanceSheetStore } from "@/stores/balance-sheet-store";
import type { ChartOfAccount } from "@/features/accounting/types";
import {
    IconWallet,
    IconBuildingBank,
    IconReceipt,
    IconCoin,
    IconReportMoney,
    IconTrash,
    IconPlus,
    IconCheck,
    IconX
} from "@tabler/icons-react";

// Reusable Helper to map account icons
const getAccountIcon = (nama: string) => {
    const lowerName = nama.toLowerCase();
    if (lowerName.includes("kas") || lowerName.includes("tunai") || lowerName.includes("cash")) {
        return <IconWallet className="w-4 h-4 text-emerald-500" />;
    }
    if (lowerName.includes("bank") || lowerName.includes("giro")) {
        return <IconBuildingBank className="w-4 h-4 text-blue-500" />;
    }
    if (lowerName.includes("piutang") || lowerName.includes("receivable")) {
        return <IconReceipt className="w-4 h-4 text-sky-500" />;
    }
    if (lowerName.includes("persediaan") || lowerName.includes("stok") || lowerName.includes("inventory")) {
        return <IconReportMoney className="w-4 h-4 text-indigo-500" />;
    }
    if (lowerName.includes("utang") || lowerName.includes("hutang") || lowerName.includes("payable")) {
        return <IconCoin className="w-4 h-4 text-amber-500" />;
    }
    return <IconReportMoney className="w-4 h-4 text-slate-400" />;
};

interface BalanceSheetSectionCardProps {
    title: string;
    description: string;
    items: { uid?: string; kode: string | null; nama: string; amount: number; debit?: number; credit?: number }[];
    total: number;
    accentColor: "emerald" | "amber" | "indigo";
    totalLabel: string;
    icon: React.ReactNode;
    isEditing?: boolean;
    showDebitCredit?: boolean;
    sectionKey?: "assets" | "liabilities" | "equity" | "revenue" | "expense";
    coaList?: ChartOfAccount[];
}

export function BalanceSheetSectionCard({
    title,
    description,
    items = [],
    total,
    accentColor,
    totalLabel,
    icon,
    isEditing = false,
    showDebitCredit = false,
    sectionKey,
    coaList = []
}: BalanceSheetSectionCardProps) {
    const { updateItemDebitCredit, removeItem, addItem } = useBalanceSheetStore();
    const [isAdding, setIsAdding] = useState(false);

    const addMethods = useForm<{ selectedAccountUid: string }>({
        defaultValues: {
            selectedAccountUid: "",
        },
    });

    // eslint-disable-next-line react-hooks/incompatible-library
    const watchedAccountUid = addMethods.watch("selectedAccountUid");

    const borderColors = {
        emerald: "border-t-emerald-500",
        amber: "border-t-amber-500",
        indigo: "border-t-indigo-500"
    };

    const bgTotals = {
        emerald: "bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-800 dark:text-emerald-450 border-emerald-100 dark:border-emerald-900/30",
        amber: "bg-amber-50/50 dark:bg-amber-950/10 text-amber-800 dark:text-amber-450 border-amber-100 dark:border-amber-900/30",
        indigo: "bg-indigo-50/50 dark:bg-indigo-950/10 text-indigo-800 dark:text-indigo-450 border-indigo-100 dark:border-indigo-900/30"
    };

    const getTargetCoaType = () => {
        if (sectionKey === "assets") return "asset";
        if (sectionKey === "liabilities") return "liability";
        if (sectionKey === "equity") return "equity";
        if (sectionKey === "revenue") return "revenue";
        if (sectionKey === "expense") return "expense";
        return "";
    };

    const targetType = getTargetCoaType();
    const availableCoas = coaList
        .filter((coa) => coa.is_active && coa.tipe === targetType)
        .filter((coa) => !items.some((item) => item.kode === coa.kode))
        .sort((a, b) => a.kode.localeCompare(b.kode));

    const handleAddAccount = () => {
        const uid = addMethods.getValues("selectedAccountUid");
        if (!uid || !sectionKey) return;
        const coa = coaList.find((c) => c.uid === uid);
        if (coa) {
            addItem(sectionKey, {
                uid: coa.uid,
                kode: coa.kode,
                nama: coa.nama,
            });
            addMethods.reset({ selectedAccountUid: "" });
            setIsAdding(false);
        }
    };

    // Filter displayed items in view mode to only show non-zero balances
    const displayedItems = isEditing 
        ? items 
        : items.filter((item) => (item.debit || 0) !== 0 || (item.credit || 0) !== 0 || (item.amount || 0) !== 0);

    // If indeed there are no COA items in view mode, DO NOT display this card!
    if (!isEditing && displayedItems.length === 0) {
        return null;
    }

    const totalDebit = items.reduce((sum, item) => sum + (item.debit || 0), 0);
    const totalCredit = items.reduce((sum, item) => sum + (item.credit || 0), 0);

    const fmtLedger = (n: number) => (n ? formatRupiah(n) : "Rp 0");

    return (
        <Card className={cn("bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden border-t-2", borderColors[accentColor])}>
            <CardHeader className="pb-4 px-6 pt-5">
                <div className="flex items-center gap-2">
                    {icon}
                    <CardTitle className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">{title}</CardTitle>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                    {description}
                </p>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[10px] font-bold uppercase tracking-wider text-slate-400/80 select-none">
                                <th className="py-3 px-6 text-left">Akun</th>
                                {isEditing ? (
                                    <>
                                        <th className="py-3 px-4 text-right w-[170px]">Debit</th>
                                        <th className="py-3 px-4 text-right w-[170px]">Kredit</th>
                                        <th className="py-3 px-6 text-center w-[80px]">Aksi</th>
                                    </>
                                ) : (
                                    <>
                                        {showDebitCredit && (
                                            <>
                                                <th className="py-3 px-4 text-right w-[150px]">Debit</th>
                                                <th className="py-3 px-4 text-right w-[150px]">Kredit</th>
                                            </>
                                        )}
                                        <th className="py-3 px-6 text-right w-[160px]">Saldo Bersih</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/60 dark:divide-slate-800/40">
                            {displayedItems.map((item, idx) => {
                                const percentVal = total > 0 ? (item.amount / total) * 100 : 0;
                                const formattedPercent = percentVal > 0 && percentVal < 0.1
                                    ? "< 0.1%"
                                    : `${percentVal.toFixed(percentVal % 1 === 0 ? 0 : 1)}%`;
                                return (
                                    <tr key={`${item.uid || item.kode}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                                        <td className="py-3.5 px-6 text-left">
                                            <div className="space-y-0.5">
                                                <span className="text-[10px] font-mono text-slate-450 dark:text-slate-500 block">
                                                    {item.kode ?? "-"}
                                                </span>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {getAccountIcon(item.nama)}
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                        {item.nama}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {isEditing && sectionKey ? (
                                            <>
                                                <td className="py-3.5 px-4 text-right">
                                                    <NumberInput
                                                        value={item.debit ?? 0}
                                                        onChange={(val) => updateItemDebitCredit(sectionKey, item.uid || "", val || 0, item.credit ?? 0)}
                                                        allowNegative={false}
                                                        className="w-full max-w-[150px] text-right font-bold text-slate-800 dark:text-slate-200 text-xs h-9 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 ml-auto"
                                                        placeholder="Debit"
                                                    />
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <NumberInput
                                                        value={item.credit ?? 0}
                                                        onChange={(val) => updateItemDebitCredit(sectionKey, item.uid || "", item.debit ?? 0, val || 0)}
                                                        allowNegative={false}
                                                        className="w-full max-w-[150px] text-right font-bold text-slate-800 dark:text-slate-200 text-xs h-9 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 ml-auto"
                                                        placeholder="Kredit"
                                                    />
                                                </td>
                                                <td className="py-3.5 px-6 text-center">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeItem(sectionKey, item.uid || "")}
                                                        className="h-9 w-9 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                                    >
                                                        <IconTrash className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                {showDebitCredit && (
                                                    <>
                                                        <td className="py-3.5 px-4 text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                            {fmtLedger(item.debit || 0)}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right text-xs font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                                                            {fmtLedger(item.credit || 0)}
                                                        </td>
                                                    </>
                                                )}
                                                <td className="py-3.5 px-6 text-right text-xs font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                                                    <div className="space-y-0.5">
                                                        <span>{formatRupiah(item.amount)}</span>
                                                        {!showDebitCredit && percentVal > 0 && (
                                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">
                                                                {formattedPercent}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className={cn("border-t font-extrabold text-xs select-none", bgTotals[accentColor])}>
                                <td className="py-4 px-6 text-left text-[10px] font-extrabold uppercase tracking-wider">
                                    {totalLabel}
                                </td>
                                {isEditing ? (
                                    <>
                                        <td colSpan={2} className="py-4 px-4 text-right tabular-nums text-xs font-extrabold text-slate-800 dark:text-slate-100">
                                            Saldo Bersih: {formatRupiah(total)}
                                        </td>
                                        <td className="py-4 px-6"></td>
                                    </>
                                ) : (
                                    <>
                                        {showDebitCredit && (
                                            <>
                                                <td className="py-4 px-4 text-right text-xs font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">{fmtLedger(totalDebit)}</td>
                                                <td className="py-4 px-4 text-right text-xs font-extrabold text-rose-600 dark:text-rose-455 tabular-nums">{fmtLedger(totalCredit)}</td>
                                            </>
                                        )}
                                        <td className="py-4 px-6 text-right text-xs font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">
                                            {formatRupiah(total)}
                                        </td>
                                    </>
                                )}
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Edit Mode Inline CoA Adder */}
                {isEditing && sectionKey && (
                    <div className="px-6 py-3.5 bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-850/60">
                        {isAdding ? (
                            <FormProvider {...addMethods}>
                                <div className="flex flex-col gap-2 pt-1">
                                    <div className="flex items-end gap-2">
                                        <FormSelect<{ selectedAccountUid: string }>
                                            name="selectedAccountUid"
                                            label="Pilih Akun Baru"
                                            options={availableCoas.map((coa) => ({
                                                value: coa.uid,
                                                label: `[${coa.kode}] ${coa.nama}`,
                                            }))}
                                            placeholder="Pilih Akun..."
                                            emptyMessage="Tidak ada akun tersedia."
                                            className="w-full h-9"
                                            wrapperClassName="flex-1 min-w-0"
                                            size="sm"
                                        />
                                        <Button
                                            type="button"
                                            size="icon"
                                            disabled={!watchedAccountUid}
                                            onClick={handleAddAccount}
                                            className="h-9 w-9 bg-emerald-650 hover:bg-emerald-700 rounded-xl text-white shadow-sm transition-colors shrink-0"
                                        >
                                            <IconCheck className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                                setIsAdding(false);
                                                addMethods.reset({ selectedAccountUid: "" });
                                            }}
                                            className="h-9 w-9 border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                                        >
                                            <IconX className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </FormProvider>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAdding(true)}
                                className="w-full text-xs font-bold text-slate-650 dark:text-slate-400 border-dashed border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-slate-350 dark:hover:border-slate-700 rounded-xl py-2 h-9 flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <IconPlus className="w-3.5 h-3.5" />
                                Tambah Akun (CoA)
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
