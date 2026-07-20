// ─── Application Routes ─────────────────────────────────────────────────────

export const ROUTES = {
    // Public
    LOGIN: "/login",

    // Protected - Admin
    ADMIN: "/admin",
    ADMIN_PRODUCTS: "/admin/products",
    ADMIN_CASH_DRAWER: "/admin/cash-drawer",
    ADMIN_CASH_ACCOUNTS: "/admin/cash-accounts",
    ADMIN_STOCK: "/admin/inventory/stock-opname",
    ADMIN_STOCK_LEDGER: "/admin/inventory/stock-ledger",
    ADMIN_SUPPLIERS: "/admin/suppliers",
    ADMIN_CATEGORIES: "/admin/categories",
    ADMIN_BRANDS: "/admin/brands",
    ADMIN_MEMBERS: "/admin/members",
    ADMIN_EXPENSES: "/admin/expenses",
    ADMIN_EXPENSE_CATEGORIES: "/admin/expenses/categories",
    ADMIN_REPORTS: "/admin/reports",
    ADMIN_REPORTS_SALES: "/admin/reports/sales",
    ADMIN_REPORTS_LABARUGI: "/admin/reports/laba-rugi",
    ADMIN_REPORTS_PEMBELIAN: "/admin/reports/pembelian",
    ADMIN_REPORTS_PENGELUARAN: "/admin/reports/pengeluaran",
    ADMIN_USERS: "/admin/users",
    ADMIN_SETTINGS: "/admin/settings",
    ADMIN_AUDIT: "/admin/audit",
    ADMIN_TRANSACTIONS: "/admin/transactions",
    ADMIN_PURCHASE_ORDER: "/admin/purchase/order",
    ADMIN_PURCHASE_RECEIVING: "/admin/purchase/receiving",
    ADMIN_PURCHASE_PAYMENT: "/admin/purchase/payment",
    ADMIN_PURCHASE_RETURN: "/admin/purchase/return",
    ADMIN_DEBTS_MEMBER: "/admin/debts/member",
    ADMIN_DEBTS_MEMBER_PAYMENTS: "/admin/debts/member-payments",
    ADMIN_DEBTS_SALES: "/admin/debts/sales",
    ADMIN_ACCOUNTING_BALANCESHEET: "/admin/accounting/balance-sheet",
    ADMIN_ACCOUNTING_COA: "/admin/accounting/coa",
    ADMIN_ACCOUNTING_COA_MAPPING: "/admin/accounting/coa-mapping",
    ADMIN_ACCOUNTING_JOURNALS: "/admin/accounting/journals",
    ADMIN_ACCOUNTING_GENERAL_LEDGER: "/admin/accounting/general-ledger",
    ADMIN_ACCOUNTING_UNBALANCED: "/admin/accounting/unbalanced",

    // Protected - POS
    CHECKOUT: "/checkout",
    PRODUCTS: "/products",

    // Error
    UNAUTHORIZED: "/unauthorized",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

// ─── Public Routes (no auth required) ───────────────────────────────────────

export const PUBLIC_ROUTES: string[] = [
    ROUTES.LOGIN,
    "/api/auth",
    "/api/proxy/v1/settings/app_name",
    "/api/proxy/v1/settings/app_logo_url"
];

// ─── Auth Routes (redirect to dashboard if already logged in) ───────────────

export const AUTH_ROUTES: string[] = [ROUTES.LOGIN];
