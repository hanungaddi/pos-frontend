"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useBalanceSheet } from "@/features/accounting/api/reports-api";
import { useFlatChartOfAccounts } from "@/features/accounting/api/coa-api";
import { useManualJournalDetail } from "@/features/accounting/api/manual-journal-api";
import { getThisMonthRange } from "@/lib/date-utils";
import { IconLoader2 } from "@tabler/icons-react";

import { BalanceSheetDashboard } from "./balance-sheet-dashboard";
import { BalanceSheetSkeleton } from "./balance-sheet-skeleton";

export function BalanceSheetReport() {
    const [asOfDate, setAsOfDate] = useState<string>(() => getThisMonthRange().to);
    const searchParams = useSearchParams();
    
    const action = searchParams.get("action");
    const journalUid = searchParams.get("uid");

    const { data, isLoading, isError, refetch } = useBalanceSheet(asOfDate);
    const { data: flatAccounts, isLoading: isLoadingCoas } = useFlatChartOfAccounts();

    const { data: journal, isLoading: isJournalLoading } = useManualJournalDetail(
        (action === "edit" || action === "detail") && journalUid ? journalUid : null
    );

    const isPageLoading = isLoading || isLoadingCoas;

    if ((action === "edit" || action === "detail") && isJournalLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
                <IconLoader2 className="animate-spin text-indigo-650" size={40} />
                <span className="text-sm font-semibold">Memuat Data Jurnal Penyesuaian...</span>
            </div>
        );
    }

    if (isPageLoading) {
        return <BalanceSheetSkeleton />;
    }

    if (isError) {
        return (
            <div className="text-center p-12 text-destructive bg-rose-50/50 border border-rose-100 rounded-2xl">
                <p className="font-bold">Gagal memuat data neraca keuangan.</p>
                <p className="text-xs mt-1 text-rose-600/80">Silakan periksa koneksi internet Anda dan coba lagi.</p>
            </div>
        );
    }

    return (
        <BalanceSheetDashboard
            asOfDate={asOfDate}
            onAsOfDateChange={setAsOfDate}
            data={data}
            flatAccounts={flatAccounts}
            journal={journal}
            action={action}
            journalUid={journalUid}
            refetch={refetch}
        />
    );
}
