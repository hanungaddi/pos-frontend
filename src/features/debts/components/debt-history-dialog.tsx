"use client";

import { useState } from "react";
import { BaseDialog } from "@/components/ui/base-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import { useMemberDebtHistory } from "@/features/members/api/members-api";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { IconClock, IconNotebook, IconUser, IconCash } from "@tabler/icons-react";
import type { Member } from "@/features/members/types";

interface DebtHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    member: Member | null;
}

export function DebtHistoryDialog({ open, onOpenChange, member }: DebtHistoryDialogProps) {
    const [activeTab, setActiveTab] = useState<"purchases" | "payments">("purchases");

    const memberUid = member?.uid || "";
    const { data: history, isLoading, error } = useMemberDebtHistory(memberUid);

    if (!member) return null;

    const purchases = history?.debt_transactions?.data || [];
    const payments = history?.payments?.data || [];

    const formatDateTime = (dateString: string) => {
        try {
            return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: id });
        } catch {
            return dateString;
        }
    };

    return (
        <BaseDialog
            open={open}
            onOpenChange={onOpenChange}
            title={
                <div className="flex items-center gap-2">
                    <IconClock size={20} className="text-slate-600" />
                    <span>Riwayat Hutang &amp; Pembayaran</span>
                </div>
            }
            className="sm:max-w-3xl flex flex-col max-h-[85vh]"
        >
            <div className="flex-1 min-h-0 flex flex-col space-y-4">
                {/* Member Profile Summary */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                            <IconUser size={18} />
                        </div>
                        <div>
                            <h4 className="font-extrabold text-slate-800 leading-tight">{member.nama}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{member.kode} &bull; {member.nomor_telepon || "Tanpa Telepon"}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sisa Hutang Saat Ini</span>
                        <span className="font-black text-rose-600 text-base tabular-nums mt-0.5 block">{formatRupiah(member.hutang || 0)}</span>
                    </div>
                </div>

                {/* Custom Tabs Navigation */}
                <div className="flex border-b border-slate-100 shrink-0">
                    <button
                        onClick={() => setActiveTab("purchases")}
                        className={`px-5 py-2.5 font-bold text-xs border-b-2 cursor-pointer transition-all outline-none ${activeTab === "purchases"
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-slate-400 hover:text-slate-600"
                            }`}
                    >
                        Transaksi Belanja (Hutang)
                    </button>
                    <button
                        onClick={() => setActiveTab("payments")}
                        className={`px-5 py-2.5 font-bold text-xs border-b-2 cursor-pointer transition-all outline-none ${activeTab === "payments"
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-slate-400 hover:text-slate-600"
                            }`}
                    >
                        Riwayat Pembayaran Cicilan
                    </button>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 overflow-auto min-h-[250px]">
                    {isLoading ? (
                        <div className="space-y-3 p-1">
                            {Array.from({ length: 4 }).map((_, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 border border-slate-100 dark:border-slate-800 rounded-xl animate-pulse">
                                    <div className="space-y-1.5 w-1/2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                    <div className="space-y-1.5 w-20 flex flex-col items-end">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-3 w-3/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-rose-500 text-xs font-semibold">
                            Gagal memuat riwayat hutang member.
                        </div>
                    ) : activeTab === "purchases" ? (
                        /* TAB 1: Credit Purchases */
                        purchases.length === 0 ? (
                            <div className="text-center py-16 text-slate-400 text-xs">
                                <IconNotebook className="mx-auto mb-2 opacity-30" size={32} />
                                Belum ada transaksi belanja dengan metode hutang.
                            </div>
                        ) : (
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                                            <th className="py-2.5 px-3">Tanggal</th>
                                            <th className="py-2.5 px-3">No. Transaksi</th>
                                            <th className="py-2.5 px-3 text-right">Total Transaksi</th>
                                            <th className="py-2.5 px-3 text-right">Uang Muka (DP)</th>
                                            <th className="py-2.5 px-3 text-right text-rose-600">Sisa Hutang</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {purchases.map((sale) => (
                                            <tr key={sale.uid} className="border-b border-slate-50 hover:bg-slate-50/50">
                                                <td className="py-3 px-3 text-slate-500 font-medium">
                                                    {formatDateTime(sale.created_at)}
                                                </td>
                                                <td className="py-3 px-3 font-bold text-slate-800">
                                                    {sale.nomor_transaksi}
                                                </td>
                                                <td className="py-3 px-3 text-right font-medium text-slate-700 tabular-nums">
                                                    {formatRupiah(sale.total)}
                                                </td>
                                                <td className="py-3 px-3 text-right font-medium text-slate-500 tabular-nums">
                                                    {formatRupiah(sale.cash_received || 0)}
                                                </td>
                                                <td className="py-3 px-3 text-right font-extrabold text-rose-600 tabular-nums">
                                                    {formatRupiah(sale.debt_amount || 0)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : (
                        /* TAB 2: Debt Payments History */
                        payments.length === 0 ? (
                            <div className="text-center py-16 text-slate-400 text-xs">
                                <IconCash className="mx-auto mb-2 opacity-30" size={32} />
                                Belum ada riwayat pembayaran cicilan/pelunasan hutang.
                            </div>
                        ) : (
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                                            <th className="py-2.5 px-3">Tanggal</th>
                                            <th className="py-2.5 px-3">No. Pembayaran</th>
                                            <th className="py-2.5 px-3">Metode Bayar</th>
                                            <th className="py-2.5 px-3">Status</th>
                                            <th className="py-2.5 px-3 text-right text-emerald-600">Jumlah Bayar</th>
                                            <th className="py-2.5 px-3 text-right text-slate-500">Sisa Hutang</th>
                                            <th className="py-2.5 px-3 pl-8">Catatan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((payment) => {
                                            const method = payment.metode_pembayaran === "cash" ? "Tunai" : "Kartu/EDC";
                                            const statusLower = payment.status?.toLowerCase();
                                            const isVoid = statusLower === "void" || statusLower === "voided" || statusLower === "batal" || statusLower === "cancelled";
                                            const displayNote = isVoid
                                                ? (payment.catatan_void ? `Void: ${payment.catatan_void}` : payment.catatan || "-")
                                                : (payment.catatan || "-");

                                            return (
                                                <tr key={payment.uid} className={`border-b border-slate-50 hover:bg-slate-50/50 ${isVoid ? "bg-rose-50/20" : ""}`}>
                                                    <td className="py-3 px-3 text-slate-500 font-medium">
                                                        {formatDateTime(payment.tanggal_bayar)}
                                                    </td>
                                                    <td className="py-3 px-3 font-bold text-slate-800 font-mono text-[10px]">
                                                        {payment.nomor_pembayaran}
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border ${payment.metode_pembayaran === "cash"
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                            : "bg-blue-50 text-blue-700 border-blue-100"
                                                            }`}>
                                                            {method}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <span
                                                            className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider inline-flex items-center gap-1 ${isVoid
                                                                ? "bg-rose-50 text-rose-700 border-rose-100"
                                                                : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                                }`}
                                                        >
                                                            {isVoid ? "Void" : "Sukses"}
                                                        </span>
                                                    </td>
                                                    <td className={`py-3 px-3 text-right font-extrabold tabular-nums ${isVoid ? "text-rose-500/80 line-through" : "text-emerald-600"}`}>
                                                        {formatRupiah(payment.jumlah_bayar)}
                                                    </td>
                                                    <td className="py-3 px-3 text-right font-medium text-slate-500 tabular-nums">
                                                        {formatRupiah(payment.hutang_sesudah)}
                                                    </td>
                                                    <td className="py-3 px-3 pl-8 text-slate-600 font-medium max-w-[200px] truncate" title={displayNote}>
                                                        {displayNote}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </div>
            </div>
        </BaseDialog>
    );
}