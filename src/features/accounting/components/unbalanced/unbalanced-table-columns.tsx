"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import type { GeneralLedgerEntry } from "@/features/accounting/types";
import { formatRupiah } from "@/hooks/use-format-rupiah";

export function getUnbalancedTableColumns(): ColumnDef<GeneralLedgerEntry>[] {
    return [
        {
            accessorKey: "transaction_date",
            header: "Tanggal",
            cell: ({ row }) => (
                <span className="text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                    {row.original.transaction_date
                        ? format(new Date(row.original.transaction_date), "dd MMM yyyy", { locale: localeId })
                        : "-"}
                </span>
            ),
            size: 110,
        },
        {
            accessorKey: "kode",
            header: "Akun Asal",
            cell: ({ row }) => (
                <div className="whitespace-nowrap">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {row.original.kode ?? "-"}
                    </span>
                    <span className="text-slate-500 dark:text-slate-450 text-[11px] ml-1.5">
                        {row.original.nama}
                    </span>
                </div>
            ),
            size: 200,
        },
        {
            accessorKey: "description",
            header: "Keterangan / Referensi",
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <p className="text-slate-700 dark:text-slate-350 text-xs">
                        {row.original.description || "-"}
                    </p>
                    {row.original.reference_type && (
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            {row.original.reference_type}: {row.original.reference_uid || "-"}
                        </span>
                    )}
                </div>
            ),
            size: 260,
        },
        {
            accessorKey: "debit",
            header: "Debit",
            cell: ({ row }) => (
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold tabular-nums text-right block">
                    {Number(row.original.debit) > 0 ? formatRupiah(Number(row.original.debit)) : "-"}
                </span>
            ),
            size: 130,
        },
        {
            accessorKey: "credit",
            header: "Kredit",
            cell: ({ row }) => (
                <span className="text-rose-600 dark:text-rose-450 text-xs font-semibold tabular-nums text-right block">
                    {Number(row.original.credit) > 0 ? formatRupiah(Number(row.original.credit)) : "-"}
                </span>
            ),
            size: 130,
        },
        {
            id: "difference",
            header: "Selisih",
            cell: ({ row }) => {
                const diff = Math.abs(Number(row.original.debit) - Number(row.original.credit));
                return (
                    <span className="text-amber-600 dark:text-amber-400 text-xs font-bold tabular-nums text-right block">
                        {formatRupiah(diff)}
                    </span>
                );
            },
            size: 130,
        },
        {
            accessorKey: "source",
            header: "Sumber",
            cell: ({ row }) =>
                row.original.source === "manual" ? (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold px-2 py-0.5 border dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
                        Manual
                    </Badge>
                ) : (
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold px-2 py-0.5 border dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30">
                        GL
                    </Badge>
                ),
            size: 80,
        },
    ];
}
