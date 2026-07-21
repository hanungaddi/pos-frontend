"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ChartOfAccount } from "@/features/accounting/types";
import type { ManualJournal, ManualJournalLine } from "@/features/accounting/types/manual-journal";
import { cn } from "@/lib/utils";
import {
    IconArrowLeft,
    IconBook,
    IconCoin,
    IconEdit,
    IconTrendingUp,
    IconWallet,
} from "@tabler/icons-react";

import { BalanceSheetJournalInfo } from "./balance-sheet-journal-info";
import { BalanceSheetSectionCard } from "./balance-sheet-section-card";
import { BalanceSheetStatusCard } from "./balance-sheet-status-card";

interface BalanceSheetDetailItem {
    uid: string;
    kode: string | null;
    nama: string;
    debit: number;
    credit: number;
    amount: number;
}

interface BalanceSheetDetailProps {
    journal: ManualJournal;
    flatAccounts: ChartOfAccount[];
}

export function BalanceSheetDetail({ journal, flatAccounts }: BalanceSheetDetailProps) {
    const router = useRouter();
    const [showDebitCredit, setShowDebitCredit] = useState<boolean>(true);

    const sectionsData = useMemo(() => {
        const assets: BalanceSheetDetailItem[] = [];
        const liabilities: BalanceSheetDetailItem[] = [];
        const equity: BalanceSheetDetailItem[] = [];
        const revenue: BalanceSheetDetailItem[] = [];
        const expense: BalanceSheetDetailItem[] = [];

        (journal.lines || []).forEach((line: ManualJournalLine) => {
            const matchedCoa = flatAccounts.find(
                (coa) => coa.uid === line.chart_of_account_uid || coa.kode === line.account?.kode
            );
            if (!matchedCoa) return;

            const tipe = matchedCoa.tipe;
            const debitVal = Number(line.debit) || 0;
            const creditVal = Number(line.credit) || 0;

            let amount = 0;
            if (tipe === "asset" || tipe === "expense") {
                amount = debitVal - creditVal;
            } else {
                amount = creditVal - debitVal;
            }

            const item: BalanceSheetDetailItem = {
                uid: matchedCoa.uid,
                kode: matchedCoa.kode,
                nama: matchedCoa.nama,
                debit: debitVal,
                credit: creditVal,
                amount,
            };

            if (tipe === "asset") assets.push(item);
            else if (tipe === "liability") liabilities.push(item);
            else if (tipe === "equity") equity.push(item);
            else if (tipe === "revenue") revenue.push(item);
            else if (tipe === "expense") expense.push(item);
        });

        const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);
        const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
        const totalEquity = equity.reduce((sum, item) => sum + item.amount, 0);
        const totalRevenue = revenue.reduce((sum, item) => sum + item.amount, 0);
        const totalExpense = expense.reduce((sum, item) => sum + item.amount, 0);

        return {
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
        };
    }, [journal, flatAccounts]);

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

    const netIncome = useMemo(() => {
        return totalRevenue - totalExpense;
    }, [totalRevenue, totalExpense]);

    const equityItems = useMemo(() => {
        const netIncomeItem = {
            uid: "synthetic-net-income",
            kode: null,
            nama: "Laba (Rugi) Tahun Berjalan",
            amount: netIncome,
            debit: totalExpense,
            credit: totalRevenue,
        };
        return [...equity, netIncomeItem];
    }, [equity, netIncome, totalExpense, totalRevenue]);

    const finalEquityTotal = totalEquity + netIncome;

    const { totalLeftVal, totalRightVal, isBalanced, difference } = useMemo(() => {
        const leftVal = totalAssets;
        const rightVal = totalLiabilities + finalEquityTotal;
        const diff = Math.abs(leftVal - rightVal);
        return {
            totalLeftVal: leftVal,
            totalRightVal: rightVal,
            isBalanced: diff < 0.1,
            difference: diff,
        };
    }, [totalAssets, totalLiabilities, finalEquityTotal]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div className="flex items-center gap-4">
                    <div className="relative flex items-center justify-center p-3.5 bg-gradient-to-br from-violet-500 to-fuchsia-600 dark:from-violet-650 dark:to-fuchsia-850 text-white rounded-2xl shadow-lg shadow-violet-500/15 dark:shadow-violet-950/30 ring-4 ring-violet-50 dark:ring-violet-950/20 shrink-0">
                        <IconBook className="w-6 h-6" />
                        <div className="absolute inset-0 bg-violet-500 rounded-2xl blur-lg opacity-25 -z-10" />
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                                Detail Jurnal Penyesuaian
                            </h2>
                            <span className={cn(
                                "text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider shadow-sm border",
                                journal.status === "draft"
                                    ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30"
                            )}>
                                {journal.status === "draft" ? `Draft: ${journal.reference_number}` : `Posted: ${journal.reference_number}`}
                            </span>
                        </div>
                        <p className="text-xs text-slate-450 dark:text-slate-500 leading-relaxed max-w-xl">
                            Menampilkan tinjauan laporan neraca keuangan yang disesuaikan oleh entri jurnal ini.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/admin/accounting/journals")}
                        className="h-9 px-4 text-xs font-bold rounded-xl border-slate-200 hover:bg-slate-50 dark:border-slate-850 dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                        <IconArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                        Kembali
                    </Button>
                    {journal.status === "draft" && (
                        <Button
                            size="sm"
                            onClick={() => router.push(`/admin/accounting/balance-sheet?action=edit&uid=${journal.uid}`)}
                            className="h-9 px-4 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/10 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            <IconEdit className="w-3.5 h-3.5" />
                            Edit Jurnal
                        </Button>
                    )}
                </div>
            </div>

            {/* Read-Only Journal Metadata Display */}
            <BalanceSheetJournalInfo
                journal={journal}
                showDebitCredit={showDebitCredit}
                onShowDebitCreditChange={setShowDebitCredit}
            />

            {/* Balance Status Visual Card */}
            <BalanceSheetStatusCard
                isBalanced={isBalanced}
                totalAssets={totalLeftVal}
                totalLiabilitiesAndEquity={totalRightVal}
                difference={difference}
                leftLabel="Total Aset (A)"
                rightLabel="Liabilitas + Ekuitas (L + E)"
                leftLegend="Aset"
                rightLegend="Kewajiban & Ekuitas"
                hideUnbalancedButton={true}
            />

            {/* Two-Column Grid */}
            <div className={cn("grid gap-6", showDebitCredit ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
                <div className="space-y-6">
                    <BalanceSheetSectionCard
                        title="Aset"
                        description="Harta kekayaan perusahaan termasuk kas, rekening bank, piutang, dan stok persediaan barang dagang."
                        items={assets}
                        total={totalAssets}
                        accentColor="emerald"
                        totalLabel="Total Aset"
                        icon={<IconWallet className="w-4.5 h-4.5 text-emerald-500" />}
                        isEditing={false}
                        showDebitCredit={showDebitCredit}
                        sectionKey="assets"
                        coaList={flatAccounts}
                    />

                    {revenue.length > 0 && (
                        <BalanceSheetSectionCard
                            title="Pendapatan (Revenues)"
                            description="Penerimaan dari omset hasil penjualan barang, pendapatan jasa, maupun penerimaan non-operasional."
                            items={revenue}
                            total={totalRevenue}
                            accentColor="indigo"
                            totalLabel="Total Pendapatan"
                            icon={<IconCoin className="w-4.5 h-4.5 text-indigo-500" />}
                            isEditing={false}
                            showDebitCredit={showDebitCredit}
                            sectionKey="revenue"
                            coaList={flatAccounts}
                        />
                    )}
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
                        isEditing={false}
                        showDebitCredit={showDebitCredit}
                        sectionKey="liabilities"
                        coaList={flatAccounts}
                    />

                    <BalanceSheetSectionCard
                        title="Ekuitas"
                        description="Modal pemilik perusahaan beserta laba ditahan dan laba berjalan hasil operasional."
                        items={equityItems}
                        total={finalEquityTotal}
                        accentColor="indigo"
                        totalLabel="Total Ekuitas"
                        icon={<IconTrendingUp className="w-4.5 h-4.5 text-indigo-500" />}
                        isEditing={false}
                        showDebitCredit={showDebitCredit}
                        sectionKey="equity"
                        coaList={flatAccounts}
                    />

                    {expense.length > 0 && (
                        <BalanceSheetSectionCard
                            title="Beban (Expenses)"
                            description="Biaya-biaya operasional, pengeluaran administratif, beban pembelian, serta penyusutan aset."
                            items={expense}
                            total={totalExpense}
                            accentColor="amber"
                            totalLabel="Total Beban"
                            icon={<IconTrendingUp className="w-4.5 h-4.5 text-amber-500" />}
                            isEditing={false}
                            showDebitCredit={showDebitCredit}
                            sectionKey="expense"
                            coaList={flatAccounts}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
