import { useQuery } from "@tanstack/react-query";
import { apiGetData, apiGetList } from "@/shared/api/api-client";
import { queryKeys } from "@/lib/query-keys";
import { PaginatedResponse } from "@/types/api";
import type { BalanceSheetReport, GeneralLedgerEntry } from "../types";

export function useBalanceSheet(asOfDate: string) {
    return useQuery<BalanceSheetReport>({
        queryKey: [...queryKeys.reports.all, "balance-sheet", asOfDate],
        queryFn: () =>
            apiGetData<BalanceSheetReport>(
                `/v1/reports/balance-sheet?as_of_date=${asOfDate}`
            ),
        enabled: !!asOfDate,
    });
}

export function useGeneralLedger(params: {
    from?: string;
    to?: string;
    chart_of_account_uid?: string;
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: string;
}) {
    const queryParams: Record<string, string | number> = {};
    if (params.from) queryParams.start_date = params.from;
    if (params.to) queryParams.end_date = params.to;
    if (params.chart_of_account_uid) queryParams.chart_of_account_uid = params.chart_of_account_uid;
    if (params.page) queryParams.page = params.page;
    if (params.per_page) queryParams.per_page = params.per_page;
    if (params.sort_by) queryParams.sort_by = params.sort_by;
    if (params.sort_order) queryParams.sort_order = params.sort_order;

    return useQuery<PaginatedResponse<GeneralLedgerEntry>>({
        queryKey: [...queryKeys.reports.all, "general-ledger", queryParams],
        queryFn: () => apiGetList<GeneralLedgerEntry>("/v1/reports/general-ledger", queryParams),
        enabled: true,
    });
}

export function useGeneralLedgerUnbalanced(params: {
    from?: string;
    to?: string;
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: string;
}) {
    const queryParams: Record<string, string | number> = {};
    if (params.from) queryParams.start_date = params.from;
    if (params.to) queryParams.end_date = params.to;
    if (params.page) queryParams.page = params.page;
    if (params.per_page) queryParams.per_page = params.per_page;
    if (params.sort_by) queryParams.sort_by = params.sort_by;
    if (params.sort_order) queryParams.sort_order = params.sort_order;

    return useQuery<PaginatedResponse<GeneralLedgerEntry>>({
        queryKey: [...queryKeys.reports.all, "general-ledger-unbalanced", queryParams],
        queryFn: () => apiGetList<GeneralLedgerEntry>("/v1/reports/general-ledger/unbalanced", queryParams),
        enabled: true,
    });
}
