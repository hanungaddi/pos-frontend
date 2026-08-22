"use client";

import type { Member } from "@/features/members/types";
import type { Product } from "@/features/products/types";
import { useNetworkStatus } from "@/hooks/use-network-status";
import type { PaginationParams } from "@/types/api";
import { db } from "@/lib/db";
import { apiGetData, apiGetList, apiPost } from "@/shared/api/api-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { toUTC7String } from "@/lib/date-utils";

// Catalog auto-sync interval: every 30 minutes when online
const CATALOG_SYNC_INTERVAL_MS = 30 * 60 * 1000;

export function useSyncEngine() {
    const isOnline = useNetworkStatus();
    const [isSyncing, setIsSyncing] = useState(false);
    const [isCatalogSyncing, setIsCatalogSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
    const [syncError, setSyncError] = useState<string | null>(null);

    const isSyncingRef = useRef(false);
    const isCatalogSyncingRef = useRef(false);

    // Update the pending transactions count from IndexedDB
    const updatePendingCount = useCallback(async () => {
        try {
            const count = await db.offlineTransactions
                .where("status")
                .equals("pending")
                .count();
            setPendingCount(count);
        } catch (err) {
            console.error("Gagal membaca jumlah antrean offline:", err);
        }
    }, []);

    // ─── Sync a Single Offline Transaction to /v1/transactions ──────────────────
    // Sends each transaction individually with uid, created_at, updated_at fields.
    // Does NOT auto-trigger — must be called manually from the monitoring page.
    const syncSingleTransaction = useCallback(async (uid: string): Promise<"success" | "failed"> => {
        if (!isOnline) return "failed";

        try {
            const record = await db.offlineTransactions.get(uid);
            if (!record) return "failed";

            const now = toUTC7String();
            const syncPayload = {
                ...record.payload,
                uid: record.uid,
                created_at: record.timestamp,
                updated_at: now,
            };

            await apiPost("/v1/transactions", syncPayload);

            // Mark as synced in offlineTransactions
            await db.offlineTransactions.update(uid, {
                status: "synced",
                syncedAt: now,
                errorMessage: undefined,
            });

            // Remove from offlineQueue (if still present)
            await db.offlineQueue.where("uid").equals(uid).delete();

            setLastSyncedAt(new Date());
            await updatePendingCount();
            return "success";
        } catch (err) {
            const error = err as Error;
            const errorMsg = error.message || "Gagal menghubungi server";

            await db.offlineTransactions.update(uid, {
                status: "failed",
                errorMessage: errorMsg,
            });

            await updatePendingCount();
            return "failed";
        }
    }, [isOnline, updatePendingCount]);

    // ─── Sync Cash In/Out Offline Actions ──────────────────────────────────────────
    const syncOfflineDrawerActions = useCallback(async () => {
        if (!isOnline) return;

        try {
            const pendingActions = await db.offlineDrawerActions
                .where("status")
                .equals("pending")
                .sortBy("timestamp");

            if (pendingActions.length === 0) return;

            for (const action of pendingActions) {
                try {
                    await db.offlineDrawerActions.update(action.id!, { status: "syncing" });
                    const url = `/v1/cash-drawer/sessions/${action.session_uid}/${action.type === "cash_in" ? "cash-in" : "cash-out"}`;
                    await apiPost(url, action.payload);

                    // Successfully synced, delete it from local table
                    await db.offlineDrawerActions.delete(action.id!);
                } catch (err) {
                    const error = err as Error;
                    console.error(`Gagal sinkronisasi aksi laci kasir offline ID ${action.id}:`, error);
                    await db.offlineDrawerActions.update(action.id!, {
                        status: "failed",
                        errorMessage: error.message || "Gagal menghubungi server",
                    });
                }
            }
        } catch (err) {
            console.error("Gagal menjalankan sinkronisasi aksi laci kasir offline:", err);
        }
    }, [isOnline]);

    // ─── Sync ALL Pending Transactions (manual trigger) ──────────────────────────
    const syncOfflineTransactions = useCallback(async () => {
        if (!isOnline || isSyncingRef.current) return;

        try {
            isSyncingRef.current = true;
            setIsSyncing(true);
            setSyncError(null);

            // Sync drawer actions first
            await syncOfflineDrawerActions();

            const pendingRecords = await db.offlineTransactions
                .where("status")
                .equals("pending")
                .sortBy("timestamp");

            if (pendingRecords.length === 0) {
                isSyncingRef.current = false;
                setIsSyncing(false);
                return;
            }

            let successCount = 0;
            let failCount = 0;

            for (const record of pendingRecords) {
                const result = await syncSingleTransaction(record.uid);
                if (result === "success") successCount++;
                else failCount++;
            }

            if (successCount > 0) {
                toast.success(`${successCount} transaksi offline berhasil disinkronisasi.`);
            }
            if (failCount > 0) {
                const msg = `${failCount} transaksi gagal disinkronisasi.`;
                setSyncError(msg);
                toast.error(msg);
            }
        } catch (err) {
            const error = err as Error;
            console.error("Gagal menjalankan sync engine:", error);
            setSyncError(error.message || "Unknown error");
        } finally {
            isSyncingRef.current = false;
            setIsSyncing(false);
            await updatePendingCount();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline, syncSingleTransaction, updatePendingCount]);

    // ─── Sync SELECTED Pending Transactions (manual checkbox trigger) ─────────────
    const syncSelectedTransactions = useCallback(async (uids: string[]) => {
        if (!isOnline || isSyncingRef.current || uids.length === 0) return;

        try {
            isSyncingRef.current = true;
            setIsSyncing(true);
            setSyncError(null);

            let successCount = 0;
            let failCount = 0;

            for (const uid of uids) {
                const result = await syncSingleTransaction(uid);
                if (result === "success") successCount++;
                else failCount++;
            }

            if (successCount > 0) {
                toast.success(`${successCount} transaksi offline berhasil disinkronisasi.`);
            }
            if (failCount > 0) {
                const msg = `${failCount} transaksi gagal disinkronisasi.`;
                setSyncError(msg);
                toast.error(msg);
            }
        } catch (err) {
            const error = err as Error;
            console.error("Gagal menjalankan sync terpilih:", error);
            setSyncError(error.message || "Unknown error");
        } finally {
            isSyncingRef.current = false;
            setIsSyncing(false);
            await updatePendingCount();
        }
    }, [isOnline, syncSingleTransaction, updatePendingCount]);


    // ─── Delta Catalog Syncing ────────────────────────────────────────────────────
    const syncCatalog = useCallback(async () => {
        if (!isOnline || isCatalogSyncingRef.current) return;

        try {
            isCatalogSyncingRef.current = true;
            setIsCatalogSyncing(true);

            // 1. Sync Products (Incremental Delta Sync)
            let lastProductUpdate = "";
            const hasSyncedBefore = typeof window !== "undefined" ? localStorage.getItem("catalog_last_synced_at") : null;
            if (hasSyncedBefore) {
                const lastProduct = await db.products.orderBy("updated_at").last();
                if (lastProduct && lastProduct.updated_at) {
                    lastProductUpdate = lastProduct.updated_at;
                }
            }

            let currentPage = 1;
            let lastPage = 1;
            const perPage = 250;

            while (currentPage <= lastPage) {
                const params: PaginationParams & { updated_after?: string; include_archived?: boolean } = {
                    page: currentPage,
                    per_page: perPage,
                    include_archived: true,
                };
                if (lastProductUpdate) {
                    params.updated_after = lastProductUpdate;
                }

                const res = await apiGetList<Product>("/v1/products", params);
                if (res.data && res.data.length > 0) {
                    // Update all products in IndexedDB (including status: 'archived' so local filter excludes them)
                    await db.products.bulkPut(res.data);
                }

                lastPage = res.meta?.last_page || 1;
                currentPage++;
            }

            // 2. Sync Members (Fetch all)
            try {
                const members = await apiGetData<Member[]>("/v1/members/all");
                if (members && members.length > 0) {
                    await db.members.clear();
                    await db.members.bulkPut(members);
                }
            } catch (err) {
                console.warn("Gagal sinkronisasi data member:", err);
            }

            localStorage.setItem("catalog_last_synced_at", new Date().toISOString());
            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("pos_catalog_synced"));
            }
        } catch (err) {
            console.error("Gagal sinkronisasi katalog:", err);
        } finally {
            isCatalogSyncingRef.current = false;
            setIsCatalogSyncing(false);
        }
    }, [isOnline]);

    // Initialize pending count on mount
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        updatePendingCount();
    }, [updatePendingCount]);

    // Sync catalog when coming back online (one-time trigger)
    useEffect(() => {
        if (isOnline) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            syncCatalog();
            syncOfflineDrawerActions();
        }
        // NOTE: syncOfflineTransactions is intentionally NOT called here.
        // Offline transactions must be synced manually from the monitoring page.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline, syncOfflineDrawerActions]);

    // Periodic catalog sync every 30 minutes while online
    useEffect(() => {
        if (!isOnline) return;

        const interval = setInterval(() => {
            syncCatalog();
        }, CATALOG_SYNC_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [isOnline, syncCatalog]);

    return {
        isSyncing,
        isCatalogSyncing,
        pendingCount,
        lastSyncedAt,
        syncError,
        isOnline,
        triggerSync: syncOfflineTransactions,
        triggerSingleSync: syncSingleTransaction,
        triggerSelectedSync: syncSelectedTransactions,
        triggerCatalogSync: syncCatalog,
        updatePendingCount,
    };
}
