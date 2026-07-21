import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGetData, apiGetList, apiPost, apiPut, apiDelete, apiGet, apiPatch } from "@/shared/api/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/api";
import type { Member } from "../types";
import type { MemberInput } from "../schemas/member-schema";

export function useMembers(params?: PaginationParams & { search?: string; status?: string }) {
    return useQuery<PaginatedResponse<Member>>({
        queryKey: [...queryKeys.members.all, params],
        queryFn: () => apiGetList<Member>("/v1/members", params),
    });
}

export function useAllMembers() {
    return useQuery<Member[]>({
        queryKey: [...queryKeys.members.all, "all"],
        queryFn: () => apiGetData<Member[]>("/v1/members/all"),
    });
}

export function useCreateMember() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<Member>, Error, MemberInput>({
        mutationFn: (data) =>
            apiPost<ApiResponse<Member>, MemberInput>("/v1/members", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
        },
    });
}

export function useUpdateMember() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<Member>, Error, { uid: string; data: MemberInput }>({
        mutationFn: ({ uid, data }) =>
            apiPut<ApiResponse<Member>, MemberInput>(`/v1/members/${uid}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
        },
    });
}

export function useDeleteMember() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<void>, Error, string>({
        mutationFn: (uid) => apiDelete<ApiResponse<void>>(`/v1/members/${uid}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
        },
    });
}

// ─── Member Debts API Hooks ──────────────────────────────────────────────────

export interface MemberDebtSummary {
    total_members_with_debt: number;
    total_hutang: number;
}

export interface MemberDebtResponse {
    data: Member[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    summary: MemberDebtSummary;
    message: string;
    success: boolean;
}

export interface PayDebtPayload {
    amount: number;
    metode_pembayaran: "cash" | "card";
    cash_received?: number;
    jenis_kartu?: "debit" | "kredit";
    nomor_kartu_akhir?: string;
    referensi_edc?: string;
    catatan?: string;
}

export interface DebtTransactionItem {
    uid: string;
    sale_uid: string;
    product_uid: string;
    nama_produk: string;
    kuantitas: number;
    harga_satuan: number;
    subtotal: number;
    product?: {
        uid: string;
        nama: string;
        harga: number;
        barcode?: string;
        is_jasa?: boolean;
    };
}

export interface DebtTransaction {
    uid: string;
    nomor_transaksi: string;
    total: number;
    cash_received: number;
    debt_amount: number;
    created_at: string;
    items: DebtTransactionItem[];
    user?: {
        name: string;
    };
}

export interface MemberPayment {
    uid: string;
    member_uid?: string;
    nomor_pembayaran: string;
    jumlah_bayar: number;
    metode_pembayaran: "cash" | "card";
    cash_received: number | null;
    kembalian: number | null;
    jenis_kartu: string | null;
    nomor_kartu_akhir: string | null;
    referensi_edc: string | null;
    hutang_sebelum: number;
    hutang_sesudah: number;
    tanggal_bayar: string;
    catatan: string | null;
    catatan_void: string | null;
    status: string;
    created_at: string;
    user?: {
        uid: string;
        name: string;
    };
    cash_account?: {
        uid: string;
        nama: string;
        tipe: string;
    };
    member?: Member;
}

export interface VoidMemberDebtPaymentPayload {
    alasan: string;
}

export function useVoidMemberDebtPayment() {
    const queryClient = useQueryClient();
    return useMutation<
        ApiResponse<void>,
        Error,
        { memberUid: string; paymentUid: string; data: VoidMemberDebtPaymentPayload }
    >({
        mutationFn: ({ memberUid, paymentUid, data }) =>
            apiPost<ApiResponse<void>, VoidMemberDebtPaymentPayload>(
                `/v1/members/${memberUid}/debt/${paymentUid}/void`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
            queryClient.invalidateQueries({ queryKey: ["cash-drawer"] });
        },
    });
}


export interface DebtHistoryResponse {
    member: Member;
    debt_transactions: {
        data: DebtTransaction[];
        meta: {
            current_page: number;
            last_page: number;
            total: number;
        };
    };
    payments: {
        data: MemberPayment[];
        meta: {
            current_page: number;
            last_page: number;
            total: number;
        };
    };
}

export function useMemberDebts(params?: PaginationParams & { search?: string; status?: string }) {
    return useQuery<MemberDebtResponse>({
        queryKey: [...queryKeys.members.all, "debts", params],
        queryFn: () => apiGet<MemberDebtResponse>("/v1/members/debts", { params }),
    });
}

export function usePayMemberDebt() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<{ member: Member; payment: MemberPayment }>, Error, { uid: string; data: PayDebtPayload }>({
        mutationFn: ({ uid, data }) =>
            apiPatch<ApiResponse<{ member: Member; payment: MemberPayment }>, PayDebtPayload>(`/v1/members/pay-debt/${uid}`, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
            queryClient.invalidateQueries({ queryKey: ["cash-drawer"] });
            queryClient.invalidateQueries({ queryKey: [...queryKeys.members.all, "debt-history", variables.uid] });
        },
    });
}

export function useMemberDebtHistory(memberUid: string) {
    return useQuery<DebtHistoryResponse>({
        queryKey: [...queryKeys.members.all, "debt-history", memberUid],
        queryFn: () => apiGetData<DebtHistoryResponse>(`/v1/members/debt-history/${memberUid}`),
        enabled: !!memberUid,
    });
}

export function useMemberPayments(params?: PaginationParams & { search?: string }) {
    return useQuery<PaginatedResponse<MemberPayment>>({
        queryKey: [...queryKeys.members.all, "payments", params],
        queryFn: () => apiGetList<MemberPayment>("/v1/members/payments", params),
    });
}

export interface UpdateMemberPointsPayload {
    type: "add" | "subtract";
    points: number;
    note: string;
}

export function useUpdateMemberPoints() {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<Member>, Error, { uid: string; data: UpdateMemberPointsPayload }>({
        mutationFn: ({ uid, data }) =>
            apiPatch<ApiResponse<Member>, UpdateMemberPointsPayload>(`/v1/members/${uid}/points`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
        },
    });
}
