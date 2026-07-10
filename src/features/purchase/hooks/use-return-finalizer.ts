"use client";

import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { useAppRouter } from "@/hooks/use-app-router";
import { clearPurchaseItemsStore } from "@/stores/purchase-items-store";
import { formatUTC } from "@/lib/date-utils";
import {
    useCreatePurchaseReturnHeader,
    useUpdatePurchaseReturn,
    useBulkReplacePurchaseReturnItems,
    useBulkCreatePurchaseReturn,
    useFinalizePurchaseReturn,
} from "@/features/purchase/api/purchase-api";
import type { PurchaseReturnHeaderInput } from "@/features/purchase/schemas/return-schema";
import type { PurchaseItemLocal, PurchaseReturn } from "@/features/purchase/types";

interface UseReturnFinalizerProps {
    currentId: string;
    currentReturn?: PurchaseReturn;
    isCurrentNew: boolean;
    items: PurchaseItemLocal[];
    clearAll: () => void;
    headerForm: UseFormReturn<PurchaseReturnHeaderInput>;
    returnLimitsMap: Record<string, { sisa: number; nama: string; harga: number }>;
    onSaveSuccess: (uid: string, responseData?: PurchaseReturn) => void;
}

export function useReturnFinalizer({
    currentId,
    currentReturn: _currentReturn,
    isCurrentNew,
    items,
    clearAll,
    headerForm,
    returnLimitsMap,
    onSaveSuccess,
}: UseReturnFinalizerProps) {
    const router = useAppRouter();
    const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
    const [isSavingForFinalize, setIsSavingForFinalize] = useState(false);

    const createHeader = useCreatePurchaseReturnHeader();
    const updateReturn = useUpdatePurchaseReturn();
    const bulkReplace = useBulkReplacePurchaseReturnItems();
    const bulkCreateReturn = useBulkCreatePurchaseReturn();
    const finalizeReturn = useFinalizePurchaseReturn();

    const validateItems = (activeItems: PurchaseItemLocal[]) => {
        if (activeItems.length === 0) {
            toast.error("Harap isi kuantitas minimal 1 pcs pada salah satu barang yang ingin diretur.");
            return false;
        }

        // Validate max return limits
        for (const item of activeItems) {
            const limit = returnLimitsMap[item.product_uid];
            if (limit && item.kuantitas > limit.sisa) {
                toast.error(`Jumlah retur "${item.nama}" (${item.kuantitas} pcs) melebihi batas yang dapat diretur (${limit.sisa} pcs).`);
                return false;
            }
            if (!item.alasan) {
                toast.error(`Harap pilih alasan retur untuk "${item.nama}".`);
                return false;
            }
        }
        return true;
    };

    const handleSaveFlow = async (data: PurchaseReturnHeaderInput) => {
        const activeItems = items.filter((i) => i.kuantitas > 0);
        if (!validateItems(activeItems)) return;

        const payloadHeader = {
            receiving_uid: data.receiving_uid,
            supplier_uid: data.supplier_uid,
            tanggal_retur: formatUTC(data.tanggal_retur),
            catatan: data.catatan || null,
        };

        const payloadItems = {
            items: activeItems.map((i) => ({
                product_uid: i.product_uid,
                kuantitas: i.kuantitas,
                harga_beli: i.harga_estimasi,
                alasan: i.alasan || "damaged",
            })),
        };

        try {
            if (isCurrentNew) {
                // 1. Create Return Header draft
                const res = await createHeader.mutateAsync(payloadHeader);
                const newUid = res.data.uid;

                // 2. Submit items
                const replaceRes = await bulkReplace.mutateAsync({
                    uid: newUid,
                    data: payloadItems,
                });

                toast.success("Daftar barang retur draft berhasil disimpan!");
                clearPurchaseItemsStore("new", "return");
                onSaveSuccess(newUid, replaceRes.data);
            } else {
                // 1. Update Return Header
                await updateReturn.mutateAsync({
                    uid: currentId,
                    data: payloadHeader,
                });

                // 2. Submit items
                const replaceRes = await bulkReplace.mutateAsync({
                    uid: currentId,
                    data: payloadItems,
                });

                toast.success("Perubahan barang retur draft berhasil disimpan!");
                onSaveSuccess(currentId, replaceRes.data);
            }
        } catch (err: unknown) {
            const errorObj = err as { message?: string };
            toast.error(errorObj.message || "Gagal menyimpan barang retur.");
        }
    };

    const handleFinalizeConfirm = async (formData: {
        resolution_type: "refund" | "credit" | "credit_note" | "exchange";
        cash_account_uid?: string | null;
        stock_receiving_uid?: string | null;
        catatan_penyelesaian?: string | null;
    }) => {
        setIsSavingForFinalize(true);

        const headerData = headerForm.getValues();
        const activeItems = items.filter((i) => i.kuantitas > 0);

        const payloadHeader = {
            receiving_uid: headerData.receiving_uid,
            supplier_uid: headerData.supplier_uid,
            tanggal_retur: formatUTC(headerData.tanggal_retur),
            catatan: headerData.catatan || null,
        };

        const payloadItems = activeItems.map((i) => ({
            product_uid: i.product_uid,
            kuantitas: i.kuantitas,
            harga_beli: i.harga_estimasi,
            alasan: i.alasan || "damaged",
        }));

        try {
            if (isCurrentNew) {
                const payload = {
                    ...payloadHeader,
                    status: "completed",
                    resolution_type: formData.resolution_type,
                    impact_type: formData.resolution_type,
                    cash_account_uid: formData.resolution_type === "refund" ? formData.cash_account_uid : null,
                    stock_receiving_uid: formData.resolution_type === "credit" ? formData.stock_receiving_uid : null,
                    catatan_penyelesaian: formData.catatan_penyelesaian || null,
                    items: payloadItems,
                };

                await bulkCreateReturn.mutateAsync(payload);

                toast.success("Retur Pembelian berhasil diproses & diselesaikan!");
                clearAll();
                clearPurchaseItemsStore("new", "return");
                router.push("/admin/purchase/return");
            } else {
                // 1. Save draft header & items
                await updateReturn.mutateAsync({
                    uid: currentId,
                    data: payloadHeader,
                });

                await bulkReplace.mutateAsync({
                    uid: currentId,
                    data: { items: payloadItems },
                });

                // 2. Finalize
                const finalizePayload = {
                    resolution_type: formData.resolution_type,
                    impact_type: formData.resolution_type,
                    cash_account_uid: formData.resolution_type === "refund" ? formData.cash_account_uid : null,
                    stock_receiving_uid: formData.resolution_type === "credit" ? formData.stock_receiving_uid : null,
                    catatan_penyelesaian: formData.catatan_penyelesaian || null,
                };

                await finalizeReturn.mutateAsync({
                    uid: currentId,
                    data: finalizePayload,
                });

                toast.success("Retur Pembelian berhasil diproses & diselesaikan!");
                clearAll();
                clearPurchaseItemsStore(currentId, "return");
                router.push("/admin/purchase/return");
            }
        } catch (err: unknown) {
            const errorObj = err as { message?: string };
            toast.error(errorObj.message || "Gagal memproses Retur Pembelian.");
        } finally {
            setIsSavingForFinalize(false);
            setIsFinalizeOpen(false);
        }
    };

    const handleFinalizeClick = async () => {
        const activeItems = items.filter((i) => i.kuantitas > 0);
        if (!validateItems(activeItems)) return;

        const isHeaderValid = await headerForm.trigger();
        if (!isHeaderValid) {
            toast.error("Harap lengkapi kolom wajib pada informasi retur.");
            return;
        }

        setIsFinalizeOpen(true);
    };

    const handleSaveClick = () => {
        headerForm.handleSubmit(handleSaveFlow, (errors) => {
            console.error("Return form validation errors:", errors);
            toast.error("Harap isi semua kolom wajib dengan benar.");
        })();
    };

    const isPending =
        createHeader.isPending ||
        updateReturn.isPending ||
        bulkReplace.isPending ||
        bulkCreateReturn.isPending ||
        finalizeReturn.isPending ||
        isSavingForFinalize;

    return {
        isFinalizeOpen,
        setIsFinalizeOpen,
        isSavingForFinalize,
        isPending,
        handleSaveClick,
        handleFinalizeClick,
        handleFinalizeConfirm,
    };
}
