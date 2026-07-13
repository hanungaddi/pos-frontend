"use client";

import type { OfflineTransactionRecord } from "@/lib/db";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import {
    IconCheck,
    IconClock,
    IconAlertTriangle,
    IconPackage,
    IconCash,
    IconCreditCard,
    IconNotebook,
    IconTrash,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { formatDate, formatToTime } from "@/lib/date-utils";

const STATUS_CONFIG = {
    pending: {
        label: "Belum Dikirim",
        icon: IconClock,
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        iconClass: "text-amber-500",
    },
    synced: {
        label: "Sudah Dikirim",
        icon: IconCheck,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        iconClass: "text-emerald-500",
    },
    failed: {
        label: "Gagal Kirim",
        icon: IconAlertTriangle,
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        iconClass: "text-rose-500",
    },
} as const;

const PAYMENT_LABELS: Record<string, { label: string; icon: typeof IconCash }> = {
    cash: { label: "Tunai", icon: IconCash },
    card: { label: "EDC/Kartu", icon: IconCreditCard },
    debt: { label: "Hutang", icon: IconNotebook },
};

function formatDateTime(iso: string) {
    const formattedDate = formatDate(iso, "dd MMM yyyy");
    const formattedTime = formatToTime(iso, true);
    return {
        date: formattedDate || "-",
        time: formattedTime || "-",
    };
}

interface OfflineTransactionsTableProps {
    records: OfflineTransactionRecord[];
    isLoading: boolean;
    selectedUids: Set<string>;
    syncableRecords: OfflineTransactionRecord[];
    isAllSelected: boolean;
    onSelectAllToggle: () => void;
    onRowSelectToggle: (uid: string) => void;
    onDeleteClick: (record: OfflineTransactionRecord) => void;
}

export function OfflineTransactionsTable({
    records,
    isLoading,
    selectedUids,
    syncableRecords,
    isAllSelected,
    onSelectAllToggle,
    onRowSelectToggle,
    onDeleteClick,
}: OfflineTransactionsTableProps) {
    return (
        <div className="border border-slate-100 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0 bg-slate-50/50">
            <div className="overflow-y-auto flex-1">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 z-10">
                        <tr>
                            <th className="px-4 py-2.5 text-left w-10">
                                {syncableRecords.length > 0 && (
                                    <input
                                        type="checkbox"
                                        className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                        checked={isAllSelected}
                                        onChange={onSelectAllToggle}
                                        title={isAllSelected ? "Unchecklist All" : "Checklist All"}
                                    />
                                )}
                            </th>
                            {["Waktu", "UID", "Metode", "Total", "Produk", "Status", "Aksi"].map((h) => (
                                <th
                                    key={h}
                                    className={cn(
                                        "text-left text-[9px] font-extrabold uppercase tracking-widest text-slate-400 px-3 py-2.5",
                                        h === "Aksi" && "text-center w-16"
                                    )}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <tr key={i} className="border-b border-slate-50">
                                    <td colSpan={8} className="px-4 py-3">
                                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                                    </td>
                                </tr>
                            ))
                        ) : records.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-12 text-center">
                                    <div className="flex flex-col items-center gap-2 text-slate-300">
                                        <IconPackage size={32} strokeWidth={1.5} />
                                        <span className="text-xs text-slate-400 font-semibold">
                                            Belum ada transaksi offline.
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            records.map((record) => {
                                const { date, time } = formatDateTime(record.timestamp);
                                const status = STATUS_CONFIG[record.status] || STATUS_CONFIG.pending;
                                const StatusIcon = status.icon;
                                const payMode = String(record.payload.metode_pembayaran || "cash") as "cash" | "card" | "debt";
                                const payment = PAYMENT_LABELS[payMode] || PAYMENT_LABELS.cash;
                                const PayIcon = payment.icon;
                                const total = record.receiptData?.total ?? 0;
                                const itemCount = record.receiptData?.items?.length ?? 0;
                                const isSyncable = record.status === "pending" || record.status === "failed";
                                const isChecked = selectedUids.has(record.uid);

                                return (
                                    <tr
                                        key={record.uid}
                                        onClick={() => isSyncable && onRowSelectToggle(record.uid)}
                                        className={cn(
                                            "border-b border-slate-50 hover:bg-slate-50/50 transition-colors",
                                            isSyncable ? "cursor-pointer" : "opacity-80"
                                        )}
                                    >
                                        {/* Checkbox column */}
                                        <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                                            {isSyncable ? (
                                                <input
                                                    type="checkbox"
                                                    className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                    checked={isChecked}
                                                    onChange={() => onRowSelectToggle(record.uid)}
                                                />
                                            ) : (
                                                <IconCheck size={14} className="text-emerald-500 mx-auto" />
                                            )}
                                        </td>

                                        {/* Time */}
                                        <td className="px-3 py-2.5">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-700">
                                                    {time}
                                                </span>
                                                <span className="text-[8px] text-slate-400">{date}</span>
                                            </div>
                                        </td>

                                        {/* UID */}
                                        <td className="px-3 py-2.5">
                                            <span
                                                className="font-mono text-[9px] text-slate-500 block max-w-[80px] truncate"
                                                title={record.uid}
                                            >
                                                {record.uid.slice(0, 8)}…
                                            </span>
                                        </td>

                                        {/* Payment method */}
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-1">
                                                <PayIcon size={12} className="text-slate-400 shrink-0" />
                                                <span className="text-[10px] font-semibold text-slate-700">
                                                    {payment.label}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Total */}
                                        <td className="px-3 py-2.5">
                                            <span className="text-[10px] font-bold text-slate-800 tabular-nums">
                                                {formatRupiah(total)}
                                            </span>
                                        </td>

                                        {/* Items */}
                                        <td className="px-3 py-2.5">
                                            <span className="text-[10px] text-slate-500">
                                                {itemCount} item
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-3 py-2.5">
                                            <span
                                                className={cn(
                                                    "inline-flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full border",
                                                    status.badgeClass
                                                )}
                                            >
                                                <StatusIcon size={9} />
                                                {status.label}
                                            </span>
                                            {record.status === "failed" && record.errorMessage && (
                                                <div
                                                    className="text-[8px] text-rose-500 mt-0.5 max-w-[120px] truncate"
                                                    title={record.errorMessage}
                                                >
                                                    {record.errorMessage}
                                                </div>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteClick(record)}
                                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-none bg-transparent"
                                                title="Hapus Transaksi"
                                            >
                                                <IconTrash size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
