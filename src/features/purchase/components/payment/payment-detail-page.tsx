"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconArrowLeft, IconClipboardList, IconClock, IconFileDescription, IconCoins, IconUser, IconCalendar, IconBuildingBank, IconActivity, IconBan } from "@tabler/icons-react";
import { useAppRouter } from "@/hooks/use-app-router";
import { useSession } from "next-auth/react";
import { hasRole, hasPermission } from "@/constants/roles";
import { toast } from "sonner";
import { usePaymentDetail, useReceivingDetail, useCashAccounts, usePaymentSummary, useDeletePayment } from "../../api/purchase-api";
import { useActivityLogs } from "@/features/stock/api/stock-api";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import {
    PAYMENT_TRANSACTION_STATUS,
    PAYMENT_TRANSACTION_STATUS_LABELS,
    PAYMENT_TRANSACTION_STATUS_CLASSES,
    type PaymentTransactionStatus,
    PAYMENT_STATUS,
} from "@/constants/purchase";
import { formatToISO, formatDate, formatToReadableDateTime } from "@/lib/date-utils";
import { PaymentVoidDialog } from "./void-payment-dialog";

interface PaymentDetailPageProps {
    paymentId: string;
}

export function PaymentDetailPage({ paymentId }: PaymentDetailPageProps) {
    const { data: session } = useSession();
    const router = useAppRouter();
    const [activeTab, setActiveTab] = useState<"details" | "logs">("details");
    const [isVoidOpen, setIsVoidOpen] = useState(false);

    const deletePayment = useDeletePayment();
    const { data: payment, isLoading: isDetailLoading } = usePaymentDetail(paymentId);
    const { data: cashAccounts = [] } = useCashAccounts();

    const userRoles = session?.user?.roles || [];
    const userPermissions = session?.user?.permissions || [];
    const hasManagePurchase =
        hasRole(userRoles, "admin") ||
        hasPermission(userRoles, userPermissions, "manage_purchase");

    const handleConfirmVoid = (alasan: string) => {
        if (!payment) return;
        deletePayment.mutate(
            { uid: payment.uid, alasan },
            {
                onSuccess: () => {
                    toast.success("Transaksi pembayaran berhasil dibatalkan (void).");
                    setIsVoidOpen(false);
                },
                onError: (err) => {
                    toast.error(err.message || "Gagal membatalkan pembayaran.");
                },
            }
        );
    };

    // Fetch the receiving invoice details associated with this payment
    const { data: receiving, isLoading: isReceivingLoading } = useReceivingDetail(
        payment ? payment.referensi_uid : null
    );

    // Fetch payment summary (for overall debt info and payments history)
    const { data: summary, isLoading: isSummaryLoading } = usePaymentSummary(
        payment ? payment.referensi_uid : null
    );

    // Fetch activity logs related to this payment transaction number
    const { data: logsData, isLoading: isLogsLoading } = useActivityLogs({
        search: payment?.nomor_transaksi || undefined,
    });

    const logs = logsData?.data || [];
    const matchedCashAccount = cashAccounts.find(acc => acc.uid === payment?.cash_account_uid);

    const isLoading = isDetailLoading || isReceivingLoading;

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48 rounded" />
                        <Skeleton className="h-4 w-64 rounded" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-[250px] w-full rounded-2xl" />
                        <Skeleton className="h-[200px] w-full rounded-2xl" />
                    </div>
                    <div>
                        <Skeleton className="h-[300px] w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!payment) {
        return (
            <div className="max-w-md mx-auto text-center py-20 space-y-4">
                <p className="text-sm font-semibold text-slate-500">Data pembayaran tidak ditemukan.</p>
                <Button onClick={() => router.push("/admin/purchase/payment")} variant="outline">
                    Kembali ke Daftar Pembayaran
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        type="button"
                        onClick={() => router.push("/admin/purchase/payment")}
                        variant="outline"
                        className="p-2 h-9 w-9 rounded-xl border-slate-200 text-slate-500 hover:text-slate-900 bg-white cursor-pointer"
                    >
                        <IconArrowLeft size={18} />
                    </Button>
                    <div>
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <span>Detail Pembayaran Supplier</span>
                            <span className="text-xs font-mono font-normal text-slate-400">
                                ({payment.nomor_transaksi})
                            </span>
                        </h2>
                        <p className="text-xs text-slate-400">
                            Detail riwayat transaksi pembayaran hutang atas penerimaan barang dari supplier.
                        </p>
                    </div>
                </div>

                {payment.status === PAYMENT_TRANSACTION_STATUS.COMPLETED && hasManagePurchase && (
                    <Button
                        type="button"
                        onClick={() => setIsVoidOpen(true)}
                        variant="outline"
                        className="border-rose-200 hover:border-rose-300 hover:bg-rose-50/50 text-rose-600 font-bold text-xs h-9 rounded-xl flex items-center gap-1.5 cursor-pointer bg-white"
                    >
                        <IconBan size={16} /> Batalkan Pembayaran (Void)
                    </Button>
                )}
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Details Section */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Main Transaction Card */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
                        <div className="flex justify-between items-start border-b border-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl border border-emerald-100/30">
                                    <IconClipboardList size={22} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No. Transaksi</span>
                                    <h3 className="text-sm font-extrabold text-slate-900">{payment.nomor_transaksi}</h3>
                                </div>
                            </div>
                            <div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-extrabold border ${PAYMENT_TRANSACTION_STATUS_CLASSES[payment.status as PaymentTransactionStatus] || "bg-slate-50 text-slate-700 border-slate-100"
                                        }`}
                                >
                                    {PAYMENT_TRANSACTION_STATUS_LABELS[payment.status as PaymentTransactionStatus] || payment.status}
                                </span>
                            </div>
                        </div>

                        {/* Info Fields Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6 text-xs">
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                    <IconCalendar size={13} className="text-slate-400" />
                                    Tanggal Bayar
                                </span>
                                <p className="font-semibold text-slate-700">
                                    {formatDate(payment.created_at, "dd MMM yyyy")}
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                    <IconBuildingBank size={13} className="text-slate-400" />
                                    Akun Kas / Rekening
                                </span>
                                <p className="font-semibold text-slate-700">
                                    {matchedCashAccount ? matchedCashAccount.nama : `Akun ID: ${payment.cash_account_uid}`}
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                    <IconCoins size={13} className="text-slate-400" />
                                    Metode Pembayaran
                                </span>
                                <p className="font-semibold text-slate-700">{payment.metode_pembayaran}</p>
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                    <IconCoins size={13} className="text-slate-400" />
                                    Nominal Pembayaran
                                </span>
                                <p className="font-extrabold text-emerald-600 text-sm font-mono">
                                    {formatRupiah(payment.total)}
                                </p>
                            </div>

                            {payment.nomor_referensi && (
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                        <IconFileDescription size={13} className="text-slate-400" />
                                        Nomor Referensi
                                    </span>
                                    <p className="font-semibold text-slate-700">{payment.nomor_referensi}</p>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                    <IconUser size={13} className="text-slate-400" />
                                    Dibuat Oleh
                                </span>
                                <p className="font-semibold text-slate-700">{payment.user?.name || "-"}</p>
                            </div>
                        </div>

                        {/* Void Details */}
                        {payment.status === PAYMENT_TRANSACTION_STATUS.VOID && (
                            <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl text-xs space-y-2.5">
                                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                                    Rincian Pembatalan (Void)
                                </span>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-slate-450 block">Dibatalkan Oleh ID:</span>
                                        <span className="font-bold text-rose-800">{payment.void_by || "System"}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-slate-450 block">Tanggal Batal:</span>
                                        <span className="font-bold text-rose-800">
                                            {payment.voided_at
                                                ? formatToReadableDateTime(payment.voided_at)
                                                : "-"}
                                        </span>
                                    </div>
                                    <div className="col-span-2 space-y-1 pt-1.5 border-t border-rose-100/30">
                                        <span className="text-slate-450 block">Alasan Pembatalan:</span>
                                        <p className="font-semibold text-rose-700 italic">
                                            &ldquo;{payment.catatan_void || "Tidak ada alasan tertulis."}&rdquo;
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tabbed Info Card */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
                        <div className="flex border-b border-slate-100 shrink-0">
                            <button
                                onClick={() => setActiveTab("details")}
                                className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${activeTab === "details"
                                    ? "border-emerald-600 text-emerald-600"
                                    : "border-transparent text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                <IconFileDescription size={16} />
                                Rincian / Catatan
                            </button>
                            <button
                                onClick={() => setActiveTab("logs")}
                                className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${activeTab === "logs"
                                    ? "border-emerald-600 text-emerald-600"
                                    : "border-transparent text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                <IconClock size={16} />
                                Log Aktivitas ({logs.length})
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="pt-1">
                            {activeTab === "details" ? (
                                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl text-xs space-y-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Catatan Tambahan</span>
                                    <p className="text-slate-700 font-semibold whitespace-pre-wrap leading-relaxed">
                                        {payment.catatan || payment.catatan_void || "Tidak ada catatan tambahan."}
                                    </p>
                                </div>
                            ) : isLogsLoading ? (
                                <div className="space-y-4 py-2">
                                    {[...Array(2)].map((_, i) => (
                                        <div key={i} className="relative flex gap-3 pb-4 last:pb-0 border-l border-slate-100 pl-4 animate-pulse">
                                            <div className="absolute -left-1.5 top-0.5 w-3 h-3 bg-slate-200 rounded-full border-2 border-white" />
                                            <div className="space-y-2 w-full">
                                                <Skeleton className="h-4 w-3/4" />
                                                <Skeleton className="h-3 w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4 pl-3 pr-1 py-1">
                                    {logs.map((log) => (
                                        <div key={log.uid} className="relative flex gap-4 pb-5 last:pb-0 border-l border-slate-100 pl-5">
                                            <div className="absolute -left-1.5 top-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
                                            <div className="space-y-1 text-xs">
                                                <p className="font-semibold text-slate-800">
                                                    {log.description}
                                                </p>
                                                <div className="flex gap-2 text-[10px] text-slate-400 font-mono">
                                                    <span>
                                                        {formatToReadableDateTime(log.created_at)}
                                                    </span>
                                                    <span>•</span>
                                                    <span>Oleh: {log.user?.name || "System"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {logs.length === 0 && (
                                        <div className="text-center py-10 space-y-2">
                                            <IconActivity className="text-slate-300 w-8 h-8 mx-auto" />
                                            <p className="text-slate-400 text-xs">
                                                Belum ada log aktivitas tercatat untuk transaksi pembayaran ini.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Debt Summary & Other Payments */}
                <div className="space-y-6">
                    {/* Invoice/Receiving Info Card */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                            <div className="bg-amber-50 text-amber-600 p-1.5 rounded-lg border border-amber-100/30">
                                <IconCoins size={16} />
                            </div>
                            <h4 className="text-xs font-bold text-slate-800">Faktur Penerimaan Barang</h4>
                        </div>

                        {receiving ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400">No. Penerimaan:</span>
                                        <span className="font-semibold text-slate-800">{receiving.nomor_penerimaan}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400">Supplier:</span>
                                        <span className="font-semibold text-slate-800">
                                            {receiving.supplier_relationship?.nama || receiving.supplier || "Tanpa Supplier"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400">No. Faktur:</span>
                                        <span className="font-semibold text-slate-800">{receiving.nomor_faktur || "-"}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400">Total Faktur:</span>
                                        <span className="font-bold text-slate-900">{formatRupiah(receiving.nilai_faktur || 0)}</span>
                                    </div>
                                </div>

                                {isSummaryLoading ? (
                                    <div className="space-y-2 border-t border-slate-50 pt-3">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                ) : summary ? (
                                    <div className="space-y-2.5 border-t border-slate-50 pt-3 text-xs">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400">Total Dibayar:</span>
                                            <span className="font-bold text-emerald-600">{formatRupiah(summary.total_dibayar)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400">Sisa Hutang:</span>
                                            <span className="font-bold text-rose-600">{formatRupiah(summary.sisa_hutang)}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-1.5">
                                            <span className="text-slate-400">Status Pembayaran:</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${summary.status_pembayaran === PAYMENT_STATUS.PAID
                                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100/30"
                                                : summary.status_pembayaran === PAYMENT_STATUS.PARTIAL
                                                    ? "bg-amber-50 text-amber-700 border-amber-100/30"
                                                    : "bg-rose-50 text-rose-700 border-rose-100"
                                                }`}>
                                                {summary.status_pembayaran === PAYMENT_STATUS.PAID
                                                    ? "LUNAS"
                                                    : summary.status_pembayaran === PAYMENT_STATUS.PARTIAL
                                                        ? "SEBAGIAN"
                                                        : summary.status_pembayaran === PAYMENT_STATUS.UNPAID
                                                            ? "BELUM DIBAYAR"
                                                            : "TEMPO"}
                                            </span>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <p className="text-center py-6 text-slate-400 text-xs">
                                Gagal memuat info penerimaan barang.
                            </p>
                        )}
                    </div>

                    {/* History of Other Payments */}
                    {summary && summary.payments && summary.payments.length > 0 && (
                        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <span>Riwayat Pembayaran Faktur</span>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {summary.payments.map((p) => {
                                    const isCurrentPayment = p.uid === paymentId;
                                    return (
                                        <div
                                            key={p.uid}
                                            className={`py-2 text-[11px] flex justify-between items-center ${isCurrentPayment ? "bg-emerald-50/50 px-2.5 rounded-lg -mx-2.5" : ""
                                                }`}
                                        >
                                            <div className="space-y-0.5">
                                                <div className="font-semibold text-slate-700 flex items-center gap-1">
                                                    <span>{p.metode}</span>
                                                    {isCurrentPayment && (
                                                        <span className="text-[9px] font-bold text-emerald-600 px-1 py-0.2 bg-emerald-100 rounded">
                                                            Pembayaran Ini
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-slate-400 text-[9px]">
                                                    {formatToISO(p.tanggal)}
                                                </div>
                                            </div>
                                            <span className="font-bold text-slate-800">
                                                {formatRupiah(p.jumlah)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Danger Void Payment Dialog */}
            <PaymentVoidDialog
                open={isVoidOpen}
                onOpenChange={setIsVoidOpen}
                payment={payment}
                onConfirm={handleConfirmVoid}
                isLoading={deletePayment.isPending}
            />
        </div>
    );
}
