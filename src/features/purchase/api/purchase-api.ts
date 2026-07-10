import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGetData, apiGetList, apiPost, apiPut, apiPatch, apiDelete, apiGet } from "@/shared/api/api-client";
import { apiClient } from "@/shared/api/axios";
import { queryKeys } from "@/lib/query-keys";
import { ENDPOINTS } from "@/shared/api/endpoints";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/api";
import type { Receiving, PurchaseOrder, ReceivingPayment, CashAccount, PurchaseReturn, PaymentSummary, SupplierDebtSummary } from "../types";
import type { ReceivingInput, ReceivingHeaderInput } from "../schemas/receiving-schema";
import type { PurchaseOrderHeaderInput, PurchaseOrderBulkItemsInput } from "../schemas/order-schema";
import type { PaymentInput } from "../schemas/payment-schema";
import type { PurchaseReturnInput, PurchaseReturnHeaderInput, PurchaseReturnBulkItemsInput } from "../schemas/return-schema";
import type { Product } from "@/features/products/types";

// ─── Stock Receiving Hooks ────────────────────────────────────────────────────

export function useReceivings(params?: PaginationParams & { search?: string; status?: string; supplier_uid?: string; start_date?: string; end_date?: string; status_pembayaran?: string }) {
    return useQuery<PaginatedResponse<Receiving>>({
        queryKey: [...queryKeys.purchase.receivings(), params],
        queryFn: () => apiGetList<Receiving>(ENDPOINTS.PURCHASE.RECEIVING.LIST, params),
    });
}

export function useReceivingDebts(params?: PaginationParams & { search?: string; from?: string; to?: string; tanggal_dari?: string; tanggal_sampai?: string; supplier_uid?: string }) {
    return useQuery<PaginatedResponse<Receiving>>({
        queryKey: [...queryKeys.purchase.receivings(), "debts", params],
        queryFn: () => apiGetList<Receiving>(ENDPOINTS.PURCHASE.RECEIVING.DEBTS, params),
    });
}

export function useReceivingDebtsSummary(params?: PaginationParams & { search?: string }) {
    return useQuery<PaginatedResponse<SupplierDebtSummary>>({
        queryKey: [...queryKeys.purchase.receivings(), "debts-summary", params],
        queryFn: () => apiGetList<SupplierDebtSummary>(ENDPOINTS.PURCHASE.RECEIVING.DEBTS_SUMMARY, params),
    });
}

export function useReceivingDetail(uid: string | null) {
    return useQuery<Receiving>({
        queryKey: [...queryKeys.purchase.receivings(), "detail", uid || ""],
        queryFn: () => apiGetData<Receiving>(ENDPOINTS.PURCHASE.RECEIVING.DETAIL(uid || "")),
        enabled: uid !== null && uid !== "",
    });
}

export function useCreateReceiving() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<Receiving>, Error, ReceivingInput>({
        mutationFn: (data) =>
            apiPost<ApiResponse<Receiving>, ReceivingInput>(
                ENDPOINTS.PURCHASE.RECEIVING.CREATE,
                data,
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.receivings(),
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        },
     });
}

export function useBulkCreateReceiving() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<Receiving>, Error, unknown>({
        mutationFn: (data) =>
            apiPost<ApiResponse<Receiving>, unknown>(
                ENDPOINTS.PURCHASE.RECEIVING.BULK,
                data,
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.receivings(),
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        },
    });
}

export function useCreateReceivingHeader() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<Receiving>, Error, ReceivingHeaderInput>({
        mutationFn: (data) =>
            apiPost<ApiResponse<Receiving>, ReceivingHeaderInput>(
                ENDPOINTS.PURCHASE.RECEIVING.CREATE,
                data,
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.receivings(),
            });
        },
    });
}

export function useBulkReplaceReceivingItems() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<Receiving>, Error, { uid: string; data: unknown }>({
        mutationFn: ({ uid, data }) =>
            apiPut<ApiResponse<Receiving>, unknown>(
                ENDPOINTS.PURCHASE.RECEIVING.ITEMS_REPLACE(uid),
                data,
            ),
        onSuccess: (_, _variables) => {
            queryClient.invalidateQueries({
                queryKey: ["purchase"],
            });
        },
    });
}

export function useCompleteReceiving() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<Receiving>, Error, string>({
        mutationFn: (uid) =>
            apiPost<ApiResponse<Receiving>, void>(
                ENDPOINTS.PURCHASE.RECEIVING.COMPLETE(uid),
            ),
        onSuccess: (_, _uid) => {
            queryClient.invalidateQueries({
                queryKey: ["purchase"],
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        },
    });
}

export interface ReceivingScanResponse {
    product: Product & { harga_beli_terakhir: number; harga_jual: number };
    po_item?: {
        kuantitas_dipesan: number;
        kuantitas_sudah_diterima: number;
        sisa: number;
        harga_estimasi: number;
    } | null;
}

export function useScanReceivingProduct() {
    return useMutation<ApiResponse<ReceivingScanResponse>, Error, { receiving_uid: string; barcode: string }>({
        mutationFn: (data) =>
            apiPost<ApiResponse<ReceivingScanResponse>, { receiving_uid: string; barcode: string }>(
                ENDPOINTS.PURCHASE.RECEIVING.SCAN,
                data,
            ),
    });
}


export function useUpdateReceiving() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<Receiving>, Error, { uid: string; data: unknown }>({
        mutationFn: ({ uid, data }) =>
            apiPut<ApiResponse<Receiving>, unknown>(
                ENDPOINTS.PURCHASE.RECEIVING.UPDATE(uid),
                data,
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["purchase"],
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        },
    });
}

export function useDeleteReceiving() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<void>, Error, string>({
        mutationFn: (uid) => apiDelete<ApiResponse<void>>(ENDPOINTS.PURCHASE.RECEIVING.DELETE(uid)),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["purchase"],
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        },
    });
}

export function useUpdateReceivingPaymentStatus() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<Receiving>, Error, { uid: string; status_pembayaran: "pending" | "unpaid" | "partial" | "paid" }>({
        mutationFn: ({ uid, status_pembayaran }) =>
            apiPatch<ApiResponse<Receiving>, { status_pembayaran: "pending" | "unpaid" | "partial" | "paid" }>(
                ENDPOINTS.PURCHASE.RECEIVING.PAYMENT_STATUS(uid),
                { status_pembayaran },
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.receivings(),
            });
        },
    });
}

export interface ComparePricesInput {
    items: {
        product_uid: string;
        harga_beli: number;
    }[];
}

export interface ComparePricesResult {
    product_uid: string;
    nama: string;
    harga_beli_lama: number;
    harga_beli_baru: number;
    harga_jual_lama: number;
    margin_lama: number;
    harga_jual_saran: number;
    selisih_harga_beli: number;
    perlu_alert: boolean;
}

export function useComparePrices() {
    return useMutation<ApiResponse<ComparePricesResult[]>, Error, ComparePricesInput>({
        mutationFn: (data) =>
            apiPost<ApiResponse<ComparePricesResult[]>, ComparePricesInput>(
                ENDPOINTS.PURCHASE.RECEIVING.COMPARE_PRICES,
                data,
            ),
    });
}

// ─── Purchase Order Hooks ─────────────────────────────────────────────────────

export function usePurchaseOrders(params?: PaginationParams & { search?: string; status?: string; supplier_uid?: string; start_date?: string; end_date?: string }) {
    return useQuery<PaginatedResponse<PurchaseOrder>>({
        queryKey: [...queryKeys.purchase.orders(), params],
        queryFn: () => apiGetList<PurchaseOrder>(ENDPOINTS.PURCHASE.ORDER.LIST, params),
    });
}

export function usePurchaseOrderDetail(uid: string | null) {
    return useQuery<PurchaseOrder>({
        queryKey: [...queryKeys.purchase.orders(), "detail", uid || ""],
        queryFn: () => apiGetData<PurchaseOrder>(ENDPOINTS.PURCHASE.ORDER.DETAIL(uid || "")),
        enabled: uid !== null && uid !== "",
    });
}

// Step 1: Create PO Header only (tanpa items)
export function useCreatePurchaseOrderHeader() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<PurchaseOrder>, Error, PurchaseOrderHeaderInput>({
        mutationFn: (data) =>
            apiPost<ApiResponse<PurchaseOrder>, PurchaseOrderHeaderInput>(
                ENDPOINTS.PURCHASE.ORDER.CREATE,
                data,
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.orders(),
            });
        },
    });
}

export function useBulkCreatePurchaseOrder() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<PurchaseOrder>, Error, unknown>({
        mutationFn: (data) =>
            apiPost<ApiResponse<PurchaseOrder>, unknown>(
                ENDPOINTS.PURCHASE.ORDER.BULK,
                data,
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.orders(),
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        },
    });
}

// Step 3: Bulk submit items to PO
export function useBulkSubmitPurchaseOrderItems() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<PurchaseOrder>, Error, { uid: string; data: PurchaseOrderBulkItemsInput }>({
        mutationFn: ({ uid, data }) =>
            apiPost<ApiResponse<PurchaseOrder>, PurchaseOrderBulkItemsInput>(
                ENDPOINTS.PURCHASE.ORDER.ITEMS_BULK(uid),
                data,
            ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.orders(),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.orderDetail(variables.uid),
            });
        },
    });
}

// Replace all items in PO (for editing existing items)
export function useBulkReplacePurchaseOrderItems() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<PurchaseOrder>, Error, { uid: string; data: PurchaseOrderBulkItemsInput }>({
        mutationFn: ({ uid, data }) =>
            apiPut<ApiResponse<PurchaseOrder>, PurchaseOrderBulkItemsInput>(
                ENDPOINTS.PURCHASE.ORDER.ITEMS_REPLACE(uid),
                data,
            ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.orders(),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.orderDetail(variables.uid),
            });
        },
    });
}

// Outstanding POs (ordered, belum selesai diterima)
export function useOutstandingPurchaseOrders(params?: PaginationParams) {
    return useQuery<PaginatedResponse<PurchaseOrder>>({
        queryKey: [...queryKeys.purchase.outstanding(), params],
        queryFn: () => apiGetList<PurchaseOrder>(ENDPOINTS.PURCHASE.ORDER.OUTSTANDING, params),
    });
}

// Receivings linked to a specific PO
export function usePurchaseOrderReceivings(poUid: string | null, params?: PaginationParams) {
    return useQuery<PaginatedResponse<Receiving>>({
        queryKey: [...queryKeys.purchase.orderReceivings(poUid || ""), params],
        queryFn: () => apiGetList<Receiving>(ENDPOINTS.PURCHASE.ORDER.RECEIVINGS(poUid || ""), params),
        enabled: poUid !== null && poUid !== "",
    });
}

// Legacy: Create PO with items (backward compat — kept but not used by new flow)
export function useCreatePurchaseOrder() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<PurchaseOrder>, Error, PurchaseOrderHeaderInput>({
        mutationFn: (data) =>
            apiPost<ApiResponse<PurchaseOrder>, PurchaseOrderHeaderInput>(
                ENDPOINTS.PURCHASE.ORDER.CREATE,
                data,
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.orders(),
            });
        },
    });
}

export function useUpdatePurchaseOrder() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<PurchaseOrder>, Error, { uid: string; data: PurchaseOrderHeaderInput }>({
        mutationFn: ({ uid, data }) =>
            apiPut<ApiResponse<PurchaseOrder>, PurchaseOrderHeaderInput>(
                ENDPOINTS.PURCHASE.ORDER.UPDATE(uid),
                data,
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.orders(),
            });
        },
    });
}

export function useDeletePurchaseOrder() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<void>, Error, string>({
        mutationFn: (uid) => apiDelete<ApiResponse<void>>(ENDPOINTS.PURCHASE.ORDER.DELETE(uid)),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.orders(),
            });
        },
    });
}

export function useFinalizePurchaseOrder() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<PurchaseOrder>, Error, string>({
        mutationFn: (uid) =>
            apiPost<ApiResponse<PurchaseOrder>, void>(
                ENDPOINTS.PURCHASE.ORDER.FINALIZE(uid),
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.orders(),
            });
        },
    });
}

export function useCancelPurchaseOrder() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<PurchaseOrder>, Error, string>({
        mutationFn: (uid) =>
            apiPost<ApiResponse<PurchaseOrder>, void>(
                ENDPOINTS.PURCHASE.ORDER.CANCEL(uid),
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.orders(),
            });
        },
    });
}

// ─── Barcode Lookup ─────────────────────────────────────────────────────────

export async function lookupProductByBarcode(barcode: string): Promise<Product[]> {
    const res = await apiGet<ApiResponse<Product[]>>(
        ENDPOINTS.PRODUCTS.BARCODE(barcode),
    );
    return res.data;
}

// ─── Cash Accounts Hook ────────────────────────────────────────────────────────

export function useCashAccounts() {
    return useQuery<CashAccount[]>({
        queryKey: queryKeys.cashAccounts.all,
        queryFn: async () => {
            const res = await apiGetData<CashAccount[]>(ENDPOINTS.CASH_ACCOUNTS);
            return res;
        },
    });
}

// ─── Supplier Payment Hooks ───────────────────────────────────────────────────

export function usePayments(params?: PaginationParams & { stock_receiving_uid?: string; receiving_uid?: string; start_date?: string; end_date?: string }) {
    return useQuery<PaginatedResponse<ReceivingPayment>>({
        queryKey: [...queryKeys.purchase.payments(), params],
        queryFn: () => apiGetList<ReceivingPayment>(ENDPOINTS.PURCHASE.PAYMENT.LIST, params),
    });
}

export function usePaymentDetail(uid: string | null) {
    return useQuery<ReceivingPayment>({
        queryKey: [...queryKeys.purchase.payments(), "detail", uid || ""],
        queryFn: () => apiGetData<ReceivingPayment>(ENDPOINTS.PURCHASE.PAYMENT.DETAIL(uid || "")),
        enabled: uid !== null && uid !== "",
    });
}

export function usePaymentSummary(receivingUid: string | null) {
    return useQuery<PaymentSummary>({
        queryKey: [...queryKeys.purchase.payments(), "summary", receivingUid || ""],
        queryFn: async () => {
            if (!receivingUid) throw new Error("Receiving UID is required");
            try {
                // Try fetching from the summary endpoint first (which returns flat JSON object)
                const res = await apiGet<PaymentSummary>(
                    ENDPOINTS.PURCHASE.PAYMENT.SUMMARY(receivingUid)
                );
                if (!res) {
                    throw new Error("Empty summary response");
                }
                return res;
            } catch (err) {
                console.warn("Summary endpoint failed or not found, falling back to client-side aggregation:", err);

                // Fallback: fetch receiving detail and all payments
                const queryParams: PaginationParams & { stock_receiving_uid: string } = {
                    per_page: 100,
                    stock_receiving_uid: receivingUid,
                };
                const [receiving, paymentsResponse] = await Promise.all([
                    apiGetData<Receiving>(ENDPOINTS.PURCHASE.RECEIVING.DETAIL(receivingUid)),
                    apiGetList<ReceivingPayment>(ENDPOINTS.PURCHASE.PAYMENT.LIST, queryParams),
                ]);

                // Filter payments belonging to this receiving and which are completed (not voided)
                const completedPayments = (paymentsResponse.data || []).filter(
                    (p) => (p.referensi_uid === receivingUid || p.stock_receiving?.uid === receivingUid) && p.status === "completed"
                );

                const totalFaktur = receiving.nilai_faktur || 0;
                const totalDibayar = completedPayments.reduce((sum, p) => sum + p.total, 0);
                const sisaHutang = receiving.sisa_hutang !== undefined ? receiving.sisa_hutang : Math.max(0, totalFaktur - totalDibayar);

                let statusPembayaran: "pending" | "unpaid" | "partial" | "paid" = receiving.status_pembayaran || "pending";
                if (totalDibayar >= totalFaktur && totalFaktur > 0) {
                    statusPembayaran = "paid";
                } else if (totalDibayar > 0) {
                    statusPembayaran = "partial";
                }

                return {
                    receiving_uid: receivingUid,
                    nomor_penerimaan: receiving.nomor_penerimaan,
                    total_faktur: totalFaktur,
                    total_dibayar: totalDibayar,
                    sisa_hutang: sisaHutang,
                    status_pembayaran: statusPembayaran,
                    payments: completedPayments.map((p) => ({
                        uid: p.uid,
                        jumlah: p.total,
                        metode: p.metode_pembayaran,
                        tanggal: p.created_at,
                    })),
                };
            }
        },
        enabled: receivingUid !== null && receivingUid !== "",
    });
}

export function useOutstandingReceivings() {
    return useQuery<Receiving[]>({
        queryKey: [...queryKeys.purchase.receivings(), "outstanding"],
        queryFn: async () => {
            const queryParams: PaginationParams = {
                per_page: 1000,
            };
            const res = await apiGetList<Receiving>(ENDPOINTS.PURCHASE.RECEIVING.DEBTS, queryParams);
            return res.data || [];
        },
    });
}

export function useCreatePayment() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<ReceivingPayment>, Error, PaymentInput>({
        mutationFn: (data) =>
            apiPost<ApiResponse<ReceivingPayment>, PaymentInput>(
                ENDPOINTS.PURCHASE.PAYMENT.CREATE,
                data,
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.payments(),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.receivings(),
            });
        },
    });
}

export function useUpdatePayment() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<ReceivingPayment>, Error, { uid: string; data: PaymentInput }>({
        mutationFn: ({ uid, data }) =>
            apiPut<ApiResponse<ReceivingPayment>, PaymentInput>(
                ENDPOINTS.PURCHASE.PAYMENT.UPDATE(uid),
                data,
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.payments(),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.receivings(),
            });
        },
    });
}

export function useDeletePayment() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<ReceivingPayment>, Error, { uid: string; alasan?: string }>({
        mutationFn: async ({ uid, alasan }) => {
            const { data } = await apiClient.delete<ApiResponse<ReceivingPayment>>(
                ENDPOINTS.PURCHASE.PAYMENT.DELETE(uid),
                { data: { alasan } }
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.payments(),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.receivings(),
            });
        },
    });
}

// ─── Purchase Return Hooks ───────────────────────────────────────────────────

export function usePurchaseReturns(params?: PaginationParams & { search?: string; status?: string; supplier_uid?: string; stock_receiving_uid?: string; start_date?: string; end_date?: string }) {
    return useQuery<PaginatedResponse<PurchaseReturn>>({
        queryKey: [...queryKeys.purchase.returns(), params],
        queryFn: () => apiGetList<PurchaseReturn>(ENDPOINTS.PURCHASE.RETURN.LIST, params),
    });
}

export function usePurchaseReturnDetail(uid: string | null) {
    return useQuery<PurchaseReturn>({
        queryKey: [...queryKeys.purchase.returnDetail(uid || "")],
        queryFn: () => apiGetData<PurchaseReturn>(ENDPOINTS.PURCHASE.RETURN.DETAIL(uid || "")),
        enabled: uid !== null && uid !== "",
    });
}

export function useCreatePurchaseReturn() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<PurchaseReturn>, Error, PurchaseReturnInput>({
        mutationFn: (data) =>
            apiPost<ApiResponse<PurchaseReturn>, PurchaseReturnInput>(
                ENDPOINTS.PURCHASE.RETURN.CREATE,
                data,
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.returns(),
            });
        },
    });
}

export function useCreatePurchaseReturnHeader() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<PurchaseReturn>, Error, PurchaseReturnHeaderInput>({
        mutationFn: (data) =>
            apiPost<ApiResponse<PurchaseReturn>, PurchaseReturnHeaderInput>(
                ENDPOINTS.PURCHASE.RETURN.CREATE,
                data,
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.returns(),
            });
        },
    });
}

export function useBulkCreatePurchaseReturn() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<PurchaseReturn>, Error, unknown>({
        mutationFn: (data) =>
            apiPost<ApiResponse<PurchaseReturn>, unknown>(
                ENDPOINTS.PURCHASE.RETURN.BULK,
                data,
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.returns(),
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        },
    });
}

export function useUpdatePurchaseReturn() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<PurchaseReturn>, Error, { uid: string; data: unknown }>({
        mutationFn: ({ uid, data }) =>
            apiPut<ApiResponse<PurchaseReturn>, unknown>(
                ENDPOINTS.PURCHASE.RETURN.UPDATE(uid),
                data,
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.returns(),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.all,
            });
        },
    });
}

export function useBulkReplacePurchaseReturnItems() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<PurchaseReturn>, Error, { uid: string; data: PurchaseReturnBulkItemsInput }>({
        mutationFn: ({ uid, data }) =>
            apiPut<ApiResponse<PurchaseReturn>, PurchaseReturnBulkItemsInput>(
                ENDPOINTS.PURCHASE.RETURN.ITEMS_REPLACE(uid),
                data,
            ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.returns(),
            });
            queryClient.invalidateQueries({
                queryKey: [...queryKeys.purchase.returns(), "detail", variables.uid],
            });
        },
    });
}

export function useDeletePurchaseReturn() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<void>, Error, string>({
        mutationFn: (uid) => apiDelete<ApiResponse<void>>(ENDPOINTS.PURCHASE.RETURN.DELETE(uid)),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.returns(),
            });
        },
    });
}

export interface FinalizeReturnInput {
    impact_type?: "refund" | "credit" | "credit_note" | "exchange" | null;
    resolution_type?: "refund" | "credit" | "credit_note" | "exchange" | null;
    cash_account_uid?: string | null;
    stock_receiving_uid?: string | null;
    catatan_penyelesaian?: string | null;
}

export function useFinalizePurchaseReturn() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<PurchaseReturn>, Error, { uid: string; data: FinalizeReturnInput }>({
        mutationFn: ({ uid, data }) =>
            apiPost<ApiResponse<PurchaseReturn>, FinalizeReturnInput>(
                ENDPOINTS.PURCHASE.RETURN.FINALIZE(uid),
                data,
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.returns(),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.products.all,
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.cashAccounts.all,
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.purchase.receivings(),
            });
        },
    });
}

export interface ReturnableItem {
    product_uid: string;
    product: Product;
    kuantitas_diterima: number;
    kuantitas_diretur: number;
    kuantitas_sisa: number;
    harga_beli: number;
}

export function useReturnableItems(receivingUid: string | null) {
    return useQuery<ReturnableItem[]>({
        queryKey: [...queryKeys.purchase.receivings(), "returnable-items", receivingUid || ""],
        queryFn: async () => {
            if (!receivingUid) return [];
            const res = await apiGetData<ReturnableItem[]>(
                ENDPOINTS.PURCHASE.RETURN.RETURNABLE_ITEMS(receivingUid),
            );
            return res;
        },
        enabled: receivingUid !== null && receivingUid !== "",
    });
}

export interface ReturnScanResponse {
    product: {
        uid: string;
        nama: string;
        barcode: string;
        harga_beli: number;
    };
    kuantitas_diterima: number;
    kuantitas_diretur: number;
    kuantitas_sisa: number;
}

export function useScanReturnProduct() {
    return useMutation<ApiResponse<ReturnScanResponse>, Error, { receiving_uid: string; barcode: string }>({
        mutationFn: (data) =>
            apiPost<ApiResponse<ReturnScanResponse>, { receiving_uid: string; barcode: string }>(
                ENDPOINTS.PURCHASE.RETURN.SCAN,
                data,
            ),
    });
}
