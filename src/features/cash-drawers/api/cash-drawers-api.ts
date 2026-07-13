import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGetList, apiPost, apiPut, apiDelete } from "@/shared/api/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/api";
import type { CashDrawer } from "../types";
import type { CashDrawerInput } from "../schemas/cash-drawer-schema";

export function useCashDrawers(params?: PaginationParams & { search?: string }) {
    return useQuery<PaginatedResponse<CashDrawer>>({
        queryKey: [...queryKeys.cashDrawers.all, params],
        queryFn: () => apiGetList<CashDrawer>("/v1/cash-drawer/management", params),
    });
}

export function useCreateCashDrawer() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<CashDrawer>, Error, CashDrawerInput>({
        mutationFn: (data) =>
            apiPost<ApiResponse<CashDrawer>, CashDrawerInput>("/v1/cash-drawer/management", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cashDrawers.all });
        },
    });
}

export function useUpdateCashDrawer() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<CashDrawer>, Error, { uid: string; data: CashDrawerInput }>({
        mutationFn: ({ uid, data }) =>
            apiPut<ApiResponse<CashDrawer>, CashDrawerInput>(`/v1/cash-drawer/management/${uid}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cashDrawers.all });
        },
    });
}

export function useDeleteCashDrawer() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<void>, Error, string>({
        mutationFn: (uid) => apiDelete<ApiResponse<void>>(`/v1/cash-drawer/management/${uid}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cashDrawers.all });
        },
    });
}
