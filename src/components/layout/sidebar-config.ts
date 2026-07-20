import { hasPermission, hasRole } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import {
    IconBox,
    IconDatabase,
    IconDeviceLaptop,
    IconHome,
    IconSettings,
    IconShieldLock,
    IconShoppingCart,
    IconWallet,
    IconReceipt,
    IconUsers,
    IconChartBar,
    IconNotebook,
    IconBuildingBank
} from "@tabler/icons-react";

export interface SidebarMenuItem {
    type: "link";
    path: string;
    label: string;
    icon: React.ComponentType<{ size: number }>;
    tab?: string;
    permission: (roles: string[], permissions: string[]) => boolean;
}

export interface SidebarSubmenuItem {
    path: string;
    label: string;
    permission: (roles: string[], permissions: string[]) => boolean;
}

export interface SidebarSubmenu {
    type: "submenu";
    label: string;
    icon: React.ComponentType<{ size: number }>;
    items: SidebarSubmenuItem[];
    permission: (roles: string[], permissions: string[]) => boolean;
}

export type SidebarItemConfig = SidebarMenuItem | SidebarSubmenu;

export interface SidebarSectionConfig {
    title: string;
    items: SidebarItemConfig[];
}

export const NAVIGATION_CONFIG: SidebarSectionConfig[] = [
    // ─── Menu Utama (Operasional Harian) ────────────────────────────────────────
    {
        title: "Menu Utama",
        items: [
            {
                type: "link",
                path: ROUTES.ADMIN,
                label: "Dashboard",
                icon: IconHome,
                permission: (roles, permissions) =>
                    hasRole(roles, "admin") || hasPermission(roles, permissions, "view_reports"),
            },
            {
                type: "link",
                path: ROUTES.CHECKOUT,
                label: "Layar Kasir (POS)",
                icon: IconDeviceLaptop,
                permission: (roles, permissions) =>
                    hasRole(roles, "admin") || hasPermission(roles, permissions, "create_sales"),
            },

        ],
    },

    // ─── Transaksi & Inventori (Manajemen & Alur Kerja) ─────────────────────────
    {
        title: "Transaksi & Inventori",
        items: [
            {
                type: "submenu",
                label: "Penjualan",
                icon: IconReceipt,
                permission: (roles, permissions) =>
                    hasRole(roles, "admin") ||
                    hasPermission(roles, permissions, "view_cash_drawer") ||
                    hasPermission(roles, permissions, "view_sales") ||
                    hasPermission(roles, permissions, "create_sales") ||
                    hasPermission(roles, permissions, "view_reports"),
                items: [
                    {
                        path: ROUTES.ADMIN_CASH_DRAWER,
                        label: "Sesi Kasir",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") || hasPermission(roles, permissions, "view_cash_drawer"),
                    },
                    {
                        path: ROUTES.ADMIN_TRANSACTIONS,
                        label: "Daftar Transaksi",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") ||
                            hasPermission(roles, permissions, "view_sales") ||
                            hasPermission(roles, permissions, "create_sales"),
                    },
                ],
            },
            {
                type: "submenu",
                label: "Pembelian",
                icon: IconShoppingCart,
                permission: (roles, permissions) =>
                    hasRole(roles, "admin") ||
                    hasPermission(roles, permissions, "view_purchase") ||
                    hasPermission(roles, permissions, "manage_purchase"),
                items: [
                    {
                        path: ROUTES.ADMIN_PURCHASE_ORDER,
                        label: "Pemesanan",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") ||
                            hasPermission(roles, permissions, "view_purchase") ||
                            hasPermission(roles, permissions, "manage_purchase"),
                    },
                    {
                        path: ROUTES.ADMIN_PURCHASE_RECEIVING,
                        label: "Penerimaan Barang",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") ||
                            hasPermission(roles, permissions, "view_purchase") ||
                            hasPermission(roles, permissions, "manage_purchase"),
                    },
                    {
                        path: ROUTES.ADMIN_PURCHASE_PAYMENT,
                        label: "Pembayaran",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") ||
                            hasPermission(roles, permissions, "view_purchase") ||
                            hasPermission(roles, permissions, "manage_purchase"),
                    },
                    {
                        path: ROUTES.ADMIN_PURCHASE_RETURN,
                        label: "Retur Pembelian",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") ||
                            hasPermission(roles, permissions, "view_purchase") ||
                            hasPermission(roles, permissions, "manage_purchase"),
                    },
                ],
            },
            {
                type: "submenu",
                label: "Inventori",
                icon: IconBox,
                permission: (roles, permissions) =>
                    hasRole(roles, "admin") ||
                    hasPermission(roles, permissions, "view_inventory") ||
                    hasPermission(roles, permissions, "manage_inventory"),
                items: [
                    {
                        path: ROUTES.ADMIN_STOCK,
                        label: "Stok Opname",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") ||
                            hasPermission(roles, permissions, "view_inventory") ||
                            hasPermission(roles, permissions, "manage_inventory"),
                    },
                    {
                        path: ROUTES.ADMIN_STOCK_LEDGER,
                        label: "Kartu Stok",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") ||
                            hasPermission(roles, permissions, "view_inventory") ||
                            hasPermission(roles, permissions, "manage_inventory"),
                    },
                ],
            },
            {
                type: "submenu",
                label: "Pengeluaran",
                icon: IconReceipt,
                permission: (roles, permissions) =>
                    hasRole(roles, "admin") ||
                    hasPermission(roles, permissions, "view_expenses") ||
                    hasPermission(roles, permissions, "manage_expenses"),
                items: [
                    {
                        path: ROUTES.ADMIN_EXPENSES,
                        label: "Catatan Pengeluaran",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") ||
                            hasPermission(roles, permissions, "view_expenses") ||
                            hasPermission(roles, permissions, "manage_expenses"),
                    },
                    {
                        path: ROUTES.ADMIN_EXPENSE_CATEGORIES,
                        label: "Kategori Pengeluaran",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") ||
                            hasPermission(roles, permissions, "view_expenses") ||
                            hasPermission(roles, permissions, "manage_expenses"),
                    },
                ],
            },
            {
                type: "link",
                path: ROUTES.ADMIN_CASH_ACCOUNTS,
                label: "Kas & Bank",
                icon: IconWallet,
                permission: (roles, permissions) =>
                    hasRole(roles, "admin") ||
                    hasPermission(roles, permissions, "manage_cash_accounts") ||
                    hasPermission(roles, permissions, "view_cash_drawer"),
            },
            {
                type: "submenu",
                label: "Hutang",
                icon: IconNotebook,
                permission: (roles, permissions) =>
                    hasRole(roles, "admin") ||
                    hasPermission(roles, permissions, "view_members") ||
                    hasPermission(roles, permissions, "view_purchase"),
                items: [
                    {
                        path: ROUTES.ADMIN_DEBTS_MEMBER,
                        label: "Hutang Member",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") || hasPermission(roles, permissions, "view_members"),
                    },
                    {
                        path: ROUTES.ADMIN_DEBTS_MEMBER_PAYMENTS,
                        label: "Pembayaran Hutang Member",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") || hasPermission(roles, permissions, "view_members"),
                    },
                    {
                        path: ROUTES.ADMIN_DEBTS_SALES,
                        label: "Hutang Sales",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") || hasPermission(roles, permissions, "view_purchase"),
                    },
                ],
            },
            {
                type: "submenu",
                label: "Laporan",
                icon: IconChartBar,
                permission: (roles, permissions) =>
                    hasRole(roles, "admin") || hasPermission(roles, permissions, "view_reports"),
                items: [
                    {
                        path: ROUTES.ADMIN_REPORTS_LABARUGI,
                        label: "Laporan Laba Rugi",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") || hasPermission(roles, permissions, "view_reports"),
                    },
                    {
                        path: ROUTES.ADMIN_REPORTS_SALES,
                        label: "Laporan Penjualan",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") || hasPermission(roles, permissions, "view_reports"),
                    },
                    {
                        path: ROUTES.ADMIN_REPORTS_PEMBELIAN,
                        label: "Laporan Pembelian",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") || hasPermission(roles, permissions, "view_reports"),
                    },
                    {
                        path: ROUTES.ADMIN_REPORTS_PENGELUARAN,
                        label: "Laporan Pengeluaran",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") || hasPermission(roles, permissions, "view_reports"),
                    },
                ],
            },
            {
                type: "submenu",
                label: "Akuntansi",
                icon: IconBuildingBank,
                permission: (roles, permissions) =>
                    hasRole(roles, "admin") || hasPermission(roles, permissions, "view_reports"),
                items: [
                    {
                        path: ROUTES.ADMIN_ACCOUNTING_BALANCESHEET,
                        label: "Neraca",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") || hasPermission(roles, permissions, "view_reports"),
                    },
                    {
                        path: ROUTES.ADMIN_ACCOUNTING_GENERAL_LEDGER,
                        label: "Buku Besar",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") || hasPermission(roles, permissions, "view_reports"),
                    },
                    {
                        path: ROUTES.ADMIN_ACCOUNTING_COA,
                        label: "Chart of Accounts (COA)",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") || hasPermission(roles, permissions, "view_reports"),
                    },
                    {
                        path: ROUTES.ADMIN_ACCOUNTING_COA_MAPPING,
                        label: "Mapping COA",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") || hasPermission(roles, permissions, "view_reports"),
                    },
                    {
                        path: ROUTES.ADMIN_ACCOUNTING_JOURNALS,
                        label: "Jurnal Manual",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") || hasPermission(roles, permissions, "view_reports"),
                    },
                    {
                        path: ROUTES.ADMIN_ACCOUNTING_UNBALANCED,
                        label: "Entri Tidak Seimbang",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") || hasPermission(roles, permissions, "view_reports"),
                    },
                ],
            },
        ],
    },

    // ─── Data Master & Sistem (Setup & Konfigurasi) ─────────────────────────────
    {
        title: "Data Master & Sistem",
        items: [
            {
                type: "submenu",
                label: "Data Master",
                icon: IconDatabase,
                permission: (roles, permissions) =>
                    hasRole(roles, "admin") ||
                    hasPermission(roles, permissions, "view_products") ||
                    hasPermission(roles, permissions, "manage_products") ||
                    hasPermission(roles, permissions, "view_suppliers") ||
                    hasPermission(roles, permissions, "manage_suppliers") ||
                    hasPermission(roles, permissions, "view_members") ||
                    hasPermission(roles, permissions, "manage_members"),
                items: [
                    {
                        path: ROUTES.ADMIN_PRODUCTS,
                        label: "Produk",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") ||
                            hasPermission(roles, permissions, "view_products") ||
                            hasPermission(roles, permissions, "manage_products"),
                    },
                    {
                        path: ROUTES.ADMIN_CATEGORIES,
                        label: "Kategori",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") ||
                            hasPermission(roles, permissions, "view_products") ||
                            hasPermission(roles, permissions, "manage_products"),
                    },
                    {
                        path: ROUTES.ADMIN_BRANDS,
                        label: "Brand",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") ||
                            hasPermission(roles, permissions, "view_products") ||
                            hasPermission(roles, permissions, "manage_products"),
                    },
                    {
                        path: ROUTES.ADMIN_SUPPLIERS,
                        label: "Supplier",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") ||
                            hasPermission(roles, permissions, "view_suppliers") ||
                            hasPermission(roles, permissions, "manage_suppliers"),
                    },
                    {
                        path: ROUTES.ADMIN_MEMBERS,
                        label: "Member / Pelanggan",
                        permission: (roles, permissions) =>
                            hasRole(roles, "admin") ||
                            hasPermission(roles, permissions, "view_members") ||
                            hasPermission(roles, permissions, "manage_members"),
                    },
                ],
            },
            {
                type: "link",
                path: ROUTES.ADMIN_SETTINGS,
                label: "Pengaturan Toko",
                icon: IconSettings,
                permission: (roles) => hasRole(roles, "admin"),
            },
            {
                type: "link",
                path: ROUTES.ADMIN_USERS,
                label: "Kelola Pengguna",
                icon: IconUsers,
                permission: (roles, permissions) =>
                    hasRole(roles, "admin") ||
                    hasPermission(roles, permissions, "view_users") ||
                    hasPermission(roles, permissions, "manage_users"),
            },
            {
                type: "link",
                path: ROUTES.ADMIN_AUDIT,
                label: "Log Aktivitas",
                icon: IconShieldLock,
                permission: (roles, permissions) =>
                    hasRole(roles, "admin") || hasPermission(roles, permissions, "view_audit_logs"),
            },
        ],
    },
];
