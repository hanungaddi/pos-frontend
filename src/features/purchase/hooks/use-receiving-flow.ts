"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { PurchaseItemLocal, Receiving } from "@/features/purchase/types";
import { getPurchaseItemsStore, selectItemCount, selectTotal } from "@/stores/purchase-items-store";

import { useReceivingFinalizer } from "./use-receiving-finalizer";
import { useReceivingHeaderForm } from "./use-receiving-header-form";
import { useReceivingScanner } from "./use-receiving-scanner";

interface UseReceivingFlowProps {
    receivingId: string;
    receiving?: Receiving;
    onSaveSuccess: (uid: string, responseData?: Receiving) => void;
}

export function useReceivingFlow({
    receivingId,
    receiving,
    onSaveSuccess,
}: UseReceivingFlowProps) {
    const searchParams = useSearchParams();
    const urlPoUid = searchParams?.get("po_uid") || null;
    const isInitialPoLoadRef = useRef(true);

    // ─── Main States ──────────────────────────────────────────────────────────
    const [currentId, setCurrentId] = useState(receivingId);
    const [currentReceiving, setCurrentReceiving] = useState<Receiving | undefined>(receiving);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

    // Sync incoming props
    const [prevPropId, setPrevPropId] = useState(receivingId);
    const [prevPropReceiving, setPrevPropReceiving] = useState<Receiving | undefined>(receiving);

    if (receivingId !== prevPropId) {
        setPrevPropId(receivingId);
        setCurrentId(receivingId);
    }
    if (receiving !== prevPropReceiving) {
        setPrevPropReceiving(receiving);
        setCurrentReceiving(receiving);
    }

    const isCurrentNew = !currentId || currentId === "new";

    // ─── Zustand Store ────────────────────────────────────────────────────────
    const store = getPurchaseItemsStore(currentId, "receiving");
    const items = store((state) => state.items);
    const addItem = store((state) => state.addItem);
    const clearAll = store((state) => state.clearAll);
    const updateItem = store((state) => state.updateItem);
    const removeItem = store((state) => state.removeItem);

    const itemCount = store(selectItemCount);
    const totalValue = store(selectTotal);
    const uniqueProductCount = items.length;

    // ─── Sub-hooks invocation ────────────────────────────────────────────────

    // 1. Header form and options loading
    const headerState = useReceivingHeaderForm({
        currentId,
        currentReceiving,
        isCurrentNew,
    });

    // 2. Scanner controls and product form
    const scannerState = useReceivingScanner({
        currentId,
        currentReceiving,
        poId: headerState.poId,
        poData: headerState.poData,
        items,
        addItem,
    });

    // 3. Finalization mutations and alert logic
    const finalizerState = useReceivingFinalizer({
        currentId,
        currentReceiving,
        isCurrentNew,
        items,
        clearAll,
        onSaveSuccess,
        headerForm: headerState.headerForm,
        poId: headerState.poId,
        poData: headerState.poData,
        poRemainingMap: headerState.poRemainingMap,
    });

    // ─── PO Data Auto-population Effects ──────────────────────────────────────
    const poItemsLoadedRef = useRef<Record<string, boolean>>({});
    const prevPoIdRef = useRef<string | null>(headerState.poId);
    const initializedIdRef = useRef<string | null>(null);

    // Effect: Prepopulate Zustand items from DB receiving items if existing draft receiving
    useEffect(() => {
        if (isCurrentNew) {
            initializedIdRef.current = null;
            return;
        }

        // If we already initialized the store for this ID, do nothing
        if (initializedIdRef.current === currentId) {
            return;
        }

        // If the receiving data is not yet loaded, wait
        if (!currentReceiving || currentId !== currentReceiving.uid) {
            return;
        }

        // If the store already has items, consider it initialized (e.g. from local storage/previous edits)
        if (store.getState().items.length > 0) {
            initializedIdRef.current = currentId;
            return;
        }

        // Populate from server items
        if (currentReceiving.items && currentReceiving.items.length > 0) {
            const dbItems: PurchaseItemLocal[] = currentReceiving.items.map((item) => ({
                temp_uid: `${Date.now()}-${item.uid}-${Math.random().toString(36).substring(2, 5)}`,
                product_uid: item.product_uid,
                barcode: item.product?.barcode || null,
                nama: item.product?.nama || "Produk Tanpa Nama",
                kuantitas: item.kuantitas,
                harga_estimasi: item.harga_beli,
            }));
            store.setState({ items: dbItems });
        }

        initializedIdRef.current = currentId;
    }, [currentId, currentReceiving, isCurrentNew, store]);

    // Effect A: Auto-populate items from PO when it loads
    useEffect(() => {
        if (isCurrentNew && headerState.poData?.items && items.length === 0) {
            const poKey = headerState.poData.uid;
            if (!poItemsLoadedRef.current[poKey]) {
                poItemsLoadedRef.current[poKey] = true;

                let addedCount = 0;
                headerState.poData.items.forEach((item) => {
                    const sisa = Math.max(0, Number(item.kuantitas) - Number(item.kuantitas_diterima));
                    if (sisa > 0 && item.product) {
                        addItem({
                            product_uid: item.product_uid,
                            barcode: item.product.barcode,
                            nama: item.product.nama,
                            harga_estimasi: item.harga_estimasi,
                            kuantitas: sisa,
                        });
                        addedCount++;
                    }
                });

                if (addedCount > 0) {
                    toast.success(
                        `Berhasil memuat ${addedCount} barang dari PO ${headerState.poData.nomor_po}.`
                    );
                }
            }
        }
    }, [isCurrentNew, headerState.poData, items.length, addItem]);

    // Effect B: Clear items if PO is changed manually, ignoring initial transition to urlPoUid
    useEffect(() => {
        if (isCurrentNew) {
            const currentPoId = headerState.poId;
            if (prevPoIdRef.current !== currentPoId) {
                const isFormDirty = headerState.headerForm.formState.isDirty;

                if (isInitialPoLoadRef.current) {
                    if (currentPoId === urlPoUid) {
                        isInitialPoLoadRef.current = false;
                    } else {
                        clearAll();
                        poItemsLoadedRef.current = {};
                        isInitialPoLoadRef.current = false;
                    }
                } else if (isFormDirty) {
                    clearAll();
                    poItemsLoadedRef.current = {};
                }
                prevPoIdRef.current = currentPoId;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCurrentNew, headerState.poId, urlPoUid, clearAll]);

    // ─── Orchestrated Handlers ────────────────────────────────────────────────
    const handleUpdateItem = (
        temp_uid: string,
        data: Partial<Pick<PurchaseItemLocal, "kuantitas" | "harga_estimasi" | "alasan">>
    ) => {
        const item = items.find((i) => i.temp_uid === temp_uid);
        if (item && data.kuantitas && headerState.poId) {
            const poLimit = headerState.poRemainingMap.current[item.product_uid];
            if (poLimit && data.kuantitas > poLimit.sisa) {
                toast.warning(`Peringatan: Kuantitas melebihi sisa PO (${poLimit.sisa} pcs).`);
            }
        }
        updateItem(temp_uid, data);
    };

    const handleReset = () => {
        setIsResetDialogOpen(true);
    };

    return {
        // States
        currentId,
        currentReceiving,
        isCurrentNew,
        items,
        itemCount,
        totalValue,
        uniqueProductCount,
        poId: headerState.poId,
        poData: headerState.poData,
        notFoundQuery: scannerState.notFoundQuery,
        setNotFoundQuery: scannerState.setNotFoundQuery,
        isCreateDialogOpen: scannerState.isCreateDialogOpen,
        setIsCreateDialogOpen: scannerState.setIsCreateDialogOpen,
        isResetDialogOpen,
        setIsResetDialogOpen,

        // Price compare states
        priceAlerts: finalizerState.priceAlerts,
        isAlertOpen: finalizerState.isAlertOpen,
        isFinalizeOpen: finalizerState.isFinalizeOpen,
        isFinalizing: finalizerState.isFinalizing,
        saveMode: finalizerState.saveMode,

        // Lookup loading states / options
        suppliersLoading: headerState.suppliersLoading,
        supplierOptions: headerState.supplierOptions,
        posLoading: headerState.posLoading,
        poOptions: headerState.poOptions,

        // Mutations loading states
        isSubmitting: finalizerState.isSubmitting,

        // Forms
        productForm: scannerState.productForm,
        headerForm: headerState.headerForm,

        // Handlers
        handleProductFound: scannerState.handleProductFound,
        handleOpenCreateDialog: scannerState.handleOpenCreateDialog,
        handleReset,
        handleSaveClick: finalizerState.handleSaveClick,
        onProcessClick: finalizerState.onProcessClick,
        handleCompleteWithoutPrices: finalizerState.handleCompleteWithoutPrices,
        handleCompleteWithPrices: finalizerState.handleCompleteWithPrices,
        handleFinalizeConfirm: finalizerState.handleFinalizeConfirm,
        handleFinalizeClose: finalizerState.handleFinalizeClose,
        handleAlertClose: finalizerState.handleAlertClose,
        getProductInfo: scannerState.getProductInfo,
        clearAll,
        handleUpdateItem,
        removeItem,
    };
}
