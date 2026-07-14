"use client";

import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FormSwitch } from "@/components/forms/form-switch";
import { cn } from "@/lib/utils";
import { formatToReadableDate } from "@/lib/date-utils";
import { IconBook } from "@tabler/icons-react";
import type { ManualJournal } from "@/features/accounting/types/manual-journal";

interface BalanceSheetJournalInfoProps {
    journal: ManualJournal;
    showDebitCredit?: boolean;
    onShowDebitCreditChange?: (val: boolean) => void;
}

export function BalanceSheetJournalInfo({
    journal,
    showDebitCredit = false,
    onShowDebitCreditChange,
}: BalanceSheetJournalInfoProps) {
    const formattedDate = formatToReadableDate(journal.transaction_date) || "-";

    const methods = useForm({
        defaultValues: {
            showDebitCredit,
        },
    });

    // eslint-disable-next-line react-hooks/incompatible-library
    const watchedShowDebitCredit = methods.watch("showDebitCredit");

    useEffect(() => {
        onShowDebitCreditChange?.(watchedShowDebitCredit);
    }, [watchedShowDebitCredit, onShowDebitCreditChange]);

    useEffect(() => {
        methods.setValue("showDebitCredit", showDebitCredit);
    }, [showDebitCredit, methods]);

    return (
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3 font-sans">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                    <IconBook className="w-4 h-4 text-indigo-500" />
                    Informasi Jurnal Penyesuaian
                </h3>
                {onShowDebitCreditChange && (
                    <div className="w-[280px] shrink-0">
                        <FormProvider {...methods}>
                            <FormSwitch<{ showDebitCredit: boolean }>
                                name="showDebitCredit"
                                label="Detail D/K"
                                description="Tampilkan kolom Debit/Kredit terpisah"
                                className="!p-0 !bg-transparent !border-0 shadow-none dark:bg-transparent dark:border-0"
                            />
                        </FormProvider>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
                <div>
                    <span className="text-slate-400 dark:text-slate-500 font-medium block mb-0.5">No. Referensi</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{journal.reference_number}</span>
                </div>
                <div>
                    <span className="text-slate-400 dark:text-slate-500 font-medium block mb-0.5">Tanggal Transaksi</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{formattedDate}</span>
                </div>
                <div>
                    <span className="text-slate-400 dark:text-slate-500 font-medium block mb-0.5">Pembuat</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {journal.creator?.name || journal.creator?.username || "-"}
                    </span>
                </div>
                <div>
                    <span className="text-slate-400 dark:text-slate-500 font-medium block mb-0.5">Status</span>
                    <Badge className={cn("px-2 py-0.5 border text-[10px] font-semibold",
                        journal.status === "draft" && "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-850 dark:text-slate-300 dark:border-slate-800",
                        journal.status === "posted" && "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
                        journal.status === "voided" && "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"
                    )} variant="outline">
                        {journal.status === "draft" && "Draft"}
                        {journal.status === "posted" && "Posted"}
                        {journal.status === "voided" && "Voided (Batal)"}
                    </Badge>
                </div>
            </div>
            {journal.description && (
                <div className="pt-3 border-t border-slate-50 dark:border-slate-800 text-xs">
                    <span className="text-slate-400 dark:text-slate-500 font-medium block mb-1">Keterangan Utama</span>
                    <p className="text-slate-650 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-850">
                        {journal.description}
                    </p>
                </div>
            )}
        </Card>
    );
}
