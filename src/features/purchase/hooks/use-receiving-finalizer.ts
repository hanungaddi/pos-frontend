"use client";

import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { PAYMENT_STATUS } from "@/constants/purchase";
import { useAppRouter } from "@/hooks/use-app-router";
import { formatUTC, todayStr } from "@/lib/date-utils";
import { clearPurchaseItemsStore } from "@/stores/purchase-items-store";

import {
    useBulkCreateReceiving,
    useBulkReplaceReceivingItems,
    useComparePrices,
    useCompleteReceiving,
    useCreateReceivingHeader,
    useUpdateReceiving,
    type ComparePricesResult,
} from "@/features/purchase/api/purchase-api";
import type { ReceivingHeaderInput } from "@/features/purchase/schemas/receiving-schema";
import type { PurchaseItemLocal, PurchaseOrder, Receiving } from "@/features/purchase/types";

interface UseReceivingFinalizerProps {
    currentId: string;
    currentReceiving?: Receiving;
    isCurrentNew: boolean;
    items: PurchaseItemLocal[];
    clearAll: () => void;
    onSaveSuccess: (uid: string, responseData?: Receiving) => void;
    headerForm: UseFormReturn<ReceivingHeaderInput>;
    poId: string | null;
    poData?: PurchaseOrder;
    poRemainingMap: React.MutableRefObject<Record<string, { sisa: number; nama: string }>>;
}

export function useReceivingFinalizer({
    currentId,
    currentReceiving,
    isCurrentNew,
    items,
    clearAll,
    onSaveSuccess,
    headerForm,
    poId,
    poRemainingMap,
}: UseReceivingFinalizerProps) {
    const router = useAppRouter();

    const [saveMode, setSaveMode] = useState<"save" | "process">("process");
    const [priceAlerts, setPriceAlerts] = useState<ComparePricesResult[]>([]);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);

    const [bulkItemsPayload, setBulkItemsPayload] = useState<{
        product_uid: string;
        kuantitas: number;
        harga_beli: number;
        update_harga_jual: boolean;
        harga_jual_baru: number | null;
        margin_baru: number | null;
    }[] | null>(null);

    const bulkCreateReceiving = useBulkCreateReceiving();
    const createHeaderMutation = useCreateReceivingHeader();
    const updateReceiving = useUpdateReceiving();
    const completeReceiving = useCompleteReceiving();
    const comparePrices = useComparePrices();
    const bulkReplace = useBulkReplaceReceivingItems();

    const validateQuantities = () => {
        if (poId) {
            for (const item of items) {
                const poLimit = poRemainingMap.current[item.product_uid];
                if (poLimit && item.kuantitas > poLimit.sisa) {
                    return {
                        valid: false,
                        message: `Kuantitas untuk "${item.nama}" (${item.kuantitas} pcs) melebihi sisa PO yang belum diterima (${poLimit.sisa} pcs).`,
                    };
                }
            }
        }
        return { valid: true };
    };

    const handleSaveFlow = async (data: ReceivingHeaderInput) => {
        const payload = {
            ...data,
            purchase_order_uid: data.purchase_order_uid || null,
            supplier_uid: data.supplier_uid || null,
            tanggal_terima: formatUTC(data.tanggal_terima),
        };

        if (isCurrentNew) {
            try {
                // 1. Create receiving header draft
                const res = await createHeaderMutation.mutateAsync(payload);
                const newUid = res.data.uid;

                // 2. Save items (bulk replace) if there are any
                if (items.length > 0) {
                    const itemsPayload = items.map((item) => ({
                        product_uid: item.product_uid,
                        kuantitas: item.kuantitas,
                        harga_beli: item.harga_estimasi,
                    }));

                    const replaceRes = await bulkReplace.mutateAsync({
                        uid: newUid,
                        data: {
                            purchase_order_uid: res.data.purchase_order_uid || null,
                            supplier_uid: res.data.supplier_uid || "",
                            nomor_faktur: res.data.nomor_faktur || null,
                            nilai_faktur: res.data.nilai_faktur ? Number(res.data.nilai_faktur) : 0,
                            tanggal_terima: formatUTC(res.data.tanggal_terima || todayStr()),
                            status_pembayaran: res.data.status_pembayaran || PAYMENT_STATUS.PENDING,
                            catatan: res.data.catatan || null,
                            items: itemsPayload,
                        },
                    });

                    toast.success("Header & daftar barang penerimaan berhasil disimpan!");
                    clearPurchaseItemsStore("new", "receiving");
                    onSaveSuccess(newUid, replaceRes.data);
                } else {
                    toast.success("Header Penerimaan Barang berhasil disimpan!");
                    clearPurchaseItemsStore("new", "receiving");
                    onSaveSuccess(newUid, res.data);
                }
            } catch (err: unknown) {
                const errorObj = err as { message?: string };
                toast.error(errorObj.message || "Gagal menyimpan header penerimaan.");
            }
        } else {
            const itemsPayload = items.map((item) => ({
                product_uid: item.product_uid,
                kuantitas: item.kuantitas,
                harga_beli: item.harga_estimasi,
            }));

            const updatePayload = {
                purchase_order_uid: data.purchase_order_uid || null,
                supplier_uid: data.supplier_uid,
                nomor_faktur: data.nomor_faktur || null,
                nilai_faktur: Number(data.nilai_faktur),
                tanggal_terima: formatUTC(data.tanggal_terima),
                status_pembayaran: data.status_pembayaran,
                catatan: data.catatan,
                status: currentReceiving?.status || "draft",
                items: itemsPayload,
            };

            try {
                const res = await updateReceiving.mutateAsync({ uid: currentId, data: updatePayload });
                toast.success("Penerimaan barang berhasil diperbarui!");
                onSaveSuccess(currentId, res.data);
            } catch (err: unknown) {
                const errorObj = err as { message?: string };
                toast.error(errorObj.message || "Gagal memperbarui penerimaan.");
            }
        }
    };

    const onProcessClick = async () => {
        setSaveMode("process");

        if (items.length === 0) {
            toast.error("Harap tambahkan minimal 1 barang sebelum menyelesaikan.");
            return;
        }

        const qtyValidation = validateQuantities();
        if (!qtyValidation.valid) {
            toast.error(qtyValidation.message);
            return;
        }

        const isHeaderValid = await headerForm.trigger();
        if (!isHeaderValid) {
            toast.error("Harap lengkapi kolom wajib pada informasi penerimaan barang.");
            return;
        }

        try {
            const res = await comparePrices.mutateAsync({
                items: items.map((i) => ({
                    product_uid: i.product_uid,
                    harga_beli: i.harga_estimasi,
                })),
            });

            const alerts = (res.data || []).filter((r: ComparePricesResult) => r.perlu_alert);
            if (alerts.length > 0) {
                setPriceAlerts(alerts);
                setIsAlertOpen(true);
            } else {
                setIsFinalizeOpen(true);
            }
        } catch (err: unknown) {
            const errorObj = err as { message?: string };
            toast.error(errorObj.message || "Gagal membandingkan harga.");
        }
    };

    const handleCompleteWithoutPrices = () => {
        setIsAlertOpen(false);
        setIsFinalizeOpen(true);
    };

    const handleCompleteWithPrices = async (formValues: {
        items: {
            product_uid: string;
            update_harga_jual: boolean;
            margin_baru: number;
            harga_jual_baru: number;
        }[];
    }) => {
        const payloadItems = items.map((item) => {
            const pricing = formValues.items.find((fit) => fit.product_uid === item.product_uid);
            return {
                product_uid: item.product_uid,
                kuantitas: item.kuantitas,
                harga_beli: item.harga_estimasi,
                update_harga_jual: pricing ? pricing.update_harga_jual : false,
                harga_jual_baru: pricing && pricing.update_harga_jual ? pricing.harga_jual_baru : null,
                margin_baru: pricing && pricing.update_harga_jual ? pricing.margin_baru : null,
            };
        });

        if (isCurrentNew) {
            setBulkItemsPayload(payloadItems);
            setIsAlertOpen(false);
            setIsFinalizeOpen(true);
            return;
        }

        try {
            await bulkReplace.mutateAsync({ uid: currentId, data: { items: payloadItems } });
            setIsAlertOpen(false);
            setIsFinalizeOpen(true);
        } catch (err: unknown) {
            const errorObj = err as { message?: string };
            toast.error(errorObj.message || "Gagal menyimpan update harga.");
        }
    };

    const handleFinalizeConfirm = async (formData: {
        nomor_faktur: string | null;
        nilai_faktur: number;
        catatan: string | null;
    }) => {
        setIsFinalizing(true);

        const headerData = headerForm.getValues();

        try {
            if (isCurrentNew) {
                const itemsPayload = bulkItemsPayload || items.map((item) => ({
                    product_uid: item.product_uid,
                    kuantitas: item.kuantitas,
                    harga_beli: item.harga_estimasi,
                    update_harga_jual: false,
                    harga_jual_baru: null,
                    margin_baru: null,
                }));

                const payload = {
                    purchase_order_uid: headerData.purchase_order_uid || null,
                    supplier_uid: headerData.supplier_uid || "",
                    nomor_faktur: formData.nomor_faktur || null,
                    nilai_faktur: Number(formData.nilai_faktur),
                    tanggal_terima: formatUTC(headerData.tanggal_terima || todayStr()),
                    status_pembayaran: currentReceiving?.status_pembayaran || PAYMENT_STATUS.PENDING,
                    catatan: formData.catatan || headerData.catatan || null,
                    status: "completed",
                    items: itemsPayload,
                };

                await bulkCreateReceiving.mutateAsync(payload);

                toast.success("Penerimaan barang bulk telah diselesaikan & stok/harga telah diperbarui!");
                clearAll();
                clearPurchaseItemsStore("new", "receiving");
                router.push("/admin/purchase/receiving");
                return;
            }

            const itemsPayload = items.map((item) => ({
                product_uid: item.product_uid,
                kuantitas: item.kuantitas,
                harga_beli: item.harga_estimasi,
            }));

            const payload = {
                purchase_order_uid: currentReceiving?.purchase_order_uid || null,
                supplier_uid: currentReceiving?.supplier_uid || "",
                nomor_faktur: formData.nomor_faktur,
                nilai_faktur: Number(formData.nilai_faktur),
                tanggal_terima: formatUTC(currentReceiving?.tanggal_terima || currentReceiving?.created_at || todayStr()),
                status_pembayaran: currentReceiving?.status_pembayaran || PAYMENT_STATUS.PENDING,
                catatan: formData.catatan,
                status: currentReceiving?.status || "draft",
                items: itemsPayload,
            };

            await updateReceiving.mutateAsync({ uid: currentId, data: payload });
            await completeReceiving.mutateAsync(currentId);

            toast.success("Penerimaan barang telah diselesaikan & stok/harga telah diperbarui!");
            clearAll();
            clearPurchaseItemsStore(currentId, "receiving");
            router.push("/admin/purchase/receiving");
        } catch (err: unknown) {
            const errorObj = err as { message?: string };
            toast.error(errorObj.message || "Gagal menyelesaikan penerimaan barang.");
        } finally {
            setIsFinalizing(false);
            setIsFinalizeOpen(false);
        }
    };

    const handleSaveClick = () => {
        headerForm.handleSubmit(handleSaveFlow)();
    };

    const handleFinalizeClose = (open: boolean) => {
        setIsFinalizeOpen(open);
        if (!open && isCurrentNew && currentId !== "new") {
            onSaveSuccess(currentId, currentReceiving);
        }
    };

    const handleAlertClose = (open: boolean) => {
        setIsAlertOpen(open);
        if (!open && isCurrentNew && currentId !== "new") {
            onSaveSuccess(currentId, currentReceiving);
        }
    };

    const isSubmitting =
        bulkReplace.isPending ||
        completeReceiving.isPending ||
        isFinalizing ||
        bulkCreateReceiving.isPending ||
        updateReceiving.isPending ||
        createHeaderMutation.isPending ||
        comparePrices.isPending;

    return {
        priceAlerts,
        isAlertOpen,
        isFinalizeOpen,
        isFinalizing,
        saveMode,
        isSubmitting,
        handleSaveClick,
        onProcessClick,
        handleCompleteWithoutPrices,
        handleCompleteWithPrices,
        handleFinalizeConfirm,
        handleFinalizeClose,
        handleAlertClose,
    };
}
