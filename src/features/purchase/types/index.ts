import type { Product } from "@/features/products/types";
import type { Supplier } from "@/features/suppliers/types";

export interface ReceivingItem {
    uid: string;
    receiving_uid: string;
    product_uid: string;
    kuantitas: number;
    harga_beli: number;
    created_at: string;
    product?: Product;
}

export interface Receiving {
    uid: string;
    nomor_penerimaan: string;
    supplier_uid: string | null;
    supplier_relationship?: Supplier | null;
    supplier: string | null;
    nomor_faktur: string | null;
    nilai_faktur: number | null;
    status: "draft" | "completed";
    status_pembayaran: "pending" | "unpaid" | "partial" | "paid";
    purchase_order_uid?: string | null;
    total_dibayar?: number;
    sisa_hutang?: number;
    catatan: string | null;
    created_at: string;
    tanggal_terima: string;
    items?: ReceivingItem[];
}
export interface PurchaseOrderItem {
    uid: string;
    purchase_order_uid: string;
    product_uid: string;
    kuantitas: number;
    kuantitas_diterima: number;
    sisa_belum_diterima: number;
    harga_estimasi: number;
    created_at: string;
    product?: Product;
}

export interface PurchaseOrder {
    uid: string;
    nomor_po: string;
    supplier_uid: string | null;
    supplier_name: string | null;
    supplier?: Supplier | null;
    tanggal_po: string;
    status: "draft" | "ordered" | "partially_received" | "received" | "closed" | "cancelled";
    nilai_estimasi: number;
    total_diterima: number;
    receivings_count: number;
    catatan: string | null;
    user_uid: string;
    user?: {
        uid: string;
        name: string;
        username?: string;
    } | null;
    created_at: string;
    items?: PurchaseOrderItem[];
}

// ─── Local Item (Zustand Persist — sebelum bulk submit ke server) ────────────

export interface PurchaseItemLocal {
    temp_uid: string;
    product_uid: string;
    barcode: string | null;
    nama: string;
    kuantitas: number;
    harga_estimasi: number;
    alasan?: string | null;
}

export interface CashAccount {
    uid: string;
    nama: string;
    tipe: string;
    nomor_rekening?: string | null;
    saldo: number;
}

export interface ReceivingPayment {
    uid: string;
    store_uid: string;
    user_uid: string;
    nomor_transaksi: string;
    tipe: "supplier_payment";
    cash_account_uid: string;
    kategori: "pembelian_supplier";
    referensi_uid: string;
    referensi_tipe: "receiving";
    total: number;
    status: "completed" | "void";
    metode_pembayaran: string;
    nomor_referensi?: string | null;
    catatan?: string | null;
    catatan_void?: string | null;
    void_by?: number | null;
    voided_at?: string | null;
    created_at: string;
    updated_at?: string | null;
    user?: {
        uid: string;
        name: string;
        username?: string;
    } | null;
    stock_receiving?: Receiving | null;
    cash_account?: CashAccount | null;
}

export interface PaymentSummary {
    receiving_uid: string;
    nomor_penerimaan: string;
    total_faktur: number;
    total_dibayar: number;
    sisa_hutang: number;
    status_pembayaran: "pending" | "unpaid" | "partial" | "paid";
    payments: {
        uid: string;
        jumlah: number;
        metode: string;
        tanggal: string;
    }[];
}

export interface PurchaseReturnItem {
    uid: string;
    purchase_return_uid: string;
    product_uid: string;
    kuantitas: number;
    harga_beli: number;
    alasan?: string | null;
    created_at: string;
    product?: Product;
}

export interface PurchaseReturn {
    uid: string;
    nomor_retur: string;
    supplier_uid: string;
    supplier?: Supplier | null;
    stock_receiving_uid: string | null;
    stock_receiving?: Receiving | null;
    tanggal_retur: string;
    total_nominal: number;
    catatan: string | null;
    status: "draft" | "completed";
    resolution_type?: "refund" | "credit" | "credit_note" | "exchange" | null;
    catatan_penyelesaian?: string | null;
    user_uid: string;
    user?: {
        uid: string;
        name: string;
        username?: string;
    } | null;
    created_at: string;
    items?: PurchaseReturnItem[];
}

export interface SupplierDebtSummary {
    supplier_uid: string;
    nama_supplier: string;
    email: string | null;
    nomor_telepon: string | null;
    alamat: string | null;
    total_nilai_faktur: number;
    total_dibayar: number;
    total_hutang: number;
}
