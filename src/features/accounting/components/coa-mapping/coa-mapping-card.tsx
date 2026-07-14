"use client";

import { Card } from "@/components/ui/card";
import { CoaMappingRow } from "./coa-mapping-row";
import type { CommandOption } from "@/components/ui/command-select";
import type { CoaMapping } from "@/features/accounting/api/coa-mapping-api";
import React from "react";

interface CoaMappingCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    items: CoaMapping[];
    coaOptions: CommandOption[];
    dirtyFields: Record<string, boolean | undefined>;
    isLoadingCoas: boolean;
}

export function CoaMappingCard({
    title,
    description,
    icon,
    items,
    coaOptions,
    dirtyFields,
    isLoadingCoas,
}: CoaMappingCardProps) {
    return (
        <Card className="overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-md bg-white dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:shadow-lg">
            {/* Card Header Section */}
            <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-slate-50/80 via-slate-50/50 to-transparent dark:from-slate-800/35 dark:to-transparent border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-500/10 shadow-sm">
                    {icon}
                </div>
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                        {description}
                    </p>
                </div>
            </div>

            {/* Card Body - List of Rows */}
            <div className="p-4 md:p-6 divide-y divide-slate-100 dark:divide-slate-800/60">
                {items.map((m) => {
                    const key = `${m.transaction_type}:${m.slot}`;
                    const isDirty = !!dirtyFields[key];
                    return (
                        <CoaMappingRow
                            key={key}
                            m={m}
                            coaOptions={coaOptions}
                            isDirty={isDirty}
                            isLoadingCoas={isLoadingCoas}
                        />
                    );
                })}
            </div>
        </Card>
    );
}
