import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGetData, apiGetList, apiPost, apiPut, apiDelete } from "@/shared/api/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/api";
import type { StockMovement, Opname, OpnameItem } from "../types";
import type { AdjustmentInput } from "../schemas/adjustment-schema";
import type { OpnameHeaderInput } from "../schemas/opname-schema";

export function useStockMovements(params?: PaginationParams & { tipe?: string }) {
    return useQuery<PaginatedResponse<StockMovement>>({
        queryKey: [...queryKeys.inventory.movements(), params],
        queryFn: () => apiGetList<StockMovement>("/v1/inventory/movements", params),
    });
}

export function useOpnames(params?: PaginationParams) {
    return useQuery<PaginatedResponse<Opname>>({
        queryKey: [...queryKeys.inventory.opnames(), params],
        queryFn: () => apiGetList<Opname>("/v1/inventory/opname", params),
    });
}

export function useOpnameDetail(uid: string | null) {
    return useQuery<Opname>({
        queryKey: queryKeys.inventory.opnameDetail(uid || ""),
        queryFn: () => apiGetData<Opname>(`/v1/inventory/opname/${uid}`),
        enabled: uid !== null && uid !== "",
    });
}

export function useOpnameItems(uid: string | null, params?: PaginationParams) {
    return useQuery<PaginatedResponse<OpnameItem>>({
        queryKey: [...queryKeys.inventory.opnameDetail(uid || ""), "items", params],
        queryFn: () => apiGetList<OpnameItem>(`/v1/inventory/opname/${uid}/items`, params),
        enabled: uid !== null && uid !== "",
    });
}

export interface OpnameProgress {
    uid: string;
    status: string;
    progress: number;
    total_items: number;
    processed_items: number;
    error_message: string | null;
}

export function useOpnameProgress(uid: string | null, enabled = true) {
    return useQuery<OpnameProgress>({
        queryKey: [...queryKeys.inventory.opnameDetail(uid || ""), "progress"],
        queryFn: () => apiGetData<OpnameProgress>(`/v1/inventory/opname/${uid}/progress`),
        enabled: uid !== null && uid !== "" && enabled,
        refetchInterval: (query) => {
            const data = query.state.data;
            if (!data) return 2000;
            return data.status === "processing" || data.status === "pending" ? 2000 : false;
        },
    });
}

export function useCreateAdjustment() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<void>, Error, AdjustmentInput>({
        mutationFn: (data) =>
            apiPost<ApiResponse<void>, AdjustmentInput>(
                "/v1/inventory/adjustment",
                data,
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.inventory.movements(),
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        },
    });
}

export function useCreateOpname() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<Opname>, Error, OpnameHeaderInput>({
        mutationFn: (data) =>
            apiPost<ApiResponse<Opname>, OpnameHeaderInput>(
                "/v1/inventory/opname",
                data,
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.inventory.opnames(),
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        },
    });
}

export function useUpdateOpname() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<Opname>, Error, { uid: string; data: OpnameHeaderInput }>({
        mutationFn: ({ uid, data }) =>
            apiPut<ApiResponse<Opname>, OpnameHeaderInput>(
                `/v1/inventory/opname/${uid}`,
                data,
            ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.inventory.opnames(),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.inventory.opnameDetail(variables.uid),
            });
        },
    });
}

export function useUpdateOpnameItems() {
    const queryClient = useQueryClient();
    return useMutation<
        ApiResponse<Opname>,
        Error,
        {
            uid: string;
            data: {
                items: Array<{
                    product_uid: string;
                    stok_fisik: number;
                    alasan?: string | null;
                }>;
            };
        }
    >({
        mutationFn: ({ uid, data }) =>
            apiPut<ApiResponse<Opname>, { items: Array<{ product_uid: string; stok_fisik: number; alasan?: string | null }> }>(
                `/v1/inventory/opname/${uid}/items`,
                data,
            ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.inventory.opnames(),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.inventory.opnameDetail(variables.uid),
            });
        },
    });
}

export function useFinalizeOpname() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<Opname>, Error, string>({
        mutationFn: (uid) =>
            apiPost<ApiResponse<Opname>, undefined>(
                `/v1/inventory/opname/${uid}/finalize`,
                undefined,
            ),
        onSuccess: (_, uid) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.inventory.opnames(),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.inventory.opnameDetail(uid),
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        },
    });
}


// ─── Opname Deletion Hook ────────────────────────────────────────────────────

export function useDeleteOpname() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<void>, Error, string>({
        mutationFn: (uid) => apiDelete<ApiResponse<void>>(`/v1/inventory/opname/${uid}`),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.inventory.opnames(),
            });
        },
    });
}

// ─── Audit / Activity Logs Hooks ─────────────────────────────────────────────

export interface ActivityLog {
    uid: string;
    user_uid: string | null;
    action: string;
    model_type: string | null;
    model_uid: string | null;
    description: string;
    module?: string[] | null;
    ip_address: string | null;
    user_agent: string | null;
    properties: Record<string, unknown> | null;
    created_at: string;
    user?: {
        uid: string;
        name: string;
        username: string;
    };
}

export function useActivityLogs(params?: PaginationParams & { search?: string; module?: string }) {
    return useQuery<PaginatedResponse<ActivityLog>>({
        queryKey: [...queryKeys.activityLogs.list(), params],
        queryFn: () => apiGetList<ActivityLog>("/v1/activity-logs", params),
    });
}
