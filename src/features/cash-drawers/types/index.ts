export interface CashDrawer {
    uid: string;
    store_uid: string;
    nama: string;
    saldo: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    sessions_count?: number;
}
