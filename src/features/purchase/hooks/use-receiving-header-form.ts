"use client";

import { useEffect, useRef } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";

import { todayStr, formatToISO } from "@/lib/date-utils";
import { PAYMENT_STATUS } from "@/constants/purchase";
import { formatRupiah } from "@/hooks/use-format-rupiah";

import {
    usePurchaseOrderDetail,
    useOutstandingPurchaseOrders,
} from "@/features/purchase/api/purchase-api";
import { receivingHeaderSchema, type ReceivingHeaderInput } from "@/features/purchase/schemas/receiving-schema";
import { getPurchaseItemsStore } from "@/stores/purchase-items-store";
import type { Receiving, PurchaseOrder, PurchaseOrderItem } from "@/features/purchase/types";
import { useAllSuppliers } from "@/features/suppliers/api/suppliers-api";

interface UseReceivingHeaderFormProps {
    currentId: string;
    currentReceiving?: Receiving;
    isCurrentNew: boolean;
}

export function useReceivingHeaderForm({
    currentId,
    currentReceiving,
    isCurrentNew,
}: UseReceivingHeaderFormProps) {
    const searchParams = useSearchParams();
    const urlPoUid = searchParams?.get("po_uid") || null;
    const initializedPoUidRef = useRef<string | null>(null);

    const headerForm = useForm<ReceivingHeaderInput>({
        resolver: zodResolver(receivingHeaderSchema) as unknown as Resolver<ReceivingHeaderInput>,
        defaultValues: {
            purchase_order_uid: urlPoUid || null,
            supplier_uid: null,
            nomor_faktur: "",
            nilai_faktur: 0,
            tanggal_terima: todayStr(),
            status_pembayaran: PAYMENT_STATUS.PENDING,
            catatan: "",
        },
    });

    const { reset: resetHeader, setValue: setHeaderValue, formState: { isDirty: isHeaderDirty } } = headerForm;

    const store = getPurchaseItemsStore(currentId, "receiving");
    const headerData = store((state) => state.headerData);
    const setHeaderData = store((state) => state.setHeaderData);
    const clearAll = store((state) => state.clearAll);

    const { data: suppliers = [], isLoading: suppliersLoading } = useAllSuppliers();
    const { data: outstandingPosData, isLoading: posLoading } = useOutstandingPurchaseOrders({
        per_page: 100,
    });

    const poUID = useWatch({ name: "purchase_order_uid", control: headerForm.control });
    const poId = currentReceiving?.purchase_order_uid || poUID || null;
    const { data: poData } = usePurchaseOrderDetail(poId);

    // Prepare dropdown options
    const supplierOptions = suppliers.map((s) => ({
        value: String(s.uid),
        label: s.nama,
    }));

    const poOptions = [
        { value: "", label: "-- Tanpa PO (Pembelian Langsung) --", description: "" },
        ...(outstandingPosData?.data || []).map((po: PurchaseOrder) => ({
            value: String(po.uid),
            label: `${po.nomor_po} - ${po.supplier?.nama || po.supplier_name || "Tanpa Supplier"}`,
            description: `Estimasi: ${formatRupiah(po.nilai_estimasi || 0)}`,
        })),
    ];

    if (currentReceiving?.purchase_order_uid) {
        const hasCurrentPo = (outstandingPosData?.data || []).some(
            (po: PurchaseOrder) => po.uid === currentReceiving.purchase_order_uid
        );
        if (!hasCurrentPo) {
            poOptions.push({
                value: String(currentReceiving.purchase_order_uid),
                label: `PO Terkait (ID: ${currentReceiving.purchase_order_uid.substring(0, 8)})`,
                description: "",
            });
        }
    }

    const hasInitializedRef = useRef(false);

    // Build PO sisa reference map for validation
    const poRemainingMap = useRef<Record<string, { sisa: number; nama: string }>>({});
    useEffect(() => {
        if (poData?.items) {
            const map: Record<string, { sisa: number; nama: string }> = {};
            poData.items.forEach((item: PurchaseOrderItem) => {
                map[String(item.product_uid)] = {
                    sisa: Math.max(0, Number(item.kuantitas) - Number(item.kuantitas_diterima)),
                    nama: item.product?.nama || "Produk",
                };
            });
            poRemainingMap.current = map;
        }
    }, [poData]);

    // ─── Header Form Sync Effects ─────────────────────────────────────────────

    // 0. If urlPoUid is provided and it differs from the persisted PO, reset the store.
    // Also reset if urlPoUid was removed (e.g. navigating to new receiving without shortcut).
    useEffect(() => {
        if (isCurrentNew) {
            if (urlPoUid && initializedPoUidRef.current !== urlPoUid) {
                initializedPoUidRef.current = urlPoUid;
                const storedPoId = headerData?.purchase_order_uid;
                if (storedPoId !== urlPoUid) {
                    clearAll();
                    setHeaderData({ purchase_order_uid: urlPoUid });
                    resetHeader({
                        purchase_order_uid: urlPoUid,
                        supplier_uid: null,
                        nomor_faktur: "",
                        nilai_faktur: 0,
                        tanggal_terima: todayStr(),
                        status_pembayaran: PAYMENT_STATUS.PENDING,
                        catatan: "",
                    });
                }
            } else if (!urlPoUid && initializedPoUidRef.current !== null) {
                initializedPoUidRef.current = null;
                clearAll();
                resetHeader({
                    purchase_order_uid: null,
                    supplier_uid: null,
                    nomor_faktur: "",
                    nilai_faktur: 0,
                    tanggal_terima: todayStr(),
                    status_pembayaran: PAYMENT_STATUS.PENDING,
                    catatan: "",
                });
            }
        }
    }, [isCurrentNew, urlPoUid, headerData?.purchase_order_uid, clearAll, setHeaderData, resetHeader]);

    // 1. Detect when headerData is cleared externally (e.g. via reset/clearAll)
    useEffect(() => {
        if (isCurrentNew && headerData === null) {
            resetHeader({
                purchase_order_uid: urlPoUid || null,
                supplier_uid: null,
                nomor_faktur: "",
                nilai_faktur: 0,
                tanggal_terima: todayStr(),
                status_pembayaran: PAYMENT_STATUS.PENDING,
                catatan: "",
            });
            hasInitializedRef.current = false;
        }
    }, [isCurrentNew, headerData, resetHeader, urlPoUid]);

    // 2. Save to Zustand store on any change to form values (only when new and form is dirty)
    const watchedHeaderValues = useWatch({ control: headerForm.control });
    useEffect(() => {
        if (isCurrentNew && isHeaderDirty) {
            setHeaderData(watchedHeaderValues);
        }
    }, [watchedHeaderValues, isCurrentNew, isHeaderDirty, setHeaderData]);

    // 3. Load initial defaults from Zustand store (if they exist) when creating a new receiving
    useEffect(() => {
        if (isCurrentNew && headerData && !hasInitializedRef.current) {
            hasInitializedRef.current = true;
            resetHeader({
                purchase_order_uid: urlPoUid || headerData.purchase_order_uid || null,
                supplier_uid: headerData.supplier_uid || null,
                nomor_faktur: headerData.nomor_faktur || "",
                nilai_faktur: headerData.nilai_faktur || 0,
                tanggal_terima: headerData.tanggal_terima || todayStr(),
                status_pembayaran: headerData.status_pembayaran || PAYMENT_STATUS.PENDING,
                catatan: headerData.catatan || "",
            });
        }
    }, [isCurrentNew, headerData, resetHeader, urlPoUid]);

    // 4. Synchronize default values when receiving loads/changes from backend draft
    useEffect(() => {
        if (!isCurrentNew && currentReceiving) {
            resetHeader({
                purchase_order_uid: currentReceiving.purchase_order_uid || null,
                supplier_uid: currentReceiving.supplier_uid ? String(currentReceiving.supplier_uid) : null,
                nomor_faktur: currentReceiving.nomor_faktur || "",
                nilai_faktur: currentReceiving.nilai_faktur || 0,
                tanggal_terima: currentReceiving.created_at ? formatToISO(currentReceiving.created_at) : todayStr(),
                status_pembayaran: currentReceiving.status_pembayaran || PAYMENT_STATUS.PENDING,
                catatan: currentReceiving.catatan || "",
            });
        }
    }, [isCurrentNew, currentReceiving, resetHeader]);

    // 5. Auto-select and lock supplier if PO is chosen
    const purchaseOrderId = useWatch({ name: "purchase_order_uid", control: headerForm.control });
    const currentSupplierId = useWatch({ name: "supplier_uid", control: headerForm.control });
    useEffect(() => {
        if (purchaseOrderId) {
            let targetSupplierId: string | null = null;
            const selectedPo = (outstandingPosData?.data || []).find(
                (po: PurchaseOrder) => String(po.uid) === purchaseOrderId
            );
            if (selectedPo && selectedPo.supplier_uid) {
                targetSupplierId = String(selectedPo.supplier_uid);
            } else if (poData && String(poData.uid) === purchaseOrderId && poData.supplier_uid) {
                targetSupplierId = String(poData.supplier_uid);
            } else if (currentReceiving && String(currentReceiving.purchase_order_uid) === purchaseOrderId) {
                targetSupplierId = currentReceiving.supplier_uid ? String(currentReceiving.supplier_uid) : null;
            }

            if (targetSupplierId && currentSupplierId !== targetSupplierId) {
                setHeaderValue("supplier_uid", targetSupplierId, { shouldDirty: false });
            }
        }
    }, [purchaseOrderId, currentSupplierId, outstandingPosData, poData, setHeaderValue, currentReceiving]);

    return {
        headerForm,
        suppliersLoading,
        supplierOptions,
        posLoading,
        poOptions,
        poId,
        poData,
        poRemainingMap,
    };
}
