"use client";

import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { useAppRouter } from "@/hooks/use-app-router";
import { clearPurchaseItemsStore } from "@/stores/purchase-items-store";
import { formatUTC } from "@/lib/date-utils";
import {
    useCreatePurchaseOrderHeader,
    useUpdatePurchaseOrder,
    useBulkReplacePurchaseOrderItems,
    useBulkCreatePurchaseOrder,
    useFinalizePurchaseOrder,
} from "@/features/purchase/api/purchase-api";
import type { PurchaseOrderHeaderInput } from "@/features/purchase/schemas/order-schema";
import type { PurchaseItemLocal, PurchaseOrder } from "@/features/purchase/types";

interface UsePoFinalizerProps {
    currentId: string;
    currentOrder?: PurchaseOrder;
    isCurrentNew: boolean;
    items: PurchaseItemLocal[];
    clearAll: () => void;
    headerForm: UseFormReturn<PurchaseOrderHeaderInput>;
    onSaveSuccess: (uid: string, responseData?: PurchaseOrder) => void;
}

export function usePoFinalizer({
    currentId,
    currentOrder: _currentOrder,
    isCurrentNew,
    items,
    clearAll,
    headerForm,
    onSaveSuccess,
}: UsePoFinalizerProps) {
    const router = useAppRouter();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const createHeader = useCreatePurchaseOrderHeader();
    const updateHeader = useUpdatePurchaseOrder();
    const bulkReplace = useBulkReplacePurchaseOrderItems();
    const bulkCreatePO = useBulkCreatePurchaseOrder();
    const finalizeOrder = useFinalizePurchaseOrder();

    const handleSaveFlow = async (data: PurchaseOrderHeaderInput) => {
        if (items.length === 0) {
            toast.error("Harap tambahkan minimal 1 barang sebelum menyimpan PO.");
            return;
        }

        const payloadHeader = {
            ...data,
            supplier_uid: data.supplier_uid,
            tanggal_po: formatUTC(data.tanggal_po),
            catatan: data.catatan || null,
        };

        try {
            if (isCurrentNew) {
                // 1. Create Purchase Order header draft
                const res = await createHeader.mutateAsync(payloadHeader);
                const newUid = res.data.uid;

                // 2. Submit items
                const itemsPayload = {
                    items: items.map((item) => ({
                        product_uid: item.product_uid,
                        kuantitas: item.kuantitas,
                        harga_estimasi: item.harga_estimasi,
                    })),
                };

                const replaceRes = await bulkReplace.mutateAsync({
                    uid: newUid,
                    data: itemsPayload,
                });

                toast.success("Purchase Order draft berhasil disimpan!");
                clearPurchaseItemsStore("new", "po");
                onSaveSuccess(newUid, replaceRes.data);
            } else {
                // 1. Update Purchase Order header
                await updateHeader.mutateAsync({
                    uid: currentId,
                    data: payloadHeader,
                });

                // 2. Submit items
                const itemsPayload = {
                    items: items.map((item) => ({
                        product_uid: item.product_uid,
                        kuantitas: item.kuantitas,
                        harga_estimasi: item.harga_estimasi,
                    })),
                };

                const replaceRes = await bulkReplace.mutateAsync({
                    uid: currentId,
                    data: itemsPayload,
                });

                toast.success("Perubahan Purchase Order berhasil disimpan!");
                onSaveSuccess(currentId, replaceRes.data);
            }
        } catch (err: unknown) {
            const errorObj = err as { message?: string };
            toast.error(errorObj.message || "Gagal menyimpan Purchase Order.");
        }
    };

    const handleFinalizeConfirm = async () => {
        const headerData = headerForm.getValues();
        const payloadHeader = {
            supplier_uid: headerData.supplier_uid,
            tanggal_po: formatUTC(headerData.tanggal_po),
            catatan: headerData.catatan || null,
        };

        try {
            if (isCurrentNew) {
                const payload = {
                    ...payloadHeader,
                    status: "ordered",
                    items: items.map((item) => ({
                        product_uid: item.product_uid,
                        kuantitas: item.kuantitas,
                        harga_estimasi: item.harga_estimasi,
                    })),
                };

                await bulkCreatePO.mutateAsync(payload);

                toast.success("Purchase Order berhasil diproses & dikirim!");
                clearAll();
                clearPurchaseItemsStore("new", "po");
                router.push("/admin/purchase/order");
            } else {
                // 1. Update draft header & items
                await updateHeader.mutateAsync({
                    uid: currentId,
                    data: payloadHeader,
                });

                const itemsPayload = {
                    items: items.map((item) => ({
                        product_uid: item.product_uid,
                        kuantitas: item.kuantitas,
                        harga_estimasi: item.harga_estimasi,
                    })),
                };

                await bulkReplace.mutateAsync({
                    uid: currentId,
                    data: itemsPayload,
                });

                // 2. Finalize
                await finalizeOrder.mutateAsync(currentId);

                toast.success("Purchase Order berhasil diproses & dikirim!");
                clearAll();
                clearPurchaseItemsStore(currentId, "po");
                router.push("/admin/purchase/order");
            }
        } catch (err: unknown) {
            const errorObj = err as { message?: string };
            toast.error(errorObj.message || "Gagal memproses Purchase Order.");
        } finally {
            setIsConfirmOpen(false);
        }
    };

    const handleSaveClick = () => {
        headerForm.handleSubmit(handleSaveFlow, (errors) => {
            console.error("PO form validation errors:", errors);
            toast.error("Harap isi semua kolom wajib dengan benar.");
        })();
    };

    const onProcessClick = async () => {
        if (items.length === 0) {
            toast.error("Harap tambahkan minimal 1 barang sebelum memproses PO.");
            return;
        }

        const isHeaderValid = await headerForm.trigger();
        if (!isHeaderValid) {
            toast.error("Harap isi semua kolom wajib dengan benar.");
            return;
        }

        setIsConfirmOpen(true);
    };

    const isSubmitting =
        createHeader.isPending ||
        updateHeader.isPending ||
        bulkReplace.isPending ||
        bulkCreatePO.isPending ||
        finalizeOrder.isPending;

    return {
        isSubmitting,
        isConfirmOpen,
        setIsConfirmOpen,
        handleSaveClick,
        onProcessClick,
        handleFinalizeConfirm,
    };
}
