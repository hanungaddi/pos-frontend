import { Suspense } from "react";
import { BalanceSheetReport } from "@/features/accounting/components/balance-sheet";
import { BalanceSheetSkeleton } from "@/features/accounting/components/balance-sheet/balance-sheet-skeleton";

export default function BalanceSheetPage() {
    return (
        <Suspense fallback={<BalanceSheetSkeleton />}>
            <BalanceSheetReport />
        </Suspense>
    );
}
