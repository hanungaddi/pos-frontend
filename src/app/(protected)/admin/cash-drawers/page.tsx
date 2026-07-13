import { Suspense } from "react";
import { CashDrawers } from "@/features/cash-drawers/cash-drawers";
import { Skeleton } from "@/components/ui/skeleton";

function CashDrawersSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-3.5 w-80" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-28 rounded-xl" />
                </div>
            </div>
            <div className="space-y-4">
                <div className="flex justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                </div>
                {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="flex justify-between py-2 border-b border-slate-50 last:border-0 dark:border-slate-800">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-12" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function AdminCashDrawersPage() {
    return (
        <Suspense fallback={<CashDrawersSkeleton />}>
            <CashDrawers />
        </Suspense>
    );
}
