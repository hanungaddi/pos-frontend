"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function BalanceSheetSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Visual Balance Card Skeleton */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
                <div className="flex items-start gap-4 w-full">
                    <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
                    <div className="space-y-2 w-full max-w-md">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </div>
                <div className="w-full lg:w-[450px] shrink-0 space-y-3">
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-3 w-full rounded-full" />
                    <div className="flex justify-between">
                        <Skeleton className="h-3.5 w-16" />
                        <Skeleton className="h-3.5 w-24" />
                    </div>
                </div>
            </div>

            {/* Content Cards Grid Skeleton */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Left: Assets */}
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
                    <div className="flex gap-2">
                        <Skeleton className="h-5 w-5 rounded-md" />
                        <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <div className="space-y-4 pt-4">
                        {Array.from({ length: 4 }).map((_, idx) => (
                            <div key={idx} className="space-y-2 pb-2 border-b border-slate-50 last:border-0">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-36" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                                <Skeleton className="h-1.5 w-full rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Liabilities & Equity */}
                <div className="space-y-6">
                    {/* Liabilities */}
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
                        <div className="flex gap-2">
                            <Skeleton className="h-5 w-5 rounded-md" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <div className="space-y-4 pt-4">
                            {Array.from({ length: 2 }).map((_, idx) => (
                                <div key={idx} className="space-y-2 pb-2 border-b border-slate-50 last:border-0">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                    <Skeleton className="h-1.5 w-full rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Equity */}
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
                        <div className="flex gap-2">
                            <Skeleton className="h-5 w-5 rounded-md" />
                            <Skeleton className="h-5 w-20" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <div className="space-y-4 pt-4">
                            {Array.from({ length: 2 }).map((_, idx) => (
                                <div key={idx} className="space-y-2 pb-2 border-b border-slate-50 last:border-0">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-20" />
                                    </div>
                                    <Skeleton className="h-1.5 w-full rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
