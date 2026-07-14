
export interface PaymentMethodStats {
    count: number;
    total: number;
}

export interface ReportProduct {
    product_name: string;
    quantity: number;
    revenue: number;
    profit: number;
    profit_margin: number;
}

export interface DailyReport {
    date: string;
    total_sales: number;
    transactions_count: number;
    average_transaction_value: number;
    total_cogs: number;
    gross_profit: number;
    profit_margin: number;
    void_count: number;
    payment_methods: Record<string, PaymentMethodStats>;
    top_products: ReportProduct[];
}

export interface LabaRugiItem {
    tanggal: string;
    date_raw: string;
    no_faktur: string;
    keterangan: string;
    tipe: "sale" | "expense" | string;
    h_jual: number;
    hpp: number;
    diskon: number;
    laba_rugi: number;
}

export interface LabaRugiReport {
    from: string;
    to: string;
    interval: string;
    report_data: LabaRugiItem[];
    total_h_jual: number;
    total_hpp: number;
    total_diskon: number;
    total_laba_rugi: number;
    total_laba_penjualan: number;
    total_pengeluaran: number;
}

export interface ExpenseReportItem {
    uid: string;
    tanggal: string;
    nomor_pengeluaran: string;
    category_uid: string;
    category_name?: string;
    category?: {
        uid: string;
        nama: string;
    };
    nama: string;
    catatan?: string;
    amount: number;
    cash_account_uid: string;
    cash_account?: {
        uid: string;
        nama: string;
    };
    cashAccount?: {
        uid: string;
        nama: string;
    };
    user_uid: string;
    user?: {
        uid: string;
        name: string;
    };
}

export interface PengeluaranReport {
    from: string;
    to: string;
    expenses: ExpenseReportItem[];
    total_amount: number;
}

export interface PurchaseReportItemDetail {
    nama_barang: string;
    satuan: string;
    qty_beli: number;
    qty_retur: number;
    net_qty: number;
    harga_beli: number;
    subtotal_net: number;
}

export interface PurchasePaymentHistory {
    tanggal: string;
    no_pembayaran_ref: string;
    metode_akun: string;
    keterangan: string;
    jumlah_bayar: number;
}

export interface PurchaseReportItem {
    no: number;
    tanggal: string;
    tanggal_raw: string;
    no_faktur: string;
    supplier: string;
    operator: string;
    pembayaran: "LUNAS" | "TEMPO" | string;
    jumlah: number;
    retur: number;
    total_net: number;
    hutang: number;
    daftar_barang?: PurchaseReportItemDetail[];
    riwayat_pembayaran?: {
        history: PurchasePaymentHistory[];
        total_dibayar_kotor: number;
        pengembalian_dana_refund: number;
        total_dibayar_bersih: number;
        sisa_hutang: number;
    };
}

export interface PurchaseReport {
    from: string;
    to: string;
    receivings: PurchaseReportItem[];
    total_amount: number;
    total_retur: number;
    total_net: number;
    total_hutang: number;
    include_items: boolean;
    include_payments: boolean;
}

export interface SalesReportItemDetail {
    nama_barang: string;
    satuan: string;
    qty_beli?: number;
    qty_retur?: number;
    net_qty?: number;
    harga_beli?: number;
    subtotal_net?: number;
    qty?: number;
    harga_jual?: number;
    subtotal?: number;
}

export interface SalesPaymentHistory {
    tanggal: string;
    no_pembayaran_ref: string;
    metode_akun: string;
    keterangan: string;
    jumlah_bayar: number;
}

export interface SalesReportItem {
    no: number;
    tanggal: string;
    tanggal_raw: string;
    no_faktur: string;
    supplier?: string;
    operator: string;
    pembayaran?: string;
    jumlah: number;
    retur?: number;
    total_net?: number;
    hutang?: number;
    daftar_barang?: SalesReportItemDetail[];
    riwayat_pembayaran?: {
        history: SalesPaymentHistory[];
        total_dibayar_kotor: number;
        pengembalian_dana_refund: number;
        total_dibayar_bersih: number;
        sisa_hutang: number;
    };
}

export interface PenjualanReport {
    from: string;
    to: string;
    sales?: {
        data: SalesReportItem[];
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
    receivings?: {
        data: SalesReportItem[];
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
    total_amount: number;
    total_retur?: number;
    total_net?: number;
    total_hutang?: number;
    include_items: boolean;
    include_payments?: boolean;
}

export interface SalesByCategoryItem {
    category_uid: string | null;
    category: string;
    total_sales: number;
    total_profit: number;
    total_quantity: number;
    percentage_sales: number;
}

export interface SalesByCategoryResponse {
    from: string;
    to: string;
    data: SalesByCategoryItem[];
}




