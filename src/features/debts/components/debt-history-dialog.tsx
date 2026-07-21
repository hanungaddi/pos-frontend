"use client";

import { useState, useMemo } from "react";
import { BaseDialog } from "@/components/ui/base-dialog";
import { DataTable } from "@/components/ui/data-table";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import { useMemberDebtHistory, type DebtTransaction, type MemberPayment } from "@/features/members/api/members-api";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { IconClock, IconUser } from "@tabler/icons-react";
import type { Member } from "@/features/members/types";
import type { ColumnDef } from "@tanstack/react-table";

interface DebtHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    member: Member | null;
}

export function DebtHistoryDialog({ open, onOpenChange, member }: DebtHistoryDialogProps) {
    const [activeTab, setActiveTab] = useState<"purchases" | "payments">("purchases");

    const memberUid = member?.uid || "";
    const { data: history, isLoading, error } = useMemberDebtHistory(memberUid);

    const purchases = history?.debt_transactions?.data || [];
    const payments = history?.payments?.data || [];

    const formatDateTime = (dateString: string) => {
        try {
            return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: id });
        } catch {
            return dateString;
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "dd MMM yyyy", { locale: id });
        } catch {
            return dateString;
        }
    };

    const purchaseColumns = useMemo<ColumnDef<DebtTransaction>[]>(
        () => [
            {
                accessorKey: "created_at",
                header: "Tanggal",
                cell: ({ row }) => (
                    <span className="text-slate-500 font-medium text-xs">
                        {formatDateTime(row.original.created_at)}
                    </span>
                ),
            },
            {
                accessorKey: "nomor_transaksi",
                header: "No. Transaksi",
                cell: ({ row }) => (
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {row.original.nomor_transaksi}
                    </span>
                ),
            },
            {
                accessorKey: "total",
                header: () => <div className="text-right">Total Transaksi</div>,
                cell: ({ row }) => (
                    <div className="text-right font-medium text-slate-700 dark:text-slate-300 tabular-nums text-xs">
                        {formatRupiah(row.original.total)}
                    </div>
                ),
            },
            {
                accessorKey: "cash_received",
                header: () => <div className="text-right">Uang Muka (DP)</div>,
                cell: ({ row }) => (
                    <div className="text-right font-medium text-slate-500 dark:text-slate-400 tabular-nums text-xs">
                        {formatRupiah(row.original.cash_received || 0)}
                    </div>
                ),
            },
            {
                accessorKey: "debt_amount",
                header: () => <div className="text-right text-rose-600">Sisa Hutang</div>,
                cell: ({ row }) => (
                    <div className="text-right font-extrabold text-rose-600 dark:text-rose-400 tabular-nums text-xs">
                        {formatRupiah(row.original.debt_amount || 0)}
                    </div>
                ),
            },
        ],
        []
    );

    const paymentColumns = useMemo<ColumnDef<MemberPayment>[]>(
        () => [
            {
                accessorKey: "tanggal_bayar",
                header: "Tanggal",
                cell: ({ row }) => (
                    <span className="text-slate-500 font-medium text-xs">
                        {formatDate(row.original.tanggal_bayar)}
                    </span>
                ),
            },
            {
                accessorKey: "nomor_pembayaran",
                header: "No. Pembayaran",
                cell: ({ row }) => (
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[10px]">
                        {row.original.nomor_pembayaran}
                    </span>
                ),
            },
            {
                accessorKey: "metode_pembayaran",
                header: "Metode Bayar",
                cell: ({ row }) => {
                    const method = row.original.metode_pembayaran === "cash" ? "Tunai" : "Kartu/EDC";
                    return (
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border ${row.original.metode_pembayaran === "cash"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50"
                                : "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50"
                            }`}>
                            {method}
                        </span>
                    );
                },
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ row }) => {
                    const statusLower = row.original.status?.toLowerCase();
                    const isVoid = statusLower === "void" || statusLower === "voided" || statusLower === "batal" || statusLower === "cancelled";
                    return (
                        <span
                            className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider inline-flex items-center gap-1 ${isVoid
                                    ? "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50"
                                }`}
                        >
                            {isVoid ? "Void" : "Sukses"}
                        </span>
                    );
                },
            },
            {
                accessorKey: "jumlah_bayar",
                header: () => <div className="text-right text-emerald-600">Jumlah Bayar</div>,
                cell: ({ row }) => {
                    const statusLower = row.original.status?.toLowerCase();
                    const isVoid = statusLower === "void" || statusLower === "voided" || statusLower === "batal" || statusLower === "cancelled";
                    return (
                        <div className={`text-right font-extrabold tabular-nums text-xs ${isVoid ? "text-rose-500/80 line-through" : "text-emerald-600 dark:text-emerald-400"}`}>
                            {formatRupiah(row.original.jumlah_bayar)}
                        </div>
                    );
                },
            },
            {
                accessorKey: "hutang_sesudah",
                header: () => <div className="text-right text-slate-500">Sisa Hutang</div>,
                cell: ({ row }) => (
                    <div className="text-right font-medium text-slate-500 dark:text-slate-400 tabular-nums text-xs">
                        {formatRupiah(row.original.hutang_sesudah)}
                    </div>
                ),
            },
            {
                accessorKey: "catatan",
                header: "Catatan",
                cell: ({ row }) => {
                    const statusLower = row.original.status?.toLowerCase();
                    const isVoid = statusLower === "void" || statusLower === "voided" || statusLower === "batal" || statusLower === "cancelled";
                    const displayNote = isVoid
                        ? (row.original.catatan_void ? `Void: ${row.original.catatan_void}` : row.original.catatan || "-")
                        : (row.original.catatan || "-");
                    return (
                        <span className="text-slate-600 dark:text-slate-400 font-medium text-xs block max-w-[200px] truncate" title={displayNote}>
                            {displayNote}
                        </span>
                    );
                },
            },
        ],
        []
    );

    if (!member) return null;

    return (
        <BaseDialog
            open={open}
            onOpenChange={onOpenChange}
            title={
                <div className="flex items-center gap-2">
                    <IconClock size={20} className="text-slate-600 dark:text-slate-400" />
                    <span>Riwayat Hutang &amp; Pembayaran</span>
                </div>
            }
            className="sm:max-w-4xl flex flex-col max-h-[85vh]"
        >
            <div className="flex-1 min-h-0 flex flex-col space-y-4">
                {/* Member Profile Summary */}
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/50">
                            <IconUser size={18} />
                        </div>
                        <div>
                            <h4 className="font-extrabold text-slate-800 dark:text-slate-100 leading-tight">{member.nama}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{member.kode} &bull; {member.nomor_telepon || "Tanpa Telepon"}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sisa Hutang Saat Ini</span>
                        <span className="font-black text-rose-600 dark:text-rose-400 text-base tabular-nums mt-0.5 block">{formatRupiah(member.hutang || 0)}</span>
                    </div>
                </div>

                {/* Custom Tabs Navigation */}
                <div className="flex border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <button
                        onClick={() => setActiveTab("purchases")}
                        className={`px-5 py-2.5 font-bold text-xs border-b-2 cursor-pointer transition-all outline-none ${activeTab === "purchases"
                            ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                            : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            }`}
                    >
                        Transaksi Belanja (Hutang)
                    </button>
                    <button
                        onClick={() => setActiveTab("payments")}
                        className={`px-5 py-2.5 font-bold text-xs border-b-2 cursor-pointer transition-all outline-none ${activeTab === "payments"
                            ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                            : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            }`}
                    >
                        Riwayat Pembayaran Cicilan
                    </button>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 overflow-auto min-h-[250px]">
                    {error ? (
                        <div className="p-8 text-center text-rose-500 text-xs font-semibold">
                            Gagal memuat riwayat hutang member.
                        </div>
                    ) : activeTab === "purchases" ? (
                        <DataTable
                            columns={purchaseColumns}
                            data={purchases}
                            isLoading={isLoading}
                            paginationMode="client"
                            entityName="transaksi belanja"
                            emptyMessage="Belum ada transaksi belanja dengan metode hutang."
                        />
                    ) : (
                        <DataTable
                            columns={paymentColumns}
                            data={payments}
                            isLoading={isLoading}
                            paginationMode="client"
                            entityName="riwayat pembayaran"
                            emptyMessage="Belum ada riwayat pembayaran cicilan/pelunasan hutang."
                        />
                    )}
                </div>
            </div>
        </BaseDialog>
    );
}
