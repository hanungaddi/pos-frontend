import type { Transaction } from "@/features/transactions/types";

export interface CashDrawerMovement {
    uid: string;
    cash_drawer_session_uid: string;
    user_uid: string;
    type: "opening" | "cash_sale" | "cash_in" | "cash_out" | "cash_refund" | string;
    amount: number;
    balance_before: number;
    balance_after: number;
    reference_uid: string | null;
    reference_type: string | null;
    note: string | null;
    created_at: string;
    updated_at: string;
    user?: {
        uid: string;
        name: string;
        username: string;
        email: string;
        email_verified_at: string | null;
        store_uid: string | null;
        status: string;
        created_at: string;
        updated_at: string;
    };
}

export interface CashDrawerSession {
    uid: string;
    store_uid: string | null;
    user_uid: string;
    opening_balance: number;
    expected_cash: number;
    actual_closing_balance: number | null;
    cash_sales_total: number;
    cash_refunds_total: number;
    cash_in_total: number;
    cash_out_total: number;
    difference: number | null;
    status: "open" | "closed";
    opening_note: string | null;
    closing_note: string | null;
    opened_at: string;
    closed_at: string | null;
    closed_by: string | null | {
        uid: string;
        name: string;
        username: string;
        email: string;
        email_verified_at: string | null;
        store_uid: string | null;
        status: string;
        created_at: string;
        updated_at: string;
    };
    created_at: string;
    updated_at: string;
    transactions?: Transaction[];
    user?: {
        uid: string;
        name: string;
        username: string;
        email: string;
        email_verified_at: string | null;
        store_uid: string | null;
        status: string;
        created_at: string;
        updated_at: string;
    };
    movements?: CashDrawerMovement[];
}

export interface OpenCashDrawerPayload {
    opening_balance: number;
    opening_note?: string;
}

export interface CashInPayload {
    amount: number;
    note?: string;
}

export interface CashOutPayload {
    amount: number;
    note: string;
    expense_category_uid?: string | null;
}

export interface CloseCashDrawerPayload {
    actual_closing_balance: number;
    closing_note?: string;
}
