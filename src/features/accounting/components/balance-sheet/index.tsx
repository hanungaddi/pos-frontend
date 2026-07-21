"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useBalanceSheet } from "@/features/accounting/api/reports-api";
import { useFlatChartOfAccounts } from "@/features/accounting/api/coa-api";
import { useManualJournalDetail } from "@/features/accounting/api/manual-journal-api";
import { getThisMonthRange } from "@/lib/date-utils";

import { BalanceSheetDashboard } from "./balance-sheet-dashboard";
import { BalanceSheetDetail } from "./balance-sheet-detail";
import { BalanceSheetEditor } from "./balance-sheet-editor";
import { BalanceSheetSkeleton } from "./balance-sheet-skeleton";

export function BalanceSheetReport() {
    const [asOfDate, setAsOfDate] = useState<string>(() => getThisMonthRange().to);
    const searchParams = useSearchParams();
    
    const action = searchParams.get("action");
    const journalUid = searchParams.get("uid");

    const { data, isLoading, isError, refetch } = useBalanceSheet(asOfDate);
    const { data: flatAccounts, isLoading: isLoadingCoas } = useFlatChartOfAccounts();

    const isJournalNeeded = (action === "edit" || action === "detail") && !!journalUid;

    const { data: journal, isLoading: isJournalLoading, isFetching: isJournalFetching } = useManualJournalDetail(
        isJournalNeeded ? journalUid : null
    );

    const isPageLoading =
        isLoading ||
        isLoadingCoas ||
        (isJournalNeeded && (!journal || isJournalLoading || isJournalFetching));

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

    if (action === "new" || action === "edit") {
        return (
            <BalanceSheetEditor
                asOfDate={asOfDate}
                data={data}
                flatAccounts={flatAccounts}
                journal={journal}
                action={action}
                journalUid={journalUid}
                refetch={() => {
                    void refetch();
                }}
            />
        );
    }

    if (action === "detail" && journal && flatAccounts) {
        return <BalanceSheetDetail journal={journal} flatAccounts={flatAccounts} />;
    }

    return (
        <BalanceSheetDashboard
            asOfDate={asOfDate}
            onAsOfDateChange={setAsOfDate}
            data={data}
            flatAccounts={flatAccounts}
        />
    );
}
