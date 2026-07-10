"use client";

import { useState } from "react";
import { BaseDialog } from "@/components/ui/base-dialog";
import { IconClipboardList, IconClock, IconFileDescription } from "@tabler/icons-react";
import { useReceivingDetail, usePurchaseOrderDetail } from "../../api/purchase-api";
import { useActivityLogs } from "@/features/stock/api/stock-api";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import { Scrollable } from "@/components/ui/scrollable";
import { Skeleton } from "@/components/ui/skeleton";
import {
    PAYMENT_STATUS_LABELS,
    PAYMENT_STATUS_CLASSES,
    type PaymentStatus,
} from "@/constants/purchase";
import { formatToReadableDateTime } from "@/lib/date-utils";

interface ReceivingDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    receivingId: string | null;
}

export function ReceivingDetailDialog({
    open,
    onOpenChange,
    receivingId,
}: ReceivingDetailDialogProps) {
    const [activeTab, setActiveTab] = useState<"items" | "logs">("items");

    const { data: receiving, isLoading: isDetailLoading } = useReceivingDetail(receivingId);
    const { data: poData } = usePurchaseOrderDetail(receiving?.purchase_order_uid || null);

    // Fetch activity logs related to this receipt number
    const { data: logsData, isLoading: isLogsLoading } = useActivityLogs({
        search: receiving?.nomor_penerimaan || undefined,
    });

    const logs = logsData?.data || [];

    const handleOpenChange = (val: boolean) => {
        onOpenChange(val);
        if (!val) {
            setActiveTab("items"); // Reset to items tab on close
        }
    };

    if (receivingId === null || !open) return null;

    return (
        <BaseDialog
            open={open}
            onOpenChange={handleOpenChange}
            title={
                <>
                    <IconClipboardList size={20} className="text-emerald-500" />
                    <span>Detail Penerimaan Barang</span>
                </>
            }
            className="sm:max-w-3xl flex flex-col max-h-[90vh]"
        >
            {isDetailLoading || !receiving ? (
                <div className="space-y-5 flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Header Details Skeleton */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 shrink-0">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-4 w-28" />
                            </div>
                        ))}
                        <div className="space-y-2 col-span-2">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    </div>

                    {/* Tabs Skeleton */}
                    <div className="flex border-b border-slate-100 shrink-0 gap-4 pb-2">
                        <Skeleton className="h-8 w-28 rounded-lg" />
                        <Skeleton className="h-8 w-28 rounded-lg" />
                    </div>

                    {/* Items Table Skeleton */}
                    <div className="border border-slate-100 rounded-xl overflow-hidden mt-1 flex-1 min-h-0 flex flex-col">
                        <div className="bg-slate-50 p-3 flex justify-between border-b border-slate-100 shrink-0">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="p-3 space-y-4 overflow-y-auto flex-1">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-4 w-12" />
                                    <Skeleton className="h-4 w-10" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-5 flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Invoice Header Details */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-xs shrink-0">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">No. Penerimaan</span>
                            <p className="font-bold text-slate-900">{receiving.nomor_penerimaan}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Tanggal Masuk</span>
                            <p className="font-semibold text-slate-700">
                                {formatToReadableDateTime(receiving.created_at)}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Supplier</span>
                            <p className="font-semibold text-slate-800">
                                {receiving.supplier_relationship
                                    ? receiving.supplier_relationship.nama
                                    : receiving.supplier || "-"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">No. Faktur</span>
                            <p className="font-semibold text-slate-700">{receiving.nomor_faktur || "-"}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Nilai Tagihan</span>
                            <p className="font-bold text-slate-900">
                                {receiving.nilai_faktur !== null ? formatRupiah(receiving.nilai_faktur) : "-"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Status Pembayaran</span>
                            <div>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${PAYMENT_STATUS_CLASSES[receiving.status_pembayaran as PaymentStatus] || "bg-slate-50 text-slate-700 border-slate-100"
                                        }`}
                                >
                                    {PAYMENT_STATUS_LABELS[receiving.status_pembayaran as PaymentStatus] || receiving.status_pembayaran}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Sumber Penerimaan</span>
                            <p className="font-semibold text-slate-700">
                                {receiving.purchase_order_uid ? "Dari PO" : "Langsung (Direct)"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Referensi PO</span>
                            <p className="font-semibold text-slate-700">
                                {receiving.purchase_order_uid ? (
                                    poData ? (
                                        <span className="font-bold text-indigo-600">{poData.nomor_po}</span>
                                    ) : (
                                        `PO (ID: ${receiving.purchase_order_uid.substring(0, 8)})`
                                    )
                                ) : (
                                    "-"
                                )}
                            </p>
                        </div>
                        <div className="space-y-1 col-span-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Catatan / Keterangan</span>
                            <p className="text-slate-600 font-medium">{receiving.catatan || "-"}</p>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex border-b border-slate-100 shrink-0">
                        <button
                            onClick={() => setActiveTab("items")}
                            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${activeTab === "items"
                                ? "border-emerald-600 text-emerald-600"
                                : "border-transparent text-slate-400 hover:text-slate-600"
                                }`}
                        >
                            <IconFileDescription size={16} />
                            Daftar Barang ({receiving.items?.length || 0})
                        </button>
                        <button
                            onClick={() => setActiveTab("logs")}
                            className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${activeTab === "logs"
                                ? "border-emerald-600 text-emerald-600"
                                : "border-transparent text-slate-400 hover:text-slate-600"
                                }`}
                        >
                            <IconClock size={16} />
                            Log Aktivitas ({logs.length})
                        </button>
                    </div>

                    {/* Tab Content */}
                    <Scrollable className="flex-1 min-h-0 max-h-[450px] pr-1">
                        {activeTab === "items" ? (
                            <div className="border border-slate-100 rounded-xl overflow-hidden">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            <th className="p-3">Nama Produk</th>
                                            <th className="p-3 text-right">Harga Beli</th>
                                            <th className="p-3 text-right">Jumlah Masuk</th>
                                            <th className="p-3 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 font-medium">
                                        {receiving.items?.map((item) => {
                                            const subtotal = (item.harga_beli || 0) * (item.kuantitas || 0);
                                            return (
                                                <tr key={item.uid} className="hover:bg-slate-50/50">
                                                    <td className="p-3 font-semibold text-slate-900">
                                                        {item.product?.nama || "Produk dihapus"}
                                                    </td>
                                                    <td className="p-3 text-right text-slate-700 font-mono">
                                                        {item.harga_beli ? formatRupiah(item.harga_beli) : "Rp 0"}
                                                    </td>
                                                    <td className="p-3 text-right text-slate-700 font-mono">
                                                        {item.kuantitas} pcs
                                                    </td>
                                                    <td className="p-3 text-right text-slate-900 font-bold font-mono">
                                                        {formatRupiah(subtotal)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {(!receiving.items || receiving.items.length === 0) && (
                                            <tr>
                                                <td colSpan={4} className="p-4 text-center text-slate-400">
                                                    Tidak ada item barang tercatat.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : isLogsLoading ? (
                            <div className="space-y-4 pl-3 pr-1 py-1">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="relative flex gap-3 pb-4 last:pb-0 border-l border-slate-100 pl-4 animate-pulse">
                                        <div className="absolute -left-1.5 top-0.5 w-3 h-3 bg-slate-200 rounded-full border-2 border-white shadow-sm" />
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
                                    <div key={log.uid} className="relative flex gap-3 pb-4 last:pb-0 border-l border-slate-100 pl-4">
                                        {/* Dot */}
                                        <div className="absolute -left-1.5 top-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                                        <div className="space-y-0.5 text-xs">
                                            <p className="font-semibold text-slate-800">
                                                {log.description}
                                            </p>
                                            <div className="flex gap-2 text-[10px] text-slate-400 font-mono">
                                                <span>
                                                    {formatToReadableDateTime(log.created_at)}
                                                </span>
                                                <span>•</span>
                                                <span>Oleh: {log.user?.name || "System"}</span>
                                                {log.ip_address && (
                                                    <>
                                                        <span>•</span>
                                                        <span>IP: {log.ip_address}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {logs.length === 0 && (
                                    <p className="text-center py-8 text-slate-400 text-xs">
                                        Belum ada log aktivitas tercatat untuk penerimaan ini.
                                    </p>
                                )}
                            </div>
                        )}
                    </Scrollable>
                </div>
            )}
        </BaseDialog>
    );
}
