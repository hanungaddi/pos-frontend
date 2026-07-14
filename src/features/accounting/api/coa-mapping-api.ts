import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGetData, apiPut } from "@/shared/api/api-client";
import { queryKeys } from "@/lib/query-keys";
import { ENDPOINTS } from "@/shared/api/endpoints";
import type { ApiResponse } from "@/types/api";

export interface CoaMapping {
    transaction_type: string;
    slot: string;
    chart_of_account_uid: string;
    kode?: string | null;
    nama?: string | null;
}

export interface CoaMappingUpdate {
    transaction_type: string;
    slot: string;
    chart_of_account_uid: string;
}

export function useCoaMappings() {
    return useQuery<CoaMapping[]>({
        queryKey: queryKeys.coaMappings.list(),
        queryFn: () => apiGetData<CoaMapping[]>(ENDPOINTS.COA_MAPPINGS.LIST),
    });
}

export function useUpdateCoaMappings() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<null>, Error, CoaMappingUpdate[]>({
        mutationFn: (mappings) =>
            apiPut<ApiResponse<null>, { mappings: CoaMappingUpdate[] }>(
                ENDPOINTS.COA_MAPPINGS.UPDATE,
                { mappings }
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.coaMappings.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
        },
    });
}
