import { queryKeys } from "@/lib/query-keys";
import { apiGetData } from "@/shared/api/api-client";
import { useQuery } from "@tanstack/react-query";
import type { DailyReport, LabaRugiReport, PengeluaranReport, PenjualanReport, PurchaseReport, SalesByCategoryResponse } from "../types";

export function useDailyReport(date: string) {
    return useQuery<DailyReport>({
        queryKey: queryKeys.reports.daily(date),
        queryFn: () =>
            apiGetData<DailyReport>(`/v1/reports/sales/daily?date=${date}`),
        enabled: !!date,
    });
}

export function useLabaRugiReport(from: string, to: string, interval: string) {
    return useQuery<LabaRugiReport>({
        queryKey: queryKeys.reports.labaRugi(from, to, interval),
        queryFn: () =>
            apiGetData<LabaRugiReport>(
                `/v1/reports/laba-rugi?from=${from}&to=${to}&interval=${interval}`
            ),
        enabled: !!from && !!to && !!interval,
    });
}

export function usePengeluaranReport(from: string, to: string) {
    return useQuery<PengeluaranReport>({
        queryKey: queryKeys.reports.pengeluaran(from, to),
        queryFn: () =>
            apiGetData<PengeluaranReport>(`/v1/reports/pengeluaran?from=${from}&to=${to}`),
        enabled: !!from && !!to,
    });
}

export function usePembelianReport(
    from: string,
    to: string,
    includeItems: boolean,
    includePayments: boolean
) {
    return useQuery<PurchaseReport>({
        queryKey: queryKeys.reports.pembelian(from, to, includeItems, includePayments),
        queryFn: () =>
            apiGetData<PurchaseReport>(
                `/v1/reports/pembelian?from=${from}&to=${to}&include_items=${includeItems}&include_payments=${includePayments}`
            ),
        enabled: !!from && !!to,
    });
}

export function usePenjualanReport(
    from: string,
    to: string,
    includeItems: boolean,
    includePayments: boolean,
    page: number,
    perPage: number,
    sortOrder: "asc" | "desc"
) {
    return useQuery<PenjualanReport>({
        queryKey: queryKeys.reports.penjualan(from, to, includeItems, includePayments, page, perPage, sortOrder),
        queryFn: () =>
            apiGetData<PenjualanReport>(
                `/v1/reports/penjualan?from=${from}&to=${to}&include_items=${includeItems}&include_payments=${includePayments}&page=${page}&per_page=${perPage}&sort_order=${sortOrder}`
            ),
        enabled: !!from && !!to && !!page && !!perPage,
    });
}

export function useSalesByCategory(from: string, to: string, categoryIds?: string[]) {
    const categoryParam = categoryIds && categoryIds.length > 0
        ? `&category_ids=${categoryIds.join(",")}`
        : "";
    return useQuery<SalesByCategoryResponse>({
        queryKey: queryKeys.reports.salesByCategory(from, to, categoryIds),
        queryFn: () =>
            apiGetData<SalesByCategoryResponse>(
                `/v1/reports/sales/by-category?from=${from}&to=${to}${categoryParam}`
            ),
        enabled: !!from && !!to,
    });
}


