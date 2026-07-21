"use client";

import { Button } from "@/components/ui/button";
import type { BalanceSheetData, ChartOfAccount } from "@/features/accounting/types";
import { cn } from "@/lib/utils";
import { useBalanceSheetStore } from "@/stores/balance-sheet-store";
import {
    IconCoin,
    IconEdit,
    IconTrendingUp,
    IconWallet
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { BalanceSheetDraftBanner } from "./balance-sheet-draft-banner";
import { BalanceSheetHeaderFilters } from "./balance-sheet-header-filters";
import { BalanceSheetSectionCard } from "./balance-sheet-section-card";
import { BalanceSheetStatusCard } from "./balance-sheet-status-card";

interface BalanceSheetDashboardProps {
    asOfDate: string;
    onAsOfDateChange: (val: string) => void;
    data: BalanceSheetData | undefined;
    flatAccounts: ChartOfAccount[] | undefined;
}

export function BalanceSheetDashboard({
    asOfDate,
    onAsOfDateChange,
    data,
    flatAccounts,
}: BalanceSheetDashboardProps) {
    const router = useRouter();

    const [viewType, setViewType] = useState<"standard" | "equation">("standard");
    const [showDebitCredit, setShowDebitCredit] = useState<boolean>(false);

    const {
        editedData,
        initializeData,
        reset: resetStore,
    } = useBalanceSheetStore();

    const hasDraft = !!editedData;

    const handleStartEditing = () => {
        if (!data || !flatAccounts) return;

        if (!editedData) {
            initializeData(data, flatAccounts);
        }
        router.push("/admin/accounting/balance-sheet?action=new");
    };

    // 1. Calculate section values (Assets, Liabilities, Equity, Revenue, Expense)
    const sectionsData = useMemo(() => {
        if (hasDraft && editedData) {
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

        const fallback = {
            assets: data?.assets?.items || [],
            liabilities: data?.liabilities?.items || [],
            equity: data?.equity?.items || [],
            revenue: data?.revenue?.items || [],
            expense: data?.expense?.items || [],
            totalAssets: data?.assets?.total_assets || 0,
            totalLiabilities: data?.liabilities?.total_liabilities || 0,
            totalEquity: data?.equity?.total_equity || 0,
            totalRevenue: data?.revenue?.total_revenue || 0,
            totalExpense: data?.expense?.total_expense || 0,
        };

        return fallback;
    }, [hasDraft, editedData, data]);

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

    // 2. Compute Net Income (Laba Rugi Tahun Berjalan)
    const netIncome = useMemo(() => {
        return totalRevenue - totalExpense;
    }, [totalRevenue, totalExpense]);

    // 3. Reorganize Equity in standard view to append Laba Tahun Berjalan
    const equityItems = useMemo(() => {
        if (viewType === "standard") {
            const netIncomeItem = {
                uid: "synthetic-net-income",
                kode: null,
                nama: "Laba (Rugi) Tahun Berjalan",
                amount: netIncome,
                debit: totalExpense,
                credit: totalRevenue,
            };
            return [...equity, netIncomeItem];
        }
        return equity;
    }, [equity, viewType, netIncome, totalExpense, totalRevenue]);

    const finalEquityTotal = viewType === "standard" ? totalEquity + netIncome : totalEquity;

    // 4. Compute balance metrics
    const { totalLeftVal, totalRightVal, isBalanced, difference } = useMemo(() => {
        if (viewType === "standard") {
            const leftVal = totalAssets;
            const rightVal = totalLiabilities + finalEquityTotal;
            const diff = Math.abs(leftVal - rightVal);
            return {
                totalLeftVal: leftVal,
                totalRightVal: rightVal,
                isBalanced: diff < 0.1,
                difference: diff,
            };
        } else {
            const leftVal = totalAssets + totalExpense;
            const rightVal = totalLiabilities + totalEquity + totalRevenue;
            const diff = Math.abs(leftVal - rightVal);
            return {
                totalLeftVal: leftVal,
                totalRightVal: rightVal,
                isBalanced: diff < 0.1,
                difference: diff,
            };
        }
    }, [viewType, totalAssets, totalLiabilities, finalEquityTotal, totalExpense, totalEquity, totalRevenue]);

    return (
        <div className="space-y-6">
            {/* Header / Filtering Controls */}
            <BalanceSheetHeaderFilters
                asOfDate={asOfDate}
                onAsOfDateChange={onAsOfDateChange}
                viewType={viewType}
                onViewTypeChange={setViewType}
                showDebitCredit={showDebitCredit}
                onShowDebitCreditChange={setShowDebitCredit}
                extraAction={
                    data && flatAccounts && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleStartEditing}
                            className="h-9 px-4 text-xs font-bold rounded-xl border-indigo-200 hover:border-indigo-300 dark:border-indigo-900/60 dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 shadow-sm cursor-pointer flex items-center gap-1.5 transition-all"
                        >
                            <IconEdit className="w-3.5 h-3.5" />
                            {hasDraft ? "Lanjutkan Draf Neraca" : "Edit Neraca"}
                        </Button>
                    )
                }
            />

            {/* Warning draft banner */}
            {hasDraft && (
                <BalanceSheetDraftBanner
                    onDiscard={() => resetStore()}
                    onEdit={() => router.push("/admin/accounting/balance-sheet?action=new")}
                />
            )}

            {/* Unbalanced Warning Banner with direct shortcut to Entri Tidak Seimbang */}
            {/* {!isBalanced && (
                <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-sm text-amber-900 dark:text-amber-200 transition-all">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5 sm:mt-0">
                            <IconAlertTriangle className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="space-y-0.5 text-xs">
                            <h4 className="font-extrabold text-sm text-amber-950 dark:text-amber-100 flex items-center gap-2 flex-wrap">
                                Posisi Neraca Tidak Seimbang
                                <span className="font-mono text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                                    Selisih: {formatRupiah(difference)}
                                </span>
                            </h4>
                            <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                                Terdapat ketidakseimbangan nilai pada neraca keuangan. Anda dapat menentukan COA penyeimbang di menu <strong>Entri Tidak Seimbang</strong>.
                            </p>
                        </div>
                    </div>
                    <Link href={ROUTES.ADMIN_ACCOUNTING_UNBALANCED} className="shrink-0">
                        <Button
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl h-9 px-3.5 shadow-sm flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
                        >
                            <IconScale size={15} />
                            <span>Entri Tidak Seimbang</span>
                            <IconArrowRight size={14} />
                        </Button>
                    </Link>
                </div>
            )} */}

            {/* Balance Status Visual Card */}
            <BalanceSheetStatusCard
                isBalanced={isBalanced}
                totalAssets={totalLeftVal}
                totalLiabilitiesAndEquity={totalRightVal}
                difference={difference}
                leftLabel={viewType === "standard" ? "Total Aset (A)" : "Total Aset + Beban (A + B)"}
                rightLabel={viewType === "standard" ? "Liabilitas + Ekuitas (L + E)" : "Liabilitas + Ekuitas + Pendapatan (L + E + P)"}
                leftLegend={viewType === "standard" ? "Aset" : "Aset & Beban"}
                rightLegend={viewType === "standard" ? "Kewajiban & Ekuitas" : "Liabilitas, Ekuitas & Pendapatan"}
            />

            {/* Two-Column Assets vs Liabilities and Equity Grid */}
            <div className={cn("grid gap-6", showDebitCredit ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
                {/* Left Side: Debit Column Assets & Expenses */}
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
                        coaList={flatAccounts || []}
                    />

                    {viewType === "equation" && (
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
                            coaList={flatAccounts || []}
                        />
                    )}
                </div>

                {/* Right Side: Credit Column Liabilities, Equity & Revenues */}
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
                        coaList={flatAccounts || []}
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
                        coaList={flatAccounts || []}
                    />

                    {viewType === "equation" && (
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
                            coaList={flatAccounts || []}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
