import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type {
    CashDrawerSession,
    OpenCashDrawerPayload,
    CashInPayload,
    CashOutPayload,
    CloseCashDrawerPayload,
} from "../types";

// Helper to construct request config with optional custom Bearer token
const getRequestConfig = (token?: string) => {
    if (token) {
        return {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
    }
    return {};
};

// 1. Hook to get current open cash drawer session
export function useCurrentCashDrawer(token?: string) {
    return useQuery<ApiResponse<CashDrawerSession | null>>({
        queryKey: ["cash-drawer", "current", token],
        queryFn: async () => {
            const { data } = await apiClient.get<ApiResponse<CashDrawerSession | null>>(
                "/v1/cash-drawer/current",
                getRequestConfig(token),
            );
            return data;
        },
    });
}

// 2. Hook to open a cash drawer session
export function useOpenCashDrawer() {
    const queryClient = useQueryClient();
    return useMutation<
        ApiResponse<CashDrawerSession>,
        Error,
        { payload: OpenCashDrawerPayload; token?: string }
    >({
        mutationFn: async ({ payload, token }) => {
            const { data } = await apiClient.post<ApiResponse<CashDrawerSession>>(
                "/v1/cash-drawer/open",
                payload,
                getRequestConfig(token),
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cash-drawer", "current"] });
        },
    });
}

// 3. Hook to get details of a specific cash drawer session
export function useCashDrawerDetail(session: string | null, token?: string) {
    return useQuery<ApiResponse<CashDrawerSession>>({
        queryKey: ["cash-drawer", "detail", session, token],
        queryFn: async () => {
            if (!session) throw new Error("No session ID provided.");
            const { data } = await apiClient.get<ApiResponse<CashDrawerSession>>(
                `/v1/cash-drawer/sessions/${session}`,
                getRequestConfig(token),
            );
            return data;
        },
        enabled: session !== null && session !== undefined,
    });
}

// 4. Hook to record cash-in
export function useCashIn() {
    const queryClient = useQueryClient();
    return useMutation<
        ApiResponse<unknown>,
        Error,
        { session: string; payload: CashInPayload; token?: string }
    >({
        mutationFn: async ({ session, payload, token }) => {
            const { data } = await apiClient.post<ApiResponse<unknown>>(
                `/v1/cash-drawer/sessions/${session}/cash-in`,
                payload,
                getRequestConfig(token),
            );
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["cash-drawer", "current"] });
            queryClient.invalidateQueries({ queryKey: ["cash-drawer", "detail", variables.session] });
        },
    });
}

// 5. Hook to record cash-out
export function useCashOut() {
    const queryClient = useQueryClient();
    return useMutation<
        ApiResponse<unknown>,
        Error,
        { session: string; payload: CashOutPayload; token?: string }
    >({
        mutationFn: async ({ session, payload, token }) => {
            const { data } = await apiClient.post<ApiResponse<unknown>>(
                `/v1/cash-drawer/sessions/${session}/cash-out`,
                payload,
                getRequestConfig(token),
            );
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["cash-drawer", "current"] });
            queryClient.invalidateQueries({ queryKey: ["cash-drawer", "detail", variables.session] });
        },
    });
}

// 6. Hook to close a cash drawer session
export function useCloseCashDrawer() {
    const queryClient = useQueryClient();
    return useMutation<
        ApiResponse<unknown>,
        Error,
        { session: string; payload: CloseCashDrawerPayload; token?: string }
    >({
        mutationFn: async ({ session, payload, token }) => {
            const { data } = await apiClient.post<ApiResponse<unknown>>(
                `/v1/cash-drawer/sessions/${session}/close`,
                payload,
                getRequestConfig(token),
            );
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["cash-drawer", "current"] });
            queryClient.invalidateQueries({ queryKey: ["cash-drawer", "detail", variables.session] });
        },
    });
}

export interface CashDrawerSessionsParams {
    page?: number;
    per_page?: number;
    status?: "open" | "closed";
    user_uid?: string;
    from?: string;
    to?: string;
    sort_by?: string;
    sort_order?: "asc" | "desc";
}

// 7. Hook to list cashier sessions (paginated)
export function useCashDrawerSessions(params?: CashDrawerSessionsParams, token?: string) {
    return useQuery<PaginatedResponse<CashDrawerSession>>({
        queryKey: ["cash-drawer", "sessions", params, token],
        queryFn: async () => {
            const { data } = await apiClient.get<PaginatedResponse<CashDrawerSession>>(
                "/v1/cash-drawer/sessions",
                {
                    params,
                    ...getRequestConfig(token),
                }
            );
            return data;
        },
    });
}
