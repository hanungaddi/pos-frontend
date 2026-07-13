"use client";

import { useCallback, useEffect, useState } from "react";
import { db } from "@/lib/db";
import type { OfflineTransactionRecord } from "@/lib/db";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useSyncEngine } from "@/features/checkout/hooks/use-sync-engine";
import { toast } from "sonner";
import {
    IconCloudUpload,
    IconRefresh,
    IconWifi,
    IconWifiOff,
    IconDownload,
    IconUpload,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { BaseDialog } from "@/components/ui/base-dialog";
import { cn } from "@/lib/utils";
import { exportOfflineBackup, importOfflineBackup } from "@/features/checkout/utils/offline-backup";
import { OfflineTransactionsTable } from "./offline-transactions-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatRupiah } from "@/hooks/use-format-rupiah";
import { useSession } from "next-auth/react";
import { formatToReadableDateTime } from "@/lib/date-utils";

interface OfflineTransactionsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function OfflineTransactionsDialog({ open, onOpenChange }: OfflineTransactionsDialogProps) {
    const isOnline = useNetworkStatus();
    const { triggerSelectedSync, isSyncing, updatePendingCount } = useSyncEngine();
    const { data: session } = useSession();

    const [records, setRecords] = useState<OfflineTransactionRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());
    const [deleteTarget, setDeleteTarget] = useState<OfflineTransactionRecord | null>(null);

    const loadRecords = useCallback(async () => {
        setIsLoading(true);
        try {
            const all = await db.offlineTransactions.orderBy("timestamp").reverse().toArray();
            setRecords(all);
        } catch (err) {
            console.error("Gagal memuat riwayat transaksi offline:", err);
            toast.error("Gagal memuat riwayat transaksi offline.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load records when dialog is opened
    useEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            loadRecords();
            setSelectedUids(new Set());
        }
    }, [open, loadRecords]);

    // Unsynced/Failed records are checkable
    const syncableRecords = records.filter((r) => r.status === "pending" || r.status === "failed");
    const isAllSelected = syncableRecords.length > 0 && selectedUids.size === syncableRecords.length;

    const handleSelectAllToggle = () => {
        if (isAllSelected) {
            setSelectedUids(new Set());
        } else {
            const next = new Set<string>();
            syncableRecords.forEach((r) => next.add(r.uid));
            setSelectedUids(next);
        }
    };

    const handleRowSelectToggle = (uid: string) => {
        setSelectedUids((prev) => {
            const next = new Set(prev);
            if (next.has(uid)) {
                next.delete(uid);
            } else {
                next.add(uid);
            }
            return next;
        });
    };

    const handleSyncSelected = async () => {
        if (!isOnline) {
            toast.error("Tidak dapat mengirim: koneksi offline.");
            return;
        }

        const toSync = Array.from(selectedUids);
        if (toSync.length === 0) return;

        try {
            await triggerSelectedSync(toSync);
            await loadRecords();
            await updatePendingCount();
            setSelectedUids(new Set());
        } catch (err) {
            console.error("Gagal sinkronisasi terpilih:", err);
        }
    };

    const handleExportBackup = async () => {
        await exportOfflineBackup();
    };

    const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        await importOfflineBackup(file, async () => {
            await loadRecords();
            await updatePendingCount();
        });

        // Reset input value so it can trigger onChange again for the same file if needed
        e.target.value = "";
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        const uid = deleteTarget.uid;
        try {
            // If the transaction is not synced, revert local changes
            if (deleteTarget.status !== "synced") {
                const payload = deleteTarget.payload;

                // 1. Revert local stock
                if (payload && Array.isArray(payload.items)) {
                    const items = payload.items as Array<{ product_uid?: string; product_id?: string; quantity?: number }>;
                    for (const item of items) {
                        const productUid = item.product_uid || item.product_id;
                        const qty = Number(item.quantity) || 0;
                        if (productUid && qty > 0) {
                            try {
                                const product = await db.products.get(productUid);
                                if (product) {
                                    const newStock = product.stok + qty;
                                    await db.products.update(productUid, { stok: newStock });
                                }
                            } catch (stockErr) {
                                console.warn(`Gagal mengembalikan stok produk ${productUid}:`, stockErr);
                            }
                        }
                    }
                }

                // 2. Revert local member debt
                const memberUid = payload?.member_uid as string | undefined;
                const debtDetails = payload?.debt_details as { debt_amount?: number } | undefined;
                if (memberUid && debtDetails && typeof debtDetails === "object") {
                    const debtAmount = Number(debtDetails.debt_amount) || 0;
                    if (debtAmount > 0) {
                        try {
                            const member = await db.members.get(memberUid as string);
                            if (member) {
                                const newDebt = Math.max(0, (member.hutang || 0) - debtAmount);
                                await db.members.update(memberUid as string, { hutang: newDebt });
                            }
                        } catch (debtErr) {
                            console.warn(`Gagal mengembalikan hutang member ${memberUid}:`, debtErr);
                        }
                    }
                }

                // 3. Revert local cash drawer expected_cash / cash_sales_total
                const payMode = String(payload?.payment_method || payload?.metode_pembayaran || "cash");
                const cashReceived = Number(payload?.cash_received || payload?.cash_amount) || 0;
                const grandTotal = deleteTarget.receiptData?.total ?? 0;
                const cashAdded = payMode === "cash" ? grandTotal : (payMode === "debt" ? cashReceived : 0);

                if (cashAdded > 0) {
                    const activeSessionId = session?.cashDrawerSessionId;
                    if (activeSessionId) {
                        try {
                            const dbSession = await db.cashDrawerSessions.get(activeSessionId);
                            if (dbSession) {
                                const newExpectedCash = Math.max(0, (dbSession.expected_cash || 0) - cashAdded);
                                const newCashSalesTotal = Math.max(0, (dbSession.cash_sales_total || 0) - cashAdded);

                                await db.cashDrawerSessions.update(activeSessionId, {
                                    expected_cash: newExpectedCash,
                                    cash_sales_total: newCashSalesTotal,
                                });

                                // Find and delete matching offline cash drawer movement if any
                                const offlineReceiptUid = `OFFLINE-${uid}`;
                                const movements = await db.cashDrawerMovements
                                    .where("reference_uid")
                                    .equals(offlineReceiptUid)
                                    .toArray();
                                for (const m of movements) {
                                    await db.cashDrawerMovements.delete(m.uid);
                                }
                            }
                        } catch (drawerErr) {
                            console.warn("Gagal mengembalikan laci kasir lokal:", drawerErr);
                        }
                    }
                }

                // Delete from offlineQueue
                await db.offlineQueue.where("uid").equals(uid).delete();
            }

            // Delete from offlineTransactions
            await db.offlineTransactions.delete(uid);

            toast.success("Transaksi offline berhasil dihapus.");
            setDeleteTarget(null);

            // Reload records & counts
            await loadRecords();
            await updatePendingCount();

            // Remove from selected list if checked
            setSelectedUids((prev) => {
                const next = new Set(prev);
                next.delete(uid);
                return next;
            });
        } catch (err) {
            console.error("Gagal menghapus transaksi offline:", err);
            toast.error("Gagal menghapus transaksi offline.");
        }
    };

    const pendingCount = records.filter((r) => r.status === "pending").length;
    const syncedCount = records.filter((r) => r.status === "synced").length;
    const failedCount = records.filter((r) => r.status === "failed").length;

    return (
        <BaseDialog
            open={open}
            onOpenChange={onOpenChange}
            title={
                <div className="flex items-center gap-2">
                    <IconCloudUpload size={20} className="text-emerald-500" />
                    <span>Daftar Transaksi Offline</span>
                </div>
            }
            className="sm:max-w-4xl w-full flex flex-col max-h-[90vh]"
        >
            <div className="space-y-4 pt-3 flex-1 flex flex-col overflow-hidden min-h-0">
                {/* Network Status Banner */}
                <div className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs font-semibold shrink-0",
                    isOnline
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-rose-50 border-rose-200 text-rose-700"
                )}>
                    {isOnline ? <IconWifi size={15} /> : <IconWifiOff size={15} />}
                    {isOnline
                        ? "Koneksi tersedia — Centang transaksi dan kirimkan ke server."
                        : "Koneksi offline — Transaksi tidak dapat dikirim saat ini."}
                </div>

                {/* Summary Row & Header Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex gap-4 text-xs font-semibold text-slate-500">
                        <div>
                            Belum dikirim: <span className="text-amber-600 font-extrabold">{pendingCount}</span>
                        </div>
                        <div className="w-px h-3 bg-slate-200 self-center" />
                        <div>
                            Gagal: <span className="text-rose-600 font-extrabold">{failedCount}</span>
                        </div>
                        <div className="w-px h-3 bg-slate-200 self-center" />
                        <div>
                            Terkirim: <span className="text-emerald-600 font-extrabold">{syncedCount}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={handleExportBackup}
                            disabled={isLoading || records.length === 0}
                            className="h-8 text-xs border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                            <IconDownload size={13} />
                            Ekspor Backup
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => document.getElementById("import-offline-backup")?.click()}
                            disabled={isLoading}
                            className="h-8 text-xs border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                            <IconUpload size={13} />
                            Impor Backup
                        </Button>
                        <input
                            type="file"
                            id="import-offline-backup"
                            accept=".json"
                            onChange={handleImportBackup}
                            className="hidden"
                        />
                        <div className="w-px h-4 bg-slate-200 mx-1" />
                        <Button
                            variant="outline"
                            onClick={loadRecords}
                            disabled={isLoading}
                            className="h-8 text-xs border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                            <IconRefresh size={13} className={cn(isLoading && "animate-spin")} />
                            Refresh
                        </Button>
                        <Button
                            onClick={handleSyncSelected}
                            disabled={!isOnline || isSyncing || selectedUids.size === 0}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer border-none disabled:opacity-50"
                        >
                            <IconCloudUpload size={13} />
                            Kirim Terpilih ({selectedUids.size})
                        </Button>
                    </div>
                </div>

                {/* Table Container */}
                <OfflineTransactionsTable
                    records={records}
                    isLoading={isLoading}
                    selectedUids={selectedUids}
                    syncableRecords={syncableRecords}
                    isAllSelected={isAllSelected}
                    onSelectAllToggle={handleSelectAllToggle}
                    onRowSelectToggle={handleRowSelectToggle}
                    onDeleteClick={setDeleteTarget}
                />

                {/* Footer notes */}
                <div className="text-[11px] text-slate-400 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100 shrink-0">
                    * Transaksi offline yang belum dikirim harus disinkronisasi sebelum menutup shift laci kasir terminal ini.
                </div>
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Hapus Transaksi Offline"
                description={
                    deleteTarget ? (
                        <div className="space-y-2 text-left">
                            <p>Apakah Anda yakin ingin menghapus transaksi offline ini?</p>
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[10px] space-y-1 font-medium text-slate-600">
                                <div><span className="font-bold">UID:</span> {deleteTarget.uid}</div>
                                <div><span className="font-bold">Waktu:</span> {formatToReadableDateTime(deleteTarget.timestamp)}</div>
                                <div><span className="font-bold">Total:</span> {formatRupiah(deleteTarget.receiptData?.total ?? 0)}</div>
                                <div><span className="font-bold">Status:</span> {deleteTarget.status === "synced" ? "Sudah Terkirim" : "Belum Terkirim / Gagal"}</div>
                            </div>
                            {deleteTarget.status !== "synced" && (
                                <p className="text-rose-600 font-bold text-[10px] border border-rose-100 bg-rose-50/50 p-2 rounded-lg leading-relaxed">
                                    Peringatan: Transaksi ini belum terkirim ke server. Menghapus transaksi ini akan membatalkannya secara permanen dari antrean pengiriman lokal. Stok dan hutang member (jika ada) akan dikembalikan secara lokal.
                                </p>
                            )}
                        </div>
                    ) : null
                }
                confirmText="Hapus"
                cancelText="Batal"
                variant="danger"
                onConfirm={handleDeleteConfirm}
            />
        </BaseDialog>
    );
}
