import { useMutation, useQuery } from "@tanstack/react-query";
import { apiGetData, apiPostData } from "@/shared/api/api-client";
import { queryKeys } from "@/lib/query-keys";
import { ENDPOINTS } from "@/shared/api/endpoints";

export type LedgerBackfillState =
    | "idle"
    | "queued"
    | "running"
    | "completed"
    | "failed";

export interface LedgerBackfillStatus {
    status: LedgerBackfillState;
    queued_at?: string;
    started_at?: string;
    finished_at?: string;
    rows?: number | null;
    output?: string;
    message?: string;
}

// ponytail: fire-and-forget — returns 202 immediately; the job runs on the queue.
// Progress is polled via useLedgerBackfillStatus().
export function useLedgerBackfill() {
    return useMutation<{ status: string }, Error>({
        mutationFn: () => apiPostData<{ status: string }>(ENDPOINTS.LEDGER.BACKFILL),
    });
}

export function useLedgerBackfillStatus(enabled: boolean = true) {
    return useQuery<LedgerBackfillStatus>({
        queryKey: [...queryKeys.reports.all, "ledger-backfill-status"],
        queryFn: () => apiGetData<LedgerBackfillStatus>(ENDPOINTS.LEDGER.BACKFILL_STATUS),
        enabled,
        refetchInterval: (query) => {
            const s = query.state.data?.status;
            return s === "queued" || s === "running" ? 2500 : false;
        },
    });
}
