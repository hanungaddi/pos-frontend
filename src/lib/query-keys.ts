// ─── React Query Key Factory ────────────────────────────────────────────────
// Centralized query keys for cache management and invalidation.

export const queryKeys = {
    // Products
    products: {
        all: ["products"] as const,
        list: () => [...queryKeys.products.all, "list"] as const,
        detail: (uid: string) =>
            [...queryKeys.products.all, "detail", uid] as const,
    },

    // Users
    users: {
        all: ["users"] as const,
        list: () => [...queryKeys.users.all, "list"] as const,
    },

    // Roles & Permissions
    roles: {
        all: ["roles"] as const,
        list: () => [...queryKeys.roles.all, "list"] as const,
    },

    permissions: {
        all: ["permissions"] as const,
        list: () => [...queryKeys.permissions.all, "list"] as const,
    },

    // Dashboard / Reports
    dashboard: {
        all: ["dashboard"] as const,
        summary: () => [...queryKeys.dashboard.all, "summary"] as const,
    },

    reports: {
        all: ["reports"] as const,
        daily: (date: string) =>
            [...queryKeys.reports.all, "daily", date] as const,
        jasaVsProduct: (from?: string, to?: string) =>
            [...queryKeys.reports.all, "jasaVsProduct", from, to] as const,
        labaRugi: (from: string, to: string, interval: string) =>
            [...queryKeys.reports.all, "labaRugi", from, to, interval] as const,
        pengeluaran: (from: string, to: string) =>
            [...queryKeys.reports.all, "pengeluaran", from, to] as const,
        pembelian: (from: string, to: string, includeItems: boolean, includePayments: boolean) =>
            [...queryKeys.reports.all, "pembelian", from, to, includeItems, includePayments] as const,
        penjualan: (
            from: string,
            to: string,
            includeItems: boolean,
            includePayments: boolean,
            page: number,
            perPage: number,
            sortOrder: "asc" | "desc"
        ) =>
            [
                ...queryKeys.reports.all,
                "penjualan",
                from,
                to,
                includeItems,
                includePayments,
                page,
                perPage,
                sortOrder,
            ] as const,
        salesByCategory: (from: string, to: string, categoryIds?: string[]) =>
            [...queryKeys.reports.all, "salesByCategory", from, to, categoryIds] as const,
    },

    // Suppliers
    suppliers: {
        all: ["suppliers"] as const,
    },

    // Categories
    categories: {
        all: ["categories"] as const,
    },

    // Brands
    brands: {
        all: ["brands"] as const,
    },

    // Inventory
    inventory: {
        all: ["inventory"] as const,
        movements: () => [...queryKeys.inventory.all, "movements"] as const,
        receivings: () => [...queryKeys.inventory.all, "receivings"] as const,
        opnames: () => [...queryKeys.inventory.all, "opnames"] as const,
        opnameDetail: (uid: string) =>
            [...queryKeys.inventory.all, "opname", uid] as const,
    },

    // Purchase
    purchase: {
        all: ["purchase"] as const,
        receivings: () => [...queryKeys.purchase.all, "receivings"] as const,
        receivingDetail: (uid: string) =>
            [...queryKeys.purchase.all, "receiving", uid] as const,
        orders: () => [...queryKeys.purchase.all, "orders"] as const,
        orderDetail: (uid: string) =>
            [...queryKeys.purchase.all, "order", uid] as const,
        orderItems: (uid: string) =>
            [...queryKeys.purchase.all, "order", uid, "items"] as const,
        outstanding: () =>
            [...queryKeys.purchase.all, "orders", "outstanding"] as const,
        orderReceivings: (uid: string) =>
            [...queryKeys.purchase.all, "order", uid, "receivings"] as const,
        payments: () => [...queryKeys.purchase.all, "payments"] as const,
        paymentDetail: (uid: string) =>
            [...queryKeys.purchase.all, "payment", uid] as const,
        returns: () => [...queryKeys.purchase.all, "returns"] as const,
        returnDetail: (uid: string) =>
            [...queryKeys.purchase.all, "return", uid] as const,
    },

    cashAccounts: {
        all: ["cash-accounts"] as const,
        cashFlow: (filters?: unknown) => ["cash-accounts", "cash-flow", filters] as const,
        accountCashFlow: (uid: string, filters?: unknown) => ["cash-accounts", uid, "cash-flow", filters] as const,
    },

    // Transactions (checkout)
    transactions: {
        all: ["transactions"] as const,
        onHold: () => [...queryKeys.transactions.all, "on-hold"] as const,
        detail: (uid: string | string) =>
            [...queryKeys.transactions.all, "detail", uid] as const,
    },

    // Activity Logs
    activityLogs: {
        all: ["activity-logs"] as const,
        list: () => [...queryKeys.activityLogs.all, "list"] as const,
    },

    // Members
    members: {
        all: ["members"] as const,
        list: () => [...queryKeys.members.all, "list"] as const,
    },

    // Expenses
    expenses: {
        all: ["expenses"] as const,
        list: () => [...queryKeys.expenses.all, "list"] as const,
        categories: () => [...queryKeys.expenses.all, "categories"] as const,
        upcoming: () => [...queryKeys.expenses.all, "upcoming"] as const,
    },

    // Chart of Accounts (COA)
    chartOfAccounts: {
        all: ["chart-of-accounts"] as const,
        tree: () => [...queryKeys.chartOfAccounts.all, "tree"] as const,
        flat: () => [...queryKeys.chartOfAccounts.all, "flat"] as const,
        byType: (type: string) => [...queryKeys.chartOfAccounts.all, "type", type] as const,
        detail: (uid: string) => [...queryKeys.chartOfAccounts.all, "detail", uid] as const,
    },

    // Manual Journals
    manualJournals: {
        all: ["manual-journals"] as const,
        list: (params?: unknown) => [...queryKeys.manualJournals.all, "list", params] as const,
        detail: (uid: string) => [...queryKeys.manualJournals.all, "detail", uid] as const,
    },

    // COA Mappings
    coaMappings: {
        all: ["coa-mappings"] as const,
        list: () => [...queryKeys.coaMappings.all, "list"] as const,
    },
} as const;
